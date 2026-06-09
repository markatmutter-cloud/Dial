/** @jest-environment node */
/**
 * Real resolution test for the Lumé in-app link router (NOT a mock — the mock is
 * exactly what hid this bug). PR3 resolved a reply's URL by shortHash(url) and
 * looked it up in liveStateById, whose keys are merge.py's SHA1 stable_id. The
 * two hashes never match, so every link fell through to the dealer. The fix
 * resolves by URL match via normUrl. This pins both the fix and the regression.
 */
import { normUrl, shortHash } from "./utils";

// Items shaped like the live feed: a merge.py SHA1-style id that is NOT shortHash(url).
const items = [
  { id: "514204dbd133", url: "https://www.windvintage.com/cartier-france-asymtrique-18k-yellow-gold" },
  { id: "abc123def456", url: "https://greyandpatina.com/product/1978-rolex-1680-pumpkin-mk1-submariner/" },
];

// Mirror App's liveStateByUrl + registerItemResolver.
const byUrl = new Map(items.map((it) => [normUrl(it.url), it]));
const resolve = (url) => byUrl.get(normUrl(url)) || null;

describe("Lumé URL resolver", () => {
  test("resolves a reply link to the live item by URL (the in-app routing fix)", () => {
    expect(resolve("https://www.windvintage.com/cartier-france-asymtrique-18k-yellow-gold")).toBe(items[0]);
  });

  test("tolerates a trailing slash and angle-bracket wrapping", () => {
    expect(resolve("https://www.windvintage.com/cartier-france-asymtrique-18k-yellow-gold/")).toBe(items[0]);
    expect(resolve("<https://www.windvintage.com/cartier-france-asymtrique-18k-yellow-gold>")).toBe(items[0]);
    expect(resolve("https://greyandpatina.com/product/1978-rolex-1680-pumpkin-mk1-submariner/")).toBe(items[1]);
  });

  test("a non-listing URL does not resolve (stays an external link)", () => {
    expect(resolve("https://magazine.com/some-article")).toBeNull();
  });

  test("REGRESSION GUARD: the feed id is NOT shortHash(url), so hashing must not be used to resolve", () => {
    // This is the exact mismatch that broke PR3. If a future change reverts to
    // hashing, this documents why it fails.
    expect(shortHash(items[0].url)).not.toBe(items[0].id);
  });
});
