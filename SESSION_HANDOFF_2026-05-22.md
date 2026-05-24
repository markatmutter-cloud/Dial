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

---

## Addendum — afternoon session (2026-05-22 PT)

After the morning handoff (#456), Mark and I continued through a
desktop chrome overhaul + a density pass. **12 more PRs landed.**

### Five additional arcs

1. **End-of-session polish backlog → shipped (PRs #457/#458/#459).**
   The three δ items from the morning's "carried forward" list:
   - PR_δ1: grey fill dropped from Lists section headers
     (typographic uppercase letter-spaced labels).
   - PR_δ2: WATCHLIST wordmark on Home in olive via the new
     `--brand-olive-text` token (full olive light / lighter sage
     `#a8b3a0` in dark mode).
   - PR_δ3: mobile brand row wordmark 600 → 700 + 12%-white
     hairline below to anchor wordmark+M on olive without a third
     band color.

2. **Desktop chrome overhaul — ε series (PRs #460/#461/#462/
   #463/#464/#465).** The wide-ranging direction Mark asked for:
   bring olive to desktop in a way that maintains site-wide
   consistency.
   - PR_ε0: Editorial sticky filter `top: 40 → 0` (the 40px was
     reserved for a subStrip lifted to the shell in PR_Y3;
     became a transparent gap). Fixes Mark's transparency report.
   - PR_ε1: Desktop main tabs filled-pill → underline via
     tabPill. Same metaphor as mobile + every sub-tab strip.
   - PR_ε1.5: Top-bar expanding search (icon → 320px input + `/`
     shortcut). Replaces the filter-row search composite from
     PR_V. Editorial inline search reverts to single source.
   - PR_ε2: Olive top bar on desktop non-Home tabs — the visual
     centerpiece. White-on-olive wordmark (700), tabs, About,
     Watchbox pill. Avatar disc INVERTS on olive (white disc +
     olive letter); fixes the ε5 mobile regression where olive
     disc on already-olive mobile chrome was invisible.
   - PR_ε3: Filter pill consistency — drop `surface: true` from
     Date/Price/Sort so all pills share the PR_γ ghost-active
     pattern.
   - PR_ε5: Olive accents on M circle, Watchbox dropdown disc,
     ADMIN badge, and VIEW SETTINGS active pills. Single brand
     color across user-affordance surfaces.

3. **Search bar placement — resolved (PR_ε1.5).** After Mark
   flagged "still not sold on where the search bar goes", my
   expert recommendation was top-bar expanding inline input (over
   right-of-pills, between-pills, separate-line). Mark approved.
   Shipped. Mobile keeps the Spotify overlay from PR_Z.

4. **Surface-fill cleanup pattern extended (PRs #466/#467).**
   Mark screenshotted multiple grey-filled containers across the
   app:
   - Home Screen CTA reshaped from brand-blue → outline pill +
     ▶ glyph (matches sibling View-all).
   - Watchbox stat cards (Collection count / Total value):
     typographic-only, value bumped 18 → 22.
   - About modal feature cards: hairline top-rules between cards,
     no surface fill.
   - User dropdown Watchbox CTA + VIEW SETTINGS container: drop
     surface fill, keep border on Watchbox CTA, replace VIEW
     SETTINGS container with a hairline top-rule.

5. **Density pass (PR #468).** Mark report: "for a whole screen I
   can only see one row of watches feels poor value." Three changes
   reclaim ~30-40px above the fold:
   - Date dividers (App.js visibleWithDividers): drop chunky
     surface bg + 14-28px padding. Convert to typographic uppercase
     letter-spaced label. Saves ~18-28px per divider.
   - Filter row vertical padding 8 → 6px.
   - Source/Brand/Model expansion panel bottom 24 → 14.

### Architectural decisions worth keeping in mind (additions)

#### Desktop olive top bar is a contextual chrome, mobile mirrors

Both shells now have `tab !== "home" → olive bg` as the chrome
rule. Desktop bar contents flip via `topBarOnOlive` derived from
`tab`, mobile bar contents flip via the existing mobile chrome
pattern. The single rule is: **olive chrome on every tab except
Home, both viewports.** Same dynamic PWA theme-color logic from
PR #451 still applies.

#### Avatar disc has TWO color states based on chrome context

```
On olive top bar (tab !== "home"):  white disc + olive letter
On neutral top bar (tab === "home"): olive disc + white letter
```

Implemented as a wrapping IIFE in App.js's authJSX so the
olive-aware tokens (discBg / discFg / pillBorder / pillText /
pillOpenBg) are computed once and used by both desktop pill and
mobile circle. **If you add a new context where the chrome bg
flips, mirror this pattern** — don't duplicate the conditional.

#### `--brand-olive-text` token for text-on-bg olive

`#3b4a36` (light mode, full olive) / `#a8b3a0` (dark mode, lighter
sage). Used for the Home WATCHLIST wordmark; available for any
other olive-text-on-page-bg surface. **Don't use `var(--brand-olive)`
for text in light mode** — the contrast on white is fine, but in
dark mode `#3b4a36` is unreadable on `#000`. Always reach for
`var(--brand-olive-text)` when the surface needs text-on-bg olive.

#### Top-bar search is the single source of truth

Lives in DesktopShell as `topBarSearchJSX`. Same `search` state
threads through every surface (Listings filter, Editorial filter,
Saved-search runners). The `/` keyboard shortcut expands it from
anywhere except when an input is already focused. Editorial's
inline input (PR #442) is gone — don't reintroduce.

### Status of the original carried-forward queue

- ✅ Mark's three end-of-session polish items (δ1/δ2/δ3)
- ✅ PR_W → PR_ε1.5 superseded the cross-tab search work; search
  now lives in the top bar with the strip view available via
  "Search all" target. Editorial-strip-in-Search-all (v2) is
  still queued.
- 🟡 Per-reference page pilot from Epic 0 — not started.

### Active polish backlog (carried into next session)

| Item | Notes |
|---|---|
| **PR_ε4 polish + dark-mode audit** | Needs Mark's eyes on the live site. The ε series shipped a lot of color changes; an audit pass would catch any dark-mode regressions or contrast issues. |
| **Editorial strip in Search all (PR_W v2)** | Lift EditorialView's article corpus to App.js so SearchResultsView can render a 4th strip. ~Half-day. |
| **Reference page pilot (Epic 0)** | Pick one of Rolex GMT-Master 1675 (65 articles), Omega Speedmaster 145.022 (35), Rolex Submariner 5513 (67) and build the surface. |

### PR_ε naming key (for grep in future sessions)

The ε series followed a non-linear naming because Mark approved
δ1.5/ε1.5/ε2/ε3/ε5 in that order. The final landed PRs:

| Branch | PR # | Description |
|---|---|---|
| pr-e0-* | #460 | Editorial sticky transparency fix |
| pr-e1-* | #461 | Desktop main tab underline |
| pr-e1-5-* | #462 | Top-bar expanding search |
| pr-e5-* | #463 | Olive M circle + dropdown |
| pr-e2-* | #464 | Olive top bar on desktop |
| pr-e3-* | #465 | Filter pill consistency |

ε4 (polish + dark mode) deferred to next session — needs visual.

### Total session PR count

**~40 PRs squash-merged in this session** (counting both morning
and afternoon, plus the original handoff PR). Branch state still
clean (all delete-branched on merge).

---

## Addendum — evening session (2026-05-22 PT)

Companion file for the parallel backend session:
[SESSION_HANDOFF_2026-05-22-backend.md](SESSION_HANDOFF_2026-05-22-backend.md)
(auction scraper coverage + Bonhams Cloudflare diagnosis +
archive landmark sales).

After the afternoon handoff, an evening run continued through
copy work, search-strip rework, receive-surface chrome, and
several bug hotfixes. **~20 more PRs landed.**

### Six arcs

1. **Search-strip surface (the "Search all" destination)
   substantially reworked.** PR_φ1 was the inline-editable query
   + sticky header + smart strip order; PR_φ2 lifted the editorial
   corpus into App.js so the surface gets a 4th Articles strip;
   subsequent fixes converted the strips to Home-style horizontal
   sliders (mobile 38% / 170px max; desktop fixed 210px tiles),
   pinned strip order to live → auctions → articles → sold, and
   moved to always-show-all-4-strip-headers (empty strips render
   "No matches." inline instead of being hidden). Final shape:
   header has eyebrow row (`SEARCH RESULTS · N matches · Exit`)
   above an always-visible editable input, then 4 sliders.

2. **Copy refresh anchored to BRAND.md + RECOMMENDER_STRATEGY.md.**
   Three-line tagline hierarchy (`Watchlist` / *For people who
   watch vintage watches.* / Search, save, and follow listings
   from across the vintage watch world.) applied to public/
   index.html title + OG + Twitter + JSON-LD AND
   AboutModal welcome panel AND ShareReceiver first-time panel.
   Home Watchbox CTA went through three heading variants —
   final: "Your collecting space." Share-receive heading also
   refreshed ("{Name} thought you'd want to see this." /
   fallback "A watch worth a look.").

3. **Olive-thread completion across user surfaces.** Avatar M
   circle inverts based on chrome context (white disc + olive
   letter on olive bar; olive disc + white letter on neutral).
   Primary CTAs swept brand-blue → brand-olive site-wide via
   `actionButton({ variant: "primary" })` (+ From feed, modal
   primary buttons, ChallengeFlow). Countdown chip on auction
   cards ("6 HOURS LEFT") swapped to olive rgba. Date dividers
   redesigned to typographic-only with olive accent label.
   All Watchlists icon strokes swept olive (heart, bookmark,
   thumbs-up, users, folder, inbox, eye-off — plus search icon
   on saved-search rows, completed-challenge glyph). About
   modal feature badges (B/S/P/L/D) flipped olive. Mobile Home
   chrome extended olive through the tabs row (previously
   neutral; created a visual break with non-Home tabs). Home
   wordmark in olive in both modes (dark mode keeps the same
   `#3b4a36` per Mark spec — lower contrast is intentional).
   New token `--brand-olive-tint-12` for icon-disc backgrounds.

4. **Receive surfaces (share / challenge / list / search-all)
   inherit olive chrome.** When a focused destination surface
   takes over the content area, the underlying `tab` value can
   be "home" (fresh `/share` landing with no prior nav). Before:
   chrome flipped back to neutral on these surfaces, mismatching
   the rest of the site. Fix in both shells + the App.js
   theme-color useEffect: olive chrome applies when
   `tab !== "home" || anyShareActive || searchAllActive`.

5. **Bug hotfixes.**
   - **imgFailed scope bug (the real one).** Original
     hypothesis ("stale bundle") was wrong — PR #408 had
     declared `useState(false)` inside `ShareReceiver` but used
     the resulting state in `FocusedShareCard` (a separate
     function in the same file). Every share recipient hit
     ReferenceError on the focused-share render. Moved state
     declaration into the inner component. **Lesson logged**:
     when grep finds a name "declared", verify it's in the
     same FUNCTION scope as the consumer, not just the same file.
   - **Two-M-circles on receive surfaces.** Brand-row authJSX
     started rendering on receive surfaces (correct), but the
     merged Home tabs-row also rendered authJSX (its condition
     was tab === "home"). Both fired → two M circles. Gated
     tabs-row M on `!anyShareActive && !searchAllActive`.
   - **Desktop Source filter missing "+N more" expander.**
     Mobile had it (since the grouped-source pattern); desktop
     never did. With 38 dealers + 6 auction houses, visibleSources
     was sliced to 8 and the rest were invisible.
   - **Monaco Legend images returning 404.** Scraper saves
     bare Uploadcare UUIDs. CDN requires a path operation
     suffix to serve the image. Frontend `imgSrc()` rewrite
     appends `/-/resize/800x/-/format/auto/` for the host —
     fixes 404 + serves webp/avif at 800px (~30-50% smaller).
     Backend follow-up logged: update scraper to write the
     suffix at scrape time.
   - **Editorial filter strip transparency + alignment.** The
     `top: 40` legacy from a retired subStrip became a
     transparent gap (PR_ε0). Then horizontal alignment
     repeatedly drifted because Editorial uses a sticky-wrapper
     + nested-inner-strip pattern while Listings uses a single
     flex container — same `pillBase` pills, different outer
     geometry. Aligned them again after multiple iterations;
     queued a **refactor** to extract a shared `<FilterRow>`
     primitive.

6. **Mobile chrome refinements.** Brand row wordmark switched
   to `alignItems: "center"` (was "baseline" against the larger
   M circle, which pushed the wordmark visually low). Vertical
   padding bumped 4 → 8 for breathing room. Home gets olive
   chrome through its tabs row (the only mobile surface that
   was still neutral). Search row hide-rules audited (no
   regression).

### Architectural / durable patterns worth keeping in mind

#### Avatar disc inversion based on chrome bg

The avatar pill (App.js authJSX) has TWO color modes computed
once in a wrapping IIFE:

```
On olive top bar (tab !== "home" OR receive OR searchAll):
  white disc + olive letter, white border @ 30% alpha
On neutral top bar (Home with no receiver):
  olive disc + white letter, default border
```

If a new context flips chrome bg, mirror the rule in this IIFE —
don't add new conditionals downstream.

#### Receive-surface chrome rule (applies to four flags)

`anyShareActive || searchAllActive || challengeShareActive ||
listShareActive` — these focused-destination flags should be
OR'd with `tab !== "home"` everywhere chrome decisions are made.
Currently five places have this combined rule:
- DesktopShell topBarOnOlive + IIFE onOlive + wordmark render
  + top-bar search render
- MobileShell brand-row visibility + tabs-row bg/padding +
  tabPill onOlive flag
- App.js theme-color useEffect (`onHome` AND-s in all flags)

#### Monaco Legend Uploadcare CDN rewrite

The bare UUID URL is unusable. Frontend `imgSrc()` rewrites
hosts matching `cdn.monacolegendauctions.com` when the path
has no `/-/` segment, appending `/-/resize/800x/-/format/auto/`.
The Watchfid/WoL three-place lockstep (utils.js + api/img.js +
api/share.js) does NOT apply here — Monaco is a different
mechanism (URL transform, not proxy), so the rewrite lives only
in utils.js. Backend follow-up logged to write the suffix at
scrape time.

#### Three-line voice hierarchy

Public-facing positioning copy uses:
1. **Watchlist** (brand)
2. *For people who watch vintage watches.* (italic positioning)
3. Search, save, and follow listings from across the vintage
   watch world. (description)

Applied to: HTML head meta (title/OG/Twitter/JSON-LD), About
modal welcome panel, share-receive first-time panel. Future
positioning surfaces should mirror this hierarchy.

#### Editorial vs Listings filter row drift (known issue)

Same `pillBase` styling, different OUTER container shapes:
- **Listings**: single flex container in shell, `padding: "6px 20px"`
- **Editorial**: sticky wrapper + nested inner strip inside
  scroll container, wrapper has `marginLeft: -20 + paddingLeft: 20`
  (edge-to-edge trick) + inner strip has `padding: "6px 0"`
  (horizontal 0 because wrapper already adds 20)

When either is touched, alignment drifts. **Pinned refactor**:
extract a shared `<FilterRow>` primitive — see next-session queue.

### Next-session queue (Mark spec end-of-session 2026-05-22)

| Item | Notes |
|---|---|
| **Landing page tab font** consistency with the landing page hero + other tabs. Currently main-tab text uses 13/14px system; the landing page wordmark uses 30-56px uppercase letter-spaced. Different sizes is fine but font weights / casing could harmonize. |
| **Extract shared `<FilterRow>` primitive** so Listings + Editorial stop drifting (task #35). The recurring alignment work this session is a structural problem, not a styling one. |
| **Sotheby's brightspotcdn + Phillips CDN transforms** for image speed. Sotheby's URLs support dim params; Phillips assets are pre-sized but could be smaller. Similar pattern to the Monaco CDN rewrite. |
| **Grey headers on listings and other tabs** revisit — Mark wants another look at the section-divider treatment across the app. Earlier session retired the slab; section identity comes from chrome + sub-tab underline. Worth deciding if some surfaces still need anchored headers. |
| **Editorial cards improvements** — visual polish on the article tile (title + image + meta layout). |

### Smaller carried-forward items

| Item | Notes |
|---|---|
| **Sotheby's archive coverage** — only 1 of 162 sold lots scraped (vs Antiquorum 551, Christie's 222, Monaco 269, Phillips 200). Sold-lot parser path is broken; needs a separate scraper fix. |
| **Bonhams Cloudflare block** — three attempts in the backend session didn't clear it. Detailed in [SESSION_HANDOFF_2026-05-22-backend.md](SESSION_HANDOFF_2026-05-22-backend.md). |
| **Oliver & Clarke + Collectors Corner NY saved-item images** — empty `listing_snapshot.img` in saved snapshots (likely hearted before the dealer's scrape was capturing images). Current scrape has valid CDN URLs. Needs snapshot-refresh-on-feed-encounter or a one-time data migration. |
| **Christie's two undated stories** — Mark wants Feb 1 2026 as the published_at fallback. Not shipped this session; data file edit. |

### Total evening PR count

**~20 PRs squash-merged.** Plus the morning + afternoon
totals from this same date, the running 2026-05-22 count is
**~60 PRs.** Branch state clean (all delete-branched on merge;
stranded local branches from prior sessions reaped at session
close).

---

## Addendum — late-night session (2026-05-22 PT)

After the evening handoff merged (#495), a continuous late-night
working session went through Mark's queued visual + IA backlog
and shipped **33 more PRs (#496–#528)**. Heavy day of design
iteration; the running 2026-05-22 total is now **~93 PRs.**
Branch state clean.

### Headline arcs (in rough order)

1. **Image-perf + visual cleanup (#496–#499).** Phillips
   Cloudinary transform (w=800 → 1.6 MB → 125 KB on lot tiles),
   sticky date dividers with olive accent (replacing the grey
   slab that bled grid-bg through), divider gap fix, editorial
   cards Vogue/Hodinkee pattern (no border, 3-col max, serif
   title, uppercase kicker).

2. **Chrome typography pass (#500–#507).** Tabs / About / auth
   pill all snapped to one type system (13/500-600/0.01em).
   Active-tab color flipped from `var(--text1)` to
   `var(--brand-olive-text)` on neutral chrome — ties the active
   tab visually to the wordmark. Home got an olive kicker rule
   under the wordmark, a masthead-nav restructure (tabs +
   search moved under the hero in an olive-bleed band), then
   compression + rebalance + utility-row + tighten cycles.

3. **Search + Sale filter (#508–#511).** Home search learned
   recent-search history (localStorage, MRU-6), live per-target
   counts in the dropdown, and (briefly) live strip filtering.
   Search-all gained Brand + Price filter chips. List drill-ins
   got a hearted-only toggle. Then Mark walked back the live-
   filter trigger ("a bit weird when you start typing that
   you're suddenly in a different page") — keep counts, drop
   auto-open.

4. **Screener refresh + IA rework (#512–#516, #522).** The
   ListReviewMode chrome swept olive (was brand-blue),
   desktop got a horizontal layout redesign (image 520→400,
   serif title 36→52, inline action buttons, retired the bottom
   bar + tally emoji chips). Then Mark called for an IA
   reframe: "screening is a fun thing, kind of like the
   challenge" → move it to a destination under Collecting with
   pool cards (auction catalogs, your lists, shared lists).
   Dead feed-mode code from #283 / #507 cleaned up; Challenges
   sub-tab moved from Watchlists → Collecting.

5. **Watchbox top-right parity + Home chrome cycles (#517–#519,
   #523).** Mark flagged the Watchbox pill appearing to "jump"
   on tab change (white-on-Home → olive-on-other-tabs context
   flip). Brought back a minimal top-bar on Home with the auth
   pill at top-right (initial attempt painted an olive bar,
   reverted to transparent so Home stays neutral). Top-bar
   search retired in favour of always-expanded inline search
   in the filter row. Wordmark sizing pass — Home hero 30 → 40
   mobile, top-bar 14 → 18 mobile / 18 → 24 desktop.

6. **Auction tab plan (#524–#528).** Mark planning session
   landed five concerns. Shipped: closing-time bands replace
   sale-grouping ("Closing today / this week / this month /
   Later / Other auction lots") + always-expanded search +
   divider see-through fix (three attempts: negative-margin,
   box-shadow, absolute mask child — all failed in sticky
   state) → pragmatic resolution: flip `gridStyle.background`
   from `var(--border)` to `var(--bg)` so the 1px hairline
   between cards becomes invisible (kills the leak everywhere).
   Also shipped Sale filter chip on Live auctions (multi-select
   dropdown of active catalogs). Filter row reordered:
   Source/Brand/Sale → Search → Min-Max/Date/Price/Saved per
   Mark spec; search bar `borderRadius: 10 → 20` to match
   the pill type system.

### Workflow + memory notes graduated this session

Three durable conventions saved to memory under
`~/.claude/projects/.../memory/`:

- **`feedback_message_prefixes.md`** — Three-tier signal system:
  `FYI` / `Note —` (queue for next PR), `Save for plan` (bigger
  thread, plan-mode later), `Remember:` (persist across sessions).
  Default (no prefix) = direct instruction, execute now.
- **`feedback_multimessage_burst_cadence.md`** — Mark stacks
  feedback in bursts while testing — observations for later, NOT
  redirect-now interrupts. Ack briefly, stay on the agreed list,
  queue for next PR. Don't repivot every message.
- **`feedback_branch_discipline.md`** — Always `git checkout -b
  <name>` BEFORE editing. Don't edit while on `main`. Recurring
  failure mode this session — committed directly to local main
  3+ times; cleanup adds noise. Auto-mode classifier correctly
  blocks pushing main + resetting main, so the safety net works.

### Self-feedback (mid-session, in response to Mark's prompt)

Mark surfaced that I'd reached for "ridiculous session" as a
sign-off summary in a way that read as sassy. Honest read: not
deliberate, but the word choice probably reflected something on
my side (volume + iteration loops). Saving for future sessions:
**stay descriptive, not editorial.** Report what shipped + what's
left; let Mark judge pace/scale himself.

Also surfaced: today's iteration loops on the Home masthead (8
PRs on one surface) were partly driven by me repivoting on each
of Mark's burst-feedback messages. The right pattern is to ack +
queue + stay on the current build, not pivot on each line.
Documented in the burst-cadence memory entry above.

### Next-session queue

| Item | Notes |
|---|---|
| **Hide regression diagnosis** | Auction-plan PR C from the planning session. Mark report on Live auctions cards "don't have the hide feature anymore." Code path looks correct (admin onHide → ⋯ menu → Hide entry). Need a screenshot of the menu open to verify. |
| **Mobile Sale filter chip** | Desktop got the Sale chip in #525. Mobile filter drawer doesn't yet. |
| **Collecting > Screening v2 — "New since last visit" pool** | Deferred from #522 (3 of 4 pools shipped; this one needs re-introducing a slimmed feed-mode mount that was cleaned up in #516). |
| **Screener-without-list rework (Auction IA Slice 3)** | Bigger structural change — replace auto-list-creation on calendar Review with ad-hoc lot set + opt-in persistence at the end. |
| **Shared `<FilterRow>` primitive refactor** | Listings + Editorial alignment drift documented from earlier sessions; no visible change, hygiene. Low priority. |

### Local repo state at session close

- All 33 PRs squash-merged + delete-branched on origin.
- Local `main` has a divergent revert commit from one of the
  accidental-commit-on-main moments — harmless, will sort itself
  on the next `git checkout -b … origin/main`.
- No stranded branches; nothing to reap.

### Bottom line

Heavy visual-IA day. Most user-facing surfaces touched at least
once: chrome typography, Home masthead, search behavior, screener
visuals + IA, auction tab structure, divider treatment, modal
elevation, filter row layout. The site looks materially different
from the morning handoff state — particularly the auction tab
(closing-time bands + Sale filter chip + search inline) and the
screener (no longer reachable as an action; lives as a destination
under Collecting alongside Editorial / Challenges / Size compare /
Links).

Mark closed the session asking to write up the handoff and stop.
Next-session is wide open — the queue items above are continuation
opportunities, none of them blocking.
