/**
 * Unit tests for the eval rubric/answer-key — the PURE parsing + data integrity
 * that gate the LLM-judge. Runs in normal CI (no SDK, no API): a broken parser
 * would silently pass every judged scenario, so guard it here.
 */
import {
  RUBRIC, JUDGE_THRESHOLD, buildJudgeUser, parseJudgeResult,
  buildGroundingUser, parseGroundingResult,
  groundingSource, groundedInKnowledge, ledWithListings, RETRIEVAL_HIERARCHY,
} from "./lume_eval_rubric";
import { ANSWER_KEY } from "./lume_eval_answer_key";

const calls = (...names) => names.map((name) => ({ name }));

const fullScore = (n) =>
  JSON.stringify(Object.fromEntries(RUBRIC.map((d) => [d.key, { score: n, note: "x" }])));

test("RUBRIC has unique keys and at least one critical dimension", () => {
  const keys = RUBRIC.map((d) => d.key);
  expect(new Set(keys).size).toBe(keys.length);
  expect(RUBRIC.some((d) => d.critical)).toBe(true);
  for (const d of RUBRIC) expect(typeof d.criterion).toBe("string");
});

test("parseJudgeResult: all-5 passes, all-1 fails on the critical dims", () => {
  const pass = parseJudgeResult(fullScore(5));
  expect(pass.ok).toBe(true);
  expect(pass.failures).toEqual([]);

  const fail = parseJudgeResult(fullScore(1));
  expect(fail.ok).toBe(false);
  // every critical dim should be reported as a failure
  expect(fail.failures.map((f) => f.key).sort())
    .toEqual(RUBRIC.filter((d) => d.critical).map((d) => d.key).sort());
});

test("parseJudgeResult: a single critical dim below threshold fails the reply", () => {
  const crit = RUBRIC.find((d) => d.critical).key;
  const obj = Object.fromEntries(RUBRIC.map((d) => [d.key, { score: 5 }]));
  obj[crit] = { score: JUDGE_THRESHOLD - 1, note: "violated" };
  const r = parseJudgeResult(JSON.stringify(obj));
  expect(r.ok).toBe(false);
  expect(r.failures).toHaveLength(1);
  expect(r.failures[0].key).toBe(crit);
});

test("parseJudgeResult: a non-critical dim below threshold does NOT fail", () => {
  const nonCrit = RUBRIC.find((d) => !d.critical).key;
  const obj = Object.fromEntries(RUBRIC.map((d) => [d.key, { score: 5 }]));
  obj[nonCrit] = { score: 1 };
  expect(parseJudgeResult(JSON.stringify(obj)).ok).toBe(true);
});

test("parseJudgeResult: tolerates prose-wrapped JSON and missing keys", () => {
  const r = parseJudgeResult("Here you go:\n```json\n" + fullScore(5) + "\n```\nDone.");
  expect(r.ok).toBe(true);
  // garbage → no scores, but no critical failure flagged either (judge declined)
  const empty = parseJudgeResult("not json at all");
  expect(empty.ok).toBe(true);
  expect(empty.failures).toEqual([]);
});

test("buildJudgeUser embeds the user message, reply, and every dimension", () => {
  const u = buildJudgeUser("does the 5513 have a date?", "No, the 5513 is a no-date Submariner.");
  expect(u).toContain("does the 5513 have a date?");
  expect(u).toContain("no-date Submariner");
  for (const d of RUBRIC) expect(u).toContain(d.key);
});

test("parseGroundingResult reads the contradiction flag", () => {
  expect(parseGroundingResult('{"contradicts":true,"note":"said sapphire"}').contradicts).toBe(true);
  expect(parseGroundingResult('{"contradicts":false}').contradicts).toBe(false);
  expect(parseGroundingResult("garbage").contradicts).toBe(false); // default safe
  expect(buildGroundingUser("FACT", "Q", "REPLY")).toContain("FACT");
});

test("groundingSource picks the highest-priority source per the hierarchy", () => {
  // get_reference wins even when listings were also searched
  expect(groundingSource(calls("search_listings", "get_reference"))).toBe("reference");
  expect(groundingSource(calls("search_articles", "search_listings"))).toBe("articles");
  expect(groundingSource(calls("get_auction_state", "search_listings"))).toBe("auctions");
  expect(groundingSource(calls("search_listings"))).toBe("listings");
  // free-recall / non-knowledge tools only → none
  expect(groundingSource(calls("get_user_context"))).toBe("none");
  expect(groundingSource([])).toBe("none");
  expect(groundingSource(undefined)).toBe("none");
});

test("groundedInKnowledge / ledWithListings classify the learning-prompt bar", () => {
  expect(groundedInKnowledge(calls("get_reference", "search_listings"))).toBe(true);
  expect(groundedInKnowledge(calls("search_articles"))).toBe(true);
  expect(groundedInKnowledge(calls("search_listings"))).toBe(false);
  expect(groundedInKnowledge(calls("get_user_context"))).toBe(false); // free-recall
  // ledWithListings = listings reached but NO knowledge source (the E2643 anti-pattern)
  expect(ledWithListings(calls("search_listings"))).toBe(true);
  expect(ledWithListings(calls("get_reference", "search_listings"))).toBe(false);
  expect(ledWithListings(calls("get_user_context"))).toBe(false);
  expect(RETRIEVAL_HIERARCHY.indexOf("reference")).toBeLessThan(RETRIEVAL_HIERARCHY.indexOf("listings"));
});

test("ANSWER_KEY entries are well-formed and uniquely id'd", () => {
  const ids = ANSWER_KEY.map((a) => a.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const a of ANSWER_KEY) {
    expect(typeof a.question).toBe("string");
    expect(a.question.length).toBeGreaterThan(0);
    expect(typeof a.fact).toBe("string");
    expect(a.fact.length).toBeGreaterThan(0);
  }
});
