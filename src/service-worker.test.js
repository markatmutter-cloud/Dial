/**
 * B-21 drift guard. The service worker network-firsts a fixed list of data
 * files (JSON_DATA_FILES). When the app started fetching new feed files (the
 * live/sold listings split, auction/editorial archives) the SW list wasn't
 * updated, so the primary feed silently lost SW coverage (audit H2).
 *
 * This test reconstructs the SW's matcher from its own source and asserts it
 * covers every JSON feed the app loads via a `*_URL` constant in App.js — so
 * the two can't drift apart again. Add a feed `*_URL` without listing it in
 * the SW and this fails.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const swSrc = fs.readFileSync(path.join(ROOT, "public/service-worker.js"), "utf8");
const appSrc = fs.readFileSync(path.join(ROOT, "src/App.js"), "utf8");

// Rebuild the SW's data-file matcher from its JSON_DATA_FILES list.
function swJsonRegex() {
  const block = swSrc.match(/const JSON_DATA_FILES = \[([\s\S]*?)\];/);
  if (!block) throw new Error("JSON_DATA_FILES not found in public/service-worker.js");
  const files = [...block[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
  return new RegExp(`/(${files.join("|")})\\.json$`, "i");
}

// Every feed JSON the app fetches via a `*_URL = "/x.json"` constant.
function appFeedJsonPaths() {
  return [...appSrc.matchAll(/_URL\s*=\s*"(\/[a-z0-9_]+\.json)"/gi)].map(m => m[1]);
}

test("service worker covers every App.js feed JSON URL (B-21 drift guard)", () => {
  const re = swJsonRegex();
  const paths = appFeedJsonPaths();
  // Sanity: we actually found the feed constants (guards against a regex that
  // silently matches nothing and makes the test vacuously pass).
  expect(paths.length).toBeGreaterThan(5);
  const uncovered = paths.filter(p => !re.test(p));
  expect(uncovered).toEqual([]);
});
