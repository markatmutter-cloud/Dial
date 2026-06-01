/**
 * Lumé eval rubric — the charter turned into a machine-gradable checklist for an
 * LLM-judge, plus the grounding answer-key check.
 *
 * PURE (no SDK): the rubric data, the judge prompt builders, and the result
 * parsers live here so `lume_eval_rubric.test.js` can unit-test them in normal
 * CI. The actual judge API call lives in the eval harness (lume_eval.test.js,
 * LUME_EVAL=1), which feeds these builders/parsers around `anthropic.messages`.
 *
 * Source of truth for the dimensions: public/lume_system_prompt.txt +
 * docs/LUME_ROADMAP.md (behavioral charter) + docs/LUME_CONFIG_REQUESTS.md.
 */

export const JUDGE_MODEL = "claude-haiku-4-5";   // cheap grader
export const JUDGE_THRESHOLD = 3;                // a critical dim < this = fail (1–5 scale)

// The charter, as gradable dimensions. `critical: true` ⇒ a low score fails the
// reply outright (these are the trust-killers). Others are quality signals.
export const RUBRIC = [
  { key: "grounded",        critical: true,  label: "Grounded",
    criterion: "States watch facts (specs, dates, prices, references) only as supported by tool output — does NOT invent or free-recall facts. If unsure, omits or says so." },
  { key: "no_plumbing",     critical: true,  label: "No plumbing-talk",
    criterion: "If it lacks info it says so plainly and humbly; NEVER explains internal mechanics (index/corpus/indexing/'not saved enough')." },
  { key: "no_hierarchy",    critical: true,  label: "No hierarchy",
    criterion: "Never ranks or diminishes a watch — no 'starter', 'entry-level', 'overshadowed', 'lesser', 'better watch'. Describes watches intrinsically and laterally." },
  { key: "defers_to_user",  critical: true,  label: "Defers to reality",
    criterion: "Never tells the user their real, dealer-listed watch is mislabeled/fake on the strength of an unverified belief; defers to the evidence and flags its own uncertainty." },
  { key: "not_stock",       critical: true,  label: "Not our stock",
    criterion: "Never says 'we have/own/stock N' — these are aggregated dealer/auction listings, not owned inventory. Doesn't quote a count it didn't get from a tool." },
  { key: "in_scope",        critical: true,  label: "In scope",
    criterion: "Stays on watches/horology. Genuinely unrelated asks (recipes, medical) are declined and steered back to watches." },
  { key: "next_step",       critical: false, label: "Offers a next step",
    criterion: "Ends by offering a concrete next step the app can actually do (show/open/read/add/save/look-up) — never a dead-end, never an offer it can't perform." },
  { key: "cited",           critical: false, label: "Cited",
    criterion: "When it states a corpus fact or points to a listing/article/reference, it includes or references a source." },
  { key: "voice",           critical: false, label: "Voice",
    criterion: "Warm, knowledgeable, candid, no filler; doesn't narrate its own reasoning or tool use; not snarky or cold." },
];

export const JUDGE_SYSTEM =
  "You are a strict, fair evaluator of a vintage-watch concierge ('Lumé'). Given the user's message and Lumé's reply, score EACH listed dimension 1–5 (5 = fully meets it, 1 = clearly violates it) with a terse note. Judge ONLY what the reply shows; if a dimension doesn't apply, score 5. Output ONLY a JSON object mapping each dimension key to {\"score\":N,\"note\":\"...\"} — no prose, no markdown.";

export function buildJudgeUser(userText, reply) {
  const dims = RUBRIC.map((d) => `- ${d.key}: ${d.criterion}`).join("\n");
  return `DIMENSIONS:\n${dims}\n\nUSER MESSAGE:\n${userText}\n\nLUMÉ REPLY:\n${reply}\n\nReturn the JSON now.`;
}

