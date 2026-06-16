/** @jest-environment node */
/**
 * Parity guard: the client-safe selectMissed copy (src/lumeMissed.js) must
 * stay byte-for-byte behavioural with the canonical server one
 * (api/lume_reference.js). The client copy exists only because the server
 * module imports fs/path and so can't be bundled by CRA; this test catches
 * drift the way node_slug.py's fixture-parity test does.
 */
import { selectMissed as serverSelect } from "../api/lume_reference";
import { selectMissed as clientSelect, deriveTasteSets } from "./lumeMissed";

const NOW = "2026-06-08T12:00:00Z";
const tasteBrands = new Set(["tudor", "heuer"]);
const tasteKeys = new Set(["tudor|submariner", "heuer|autavia"]);
const heartedUrls = new Set(["shop.com/tudor-saved"]);
const heartedIds = new Set(["SAVED_BY_ID"]);

const ALL = [
  { url: "https://shop.com/tudor-live", id: "a", brand: "Tudor", model_line: "Submariner", firstSeen: "2026-06-05", priceUSD: 9000, sold: false },
  { url: "https://shop.com/rolex-live", id: "b", brand: "Rolex", model_line: "Daytona", firstSeen: "2026-06-05", priceUSD: 30000, sold: false },
  { url: "http://shop.com/tudor-saved", id: "d", brand: "Tudor", model_line: "Submariner", firstSeen: "2026-06-06", priceUSD: 9500, sold: false },
  { url: "https://shop.com/tudor-sold-fast", id: "e", brand: "Tudor", model_line: "Submariner", firstSeen: "2026-06-06", soldAt: "2026-06-07", priceUSD: null, lastMeaningfulPrice: 9250, sold: true },
  { url: "https://shop.com/tudor-sold-slow", id: "f", brand: "Tudor", model_line: "Submariner", firstSeen: "2026-05-20", soldAt: "2026-06-07", priceUSD: null, lastMeaningfulPrice: 8800, sold: true },
  { url: "https://shop.com/tudor-sold-mine", id: "SAVED_BY_ID", brand: "Tudor", model_line: "Submariner", firstSeen: "2026-06-07", soldAt: "2026-06-07", priceUSD: null, lastMeaningfulPrice: 9000, sold: true },
];

const opts = (mode) => ({ mode, nowISO: NOW, heartedUrls, heartedIds, tasteBrands, tasteKeys });

describe("selectMissed parity (client copy ↔ server canonical)", () => {
  for (const mode of ["live_unsaved", "sold_unsaved", "sold_saved"]) {
    test(mode, () => {
      expect(clientSelect(ALL, opts(mode))).toEqual(serverSelect(ALL, opts(mode)));
    });
  }
});

describe("deriveTasteSets", () => {
  test("mirrors the server's watchlist-snapshot derivation", () => {
    const watchlist = {
      x: { id: "x", url: "https://www.shop.com/a/", brand: "Tudor", model_line: "Submariner" },
      y: { id: "y", url: "https://shop.com/b", brand: "Heuer", model: "Autavia" },
    };
    const t = deriveTasteSets(watchlist);
    expect(t.heartedIds.has("x")).toBe(true);
    expect(t.heartedUrls.has("shop.com/a")).toBe(true);
    expect(t.tasteBrands.has("tudor")).toBe(true);
    expect(t.tasteKeys.has("heuer|autavia")).toBe(true);
  });
  test("empty / non-object is safe", () => {
    expect(deriveTasteSets(null).tasteBrands.size).toBe(0);
    expect(deriveTasteSets({}).heartedIds.size).toBe(0);
  });
});
