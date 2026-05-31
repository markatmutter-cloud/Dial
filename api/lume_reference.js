/**
 * Lumé corpus helpers — the PURE, no-SDK half of api/chat.js, split out so
 * jest can exercise it directly (chat.js drags in the Anthropic + Supabase
 * SDKs, which we don't want to load in a unit test). chat.js re-imports every
 * export from here; the slug logic is also mirrored in node_slug.py with a
 * shared-fixture parity test (tests/fixtures/node_slug_cases.json).
 *
 * Read-only: filesystem reads of public/*.json + the externalised prompt text.
 */
import fs from "fs";
import path from "path";

// ── public/* loaders (cached; mirrors api/share.js loadListings) ──────
const CACHE_TTL_MS = 60 * 1000;
const _cache = new Map(); // filename -> { data, t }

export function readPublicJson(fname) {
  const now = Date.now();
  const hit = _cache.get(fname);
  if (hit && now - hit.t < CACHE_TTL_MS) return hit.data;
  let data = null;
  try {
    data = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public", fname), "utf8")
    );
  } catch {
    data = null;
  }
  _cache.set(fname, { data, t: now });
  return data;
}

// Raw-text twin (no JSON.parse) for the externalised system prompt. chat.js
// reads it ONCE at module init so the prompt-cache prefix stays byte-stable.
export function readPublicText(fname) {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", fname), "utf8");
  } catch {
    return null;
  }
}

export function norm(s) {
  return String(s == null ? "" : s).toLowerCase();
}

// ── search_articles: knowledge over the editorial corpus ──────────────
// Lumé's window into OUR 13k editorial articles (collector mags, dealer
// journals, deep-dive write-ups) — the knowledge that lets it TALK ABOUT a
// watch, far beyond the curated reference index. Scores each article on a
// title/brand/excerpt/themes match + a body-presence bonus, then returns the
// top matches with a snippet drawn from the body and the source URL to cite.
// Essay/journal sources only (skips the priced shop feeds + reference_corpus_*
// node subsets). Bodies are cached (readPublicJson, 60s) so a session is cheap.
const ARTICLE_SOURCES = [
  "acollectedman_journal", "bring_a_loupe", "bulang_watch_talks", "christies_stories",
  "fratello", "hodinkee_reference_points", "onthedash", "rolex_magazine",
  "screwdowncrown", "woe_dispatch",
];

function _snippet(text, terms, width = 380) {
  const t = String(text || "");
  if (!t) return "";
  const low = t.toLowerCase();
  let at = -1;
  for (const term of terms) {
    const i = low.indexOf(term);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) return t.slice(0, width).trim() + (t.length > width ? "…" : "");
  const start = Math.max(0, at - Math.floor(width / 3));
  const end = Math.min(t.length, start + width);
  return (start > 0 ? "…" : "") + t.slice(start, end).trim() + (end < t.length ? "…" : "");
}

export function searchArticles(input) {
  const q = norm(input.query);
  const brand = norm(input.brand);
  const limit = Math.min(Math.max(Number(input.limit) || 5, 1), 8);
  const terms = `${q} ${brand}`.split(/\s+/).filter((t) => t.length > 2);
  if (!terms.length) return { count: 0, results: [] };

  const scored = [];
  for (const src of ARTICLE_SOURCES) {
    const meta = readPublicJson(`${src}.json`);
    if (!meta) continue;
    const bodies = readPublicJson(`${src}_bodies.json`) || {};
    const items = Array.isArray(meta) ? meta : Object.values(meta);
    for (const r of items) {
      if (!r || typeof r !== "object") continue;
      const url = r.url || "";
      const title = norm(r.title);
      const metaHay = norm(`${r.title} ${r.excerpt} ${r.brand} ${r.model} ${r.model_line} ${(r.themes || []).join(" ")}`);
      const bodyLow = (bodies[url] || "").toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) score += 4;
        else if (metaHay.includes(term)) score += 2;
        if (bodyLow.includes(term)) score += 1;
      }
      if (score > 0) scored.push({ score, src, r, body: bodies[url] || r.excerpt || "" });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return {
    count: scored.length,
    results: scored.slice(0, limit).map(({ src, r, body }) => ({
      title: r.title || "",
      publication: r.source || src,
      author: r.author || "",
      url: r.url || "",
      themes: r.themes || [],
      snippet: _snippet(body, terms),
    })),
  };
}

