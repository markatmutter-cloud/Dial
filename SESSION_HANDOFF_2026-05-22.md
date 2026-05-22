# Watchlist — Session Handoff (2026-05-22)

For working conventions, see [CLAUDE.md](CLAUDE.md). For roadmap, see
[ROADMAP.md](ROADMAP.md). Durable rules graduate to CLAUDE.md;
durable direction graduates to ROADMAP.md. This doc is the
in-flight snapshot.

## TL;DR

**Site-wide identity + chrome redesign in one session.** Olive
(#3b4a36, the favicon hourglass color) became the brand zone on
non-Home tabs, the identity bands were retired, search bars and
filter rows got harmonized across tabs and shells, the cross-tab
"Search all" results destination shipped, and Editorial got a
density pass (excerpt removed, initial page 100→40, infinite
scroll). Plus a half-dozen smaller bug + polish fixes. **27 PRs
shipped, all merged.**

Five arcs:

1. **Unified header band → retired (PRs #433, #434, #438, #440,
   #448).** Shipped a colored identity slab below each sub-tab strip
   ("LIVE LISTINGS · 3,548" / "EDITORIAL" / etc.), iterated on
   color (bright green → favicon olive), margins (full-bleed →
   contained with marginTop:8), placement (inside scroll → chrome
   stack), and then **retired it entirely** once the olive chrome
   zone took over the section-identity role. Count chip restored to
   the filter row right edge; wordmark fontWeight bumped 500→600
   so small-size wordmarks read the same perceptual weight as the
   hero.

2. **Olive chrome zone on mobile (PRs #445, #446, #450 → reverted
   in #451, then partially restored as accents in #453).** Olive
   extends from the iOS PWA theme-color strip through brand row +
   main tabs + sub-tab strips on non-Home tabs. Active tab uses
   white-on-olive underline; sub-tab strips drop their
   border-bottom to read as one continuous color zone. **Home was
   tried with olive then reverted to neutral** so the editorial
   hero (moonphase + WATCHLIST) carries the first-paint moment;
   olive accents on Home (Watchbox callout block + "Search →"
   button) keep the brand thread.

3. **Cross-tab "Search all" destination (PR #444 — PR_W v1).**
   "Search all" entry as the first row in HomeSearchBar's dropdown
   + mobile Spotify-pattern overlay. Pick it → 3-strip results
   view (Live listings · Live auctions · Archive Sold), each
   filtered by query, each with "View all". `SearchResultsView`
   component; `searchAllActive` flag in App.js gates rendering;
   shells hide their normal chrome and render the strip view in
   place of tab content. Top tab bar stays visible for exit.
   **Editorial strip deferred to v2** — corpus is loaded lazily
   inside EditorialView; lifting that up is its own change.

4. **Mobile shell redesign (PRs #432, #435, #436, #439, #443,
   #451).** Main tabs lifted from the bottom-fixed nav into the
   top stack (no more PWA/Safari bottom-area fight). Sub-tabs
   anchored above the search row to eliminate Y-jitter when filter
   chips collapse. Spotify-pattern search-focus overlay (PR_Z)
   solves the iOS keyboard covering the SEARCH IN dropdown. Brand
   row suppressed on Home → tabs+M circle merge into one row.
   Hamburger menu consolidates About + Sign in for signed-out
   mobile users. Bottom nav retired.

5. **Editorial UX pass (PRs #431, #442, #454, #455).** Search input
   inline with EditorialView's filter chips on desktop (was
   stacked above as a separate row). Card excerpt removed (cleaner
   tiles). Initial page 100 → 40 + infinite scroll via
   IntersectionObserver sentinel (replaces "Load more" button).
   Body-text search untouched. PR_γ added editorial details polish
   (hairline-border search bar, ghost-active filter pills, serif
   strip headings on Home).

Plus essentials: hotfix for production white-screen on Home
(null-safe `fmt()` + filter article-kind items out of strips),
fixed live-auctions leaking ENDED lots, dropped 3.3 MB of dead
`desc` payload from listings.json, fixed portal-rendered nodes
inheriting iOS Times serif, fixed Oliver-and-Clarke + Antiquorum
sub-tab key bug, etc.

## PRs shipped this session

| PR | Title | Theme |
|---|---|---|
| #428 | SDC paid posts (79 → 261 records) | Corpus |
| #429 | Hotfix: null-safe fmt() + filter articles out of Home/Saved strips | Hotfix |
| #430 | Desktop: search bar moves into filter row | PR_V |
| #431 | Editorial: paginate initial slice to 100 (was 48) | PR_X |
| #432 | Mobile chrome: z-index bottom nav + tighten moonphase eyebrow | Mobile chrome |
| #433 | Unified header band across all non-Home tabs | PR_Y1 |
| #434 | Identity band uses favicon olive (#3b4a36) not bright green | Identity band |
| #435 | Mobile shell redesign: main tabs to top, no bottom nav | PR_Y2 |
| #436 | PR_Y3: lift Collecting sub-tabs + reorder mobile chrome + hamburger | PR_Y3 |
| #437 | Hotfix: strip dead `desc` field from listings.json (7.7 → 4.1 MB) | Perf |
| #438 | PR_Y4: band above filter row + search-row spacing consistency | PR_Y4 |
| #439 | PR_Z: mobile search-focus overlay (Spotify pattern) | PR_Z |
| #440 | Chrome polish: wordmark weight + band margins + hide watchlist search | Chrome |
| #441 | Fix: live-auctions filter leaks ENDED lots when auction_end is date-only | Bug |
| #442 | Editorial: inline search input with filter pills (desktop) | Editorial |
| #443 | Home (mobile): merge brand row + main tabs row into one | Mobile |
| #444 | PR_W: cross-tab strip search results (v1) | PR_W |
| #445 | PR_β: olive chrome zone experiment (mobile brand + main tabs) | PR_β |
| #446 | PR_β-A: extend olive to sub-tabs + hide search on Watchlists desktop | PR_β-A |
| #447 | Fix: portal-rendered nodes inheriting browser default serif font | Bug |
| #448 | Retire identity bars + restore count chip + wordmark heavier | Chrome |
| #450 | Home (mobile): extend olive chrome into the editorial hero | Identity |
| #451 | Home: remove all green — neutral chrome + dynamic PWA theme-color | Identity |
| #452 | PR_γ: editorial details polish (ghost pills + hairline search + serif headings) | PR_γ |
| #453 | Olive accents on Home + over-scroll bounce + hide search on calendar | Identity |
| #454 | Editorial: drop card excerpt + reduce initial page + infinite scroll | Editorial |
| #455 | Polish: hide search on size/links + remove faint line on Home + filter Y-height | Polish |

**27 PRs landed.**

## Architectural decisions worth keeping in mind

### Identity through olive chrome zone, not bands

The colored identity band was the first iteration of "tell users
what section they're in". It got retired when the olive chrome
zone (brand row + main tabs + sub-tab strip) became continuous on
non-Home tabs — the sub-tab strip itself now carries section
identity. Future tabs / sub-tabs should rely on the colored chrome
+ active sub-tab underline; **don't reintroduce a separate identity
band** under the chrome.

The `IdentityBand` component still exists in `src/components/` —
the const `identityBandJSX` in App.js returns `null`. Kept as a
no-op so shells can still destructure without conditional logic.
If something genuinely needs a contained colored slab in the
content area, the component is ready to use.

### Home is the editorial exception

Olive chrome runs through Listings / Watchlists / Collecting. Home
is **neutral by design** so the editorial hero (moonphase eyebrow
+ WATCHLIST wordmark + Recently-added strip) carries the first-
paint moment. Two olive accents preserve the brand thread:

- ManageCallout / Watchbox CTA block (bottom of Home) — olive bg
- HomeSearchBar "Search →" CTA — olive bg

Don't extend olive chrome to Home without explicit redirection.
Mark tried it (#450), didn't like it, reverted (#451).

### Dynamic PWA theme-color on Home

`<meta name="theme-color">` content is a global meta tag — it
can't change per-route via static HTML. Solved with a `useEffect`
in App.js that watches `tab` and updates all three theme-color
meta tags (default / light / dark) plus `<html>.style.background`.

- Non-Home tabs: olive (#3b4a36) — iOS PWA strip matches the in-
  page chrome above the fold.
- Home tabs: white (light theme) / #1c1c1e (dark theme) — neutral
  iOS strip matches Home's neutral chrome.

Also updates `<html>` background so iOS over-scroll bounce reveals
the same color (bounce reveals html element's bg, not body's).

### Search row hide rules

The shell-level search row is hidden on:
- Home (HomeTab has its own hero search)
- All Watchlists sub-tabs ("not sure we need search for saved
  lists / searches / challenges")
- Listings > Auction calendar
- Collecting > Size comparison + Links (only Editorial keeps search)
- Admin

If a new tab/sub-tab should also hide search, extend the
conditional in DesktopShell + MobileShell. Don't gate via
`noFilterableList` for new hides — that flag drives FILTER row
visibility, not SEARCH row.

### Olive chrome implementation

- Color token: `--brand-olive: #3b4a36` (matches favicon hourglass
  bg). Defined in both light + dark theme blocks in App.js.
- `tabPill(active, { onOlive: true })` flips to white-on-olive.
  Sub-tab strips pass `onOlive: isMobile` since only mobile chrome
  is olive today.
- Mobile main-tabs row + sub-tab strips render olive bg via
  `isMobile && tab !== "home"` conditional.
- Desktop chrome unchanged — desktop hasn't picked up olive yet.

### Search-all destination

`searchAllActive` boolean state in App.js. When true, both shells
skip rendering sub-tab strips / filter row / identity band and
render `searchAllResultsJSX` (`<SearchResultsView/>`) in place of
the regular tab content. Main tab bar stays visible. Picking a
main tab clears the flag via `setTabWithReceiveEscape`.

Strip-view shows 3 strips (Listings / Auctions / Sold), each
capped at 8 cards with "View all" jumping to that tab with the
search preserved. **Editorial strip is v2 work** — articles live
inside EditorialView's lazy-loaded corpus; lifting that to App.js
is the prerequisite.

### Editorial page-size + infinite scroll

`RESULTS_PAGE_SIZE = 40` (was 100, was 48 before that). First
paint loads 40 cards. IntersectionObserver sentinel at the bottom
of the grid bumps page when in viewport with 200px rootMargin so
loading begins before the user hits the literal end. Replaces the
previous "Show N more" button. Same callback-ref pattern App.js
uses for the Listings grid.

### Body font-family on `body`, not on App root

`fontFamily: -apple-system, ...` lives on `body` in
`public/index.html` (NOT just on the App-root `baseStyle` div).
This is critical for portal-rendered nodes (Card ⋯ menu, mobile
search overlay) which render to `document.body` outside the App
subtree. Without body-level font-family, iOS Safari falls back to
Times serif. Same pattern as the theme-variables-on-`:root` fix
from PR #168.

## Known follow-ups for next session

### Mark's visual polish backlog (raised end-of-session, not yet shipped)

| Item | Notes |
|---|---|
| **WATCHLIST wordmark in olive on Home** | Mark floated this near end. Worth trying as a small experiment — hero text color becomes olive instead of black. Tests the "brand thread on a neutral page" idea further. |
| **Darker olive shade behind brand row on non-Home tabs** | Wordmark + M circle currently float on olive — Mark thinks they need anchoring. Two-tone olive (slightly darker band behind wordmark+M, lighter olive for main-tabs + sub-tabs). |
| **Grey section header bars in Lists view** | "Saved · 2 / Review · 1 / My lists · 10 · + New list" rows currently have `var(--surface)` fill — Mark thinks they look out of place. Options: drop the fill (just heading text), use a hairline top-border instead, or olive-tint. |
| **Mobile search Y-height between Listings and Collecting** | Likely resolved by PR #455's data-desktop-main `padding-top: 0` on references. Verify next session. |

### Active queue (carried forward from earlier sessions)

| Item | Notes |
|---|---|
| **PR_W v2 — Editorial strip in Search all** | Lift EditorialView's article corpus state to App.js so SearchResultsView can render a 4th strip. ~Half-day. |
| **Reference page first build** | Data analysis surfaced 3 strong starters: Rolex GMT-Master 1675 (65 articles), Omega Speedmaster 145.022 (35 articles), Rolex Submariner 5513 (67 articles). Pilot one. |
| **PR_S — Related articles on article cards** | "If you liked this…" scored by shared brand / model_line / reference_no across the corpus. Collector analyzer plumbing exists. |
| **Article share landing surface** | Articles currently share as the publisher URL directly. Routing through `/share/article/<hash>` + ShareReceiver article variant + `api/share.js` article OG handler would let recipients see a Watchlist landing surface like listings. |

### Smaller items still open

| Item | Notes |
|---|---|
| **Reactivate search on Saved listings/auctions/sold** | Currently hidden on ALL Watchlists sub-tabs per Mark spec. If users want it back on filterable sub-tabs, gate condition is `watchTopTab in (listings, auctions, sold)`. |
| **listings.json file split (live vs sold)** | At 4.1 MB after the `desc` strip. ROADMAP threshold is 5 MB — not urgent. |
| **Internal-vs-external naming cleanup** | `tab=watchlist` (internal) vs "Saved" (UI), `tab=references` (internal) vs "Collecting" (UI), `collections` (DB) vs "Lists" (UI). All deliberate, all documented in CLAUDE.md. Mechanical sweep parked. |
| **Mac mini Phase A** | Hard-source scraping (Heritage / Bonhams / Monaco Legend lot detail). Unblocks Phillips lot-detail throttling. Hardware tier deferred until justified. |

## Repo / corpus size status

- `public/listings.json`: **4.1 MB** (post-#437 strip; was 7.7 MB).
- `public/auction_lots.json`: 3.2 MB.
- Editorial corpus across 11 sources: ~12,600 articles, lazy-loaded.
- 27 PRs through the queue without a sustained CI-red incident
  (one JSX bug in #440 and one obsolete test assertion needed
  hotfixes; both resolved in-PR).

## PR hygiene incidents this session

- **#440 JSX bug**: removed a `</div>` while reverting an
  abandoned Home tabs+M merge edit. CI caught it on jest's
  build step. Fixed in a follow-up commit on the same branch.
  Lesson: when reverting partial edits, verify the closing tag
  count matches the opening tag count before pushing.

- **#440 test assertion regression**: the watchlist-search-hide
  change broke a Filters-icon test that targeted
  `tab=watchlist, watchTopTab=listings`. Switched the assertion to
  `tab=listings, listingsSubTab=live` (which still renders
  Filters). Lesson: when changing chrome visibility, sweep
  test-fixture call sites.

- **Stranded commit on `bonhams-comprehensive-lot-scrape` branch**:
  some earlier session left that branch checked out locally;
  `git checkout -b home-tabs-m-merge-v2` silently failed (likely
  filesystem state) and commits landed on the stranded branch
  instead. PR was opened from that branch name as a workaround.
  Lesson: when `git checkout -b` doesn't visibly switch, verify
  `git branch --show-current` before committing.

## Bottom line

The site looks substantially different from where this session
started: olive chrome zone is the identity cue on non-Home tabs,
the editorial hero is the moment on Home, search and filter rows
are harmonized across tabs and shells, the cross-tab Search all
destination is shipped, Editorial has a faster + cleaner card
grid, and a dozen small bugs and visual misalignments are fixed.

Next session has a clear queue: Mark's end-of-session polish
backlog (wordmark in olive on Home, darker-olive band behind
brand row, grey section-header treatment in Lists view), PR_W v2
to add Editorial to Search all, and the per-reference page pilot
from Epic 0. Branch state is clean (all 27 PRs squash-merged with
`--delete-branch`).