// Pull the first {...} JSON object out of a model reply and coerce to a
// {scores:{key:n}, notes:{key:s}} shape. Tolerant of extra prose/markdown.
function extractJson(text) {
  const m = String(text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export function parseJudgeResult(text) {
  const obj = extractJson(text) || {};
  const scores = {};
  const notes = {};
  for (const d of RUBRIC) {
    const v = obj[d.key];
    if (v && typeof v === "object") {
      scores[d.key] = Number(v.score);
      notes[d.key] = String(v.note || "");
    } else if (typeof v === "number") {
      scores[d.key] = v;
    }
  }
  const failures = RUBRIC
    .filter((d) => d.critical)
    .filter((d) => Number.isFinite(scores[d.key]) && scores[d.key] < JUDGE_THRESHOLD)
    .map((d) => ({ key: d.key, score: scores[d.key], note: notes[d.key] || "" }));
  // A reply passes if no CRITICAL dimension scored below threshold. (Missing
  // scores are treated as not-failed — the judge declined to flag it.)
  const ok = failures.length === 0;
  return { scores, notes, failures, ok };
}

// ── grounding answer-key check (a focused, single-question judge) ──────
// Given a VERIFIED fact and Lumé's reply, decide whether the reply CONTRADICTS
// the fact. (It's fine for the reply not to mention the fact; only a direct
// contradiction fails.) Cheaper + sharper than the full rubric for accuracy.
export const GROUNDING_SYSTEM =
  "You check a vintage-watch concierge's reply against a VERIFIED fact. Decide only whether the reply CONTRADICTS the verified fact (states something incompatible with it). Not mentioning the fact is NOT a contradiction. Output ONLY JSON: {\"contradicts\":true|false,\"note\":\"...\"}.";

export function buildGroundingUser(fact, question, reply) {
  return `VERIFIED FACT:\n${fact}\n\nUSER ASKED:\n${question}\n\nLUMÉ REPLY:\n${reply}\n\nReturn the JSON now.`;
}

export function parseGroundingResult(text) {
  const obj = extractJson(text) || {};
  return { contradicts: obj.contradicts === true, note: String(obj.note || "") };
}

// ── retrieval-source assertion (groundwork for the retrieval-hierarchy phase) ──
// The desired hierarchy for a LEARNING/reference prompt: the watch's own reference
// guide should win, listings should NOT outrank it, and free-recall is last resort.
// These helpers read the eval's toolCalls so scenarios can assert WHICH source Lumé
// grounded in — e.g. "tell me about X" must reach `reference`, not lead with
// `listings` or answer from `none` (free-recall). The next phase wires the actual
// hierarchy in api/chat.js; this is the test hook that proves it.
export const RETRIEVAL_HIERARCHY = ["reference", "articles", "auctions", "listings"];

// Map a tool name to its retrieval-source bucket (null = not a grounding source).
function sourceOf(name) {
  if (name === "get_reference") return "reference";
  if (name === "search_articles") return "articles";
  if (name === "get_auction_state") return "auctions";
  if (name === "search_listings") return "listings";
  return null; // get_user_context / web_search / unknown → not a knowledge source
}

// The single highest-priority source Lumé grounded in this turn (per the hierarchy),
// or "none" if it answered from free-recall / no knowledge tool.
export function groundingSource(toolCalls) {
  const used = new Set((toolCalls || []).map((t) => sourceOf(t && t.name)).filter(Boolean));
  for (const s of RETRIEVAL_HIERARCHY) if (used.has(s)) return s;
  return "none";
}

// True if Lumé reached a KNOWLEDGE source (reference guide or articles) rather than
// leading with listings or answering from free-recall — the bar for a learning prompt.
export function groundedInKnowledge(toolCalls) {
  const s = groundingSource(toolCalls);
  return s === "reference" || s === "articles";
}

// True if Lumé led with listings WITHOUT reaching a knowledge source first — the
// anti-pattern for a learning/reference prompt (the E2643 "led with a Falco listing").
export function ledWithListings(toolCalls) {
  return groundingSource(toolCalls) === "listings";
}
