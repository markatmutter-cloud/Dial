# Maintainability & Continuity Audit — Watchlist (cold, read-only)

**Date:** 2026-05-24 · **Repo:** /Users/markmutter/Documents/watchlist · **Domain:** Maintainability & Continuity

Context: non-technical owner co-coding with an LLM across many short sessions. Dominant risk is continuity. The doc set is unusually disciplined and most spot-checked claims hold; the real cliffs are infrastructural.

## Headline
Better documented than most funded teams. CLAUDE.md was just pruned 2515 lines (#541); single-site rules live as comments at the sites they govern; lockstep rules (image-proxy 3-place, brand aliases 2-place) are real and in sync; the "retired surfaces" list is accurate; naming divergences are documented and consistently applied; TODO/FIXME debt is effectively zero; CI gates merges. The bad news is structural: no dep pinning/lockfiles, an abandoned build toolchain, and two monoliths holding most of the risk.

## Findings (0 CRITICAL · 3 HIGH · 6 MEDIUM · 2 LOW)

**HIGH-1 · No dependency pinning, no lockfiles (Python + JS).** No `requirements.txt` (only `requirements-dev.txt` = `pytest>=8.0`). Runtime deps installed unpinned inline: `scrape-listings.yml:29 pip install requests`, `scrape-auctions.yml:33 pip install requests curl-cffi`, `scrape-auction-lots-frequent.yml:67`, `index-corpus-topics.yml:63 pip install anthropic`, `collector-profile.yml:50`. JS uses caret ranges and has **no `package-lock.json`** — `tests.yml:50-54` documents "we don't commit a lockfile" and runs fresh `npm install`. Why it matters: today's green build proves nothing about tomorrow's; a transitive bump can break a scrape with no code change, and `merge.py`'s disappearance logic then marks hundreds of live items sold (handoff cites Analog Shift 624, Vintage Watch Fam 424). Fix: pinned `requirements.txt` + `pip install -r`; commit lockfile + `npm ci`; Dependabot. **Effort: S.** *(Biggest continuity lever — small effort, converts invisible failure into a visible one.)*

**HIGH-2 · Frontend on abandoned Create React App.** `package.json:10 "react-scripts": "5.0.1"` (last CRA release, ~2022; React team deprecated CRA). All scripts route through it. The single most load-bearing dependency is frozen on a dead toolchain; it will eventually fail to build/test on advancing Node with no upstream fix. Fix: plan Vite migration (no router to port — app uses query params); make it a named ROADMAP item with a trigger. **Effort: L.**

**HIGH-3 · Two monoliths concentrate change-risk with render-only tests.** `src/App.js` = 4627 lines / 231 KB with **125** hook calls in one component; `src/supabase.js` = 1978 lines. `src/App.test.jsx` has only **8** assertions, all render-without-crash; supabase.js has no dedicated test. The hook-ordering tripwire is self-documented (React #310 if a hook lands after `App.js:3333-3334` early returns). Fix: route new state into `src/hooks/`; add behavioral tests around pure filter/sort/query logic; trend App.js line count down. **Effort: L (each extraction S).**

**MEDIUM-1 · Tribal knowledge in ~22 archived handoffs + auto-memory, not durable docs.** `archive/` holds 22 `SESSION_HANDOFF_*.md`; the active one records the ~7h scrape outage (one missing `continue-on-error`) and dead-ends (Bonhams CI block, Phillips WAF) that exist nowhere durably. CLAUDE.md states handoffs are "archived, never graduated." Fix: at `/wrap`, explicitly route durable *failure modes* to single-site comments / CLAUDE.md. **Effort: S.**

**MEDIUM-2 · Node version unpinned and inconsistent.** No `.nvmrc`. Tests use Node 20 (`tests.yml:49`); scrape lanes use Node 22 (`scrape-auctions.yml:79`, `scrape-auction-lots-frequent.yml:91`). Python is consistently 3.11 (good contrast). Fix: add `.nvmrc`, reference via `node-version-file`. **Effort: S.**

**MEDIUM-3 · Committed data JSON bloats repo; bots churn `main`.** `public/` = 101 MB (`fratello_bodies.json` 27 MB, `rolex_magazine_bodies.json` 7.4 MB, `listings.json` 4 MB, etc.); `.git` = 270 MB; **17 of last 50 commits** are automated data commits interleaved with features. Hurts clone/onboarding and `git log`/`blame` signal. Fix: move large lazy-loaded corpus bodies to Blob/artifact; periodic `gc`. **Effort: M.**

**MEDIUM-4 · Two near-identically-named auction scrapers, both live.** `auction_lots_scraper.py` (101 KB, comprehensive lot scraper) vs `auctionlots_scraper.py` (55 KB, tracked-lot URL tracker → `tracked_lots.json`) — both run in the *same* workflow (`scrape-auctions.yml:68` and `:130`); CLAUDE.md never disambiguates. Coin-flip risk an LLM edits the wrong file. Fix: rename `auctionlots_scraper.py` → `tracked_lots_scraper.py`; add cross-ref headers. **Effort: S.**

**MEDIUM-5 · `is_excluded_title` not shared.** Defined only in `auction_lots_scraper.py`, used in 3 files, absent from 7 auction scrapers, despite CLAUDE.md "apply in any new auction scraper." (Nuance: the un-covered ones are mostly *calendar* scrapers.) Fix: move predicate to `auction_lot_parsers.py`; tighten doc wording to "auction *lot* scraper." **Effort: S.**

**MEDIUM-6 · Retry helper adopted by 14 of ~65 scrapers.** `scraper_lib.fetch_json_with_retry` (the documented fix for "one 503 wipes a source") is imported by 14; 51 `*_scraper.py` don't import `scraper_lib`. Named-but-not-closed fragility. Fix: route full-catalog/pagination fetches through it. **Effort: M.**

**LOW-1 · README count drift.** `README.md:64` diagram says "38× listing scrapers"; actual ~40 (prose at :108 is correct). **Effort: S.**

**LOW-2 · Bare `eslint-disable-line` on three useMemos.** `SearchResultsView.js:216,224,232` silence `react-hooks/exhaustive-deps` (omit `matchesQuery`/`matchesFilters`) with un-named bare disables — masks future lint + a real stale-closure correctness risk the render-only tests won't catch. Fix: name the rule + comment, or hoist to stable `useCallback`. **Effort: S.**

## Doc-vs-reality ledger (13 claims checked)
HOLDS (11): image-proxy 3-place lockstep in sync (`utils.js:115`/`share.js:130`/`img.js:22`), BRAND_ALIASES 2-place, retired surfaces (EndingSoon/tri-state survive only as comments; `_isTrackedLot` flag lives but heart-guard gone per `App.js:2299`), internal/UI naming, never-bump storage keys (`App.js:149`), `lastMeaningfulPrice`, `articleAsListing`, `create_challenge_v2` RPC, no `window.confirm` (only the documented fallback in `ConfirmModal.js:26`), `continue-on-error` (substantively — matrix uses job-level flag; un-flagged steps are correctly merge/commit), `health.py`. PARTIAL/DRIFT (2): `is_excluded_title` coverage (MED-5), README "38×" (LOW-1).

## Bus factor
Fresh LLM *with* handoff: minutes. Fresh LLM *without* handoff: hours, at real risk of editing the wrong auction scraper, tripping hook-ordering, or hitting an undocumented dead-end. New human dev: days-to-weeks — monoliths, CRA, and the no-lockfile gap are the steep parts, not the docs.

## Domain sub-grade: **B−**
Doc discipline and doc-vs-reality fidelity are A-grade and rare for a solo non-technical project — the load-bearing strength. Pulled to B− by infrastructure that hasn't kept pace: HIGH-1 (deps/lockfiles), HIGH-2 (abandoned CRA), HIGH-3 (under-tested monoliths). None breaks today; each is a months-out cliff the owner can't easily see coming.

**Counts:** 0 CRITICAL · 3 HIGH · 6 MEDIUM · 2 LOW (11 total).
