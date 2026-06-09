/** @jest-environment node */
/**
 * Unit tests for selectMissed (api/lume_reference.js) — the pure half of the
 * find_missed tool that powers the "what did I miss" / "the ones that got away"
 * Lumé workflow. No Supabase, no model, no file read — runs in normal CI.
 *
 * Pins the load-bearing behaviour: window by the right date per mode, EXCLUDE
 * the user's hearted set (the trust-breaker if it leaks), filter to taste, and
 * sort sold_unsaved fastest-sale-first.
 */
import { selectMissed, urlKey } from "../api/lume_reference";

const NOW = "2026-06-08T12:00:00Z"; // cutoff at 7d = 2026-06-01T12:00Z

// Taste = Tudor Submariner + Heuer Autavia (what the user has hearted).
const tasteBrands = new Set(["tudor", "heuer"]);
const tasteKeys = new Set(["tudor|submariner", "heuer|autavia"]);
// Two saved watches: one matched by url (with messy protocol/www/slash), one by id.
const heartedUrls = new Set([urlKey("https://www.shop.com/tudor-saved/")]);
const heartedIds = new Set(["SAVED_BY_ID"]);

const L = {
  liveInTaste:   { url: "https://shop.com/tudor-live", id: "a", brand: "Tudor", model_line: "Submariner", firstSeen: "2026-06-05", priceUSD: 9000, sold: false },
  liveOffTaste:  { url: "https://shop.com/rolex-live", id: "b", brand: "Rolex", model_line: "Daytona", firstSeen: "2026-06-05", priceUSD: 30000, sold: false },
  liveOldWindow: { url: "https://shop.com/tudor-old",  id: "c", brand: "Tudor", model_line: "Submariner", firstSeen: "2026-05-20", priceUSD: 8000, sold: false },
  liveSavedUrl:  { url: "http://shop.com/tudor-saved", id: "d", brand: "Tudor", model_line: "Submariner", firstSeen: "2026-06-06", priceUSD: 9500, sold: false }, // saved (url normalises to match)
};
const S = {
  soldFast:      { url: "https://shop.com/tudor-sold-fast", id: "e", brand: "Tudor", model_line: "Submariner", firstSeen: "2026-06-06", soldAt: "2026-06-07", priceUSD: null, lastMeaningfulPrice: 9250, sold: true }, // tts 1
  soldSlow:      { url: "https://shop.com/tudor-sold-slow", id: "f", brand: "Tudor", model_line: "Submariner", firstSeen: "2026-05-20", soldAt: "2026-06-07", priceUSD: null, lastMeaningfulPrice: 8800, sold: true }, // tts 18
  soldSavedById: { url: "https://shop.com/tudor-sold-mine", id: "SAVED_BY_ID", brand: "Tudor", model_line: "Submariner", firstSeen: "2026-06-07", soldAt: "2026-06-07", priceUSD: null, lastMeaningfulPrice: 9000, sold: true }, // tts 0, saved
  soldOldWindow: { url: "https://shop.com/tudor-sold-old", id: "g", brand: "Tudor", model_line: "Submariner", firstSeen: "2026-05-01", soldAt: "2026-05-20", priceUSD: null, lastMeaningfulPrice: 7000, sold: true },
};
const ALL = [...Object.values(L), ...Object.values(S)];

const opts = (mode) => ({ mode, nowISO: NOW, heartedUrls, heartedIds, tasteBrands, tasteKeys });
const urls = (r) => r.results.map((x) => x.url);

describe("selectMissed — live_unsaved", () => {
  const r = selectMissed(ALL, opts("live_unsaved"));
  test("keeps only live, in-taste, in-window, NOT saved", () => {
    expect(urls(r)).toEqual(["https://shop.com/tudor-live"]);
  });
  test("excludes off-taste, out-of-window, and saved (via normalised url)", () => {
    expect(urls(r)).not.toContain("https://shop.com/rolex-live");   // off taste
    expect(urls(r)).not.toContain("https://shop.com/tudor-old");    // out of window
    expect(urls(r)).not.toContain("http://shop.com/tudor-saved");   // saved
  });
  test("tags the taste match level", () => {
    expect(r.results[0].taste_match).toBe("model");
  });
});

describe("selectMissed — sold_unsaved (the ones that got away)", () => {
  const r = selectMissed(ALL, opts("sold_unsaved"));
  test("keeps recently-sold, in-taste, not-hearted", () => {
    expect(urls(r)).toEqual([
      "https://shop.com/tudor-sold-fast", // tts 1, sorted first
      "https://shop.com/tudor-sold-slow", // tts 18
    ]);
  });
  test("sorts fastest sale first", () => {
    expect(r.results[0].time_to_sell_days).toBe(1);
    expect(r.results[1].time_to_sell_days).toBe(18);
  });
  test("excludes the saved-by-id sold watch and the out-of-window one", () => {
    expect(urls(r)).not.toContain("https://shop.com/tudor-sold-mine"); // saved
    expect(urls(r)).not.toContain("https://shop.com/tudor-sold-old");  // window (soldAt)
  });
  test("uses lastMeaningfulPrice as the sold price when priceUSD is null", () => {
    expect(r.results[0].priceUSD).toBe(9250);
  });
});

describe("selectMissed — sold_saved (hearted that got away)", () => {
  const r = selectMissed(ALL, opts("sold_saved"));
  test("keeps ONLY the user's own hearted watches that have since sold", () => {
    expect(urls(r)).toEqual(["https://shop.com/tudor-sold-mine"]);
  });
  test("ignores taste filter for the user's own hearts", () => {
    // (the saved sold watch is in taste here, but the mode must not depend on it)
    expect(r.results[0].time_to_sell_days).toBe(0);
  });
});

describe("selectMissed — guards", () => {
  test("window_days clamps and widening to 30 pulls in the older in-taste live one", () => {
    const r = selectMissed(ALL, { ...opts("live_unsaved"), windowDays: 30 });
    expect(urls(r)).toContain("https://shop.com/tudor-old");
  });
  test("non-array input is safe", () => {
    expect(selectMissed(null, opts("live_unsaved"))).toEqual({ count: 0, mode: "live_unsaved", window_days: 7, results: [] });
  });
  test("urlKey normalises protocol / www / trailing slash / query", () => {
    expect(urlKey("https://www.Shop.com/X/?utm=1")).toBe(urlKey("http://shop.com/x"));
  });
});
