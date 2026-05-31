/**
 * Watch-expert AI concierge endpoint (Epic 9 "AI spine", Phase A).
 *
 * A grounded chat bot: it answers ONLY from tool calls into our corpus
 * (the user's own saved data, dealer listings, auction state, the curated
 * reference index + the deep-dive syntheses) and cites source URLs — it
 * never free-generates watch facts. See docs/IA_REDESIGN.md / the build
 * brief + memory [[project_ai_concierge_bot]].
 *
 * Security / cost (load-bearing):
 *   - ANTHROPIC_API_KEY lives only here (Vercel env), never client-side.
 *   - The caller's Supabase JWT is verified server-side; user_id is taken
 *     from the verified token, NEVER from the request body.
 *   - Every message is gated by the per-user daily cap RPC (consume_chat_quota,
 *     migration 2026-05-29_ai_chat_usage.sql) BEFORE any Anthropic spend, so
 *     an over-quota user costs nothing. P0001 → HTTP 429.
 *   - Cheap model (Haiku) by default; Opus only on hard-reasoning turns.
 *   - System prompt + tool defs are prompt-cached; per-user context goes
 *     after the cache breakpoint (in messages), so the big prefix stays warm.
 *
 * Signed-in only for v1. Non-streaming. The cold-open voice lives in
 * SYSTEM_PROMPT (one versioned constant — tune it there).
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
// Pure corpus helpers (no SDK) live in lume_reference.js so jest can test them.
import {
  readPublicJson,
  readPublicText,
  norm as _norm,
  getReference,
  searchArticles,
} from "./lume_reference.js";

// ── config ───────────────────────────────────────────────────────────
const MODEL_FAST = "claude-haiku-4-5";   // default — cheap/fast, fine for grounded Q&A + the opener
const MODEL_SMART = "claude-opus-4-8";   // routed-to for compare / why / recommend turns
const MAX_OUTPUT_TOKENS = 1024;
const MAX_TOOL_ROUNDS = 6;               // bound the agentic loop (cost backstop)
const MAX_HISTORY_MSGS = 20;             // server-side history truncation

const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Compact glossary from public/watch_lexicon.json (phase-1 seed; the mine-lexicon
// workflow expands it later). Injected as a cached system block so Lumé expands
// collector shorthand ("speedie", "panda", "QP", "DON") to canonical terms before
// calling the grounding tools — and understands it when the user writes it. Cheap
// after the first call (prompt-cached).
function buildLexiconGlossary() {
  const lex = readPublicJson("watch_lexicon.json");
  const terms = lex && Array.isArray(lex.terms) ? lex.terms : [];
  if (!terms.length) return "";
  const lines = terms.map((t) => {
    const names = [t.term, ...((t.aliases || []))].filter(Boolean).join(" / ");
    const c = t.canonical || {};
    const canon = [c.brand, c.model_line, c.reference, c.dial, c.bezel, c.complication, c.condition, c.collector_intent]
      .filter(Boolean).join(" · ");
    const def = t.definition ? ` — ${t.definition}` : "";
    return `- ${names}${def}${canon ? ` [${canon}]` : ""}`;
  });
  return "WATCH LEXICON — collectors use this shorthand. Understand it when the user writes it, and EXPAND it to the canonical brand/model/dial/etc. terms below before calling the search tools:\n" + lines.join("\n");
}

// ── system prompt — the cold-open voice + grounding contract ──────────
// EXTERNALISED to public/lume_system_prompt.txt so tuning Lumé's behaviour is
// a prose edit + redeploy (no code change). Read ONCE at module init to keep
// the prompt-cache prefix byte-stable. The FALLBACK below is a minimal safety
// net so a missing/unreadable file can never 500 the endpoint — keep it short;
// the real, maintained prompt lives in the .txt. Honors the house style:
// intrinsic, lateral, NO hierarchy ("starter/entry watch") — see
// [[feedback_reference_voice_intrinsic]] — and recommender transparency.
const SYSTEM_PROMPT_FALLBACK = `You are **Lumé**, the resident watch expert inside The Watch List app. Answer ONLY from tool calls into our corpus (the user's saved data, our listings, auction state, the reference index + syntheses) and cite source URLs — never invent references, prices, specs, or dates. Warm, friendly, knowledgeable; never rank or diminish watches (no "starter/entry watch"). If a tool returns nothing, say so — don't guess. Keep replies tight. Use the tools before any factual claim.`;
const SYSTEM_PROMPT = readPublicText("lume_system_prompt.txt") || SYSTEM_PROMPT_FALLBACK;

// ── tool definitions ──────────────────────────────────────────────────
// cache_control on the last tool caches tools+system together (render
// order is tools → system → messages). Per-user data arrives in messages.
const TOOLS = [
  {
    name: "get_user_context",
    description:
      "Read THIS signed-in user's saved data: hearted items, saved searches, owned/sold/wishlist collections, tracked auction lots, and saved auctions. Returns counts (to drive the confidence ramp) plus small samples. Call this first to know who you're talking to and whether it's a cold start.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "search_listings",
    description:
      "Search live (and optionally sold) dealer listings in the corpus. Filter by free-text query, brand, model, reference number, and USD price range. Returns matches with their source URL.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "free-text, matched against brand/model/ref/title" },
        brand: { type: "string" },
        reference: { type: "string", description: "reference number, e.g. 5513" },
        min_price_usd: { type: "number" },
        max_price_usd: { type: "number" },
        include_sold: { type: "boolean", description: "also search sold listings (default false)" },
        limit: { type: "number", description: "max results (default 8, cap 15)" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_auction_state",
    description:
      "Current auction-house state: upcoming / live / ended sales (house, title, location, dates, whether the catalog is live, catalog URL). Use for 'what's live', 'latest catalog', 'ending soon' type questions.",
    input_schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["live", "upcoming", "ended", "all"], description: "default all" },
        house: { type: "string" },
        limit: { type: "number", description: "max sales (default 12)" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_reference",
    description:
      "Look up the curated reference index (brand → model line → reference numbers, nicknames, years, notes) and, where a deep-dive synthesis exists for that model line, its source-cited consensus claims, named marks/dial variants, conflicts, and stories. Coverage spans the model lines the community has saved (Submariner, Speedmaster, and a growing set) — pass a brand + model_line and it returns whatever synthesis we hold, or just the index entry if none. Use for canonical facts about a model or reference. Returns sources to cite.",
    input_schema: {
      type: "object",
      properties: {
        brand: { type: "string" },
        model_line: { type: "string", description: "e.g. Submariner" },
        reference: { type: "string", description: "e.g. 5513" },
        query: { type: "string", description: "free-text fallback" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "search_articles",
    description:
      "Search OUR editorial article corpus — collector magazines, dealer journals, and deep-dive write-ups (Hodinkee Bring-a-Loupe, A Collected Man, Fratello, Bulang, OnTheDash, Screwdown Crown, WOE, Christie's, Rolex Magazine). This is your KNOWLEDGE about watches: use it to ANSWER questions about a watch / brand / model / reference / collecting topic (what it is, its history, variants, quirks, what to look for) — it covers brands and models FAR beyond the curated reference index (e.g. Enicar, niche or independent makers). Reach for this BEFORE concluding you don't know something. Returns matching articles with a relevant snippet and the source URL to cite.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "free-text — brand, model, reference, or topic (e.g. 'Enicar Sherpa Super Jet date')" },
        brand: { type: "string" },
        limit: { type: "number", description: "max results (default 5, cap 8)" },
      },
      additionalProperties: false,
    },
  },
];

// ── tool handlers ─────────────────────────────────────────────────────

async function toolGetUserContext(sb) {
  const out = {
    hearted_count: 0,
    saved_search_count: 0,
    owned_count: 0,
    sold_count: 0,
    wishlist_count: 0,
    tracked_lot_count: 0,
    saved_auction_count: 0,
    hearted_sample: [],
    saved_searches_sample: [],
  };
  // Each read is RLS-scoped to the user via the JWT-bearing client. Wrap
  // defensively so one missing table/column can't blank the whole context.
  try {
    const { data } = await sb
      .from("watchlist_items")
      .select("listing_snapshot, saved_at")
      .limit(60);
    if (Array.isArray(data)) {
      out.hearted_count = data.length;
      out.hearted_sample = data.slice(0, 12).map((r) => {
        const s = r.listing_snapshot || {};
        return {
          brand: s.brand || "",
          model: s.model || s.model_line || "",
          reference: s.reference_id || s.reference_no || "",
          priceUSD: s.priceUSD ?? s.price ?? null,
          url: s.url || "",
        };
      });
    }
  } catch {}
  try {
    const { data } = await sb
      .from("saved_searches")
      .select("label, query, min_price, max_price")
      .limit(20);
    if (Array.isArray(data)) {
      out.saved_search_count = data.length;
      out.saved_searches_sample = data.slice(0, 12).map((r) => ({
        label: r.label || "",
        query: r.query || "",
        min_price: r.min_price ?? null,
        max_price: r.max_price ?? null,
      }));
    }
  } catch {}
  try {
    const { data } = await sb.from("collections").select("type, is_shared_inbox").limit(100);
    if (Array.isArray(data)) {
      for (const c of data) {
        if (c.type === "owned") out.owned_count += 1;
        else if (c.type === "sold") out.sold_count += 1;
        else if (c.type === "wishlist") out.wishlist_count += 1;
      }
    }
  } catch {}
  try {
    const { count } = await sb
      .from("tracked_lots")
      .select("*", { count: "exact", head: true });
    if (typeof count === "number") out.tracked_lot_count = count;
  } catch {}
  try {
    const { count } = await sb
      .from("saved_auctions")
      .select("*", { count: "exact", head: true });
    if (typeof count === "number") out.saved_auction_count = count;
  } catch {}
  return out;
}

function toolSearchListings(input) {
  const limit = Math.min(Math.max(Number(input.limit) || 8, 1), 15);
  const files = ["listings_live.json"];
  if (input.include_sold) files.push("listings_sold.json");
  const q = _norm(input.query);
  const brand = _norm(input.brand);
  const ref = _norm(input.reference);
  const minP = Number.isFinite(input.min_price_usd) ? input.min_price_usd : null;
  const maxP = Number.isFinite(input.max_price_usd) ? input.max_price_usd : null;

  const results = [];
  for (const fname of files) {
    const arr = readPublicJson(fname);
    if (!Array.isArray(arr)) continue;
    for (const it of arr) {
      if (!it) continue;
      const hay = _norm(`${it.brand} ${it.title || it.ref} ${it.model} ${it.model_line} ${it.reference_id} ${it.reference_no}`);
      if (q && !hay.includes(q)) continue;
      if (brand && !_norm(it.brand).includes(brand)) continue;
      if (ref && !_norm(`${it.reference_id} ${it.reference_no} ${it.title} ${it.ref}`).includes(ref)) continue;
      const price = it.priceUSD ?? (it.currency === "USD" ? it.price : null);
      if (minP != null && (price == null || price < minP)) continue;
      if (maxP != null && (price == null || price > maxP)) continue;
      results.push({
        id: it.id || "",          // stable id for open_watch (resolve in-app)
        brand: it.brand || "",
        model: it.model || it.model_line || "",
        reference: it.reference_id || it.reference_no || "",
        priceUSD: it.priceUSD ?? null,
        currency: it.currency || "",
        source: it.source || "",
        sold: !!it.sold,
        soldAt: it.soldAt || null,
        url: it.url || "",
      });
      if (results.length >= limit * 3) break; // cheap early stop before slice
    }
  }
  return { count: results.length, results: results.slice(0, limit) };
}

function toolGetAuctionState(input) {
  const state = readPublicJson("auctions_state.json") || {};
  const wantStatus = (input.status || "all").toLowerCase();
  const house = _norm(input.house);
  const limit = Math.min(Math.max(Number(input.limit) || 12, 1), 30);
  const sales = [];
  for (const id of Object.keys(state)) {
    const s = state[id] || {};
    const hint = _norm(s.statusHint);
    if (wantStatus !== "all" && hint !== wantStatus) continue;
    if (house && !_norm(s.house).includes(house)) continue;
    sales.push({
      house: s.house || "",
      title: s.title || "",
      location: s.location || "",
      dates: s.dateLabel || [s.dateStart, s.dateEnd].filter(Boolean).join(" – "),
      status: s.statusHint || "",
      catalog_live: !!s.hasCatalog,
      catalog_url: s.catalogUrl || "",
    });
    if (sales.length >= limit) break;
  }
  return { count: sales.length, sales };
}

async function runTool(name, input, sb) {
  try {
    if (name === "get_user_context") return await toolGetUserContext(sb);
    if (name === "search_listings") return toolSearchListings(input || {});
    if (name === "get_auction_state") return toolGetAuctionState(input || {});
    if (name === "get_reference") return getReference(input || {});
    if (name === "search_articles") return searchArticles(input || {});
    return { error: `unknown tool: ${name}` };
  } catch (e) {
    return { error: `tool ${name} failed: ${e.message}` };
  }
}

// ── model routing — Opus only for hard-reasoning turns ────────────────
function chooseModel(text) {
  const t = _norm(text);
  if (t.length > 400) return MODEL_SMART;
  if (/\b(why|compare|comparison|vs\.?|versus|recommend|recommendation|should i|which (one|watch|should)|better|worth it|instead|trade[- ]?off|pros and cons|help me (decide|choose)|what (would|should) you)\b/.test(t)) {
    return MODEL_SMART;
  }
  return MODEL_FAST;
}

function lastUserText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "user") {
      if (typeof m.content === "string") return m.content;
      if (Array.isArray(m.content)) {
        return m.content.filter((b) => b.type === "text").map((b) => b.text).join(" ");
      }
    }
  }
  return "";
}

// ── structured actions (Lumé offer→do) ───────────────────────────────
// The model appends a trailing <actions>[…]</actions> block; we extract,
// validate, clamp (≤3), and strip it from the visible reply. Only types the
// client ActionBus actually wires are allowed — so an offered button is never
// a no-op. (Types grow per PR: PR-A = show_listings, read_more.)
const ACTION_TYPES = new Set([
  "show_listings", "open_watch", "read_more", "add_to_list", "create_list", "save_note",
]);

function extractActions(text) {
  const m = (text || "").match(/<actions>\s*([\s\S]*?)<\/actions>/i);
  if (!m) return { text: text || "", actions: [] };
  let actions = [];
  try {
    const parsed = JSON.parse(m[1]);
    if (Array.isArray(parsed)) {
      actions = parsed
        .filter((a) => a && ACTION_TYPES.has(a.type) && typeof a.label === "string" && a.label.trim())
        .slice(0, 3)
        .map((a) => ({
          type: a.type,
          label: a.label.trim().slice(0, 60),
          payload: a.payload && typeof a.payload === "object" ? a.payload : {},
        }));
    }
  } catch {
    actions = [];
  }
  return { text: text.replace(m[0], "").trim(), actions };
}

// ── handler ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }
  if (!ANTHROPIC_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    res.status(500).json({ error: "server_misconfigured" });
    return;
  }

  // 1) Verify the Supabase JWT — derive user_id from the token, never the body.
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!jwt) {
    res.status(401).json({ error: "missing_token" });
    return;
  }
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let userId = null;
  try {
    const { data, error } = await sb.auth.getUser(jwt);
    if (error || !data || !data.user) {
      res.status(401).json({ error: "invalid_token" });
      return;
    }
    userId = data.user.id;
  } catch {
    res.status(401).json({ error: "invalid_token" });
    return;
  }

  // 2) Daily quota — gated BEFORE any Anthropic spend. P0001 → 429.
  try {
    const { error } = await sb.rpc("consume_chat_quota");
    if (error) {
      if (error.code === "P0001") {
        res.status(429).json({ error: "cap_exceeded", message: "Daily chat limit reached — back tomorrow." });
        return;
      }
      res.status(500).json({ error: "quota_check_failed" });
      return;
    }
  } catch {
    res.status(500).json({ error: "quota_check_failed" });
    return;
  }

  // 3) Validate + truncate the conversation history.
  const body = typeof req.body === "string" ? safeJson(req.body) : req.body || {};
  let messages = Array.isArray(body.messages) ? body.messages : [];
  messages = messages
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content != null)
    .slice(-MAX_HISTORY_MSGS);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    res.status(400).json({ error: "bad_messages" });
    return;
  }

  // 4) Tool-use loop (manual; bounded). Cheap model unless the turn needs reasoning.
  const model = chooseModel(lastUserText(messages));
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  // System prefix: the voice/contract + the watch lexicon (phase 1). cache_control
  // on the LAST block caches the whole static prefix (system + lexicon) together.
  const lexiconGlossary = buildLexiconGlossary();
  const system = [{ type: "text", text: SYSTEM_PROMPT }];
  if (lexiconGlossary) system.push({ type: "text", text: lexiconGlossary });
  system[system.length - 1].cache_control = { type: "ephemeral" };
  // cache_control on the last tool caches the whole tools block with system.
  const tools = TOOLS.map((t, i) =>
    i === TOOLS.length - 1 ? { ...t, cache_control: { type: "ephemeral" } } : t
  );

  let inputTok = 0;
  let outputTok = 0;
  let finalText = "";
  const convo = messages.map((m) => ({ role: m.role, content: m.content }));

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const params = {
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system,
        tools,
        messages: convo,
      };
      // Disable extended thinking to keep latency + cost down; the system
      // prompt already asks for final-answer-only (Opus 4.8 otherwise may
      // narrate reasoning when thinking is off).
      if (model === MODEL_SMART) params.thinking = { type: "disabled" };

      const resp = await anthropic.messages.create(params);
      const u = resp.usage || {};
      inputTok += (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
      outputTok += u.output_tokens || 0;

      if (resp.stop_reason === "tool_use") {
        convo.push({ role: "assistant", content: resp.content });
        const toolUses = resp.content.filter((b) => b.type === "tool_use");
        const toolResults = [];
        for (const tu of toolUses) {
          const result = await runTool(tu.name, tu.input, sb);
          toolResults.push({
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify(result).slice(0, 60000),
          });
        }
        convo.push({ role: "user", content: toolResults });
        continue;
      }

      finalText = resp.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      break;
    }
  } catch (e) {
    // Don't refund the quota message — a failed attempt still counts (cheap
    // backstop against retry-spam); surface a clean error.
    res.status(502).json({ error: "model_error", message: e.message });
    return;
  }

  // Pull out any structured actions Lumé appended; strip them from the text.
  let actions = [];
  ({ text: finalText, actions } = extractActions(finalText));

  if (!finalText) {
    finalText = "I hit my limit working that one out — try asking a bit more narrowly.";
  }

  // 5) Log token spend (best-effort; never block the response on it).
  try {
    await sb.rpc("log_chat_tokens", { p_input: inputTok, p_output: outputTok, p_model: model });
  } catch {}

  res.status(200).json({ reply: finalText, actions, model });
}

function safeJson(s) {
  try { return JSON.parse(s); } catch { return {}; }
}

// Internals exposed ONLY for the offline eval harness (src/lume_eval.test.js),
// so it drives the REAL system prompt + tool defs + pure tool handlers + routing
// rather than a drifting copy. Not used by the handler; harmless to Vercel
// (the default export is still the handler).
export const __evalInternals = {
  SYSTEM_PROMPT, TOOLS, toolSearchListings, toolGetAuctionState,
  chooseModel, extractActions, MAX_TOOL_ROUNDS, MODEL_FAST, MODEL_SMART,
};
