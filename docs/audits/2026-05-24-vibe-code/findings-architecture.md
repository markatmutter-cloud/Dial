# Architecture & Structure Audit — Watchlist (2026-05-24)

Cold, read-only audit. Every finding cites file:line.

## Headline

The worry "will it die under its own weight" is **partially warranted but not acute**. Real god-file concentration: `App.js` + 4 others = **43.6% of all `src/` JS** (13,163 of 30,184 lines). But the discipline that matters is intact — clean Supabase data layer, **no hooks after the early returns** (React #310 cliff respected), no circular Python imports, near-perfect constant sync. Drift is minor and contained. Dominant risk is *iteration friction* in `App.js`/`CollectionsTab.js`, not imminent breakage.

**Sub-grade: B** · CRITICAL 0 · HIGH 2 · MEDIUM 3 · LOW 3 (total 8)

## CRITICAL — none

## HIGH

**H1 — `App.js` is a genuine god-component (the central maintainability cliff).** Effort L.
`src/App.js` = 4,627 lines. Hook density in one body: 51 `useState`, 41 `useMemo`, 23 `useEffect`, 17 `useCallback`, 20 distinct custom hooks, 41 imports. It pre-builds **29 named `…JSX` consts** (`src/App.js`, `const authJSX`…`userLimitBannerJSX`) and hand-assembles a **~110-field `shellProps` bag** (`src/App.js:4524`–4617). A new feature threads state→memo→JSX const→shellProps→shell destructure→child (5-file edit per field). *Mitigant (keeps it HIGH not CRITICAL):* early returns at `src/App.js:3333`-3334 with **zero hooks below them**; shells are pure render targets; domain state already extracted to `src/hooks/` and `src/supabase.js`. Fix: continue incremental extraction — the 29 JSX consts are the cheapest win (move to self-contained components App mounts). One per branch; no big-bang.

**H2 — The 3-file `shellProps` lockstep is manual, unenforced, and already drifted.** Effort S–M.
Contract spans `App.js:4524` (producer), `MobileShell.js:19`-78 (106 keys), `DesktopShell.js:18`-69 (101 keys), `mockShellProps.js` (111 keys). Diff: 5 fields destructured by DesktopShell but **absent from the mock** — `auctions`, `filterSaleUrls`, `lotCountsByAuctionUrl`, `setFilterSaleUrls`, `toggleSaleUrl` (the Sale-filter cluster, `DesktopShell.js:26,46,517-549`). CLAUDE.md says a field used in one shell and missing from the other + mock is "a ReferenceError the moment that branch renders." *Mitigant (not CRITICAL today):* every use site is defensively guarded (`filterSaleUrls?.length`, `auctions || []`, `toggleSaleUrl &&` — `DesktopShell.js:270,517,538,545`), so the missing mock keys render the empty state instead of crashing — but the jest smoke test never exercises the populated desktop path. Fix: backfill the 5 keys into the mock (S); ideally derive one shared key-list or add a jest assertion that the mock ⊇ both shells' destructures (M).

## MEDIUM

**M1 — Two near-identically-named auction scrapers, both live — standing footgun.** Effort M.
`auction_lots_scraper.py` (2,287 ln, comprehensive catalog walker) vs `auctionlots_scraper.py` (1,332 ln, user-tracked-URL lot tracker) differ by one underscore. Both live, clean one-way dependency: the catalog walker imports per-lot detail fns FROM the tracker (`auction_lots_scraper.py:55`-65). Both run in workflows (`scrape-auctions.yml:68` + `:130`; `scrape-auction-lots-frequent.yml:75`). No circular import. A prior branch/scope collision in this area is on record (`archive/SESSION_HANDOFF_2026-05-22-backend.md:43`). Known copy-pasted logic: Christie's Lot-Essay regex duplicated with an acknowledging comment (`auctionlots_scraper.py:462`-477). Fix: rename for unambiguity (e.g. `tracked_lots_scraper.py` / `catalog_lots_scraper.py`) and update ~10 importers/workflow steps. Mechanical, removes a recurring mistake class.

**M2 — `CollectionsTab.js` is a second orchestrator (god-file #2).** Effort L.
3,341 lines, 31 `useState`, 19 `useEffect`, ~29 props (`CollectionsTab.js:65`-93), owns its own `?col=` URL sync (`:99`-110). Same effect-ordering risk surface as App.js. *Mitigant:* receives a clean `collectionsApi` bag; only 3 `useMemo`. Fix: split per sub-tab (Sold/Wishlist are clean seams; Challenges already partly in `ChallengesView.js`/`ChallengeFlow.js`). Lower priority than H1.

**M3 — `BRAND_ALIASES` dual-maintenance already drifted: `"jlc"` missing on frontend.** Effort S.
`merge.py:175`-270 has 41 keys incl. `'jlc': 'Jaeger-LeCoultre'` at `merge.py:188`. Frontend mirror `src/utils.js:127`-188 has only 40 — **`"jlc"` absent**. CLAUDE.md + the in-file comment (`utils.js:124`-126) mandate lockstep. Impact (low): a Supabase snapshot saved with literal brand "JLC" canonicalizes in the backend feed but not in frontend `canonicalizeBrand` (`utils.js:234`). *Mitigant:* `EXCLUDED_BRANDS` is in perfect sync (`merge.py:279`-282 ↔ `utils.js:212`-215), `FORCE_OTHER`/`SUPPRESS_AT_SOLD` are intentionally frontend-only and documented. Fix: add the one key; optionally a pytest that asserts JS keys ⊇ python keys.

## LOW

**L1 — Dead code: `SubTabIntro.js` + two stale mock keys.** Effort S.
`src/components/SubTabIntro.js` (89 ln) is imported by **no non-test src file** — every mention is a comment about its own retirement (`WatchlistTab.js:103`, `CollectionsTab.js:359,504,511,2370,2504`, etc.). `mockShellProps.js:127` `statusSegmentJSX: null` and `:132` `endingSoonJSX: null` are dead keys (0 occurrences outside the mock) — remnants of the retired Status-segment / EndingSoon-strip surfaces. *Mitigant:* the active-code retired surfaces are genuinely gone (`App.js:4182` documents EndingSoon removal; `endingSoonComparator` at `App.js:162` is a still-used sort fn, not the strip; `_isTrackedLot` references are live legitimate uses). Fix: delete the orphan file + two mock keys (coordinate with the concurrent session editing the tree).

**L2 — Stale "tri-state pill" naming in live comments.** Effort S. `App.js:3735` and `useFilters.js:59` reference the retired tri-state pill though the underlying counts now feed the Live/Sold sub-tabs. Naming staleness only; could mislead a future session into re-adding the retired UI. Fix: reword.

**L3 — Whole-bag spread defeats prop-level memoization.** Effort M (only if needed). `App.js:4621`-4623 spreads all ~110 props (29 freshly-built JSX trees) every render, so shells re-render wholesale on any state change. Not a measured problem at ~1,800 listings / ~2 MB; forecloses `React.memo`. No action now.

## Healthy (counter-evidence)
- **Clean data layer:** `src/supabase.js` exports 12 named hooks, imported **directly** by 7 components/hooks — data access does not all funnel through App.js.
- **Hook discipline holds:** no `use*` after `App.js:3333`-3334 early returns.
- **Python graph sound:** one-way auction-scraper dependency, no cycle; shared helpers opt-in via `scraper_lib` (14 importers) + `auction_lot_parsers.py`/`dealer_parsers.py`.
- **Constants mostly synced:** `EXCLUDED_BRANDS` identical both sides; only `"jlc"` drifted.
- **Handoff hygiene clean:** one active `SESSION_HANDOFF_2026-05-24.md`, 21 archived.