// ── node slug (mirrors node_slug.py) ──────────────────────────────────
// Folds variant model-line labels onto one node ("Submariner (gold variants)"
// → submariner) and exposes the legacy BARE alias so the two pre-existing
// hand-curated nodes (submariner / speedmaster) keep resolving.
function baseModel(modelLine) {
  let m = (modelLine || "").trim();
  m = m.replace(/\(.*?\)/g, "");             // drop parentheticals
  m = m.split(/\s+[—–-]\s+|\s*\/\s*/)[0];     // before " — " / " - " / " / "
  return m.trim();
}
function slugify(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
export function nodeSlug(brand, modelLine) {
  return slugify(`${(brand || "").trim()} ${baseModel(modelLine)}`);
}
export function nodeAliases(brand, modelLine) {
  const full = nodeSlug(brand, modelLine);
  const bare = slugify(baseModel(modelLine));
  const out = [full];
  if (bare && bare !== full) out.push(bare);
  return out;
}

// ── get_reference tool body ───────────────────────────────────────────
// Curated index lookup + (generically, by node slug) the deep-dive synthesis
// for any model line we hold. No hardcoded node list — the saved-node pipeline
// grows the synthesis set automatically. Returns `marks` (named dial variants),
// the per-reference detail Lumé trips on.
export function getReference(input) {
  const index = readPublicJson("watch_references_index.json") || {};
  const brand = norm(input.brand);
  const line = norm(input.model_line);
  const ref = norm(input.reference);
  const q = norm(input.query);

  const matches = [];
  for (const b of Object.keys(index)) {
    if (brand && !norm(b).includes(brand)) continue;
    const lines = index[b] || {};
    for (const ml of Object.keys(lines)) {
      const entry = lines[ml] || {};
      const refs = (entry.refs || []).map(norm);
      const hay = norm(`${b} ${ml} ${(entry.nicknames || []).join(" ")} ${entry.notes}`);
      let ok = true;
      if (line && !norm(ml).includes(line)) ok = false;
      if (ref && !(refs.some((r) => r.includes(ref)) || norm(ml).includes(ref))) ok = false;
      if (q && !hay.includes(q)) ok = false;
      if (!brand && !line && !ref && !q) ok = false; // require at least one filter
      if (ok) {
        matches.push({
          brand: b,
          model_line: ml,
          refs: entry.refs || [],
          nicknames: entry.nicknames || [],
          years: entry.years || "",
          notes: entry.notes || "",
        });
      }
      if (matches.length >= 6) break;
    }
    if (matches.length >= 6) break;
  }

  // Deep-dive syntheses (source-cited), served generically by node slug. For
  // every matched model line, try its node slug (+ legacy bare alias) and load
  // reference_synthesis_<slug>.json if we hold one. De-duped across matches.
  const synthesis = [];
  const seen = new Set();
  for (const m of matches) {
    for (const slug of nodeAliases(m.brand, m.model_line)) {
      if (seen.has(slug)) continue;
      const syn = readPublicJson(`reference_synthesis_${slug}.json`);
      if (!syn) continue;
      seen.add(slug);
      synthesis.push({
        node: slug,
        model_context: syn.model_context || "",
        consensus: (syn.consensus || []).slice(0, 12).map((c) => ({
          claim: c.claim,
          applies_to: c.applies_to,
          sources: c.sources || [],
        })),
        marks: (syn.marks || []).slice(0, 10).map((k) => ({
          name: k.name,
          applies_to: k.applies_to,
          explanation: k.explanation,
          sources: k.sources || [],
        })),
        conflicts: (syn.conflicts || []).slice(0, 4),
        stories: (syn.stories || []).slice(0, 4),
      });
      break; // one synthesis per matched line (first alias that resolves)
    }
  }

  return { index_matches: matches, synthesis };
}

// ── web search (Anthropic native server tool) ─────────────────────────
// Lumé's reach BEYOND our corpus (the "ChatGPT found the JLC E2643, Lumé
// couldn't" gap). The tool runs SERVER-SIDE inside Anthropic — it never hits
// runTool; chat.js handles its pause_turn round-trips and harvests citations.
// max_uses bounds cost per turn ($10/1k searches). Corpus-first usage +
// always-cite is enforced in public/lume_system_prompt.txt. Pure data/string
// helpers live here so jest can assert the wiring without loading the SDK.
export const WEB_SEARCH_TOOL = { type: "web_search_20250305", name: "web_search", max_uses: 3 };

// Harvest web-search citations (url + title) off a response's text blocks into
// `sink`, deduped by url. Anthropic attaches them as `web_search_result_location`
// entries on the `citations` array of each grounded text block.
export function collectWebCitations(content, sink) {
  for (const b of content || []) {
    if (b.type !== "text" || !Array.isArray(b.citations)) continue;
    for (const c of b.citations) {
      const url = c && c.url;
      if (!url || sink.some((x) => x.url === url)) continue;
      sink.push({ url, title: c.title || url });
    }
  }
}
