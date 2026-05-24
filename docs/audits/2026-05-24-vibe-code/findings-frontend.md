# Frontend & Performance Audit — Watchlist

Cold read-only audit. All findings cite `file:line`. Stack: React (CRA), inline styles only, single bundle, iOS PWA. `App.js` is 4,627 lines and orchestrates everything.

## CRITICAL

**C1 — ~22 MB JSON (~3.6 MB gzipped) fetched on every app mount.** `src/App.js:1266-1361` — the mount `useEffect` fires 11 fetches. The live/sold split (`listings_live.json` eager / `listings_sold.json` lazy, `App.js:1267,1283`) was a real first-paint win, but it's undercut: the same effect *unconditionally* also pulls `auction_lots.json` (5.2 MB), `loupethis_lots.json` (4.4 MB), `listings_desc.json` (3.4 MB), `hodinkee_shop.json` (3.2 MB), `hairspring_finds.json` (1.7 MB), `manual_archive_lots.json` (1.1 MB) — ~19 MB the default Listings>Live view doesn't render. Measured totals: ~22 MB raw, ~3.6 MB gzip. Parse is *not* gzipped — the engine inflates and allocates ~22 MB of objects on the main thread during the most sensitive window → multi-second jank on mobile. None of the six is gated on the tab that consumes it. **Fix:** gate non-critical fetches behind tab visit / `requestIdleCallback`; mount should fetch only `listings_live` + `auctions` (~440 KB gzip). **Effort: M.**

**C2 — Feed JSON grows unbounded; parse cost scales linearly.** `listings.json` is 5,398 items/4 MB; `auction_lots.json` 4.9 MB and growing every sale cycle; sold/archive sets only ever accumulate (`state.json` is append-only). `README.md:199` still claims "~1,800 listings, ~2 MB" — already 3× off. Render is paged (`App.js:2479`) but the *fetch* is not. Months-out cliff. **Fix:** shard archive/auction JSON by recency or move behind a paginated endpoint. **Effort: L.**

## HIGH

**H1 — No code-splitting; entire app is one bundle.** `grep React.lazy|Suspense|import(` over `src/` → zero hits; `index.js:1-10` imports App statically; App.js (231 KB) statically imports every tab/modal. AdminTab (which itself fetches 6 more JSON incl. the 4 MB `listings.json` at `AdminTab.js:308-314`), SizeCompare, ChallengeFlow, EditorialView, all modals/receivers parse on first load for everyone. Compounds C1. **Fix:** `React.lazy` the heavy rarely-hit surfaces. **Effort: M.**

**H2 — Service-worker JSON rule is out of sync with the files the app fetches.** `public/service-worker.js:51-55` `isJsonData()` matches only `(listings|auctions|tracked_lots|state|auctions_state).json`. The app fetches `listings_live/_sold/_desc`, `auction_lots`, `loupethis_lots`, `hairspring_finds`, `hodinkee_shop`, `manual_archive_lots` (`App.js:1267-1361`) — **none match**, so they fall through to pass-through (`service-worker.js:113`). Result: no offline fallback for the primary feed, and the SW's freshness/`no-store` guarantee no longer applies to the live feed (it works only because the app sets `cache:"no-cache"` at `App.js:1259`). Silent drift since the #437 live/sold split. **Fix:** broaden the regex to the new filenames; add a test asserting every App.js URL constant matches one SW rule. **Effort: S.**

**H3 — `handleShare` is non-memoized and passed to every Card, defeating Card's `React.memo`.** Card is memoized (`Card.js:17,24`); grid passes `onShare={handleShare}` to every card (`App.js:3619`). But `handleShare` is a plain `async function` at `App.js:1097` — *not* `useCallback`, unlike `onClickListing`/`openCollectionPicker`/`toggleHide`/`handleWish` (`App.js:817,1205,2276,2297`). New identity each render → every visible card re-renders on any App state change (keystroke, heart, theme). The memo is the main defense against the un-recycled DOM (H4); one unstable prop nullifies it grid-wide. **Fix:** wrap in `useCallback`. **Effort: S.**

