# BUGS — usability + defect backlog

The durable home for bugs Mark spots while using the app. Survives across
sessions so nothing gets lost in a screenshot folder or a rotating handoff.

## How this works

Mark drops a **`Bug:`** into *any* open session (no dedicated session needed —
this file is the memory, not the conversation). Claude then:

1. **Triages severity.** Break-now (white screen, broken core flow, can't
   load) → fix immediately, abandon current tidy-up. Everything else →
   logged here, work continues.
2. **Writes an *enriched* entry** — Claude's reconstruction (surface,
   component, likely cause, repro), not Mark's terse note. The point is that
   future-Claude's "B-07 still open" is something Mark can actually recognise.
3. **Echoes back the one-liner + stable ID** in the moment, so Mark sees it
   was captured correctly.

`/start` surfaces every **Open** entry so they resurface each session.

**Entry format:** `### B-NN — <one-line title>` then a bullet block:
`Reported` (date) · `Severity` (1 break-now / 2 usability / 3 polish) ·
`Surface` · `Status` (Open / In progress / Fixed PR#### / Won't-fix) ·
`Detail` (enriched) · `Hypothesis` (likely cause/location, if known).

When a bug ships fixed, move it to **Resolved** with the PR number. Don't
delete — the history is useful.

---

## Open

### B-01 — Editorial search bar squashed/clipped on scroll (mobile)
- **Reported:** 2026-05-24, updated w/ 3-frame screenshot · **Severity:** 2 (usability) · **Surface:** Mobile PWA, Editorial subtab (Collecting → Editorial) · **Status:** Fix on preview PR — awaiting Mark's eyeball. **Contained fix (not the full AppChrome extraction):** EditorialView now portals its filter chrome into a slot in the shell sticky stack (`#editorial-filter-slot`) on mobile, so editorial's filters live in the same chrome as every other tab — no 2nd sticky layer squashing search. Desktop unchanged. (The full shared-chrome unification, plan Stages 2–3, remains the durable best-practice follow-up.)
- **Split note (2026-05-24):** B-03 (pin the main tabs everywhere) shipped on
  its own — see Resolved. This entry is now the *editorial-specific* part: the
  two-competing-sticky-layers collision that squashes the search behind the
  filter pills. Harder than B-03 because it needs EditorialView's own filter
  strip to coordinate with the shell's sticky stack (not just pin one row).
- **Detail:** On scroll the search bar gets **squashed and clipped behind
  the Date/Source/Brand/Hearted filter-pill row** (frame 3 — the "Search
  articles…" input is half-hidden behind the pills).
- **Hypothesis:** Two competing sticky layers in the mobile scroll container.
  The shell's `data-sticky-chrome` (sub-tabs + search row, `position:sticky;
  top:0; zIndex:20` — `MobileShell.js` L256–257) and **EditorialView's own**
  sticky filter chrome (Date/Source/Brand/Hearted + count, also `position:
  sticky; top:0; zIndex:20` — `EditorialView.js` ~L543–575) both pin at
  `top:0` but in different containing blocks, so as you scroll the shell search
  row unsticks/overlaps under the EditorialView pill row instead of stacking
  cleanly below it. Fix = **one** coordinated sticky stack: either lift the
  Editorial filter strip into the shell's sticky chrome, or give the two
  layers sequential `top` offsets (search row pins, pills pin *below* it) and a
  shared compact header so search stays reachable at any depth. Inline search
  was retired 2026-05-21 (uses shell global search now). Prior related fix:
  2026-05-21.

### B-06 — Post-screening flow is underspecified (design thread → plan-mode)
- **Reported:** 2026-05-24 · **Type:** Design/product question, **not** a code defect · **Severity:** — (needs plan, not a quick fix) · **Surface:** Screening / RecapView · **Status:** Open — flagged for plan-mode · **Priority:** HIGH — Mark confirmed 2026-05-24 the screening workflow is "still incomplete" and he's "not happy with it"; this is the surface to fix next in screening, via plan-mode.
- **Detail:** Open questions Mark raised at the end of a screening session:
  1. What happens when you're done screening?
  2. Where do you see your **auction screening results** (the watches you said Yes to / hearted)?
  3. Can you **rescreen / reset / share** the list you built?
  4. On a shared list, **who likes what** — visible per-person reactions?
- **What exists today:** `RecapView` (`ListReviewMode.js:1257`) shows "All
  reviewed", a Yes/Hearted/Pass tally, a "reactions saved" note, and a single
  button ("Back to list" / "Done"). It does **not** let you view the Yes set,
  rescreen/reset, share the result, or see per-person reactions. So all four
  questions are genuine gaps, not bugs.
- **Why this is a plan item, not a quick fix:** it's the whole post-screening
  outcome surface — touches results storage/retrieval, the share flow, and
  collaborative reaction visibility. Connects to [[feedback-screening-mode-surfaces]]
  (shared lists / auction catalogs / "new since last visit"),
  [[feedback-reaction-context-lives-in-lists]] (who-likes-what = list-membership
  reactions, stay binary), and [[feedback-screening-long-queues]] (pause/resume).
  **Recommend graduating this to a plan-mode session**, not patching RecapView
  piecemeal.

### B-07 — Smooth the jarring Home → core-tabs tonal jump
- **Reported:** 2026-05-24 (clarified) · **Type:** UI tweak · **Severity:** 3 (polish) · **Surface:** Home masthead, mobile · **Status:** Open — unblocked, ready to build
- **Detail:** The real problem (Mark's clarification): navigating from the
  neutral Home to the olive core tabs (Listings/Watchlists/Collecting) is a
  **hard tonal cut — it changes the whole design tone and feels jarring.** The
  proposed fix: make the Home "bleed bar" (the band holding the main tabs +
  search under the wordmark) the same dark olive as the core tabs, so Home
  starts carrying a little olive and the transition isn't a hard jump. The
  `EditorialHero` (wordmark/moon) **stays neutral** by design.
- **Note on prior decision:** the 2026-05-22 *"remove green altogether"* call
  was about the **top/hero only**, not the whole Home (Mark clarified
  2026-05-24) — so this is consistent, not a reversal.
- **Hypothesis:** Band bg is set in `MobileShell.js` Row 2 (`var(--bg)` on
  Home, olive elsewhere — ~L186–187) + the `HomeSearchBar` band in
  `HomeTab.js`. Swap those to `var(--brand-olive)` for Home. Visual change →
  push ready-to-merge for Mark to eyeball on-device. Cheap to revert.

### B-08 — Unify the Watchlists tab into one sectioned screen (design thread → plan-mode)
- **Reported:** 2026-05-24 · **Type:** Design/product thread, **not** a defect · **Severity:** — (needs plan) · **Surface:** Watchlists tab (UI "Watchlists"/"Saved") · **Status:** Open — flagged for plan-mode
- **Detail:** The Watchlists tab currently has **two sub-tabs** (Lists +
  Searches). Mark's idea: **integrate them into one screen** with **sections**
  rather than a plain list — **cards on mobile**, and **make more of the width
  on desktop**. This unified screen could also become the home for **Watchbox**
  (owned-watches view) so it lives alongside lists/searches instead of separate.
- **Why this is a plan item:** it's a re-architecture of a whole tab's IA
  (merging sub-tabs, a new sectioned layout, responsive card/grid treatment,
  and absorbing Watchbox) — design + layout decisions up front, not a quick
  edit. Internals reminder (CLAUDE.md): UI "Watchlists"/"Saved" ↔ internal
  `watchlist`/`WatchlistTab.js`; the broader `collections` umbrella (Lists,
  Wishlist, Owned/Watchbox, Sold) is the relevant data model. Pairs with B-06
  for a screening/collecting plan-mode session.

### B-09 — Search-all returns "no articles" for reference numbers (e.g. 5513)
- **Reported:** 2026-05-24 · **Severity:** 2 (usability) · **Surface:** Cross-tab Search-all (search strip) · **Status:** Open
- **Detail:** Searching **5513** in Search-all reports no articles, even though
  many articles discuss the 5513 (Submariner) — the reference appears in
  article **body text**, not titles.
- **Hypothesis:** `SearchResultsView.js` fetches the editorial corpus **meta
  only, no bodies** (L13–14 comment). `matchesArticleQuery` (L49–51) matches
  title/excerpt/author always but body **only if `articleBodies[url]` is
  present** — and bodies aren't loaded for Search-all. Reference numbers live in
  bodies, so they don't match → "no articles." Fix = trigger the lazy bodies
  fetch when `searchAllActive` (mirror EditorialView's first-keystroke body
  load) so body matches surface. **Perf note:** bodies are ~14 MB — load on
  demand for Search-all, not eagerly. Same lazy-bodies machinery as the B-01
  editorial area.

### B-11 — See-through strip below the sticky chrome (the date-divider gap)
- **Reported:** 2026-05-24 (Home + Listings screenshots). **LONG-RECURRING since early builds** (Mark) — confirmed by the code (multiple documented failed fixes). · **Severity:** 2 (bumped — recurring + visible on core surfaces) · **Surface:** Desktop Listings/Watchlist grids + Home; the `DateDivider` sticky region · **Status:** Stage 1 fix on preview PR — **root cause found & removed (not masked).** The desktop scroll pane `[data-desktop-main]` had a 14px top padding; a sticky child sticks *below* container padding, so those 14px were the see-through strip (Watchlist/Collecting were already 0 → never showed it, confirming cause). Fix: zero the pane top padding on all tabs (`DesktopShell.js`). Mobile pins via its own measured offset. The broader shared-chrome unification (Stages 2–5 of the plan) still stands as the durable best-practice follow-up.
- **What it actually is (Mark's key detail):** a **see-through strip that stays
  put while card images scroll behind it** — a transparent sticky region
  between the filter bar and the date-group header. Not a 1px seam; a real gap.
- **Root cause:** `DateDivider` (`src/components/DateDivider.js`) pins at
  `top: var(--sticky-top, 0px)`. `--sticky-top` is a **pixel value JS measures
  off the *mobile* `[data-sticky-chrome]`** (App.js L1498–1517) and writes to a
  CSS var; on desktop the chrome is a *different structure*, the selector
  misses, the value is 0, and the divider can't actually reference the chrome
  above it. A sticky element aligning to a chrome it has no real handle on,
  across two different chrome implementations, via a measured-pixel guess →
  perpetual drift.
- **Why it keeps coming back:** the file documents the band-aid graveyard —
  box-shadow (#524, "still got a gap"), negative-margin (doesn't translate
  under `position:sticky`), now 3px absolute "gap-mask" divs. Each patches one
  viewport/state; the next change re-opens it.
- **Proper fix = the shared-chrome component (Mark's repeated ask).** One
  chrome + sticky-offset system with a real source of truth so dividers (and
  editorial's filters, and the seam) pin **flush by construction**. This entry,
  B-01/editorial-difference, and the old peekaboo framing are **the same root**.
  Target end-state (Mark): the date bar sits flush against the filter/search
  bar. **Plan-mode item** — see the chrome-unification thread.

---

## Resolved

### B-03 — Main tabs pinned on scroll (all tabs) · Fixed PR (this branch)
- Main tab pills (Listings/Watchlists/Collecting) used to be a non-sticky
  "Row 2" that scrolled away. Moved them into the `data-sticky-chrome` stack
  in `MobileShell.js` as its first child (the same lift a prior PR did for the
  sub-tabs), so they stay visible at any scroll depth on every tab. Wordmark
  brand row stays non-sticky to keep the pinned chrome compact. Note: main tabs
  no longer show during cross-tab Search-all (SearchResultsView has its own
  Exit). B-01 (editorial search squash) split out as a separate follow-up.

### B-10 — Home nav band (tabs + search) sticky · Fixed #549
- Pinned the HomeTab masthead band with `position: sticky;
  top: env(safe-area-inset-top); zIndex: 30` — Home tabs + search stay
  reachable on scroll; hero scrolls away above, strips scroll under.

### B-04 — "Take a break" interstitial fires too early (25 → 50) · Fixed #544
- Screening break prompt fired after 25 cards; Mark wanted 50. Changed
  `BREAK_INTERVAL` 25 → 50 in `ListReviewMode.js`; the `Math.floor(idx /
  BREAK_INTERVAL)` cadence now fires at 50/100/150…

### B-02 — Screening copy: auction catalogs distinguish watch vs save · Fixed PR (this branch)
- Auction-catalog screening onboarding now reads: Yes = "Watches you want to
  watch", Heart = "Watches you want to save and are very interested in", Pass =
  "Not interested" (Mark's wording). Threaded `isAuctionCatalog` (=
  `selected.type === 'auction'`) → `OnboardingCard`. Non-auction lists keep
  their original consider/save/Not-for-you copy. One-time intro gated by
  `screening_intro_seen_v1`.

### B-05 — Saved auction catalogs need house + date · Fixed #545
- Auction-catalog rows in Lists showed only title + count, so two
  similarly-named catalogs were indistinguishable. Now append "· {House} ·
  {date}" to the row subtitle, read from the saved lots' `house` +
  `auction_date_label` (carried in the listing_snapshot) — frontend-only, no
  migration. Degrades to count-only for old snapshots / manual items.
