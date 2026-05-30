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