**H4 — Feed is paged, not virtualized — DOM accumulates without recycling.** `App.js:2479` slices `page * PAGE_SIZE`; IntersectionObserver bumps page (`2484-2492`); cards render via `.map` (`3609-3621`). No windowing lib anywhere. "Load more" appends, never unmounts off-screen cards — scrolling deep into a 3,600-item feed leaves thousands of cards+images mounted (tab-reload risk on iOS). **Fix:** windowing (react-window) — M; or interim retained-page cap — S.

## MEDIUM

**M1 — Theme object `c` rebuilt every render; `:root` mirror effect re-runs every render.** `App.js:1364` `c` is a plain const (new identity each render); `App.js:1452-1456` `useEffect(...,[c])` writes ~40 `setProperty` calls to `:root` on *every* App render (every keystroke/heart/page-bump). The mirror itself is correct/necessary for portals — only its frequency is wrong. **Fix:** `useMemo(c, [dark])`. **Effort: S.**

**M2 — `gridStyle` recreated every render.** `App.js:2924`, consumed at `3608` and threaded into 5 shell props (`3667,3865,4023,4100,4160`). New identity defeats shell memoization. **Fix:** `useMemo(...,[cols])`. **Effort: S.**

**M3 — Inline-style allocation is pervasive: 1,280 `style={{…}}` sites.** Hottest: AdminTab 127, CollectionsTab 117, ChallengeFlow 90, HomeTab 84, Card.js 32. `styles.js` tokens exist but most styles are inline literals. Fresh object per render (Card alone = 32), forecloses CSS-only wins (`content-visibility:auto` would cheaply help H4, `:hover`, media queries). Structural cost of the no-CSS choice, not a bug. **Fix:** hoist static style objects in mapped lists to module consts; add a shared `content-visibility` class. **Effort: M.**

**M4 — `mainFeedItems` spreads four full arrays (~10k objects) on each input change; search has no debounce.** `App.js:1834` four-way spread; base for `allFiltered` (`2366`), `homeSearchCounts` (`1905`), sold counts (`3745,3751`). Lazy dicts resolve at staggered times post-mount, so the 10k merge runs several times in the first seconds atop C1's parse. `allFiltered` re-filters all 10k per keystroke; comment at `App.js:1894` accepts "few ms" — optimistic on low-end phones. **Fix:** debounce search; measure on-device. **Effort: S.**

**M5 — No `Cache-Control` headers configured.** `vercel.json` has only `rewrites`, no `headers`. Immutable hashed bundle isn't told it's immutable; multi-MB feeds have no declared freshness contract (and H2 means the SW no longer guards them). **Fix:** add `headers` — immutable for `/static/*`, short max-age + `stale-while-revalidate` for feed JSON. **Effort: S.**

## LOW

**L1 — `maximum-scale=1` blocks pinch-zoom** (`index.html:12`) — WCAG 1.4.4 failure. Drop it. **S.**
**L2 — Divider keys are index-based** (`App.js:3612` `div-${idx}-...`); cards correctly use `entry.item.id`. Fragile on reorder. **S.**
**L3 — CRA/`react-scripts 5.0.1` is unmaintained; App.js 231 KB/4,627 lines.** 6+ comments police hook placement around the loading early-returns (`App.js:770,993,1506,1896,3265,3905`) — the TDZ/white-screen hazard CLAUDE.md repeatedly flags. Migrate to Vite + decompose when touched. **L.**
**L4 — A11y broadly OK (credit, not defect):** 57 aria-labels, alt on 26/28 imgs, decorative favicon correctly `aria-hidden` (`Card.js:290`), action buttons labeled (`Card.js:460,475,500`). Minor: `alt={item.ref}` (`Card.js:274`) renders empty when no ref. **S.**

## Sub-grade: **C+**

The architecture has genuinely good instincts — live/sold split, render pagination, memoized Card, correct `:root`/font-on-body portal coupling, an ErrorBoundary, deliberate hook-ordering discipline. But the first-load story is undermined by ~19 MB of eager non-critical JSON (C1), there's no code-splitting (H1), and the service worker silently stopped covering the real feed files after the live/sold split (H2). These are real, present-tense mobile-UX risks, and the unbounded JSON growth (C2) is a dated cliff. The memo defense is partially broken by one unstable handler (H3). All fixable; most fixes are S/M.

**Finding count:** CRITICAL 2 · HIGH 4 · MEDIUM 5 · LOW 4 (15 total).
