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
- **Reported:** 2026-05-24, updated w/ 3-frame screenshot · **Severity:** 2 (usability) · **Surface:** Mobile PWA, Editorial subtab (Collecting → Editorial) · **Status:** Open
- **Detail:** Platform now confirmed **mobile** (not desktop). On scroll it's
  worse than "scrolls away": the search bar gets **squashed and clipped behind
  the Date/Source/Brand/Hearted filter-pill row** (frame 3 — the "Search
  articles…" input is half-hidden behind the pills), and the main tabs +
  sub-tabs disappear, so you must scroll back to the top to search. **Same
  failure as [[B-03]]** — tabs squashing — they should be fixed together as one
  sticky-chrome pass.
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

### B-03 — Main tabs scroll off on mobile; want them pinned + compact
- **Reported:** 2026-05-24 (screenshot) · **Severity:** 2 (navigation) · **Surface:** Mobile PWA, all non-Home tabs (shown on Saved → Lists) · **Status:** Open
- **Detail:** Scrolling down hides the top-level main tabs (Listings /
  Watchlists / Collecting). Only the sub-tab chrome stays pinned, so you can't
  switch main tabs without scrolling back to the top. Mark wants the main tabs
  **visible but compact** at the top at any scroll depth.
- **Hypothesis:** `MobileShell.js` — Row 1 (brand/wordmark, L142–170) and Row 2
  (main tab pills, L176 onward) render **outside** the `data-sticky-chrome`
  wrapper (L256), so they scroll away; only sub-tabs + identity + search row
  inside that wrapper stay pinned. This was partly intentional (L106 comment:
  "title sits OUTSIDE the sticky wrapper" + repeated space-trimming because the
  iOS URL bar already eats the top viewport). Fix = pull a **compact** main-tab
  row into the sticky stack — likely drop/shrink the wordmark brand row on
  scroll to claw back the vertical space, so pinning the tabs doesn't push
  cards below the fold. Has a small design trade-off (nav access vs vertical
  space); the "compact" instinct is the resolution. Decide the compact form
  before building.

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

---

## Resolved

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
