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

### B-02 — Screening response copy should be auction-specific
- **Reported:** 2026-05-24 · **Severity:** 3 (polish/copy) · **Surface:** Screening / ListReviewMode onboarding card, on auction catalogs · **Status:** Open
- **Detail:** When screening auctions, the descriptions of each response
  should distinguish *watch* from *save*. Mark's wording:
  - **Swipe Yes** → "watches you want to watch"
  - **Heart** → "watches you want to save and are very interested in"
  - **Pass** → "not interested"
- **Hypothesis:** The copy lives in `OnboardingCard` →
  `ListReviewMode.js:1133–1144` (the one-time intro), currently: Yes =
  "Watches you want to consider", Pass = "Not for you", Heart = "tap to save
  to your watchlist. Independent from this list." `OnboardingCard` isn't
  mode-aware today (takes `ownerName, total` only). Fix = thread the screening
  context/mode in and swap to auction-specific lines when screening an auction
  catalog. Consistent with the binary Yes/Pass + heart model
  ([[reaction-context-lives-in-lists]]) — this is wording only, not new
  reactions. Note the intro is gated one-time per browser
  (`screening_intro_seen_v1`), so test with that key cleared.

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

### B-04 — "Take a break" interstitial fires too early (25 → 50)
- **Reported:** 2026-05-24 · **Severity:** 3 (tuning) · **Surface:** Screening / ListReviewMode break interstitial · **Status:** Open
- **Detail:** While screening, the "Take a break?" prompt appears after 25
  cards. Mark wants it after **50**.
- **Hypothesis:** One-line change — `BREAK_INTERVAL = 25` →  `50` at
  `ListReviewMode.js:12`. The break logic (`Math.floor(idx / BREAK_INTERVAL)`,
  L149) already generalises, so it'll then fire at 50, 100, 150… Relates to
  [[feedback-screening-long-queues]] (natural-break cadence for long auction
  catalogs).

### B-05 — Saved auction catalogs need house + date, not just title
- **Reported:** 2026-05-24 (screenshot) · **Severity:** 2 (clarity) · **Surface:** Lists / Watchlist — auction-catalog rows (`type='auction'` collections) · **Status:** Open
- **Detail:** A saved auction in Lists/Watchlist shows only the catalog title +
  watch count (e.g. "Important Watches: Featuri…" 272 · "Important Watches"
  138). It should also show the **auction date** and **house name**. Motivating
  case from the screenshot: two catalogs both named "Important Watches" are
  indistinguishable — house + date disambiguates them.
- **Hypothesis:** Rows render in `CollectionsTab.js` `renderListRow`; the
  auction-catalog subtitle is just `${count} watch(es)` (L2426). The
  `type='auction'` collection currently stores **only** `name` +
  `sourceAuctionUrl` — **no house/date fields** (`getOrCreateAuctionList` /
  `get_or_create_auction_list` RPC, `supabase.js` L1613–1644). Two fix shapes:
  (a) **derive** house + date from the first lot in `itemsByColl[c.id]` (lots
  carry `auctionHouse` + a sale/end date) — frontend-only, no migration,
  lower-risk; or (b) **store** `house` + `sale_date` on the collection at
  creation (extend the RPC + a column) — cleaner but needs a migration shipped
  first (CLAUDE.md Supabase rule). Lean (a) unless the lots don't reliably
  carry both. Then append "· {House} · {date}" to the auction-row subtitle.

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

### B-07 — Test: olive bleed bar on Home (⚠ reverses a recent decision)
- **Reported:** 2026-05-24 · **Type:** UI experiment · **Severity:** 3 (polish) · **Surface:** Home masthead, mobile · **Status:** Open — needs Mark's call given the conflict below
- **Detail:** Mark wants to test making the Home "bleed bar" (the band holding
  the main tabs + search under the wordmark) the same dark olive as the other
  tabs' top/bleed bars.
- **⚠ Conflict with a recent explicit decision:** On **2026-05-22** Mark said
  *"undo the green on the landing page. remove green altogether"* (PR #450's
  olive Home was pulled back). The current design is deliberate — see
  `HomeTab.js:47–51`: "Home is the editorial moment; the colored chrome zone
  lives only on Listings/Watchlists/Collecting where it's an identity cue, not
  on Home." This test partly reverses that. Worth confirming the intent
  changed before building.
- **Hypothesis:** This is narrower than the reverted change — it's just the
  tabs/search band, not the `EditorialHero` (which stays neutral by design).
  The band bg is set in `MobileShell.js` Row 2 (`var(--bg)` on Home, olive
  elsewhere — ~L186–187) + the `HomeSearchBar` band in `HomeTab.js`. A test =
  swap those to `var(--brand-olive)` for Home. Cheap to try and revert.

---

## Resolved

_(none yet)_
