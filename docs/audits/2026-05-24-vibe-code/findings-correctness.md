# Cold Audit — Correctness & Tests

Repo: `/Users/markmutter/Documents/watchlist` · Branch `listings-live-sold-split` · READ-ONLY.

## Coverage map — what is actually verified

Two CI suites:
- **pytest** (`tests/test_merge_state.py`, 455 lines, ~17 tests) — the *only* behavior-asserting suite. Covers `merge.update_state` lifecycle (first-seen, persist, price drop/rise, disappear/reappear, multi-cycle, `lastMeaningfulPrice`, `split_live_sold`). Genuinely solid for what it covers.
- **jest** (6 `.test.jsx`) — **render-without-crash only.** Confirmed: every body is `expect(() => render(...)).not.toThrow()` plus a couple of `getByText` presence checks. **Zero** behavioral assertions — no click, toggle, money value, filter result, or state transition.

Unverified surface (`wc -l`): `App.js` 4,601 lines / 106 hooks, `CollectionsTab.js` 3,341 / 55, `supabase.js` 1,978, `ListReviewMode.js` 1,549 / 25, `utils.js` 511, `reference_index_match.py` ~1,000 — all 0 behavioral tests. The App render test (`App.test.jsx:99-108`) mocks every fetch to `[]`/`{}` and every Supabase hook to a no-op, so its only dynamic assertion is "the word *Listings* appears after loading" (`:177`). The jest suite is a TDZ/ReferenceError tripwire and almost nothing else.

## Findings

**F1 · HIGH — Money conversion/formatting untested; every null-guard added reactively after a prod crash.** `utils.js` `priceIn`(66-76), `fmt`(378-387), `fmtUSD`(389-392), `fmtLotPrice`(352-357), `daysAgo`(394). No test references these. `fmt`'s guard (`:385`) comment: "Without this guard, null.toLocaleString() throws — bug surfaced in production 2026-05-21"; shipped as hotfix `e677e4b`. `priceIn` is the single money chokepoint feeding every price, filter, and sort. Fix: pure-function `utils.test.js`. Effort S.

**F2 · HIGH — Two hand-maintained FX tables that must agree but can silently drift; stale hardcoded rates.** `merge.py:337` and `utils.js:49` are independent literals (identical today). Backend writes `priceUSD` (`merge.py:513`); frontend re-derives target prices using its own table (`utils.js:72-75`). Edit one, not the other → silently wrong one-directional conversions (the same silent-8×-off class CLAUDE.md warns about for currency). Rates are static (1.27 GBP…) with no provenance/refresh. Fix: single source or CI parity test. Effort S/M.

**F3 · HIGH — `reference_index_match.py` (~1,000 lines, runs in every scrape path) has zero tests.** Functions `normalize_ref`(334), `match_against_index`(490), `match_or_extract`(656), etc. `grep tests/` → none. Invoked at `merge.py:544` (live) and `:738` (ghost-sold). It's the spine of the "browse by model line" next-era direction and the most complex untested code; `merge.py:731` documents this already misfiring in prod (9 Tudor Submariners, `model_line=null`). Fix: fixture-based match tests before it gets extended. Effort M.

**F4 · HIGH — Auction pipeline entirely untested; `auction_status` uses fragile lexical date comparison.** `merge.py` `auction_status`(918-926), `auction_id`(912), `_days_since`(936), `process_auctions`(951+) — no tests. Status decided by string `today > end` (`:922`); works only for zero-padded ISO, silently mislabels on any non-ISO date. Drives the whole Auctions tab. Fix: status-transition tests (reuse `at_date`), validate ISO. Effort S/M.

**F5 · HIGH — No TypeScript on 30K lines across many LLM sessions; the recurring bug class is exactly what types catch.** Plain JS/CRA, no tsconfig. Git log signature: `9e428fe` imgFailed scope bug, `0bd8e06` clearPendingChallengeDrill reference, `App.test.jsx:14-17` "FOUR production white-screens," `ShareReceiver.js:60-65` ReferenceError every recipient open. The shellProps lockstep rule + 142-line `mockShellProps.js` are manual substitutes for an interface. Fix: incremental `// @ts-check`+JSDoc on `utils.js`/`supabase.js`/shellProps, `tsc --noEmit --checkJs` in CI. Effort M (full migration L, not recommended now).

