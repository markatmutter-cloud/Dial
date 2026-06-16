// lumeMissed — the CLIENT-SAFE copy of Lumé's "what did I miss" selector.
//
// Why a copy: the canonical pure logic lives in `api/lume_reference.js`
// (`selectMissed`), but that module imports `fs`/`path` at top level for its
// other helpers, so the CRA client can't import it (ModuleScopePlugin blocks
// imports outside src/, and `fs` won't bundle). Rather than destabilise the
// live chat backend to split it, we keep a byte-for-byte logic copy here and
// guard drift with a parity test (`lumeMissed.parity.test.js`) — the same
// shared-fixture pattern node_slug.py / lume_reference.js use.
//
// PURE: no imports, no I/O. Feeds the morphing-canvas catch-up journeys
// straight from the listings already in App memory (no /api/chat round-trip).

export function norm(s) {
  return String(s == null ? "" : s).toLowerCase();
}

// Normalise a listing URL to a stable key so saved-state matching works across
// surfaces (watchlist_items.listing_snapshot.url vs listings_*.json url): drop
// protocol, www, query, trailing slash. Mirrors api/lume_reference.js urlKey.
export function urlKey(u) {
  return norm(u).replace(/^https?:\/\//, "").replace(/^www\./, "").split("?")[0].replace(/\/+$/, "");
}

// Build the user's hearted + taste sets from the client watchlist map
// ({ id: item }). Mirrors the server-side derivation in api/chat.js
// toolFindMissed (lines ~303-315) so client and server window taste identically.
export function deriveTasteSets(watchlistMap) {
  const heartedUrls = new Set(), heartedIds = new Set(), tasteKeys = new Set(), tasteBrands = new Set();
  const items = watchlistMap && typeof watchlistMap === "object" ? Object.values(watchlistMap) : [];
  for (const s of items) {
    if (!s || typeof s !== "object") continue;
    if (s.url) heartedUrls.add(urlKey(s.url));
    if (s.id) heartedIds.add(s.id);
    const brand = norm(s.brand), ml = norm(s.model_line || s.model || "");
    if (brand) { tasteBrands.add(brand); tasteKeys.add(`${brand}|${ml}`); }
  }
  return { heartedUrls, heartedIds, tasteKeys, tasteBrands };
}

// PURE selector — see api/lume_reference.js for the canonical doc comment.
// modes: live_unsaved | sold_unsaved (speed-ranked) | sold_saved.
export function selectMissed(listings, opts = {}) {
  const mode = ["live_unsaved", "sold_unsaved", "sold_saved"].includes(opts.mode) ? opts.mode : "live_unsaved";
  const windowDays = Math.min(Math.max(Number(opts.windowDays) || 7, 1), 60);
  const limit = Math.min(Math.max(Number(opts.limit) || 8, 1), 15);
  const heartedUrls = opts.heartedUrls instanceof Set ? opts.heartedUrls : new Set();
  const heartedIds = opts.heartedIds instanceof Set ? opts.heartedIds : new Set();
  const tasteKeys = opts.tasteKeys instanceof Set ? opts.tasteKeys : new Set();
  const tasteBrands = opts.tasteBrands instanceof Set ? opts.tasteBrands : new Set();
  const DAY = 86400000;
  const now = Number(opts.nowMs) || Date.parse(opts.nowISO || "") || Date.now();
  const cutoff = now - windowDays * DAY;

  const sold = mode !== "live_unsaved";
  const onlySaved = mode === "sold_saved";
  const out = [];
  if (!Array.isArray(listings)) return { count: 0, mode, window_days: windowDays, results: [] };
  for (const it of listings) {
    if (!it || !it.url) continue;
    if (sold ? !it.sold : !!it.sold) continue;
    const dateStr = sold ? it.soldAt : it.firstSeen;
    const t = dateStr ? Date.parse(dateStr) : NaN;
    if (!Number.isFinite(t) || t < cutoff) continue;
    const saved = heartedUrls.has(urlKey(it.url)) || (it.id && heartedIds.has(it.id));
    if (onlySaved ? !saved : saved) continue;
    const brand = norm(it.brand);
    const ml = norm(it.model_line || it.model || "");
    if (!onlySaved && (tasteKeys.size || tasteBrands.size)) {
      if (!(tasteKeys.has(`${brand}|${ml}`) || tasteBrands.has(brand))) continue;
    }
    const tts = (sold && it.firstSeen && it.soldAt)
      ? Math.max(0, Math.round((Date.parse(it.soldAt) - Date.parse(it.firstSeen)) / DAY)) : null;
    const rawPrice = it.priceUSD ?? it.lastMeaningfulPrice;
    out.push({
      id: it.id || "",
      brand: it.brand || "",
      model: it.model || it.model_line || "",
      reference: it.reference_id || it.reference_no || it.ref || "",
      priceUSD: (typeof rawPrice === "number" && rawPrice > 0) ? rawPrice : null,
      currency: it.currency || "",
      source: it.source || "",
      url: it.url || "",
      sold: !!it.sold,
      soldAt: it.soldAt || null,
      firstSeen: it.firstSeen || null,
      time_to_sell_days: tts,
      taste_match: tasteKeys.has(`${brand}|${ml}`) ? "model" : (tasteBrands.has(brand) ? "brand" : null),
    });
  }
  const recency = (x) => Date.parse((sold ? x.soldAt : x.firstSeen) || "") || 0;
  const tier = (x) => (x.taste_match === "model" ? 0 : x.taste_match === "brand" ? 1 : 2);
  if (mode === "sold_unsaved") {
    out.sort((a, b) => tier(a) - tier(b) || (a.time_to_sell_days ?? 999) - (b.time_to_sell_days ?? 999) || recency(b) - recency(a));
  } else {
    out.sort((a, b) => tier(a) - tier(b) || recency(b) - recency(a));
  }
  return { count: out.length, mode, window_days: windowDays, results: out.slice(0, limit) };
}
