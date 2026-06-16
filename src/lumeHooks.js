// lumeHooks — the PERCEPTIVE-hook library for the Lumé greeting. Mark wants the
// opener to feel like "it knew that so well", and he's enumerated the kinds of
// signal that earn it. Each generator turns real data into one named, behaviour-
// aware line; buildHook picks the most perceptive non-empty one in priority
// order. Pure + extensible — add a generator and slot it into the priority list.
//
// Priority (most explicitly perceptive first):
//   1. saved-search activity  — they TOLD us they want this (sold-fast > new)
//   2. new taste-matched catalog — a house sale full of their lane
//   3. got-away — a named model in their taste that sold (the sting)
//   4. missed — a named model just surfaced in their lane
//   5. fallback — auctions closing / new reading

import { matchesSearch } from "./utils";

const DAY = 86400000;

function recentWithin(t, now, days = 14) {
  const x = Date.parse(t || "");
  return Number.isFinite(x) && now - x < days * DAY;
}
function soldDays(it) {
  if (!it || !it.firstSeen || !it.soldAt) return null;
  return Math.max(0, Math.round((Date.parse(it.soldAt) - Date.parse(it.firstSeen)) / DAY));
}
function nameOf(it) {
  if (!it) return "";
  const m = String(it.model || it.model_line || "").trim();
  return `${it.brand || ""} ${m}`.trim();
}
const norm = (s) => String(s == null ? "" : s).toLowerCase();

function savedSearchHook({ savedSearches, liveItems, now }) {
  if (!Array.isArray(savedSearches) || !savedSearches.length || !Array.isArray(liveItems)) return "";
  let best = null;
  for (const s of savedSearches) {
    const q = (s && (s.query || s.label)) || "";
    if (!q) continue;
    let newly = 0, soldFast = 0;
    for (const it of liveItems) {
      if (!it || !matchesSearch(it, q)) continue;
      if (s.min_price && it.priceUSD && it.priceUSD < s.min_price) continue;
      if (s.max_price && it.priceUSD && it.priceUSD > s.max_price) continue;
      if (it.sold) { if (recentWithin(it.soldAt, now) && (soldDays(it) ?? 99) <= 2) soldFast++; }
      else if (recentWithin(it.firstSeen, now)) newly++;
    }
    const score = soldFast * 3 + newly;
    if (score > 0 && (!best || score > best.score)) best = { label: s.label || q, newly, soldFast, score };
  }
  if (!best) return "";
  // Quote the label rather than pluralizing it — saved-search labels are free
  // text ("Jackie DateJust") and "Jackies DateJusts" reads wrong.
  if (best.soldFast) return `A few from your "${best.label}" search sold almost instantly.`;
  return `${best.newly} new on your "${best.label}" search.`;
}

function newCatalogHook({ auctionLotItems, tasteBrands, now }) {
  if (!Array.isArray(auctionLotItems) || !auctionLotItems.length || !tasteBrands || !tasteBrands.size) return "";
  const byHouse = {};
  for (const it of auctionLotItems) {
    if (!it || it.sold) continue;
    const end = Date.parse(it.auction_end || "");
    if (!(Number.isFinite(end) && end > now)) continue;
    if (!tasteBrands.has(norm(it.brand))) continue;
    const house = it.house || it.auction_house || it.source || "";
    if (!house) continue;
    byHouse[house] = (byHouse[house] || 0) + 1;
  }
  let bestHouse = null, bestN = 0;
  for (const [h, n] of Object.entries(byHouse)) if (n > bestN) { bestHouse = h; bestN = n; }
  return bestN >= 2 ? `There's a ${bestHouse} sale with a few you'd probably like.` : "";
}

function gotAwayHook({ gotAway, missedCount }) {
  const ga = gotAway && gotAway[0];
  if (!ga || !nameOf(ga)) return "";
  const d = soldDays(ga);
  const lead = d != null
    ? `That ${nameOf(ga)} you'd have liked sold in ${d} day${d !== 1 ? "s" : ""}`
    : `A ${nameOf(ga)} you'd have liked just sold`;
  return missedCount > 1 ? `${lead}, and a few more slipped by.` : `${lead}.`;
}

function missedHook({ missed, missedCount }) {
  const m = missed && missed[0];
  if (!m || !nameOf(m)) return "";
  return missedCount > 1
    ? `A ${nameOf(m)} just surfaced in your lane, with a few others.`
    : `A ${nameOf(m)} just surfaced, right in your lane.`;
}

function fallbackHook({ auctionsSoonCount, articlesCount }) {
  if (auctionsSoonCount) return "A few lots are about to go under the hammer.";
  if (articlesCount) return "There's some new reading waiting.";
  return "";
}

const GENERATORS = [savedSearchHook, newCatalogHook, gotAwayHook, missedHook, fallbackHook];

export function buildHook(ctx = {}) {
  const c = { ...ctx, now: ctx.now || Date.now() };
  for (const gen of GENERATORS) {
    const s = gen(c);
    if (s) return s;
  }
  return "";
}