**F6 · MEDIUM — Supabase mutations swallow errors: 62 awaits, 4 catch blocks.** `supabase.js` — hidden remove(`:259`)/add(`:266`), search update(`:414`)/remove(`:424`) do `if(error) console.warn` then return as success. Watchlist add/remove (`:173-224`) correctly does optimistic+rollback, but that discipline isn't uniform. UI shows success on a write that failed RLS/network → silent data loss on reload. Jest mocks always return `{error:null}`, so the failure branch is never exercised. Fix: standardize rollback+toast; test the error branch. Effort M.

**F7 · MEDIUM — `state.json` and sold-archive payload grow unbounded (prune deliberately removed).** `state.json` = 2.87 MB / 5,463 entries; `listings_sold.json` = 1.22 MB / 1,785 rows; `listings_live.json` = 2.93 MB. `merge.py:932` "30-day prune dropped per Mark spec." Every disappeared listing re-emits forever (`:711-740`); `update_state` is O(state) each run. Slow break-at-scale on iOS PWA/cellular. Was a product decision — needs a cap/tiering plan + a CI size-budget guard. Effort M.

**F8 · MEDIUM — `getSession()` has no `.catch`; cold-load auth failure leaves `ready` stuck false.** `supabase.js:42-46` — rejection means `setReady(true)` never fires. App `loading` gate is driven by listings fetch (which has `.catch` at `App.js:1303`), so not a white screen, but auth chrome hangs in its placeholder (`App.js:2930`) — signed-in user appears signed-out until manual reload. Fix: `.catch(() => setReady(true))`. Effort S.

**F9 · MEDIUM — Currency-switch-on-same-URL is a known silent price corruption, documented but locked in by passing tests.** `test_merge_state.py:195-261` assert *current wrong* behavior: state key is URL-hash only (`merge.py:405`), currency not part of identity; a GBP→USD reprice with matching numeric is invisible (`:260-261`), with differing numeric records a fake price move (`:234` asserts priceChange 1215 for a redenomination). That fake delta feeds the big-mover sort (`merge.py:609-617`) → fabricated "deals." Fix: compare via priceUSD, tag redenominations, update the two tests. Effort M.

**F10 · LOW (latent HIGH) — Hook-ordering/TDZ discipline holds today but is guarded only by a comment + a weak tripwire.** Verified clean: `awk` over `App.js` finds **no** hooks after the early returns at `:3333-3334`; child-component guards (`CollectionsTab.js:979`, `ChallengeFlow.js:55`) are correctly ordered. Protection is the comment at `App.js:3332` and the empty-data #310 tripwire (`App.test.jsx:154`, "Bit production THREE TIMES"). Next hook added past 3334 reopens the class and the tripwire only catches it if the path renders under empty mocks. Fix: add `eslint-plugin-react-hooks` `rules-of-hooks: error` to CI lint. Effort S.

**F11 · LOW — `merge.py:578` price-change check compares `history[-1].price` only, currency-blind.** Mechanism behind F9; any currency-aware fix changes this line. Effort S (with F9).

**F12 · LOW — `load_csv` price-floor/parse-skip silently drops rows with no observability.** `merge.py:446-454` — try/except `continue` on bad price + `price<500` floor, no count logged (unlike dedupe at `:842`). A cents-priced or comma-decimal scraper change would drop every row with only a lower count as signal, possibly under the health truncation threshold. Fix: log dropped-by-parse/floor counts per source. Effort S.

## Summary

The Python `update_state` state machine is genuinely well-tested. Everything else of correctness consequence is unverified: the jest suite is render-without-crash with no behavioral assertions on money, filters, sorts, or ~150 Supabase mutation paths. Highest-leverage gaps: the `utils.js` money/format layer (pure functions, fixed bug-by-bug after prod crashes) and the duplicated drift-prone FX tables. The reference matcher and the entire auction pipeline run in prod with zero tests. No TypeScript on 30K lines is the root of the recurring undefined-ref/TDZ/shellProps-mismatch hotfix class; hook discipline holds today but is guarded only by a comment. Mutation errors swallowed into `console.warn` risk silent data loss.

**Domain sub-grade: C-**

**Finding count:** CRITICAL 0 · HIGH 5 (F1–F5) · MEDIUM 4 (F6–F9) · LOW 3 (F10–F12) · Total 12
