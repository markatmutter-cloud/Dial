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

### B-14 — BRAND.md review (Plan thread)
- **Reported:** 2026-05-24 (`Plan:`) · **Type:** Plan-mode thread, not a bug · **Status:** Queued for a coming session. Mark wants a review of `BRAND.md` (voice/brand). Pairs naturally with the card design system's "breathing-space & brand impact" dial — brand voice + visual brand expression. Surface at a replanning step.

### B-16 — Dependencies unpinned (no lockfiles, JS + Python)
- **Reported:** 2026-05-24 · **Source:** `audit:2026-05-24` · **Severity:** 2 (reliability + supply-chain) · **Surface:** build / CI / workflows · **Status:** Open
- **Detail:** No `package-lock.json`; workflows `pip install` latest unpinned. A build that works today can break tomorrow with no code change, and it's a supply-chain exposure (updates run with the scrapers' secret keys). Cheapest high-leverage fix in the audit.
- **Fix:** commit `package-lock.json` + `npm ci`; pinned `requirements.txt` + `pip install -r`; turn on Dependabot. Detail: `findings-maintainability.md` (HIGH-1), `findings-security.md` (MED-2/3).

### B-21 — Service-worker JSON regex out of sync with post-split feed filenames
- **Reported:** 2026-05-24 · **Source:** `audit:2026-05-24` (H2; split from B-17) · **Severity:** 2 (offline / freshness) · **Surface:** `public/service-worker.js` · **Status:** Open
- **Detail:** `isJsonData()` matches only `(listings|auctions|tracked_lots|state|auctions_state).json`, so the post-split feed files the app actually fetches (`listings_live/_sold/_desc`, `auction_lots`, `loupethis_lots`, `hairspring_finds`, `hodinkee_shop`, `manual_archive_lots`) fall through to pass-through — no offline fallback for the primary feed, and the SW freshness guarantee no longer applies (works today only because App.js sets `cache:"no-cache"`). Silent drift since the live/sold split.
- **Fix:** broaden the regex to the current filenames; add a test asserting every App.js feed URL matches a SW rule. Detail: `docs/audits/2026-05-24-vibe-code/findings-frontend.md` (H2).

### B-18 — Currency FX tables duplicated, can silently drift
- **Reported:** 2026-05-24 · **Source:** `audit:2026-05-24` · **Severity:** 2 (price correctness) · **Surface:** `merge.py` + `utils.js` · **Status:** Open
- **Detail:** Exchange rates are hardcoded in two places that must match, with nothing enforcing it. Drift → silently wrong prices (the "8× off" class) and fabricated "biggest price drops" feeding the deals sort.
- **Fix:** single source of truth, or a parity test that fails if the two disagree. Detail: `findings-correctness.md` (F2/F9), `findings-data.md` (H4).

### B-19 — 5 user-data tables' RLS state not version-controlled
- **Reported:** 2026-05-24 · **Source:** `audit:2026-05-24` · **Severity:** 2 (security provability) · **Surface:** Supabase / migrations · **Status:** Open
- **Detail:** `watchlist_items`, `hidden_listings`, `saved_searches`, `tracked_lots`, and the base collections/challenges table have correct policies in the repo but **no committed CREATE / enable-RLS** — so "RLS is on" can't be proven from code, and a dashboard change could silently disable it (private → world-readable). No active leak found; this is a provability + regression-safety gap. Also: the `listing_events` insert policy lets a client forge `user_id`.
- **Fix:** commit DDL + `enable row level security` for the 5; tighten the `listing_events` insert policy. Detail: `findings-security.md` (HIGH-1, MED-1).

### B-20 — Two near-identical auction-scraper filenames
- **Reported:** 2026-05-24 · **Source:** `audit:2026-05-24` · **Severity:** 3 (footgun) · **Surface:** auction scrapers · **Status:** Open
- **Detail:** `auction_lots_scraper.py` (catalog walker) and `auctionlots_scraper.py` (tracked-URL tracker) differ by one underscore and both run in the same workflow — easy to edit the wrong one. Flagged independently by 3 auditors.
- **Fix:** rename `auctionlots_scraper.py` → `tracked_lots_scraper.py` + update importers/workflows. Detail: `findings-architecture.md` (M1), `findings-maintainability.md` (MED-4).

---

## Resolved

### B-17 — ~19 MB of non-critical JSON loaded eagerly on every app open · Fixed #577
- The mount effect fetched 5 heavy archive/auction sources (auction_lots 5.2 MB,
  loupethis 4.4 MB, hodinkee_shop 3.2 MB, hairspring_finds 1.7 MB,
  manual_archive_lots 1.1 MB) concurrently with the critical `listings_live`
  fetch, though they feed only the Auctions tab + the Sold-archive projection —
  never the default Listings>Live first paint. Deferred them past first paint
  via `requestIdleCallback` (timeout 2000 ms; `setTimeout(1200)` fallback),
  taking ~15 MB of fetch+parse off the mobile first-paint window. The
  service-worker-regex sub-item (H2) was split to B-21. Detail:
  `docs/audits/2026-05-24-vibe-code/findings-frontend.md` (C1).

### B-15 — Scrapers could silently mark a source's whole stock "Sold" on an empty scrape · Fixed #576
- An HTTP-200-but-empty/truncated scrape used to flip **every** previously-live
  item from that source to SOLD on the first miss (permanent, in the archive),
  with no alert because every workflow step is `continue-on-error`. Fixed with a
  central debounce in `merge.update_state`: a listing must be absent from
  `DISAPPEARANCE_MISS_THRESHOLD` (=2) consecutive runs before flipping to sold —
  the first miss is held live (re-emitted from the state cache), and a seen run
  resets the per-entry `missCount`, so an every-other-run flap never flips.
  Protects all ~41 sources + future ones centrally (no per-scraper edits).
  Detail: `docs/audits/2026-05-24-vibe-code/findings-data.md` (C1).

### B-01 — Editorial filter chrome squashed on scroll (mobile) · Fixed #554
- EditorialView portals its filter chrome into a slot in the shell's sticky
  stack (`#editorial-filter-slot`) on mobile, so editorial's filters live in
  the same chrome as every other tab — no 2nd sticky layer squashing search.

### B-07 — Olive Home nav band (smooths Home → core-tabs jump) · Fixed #547
- Home masthead nav band (tabs + search) made full `--brand-olive` so Home ends
  in the same olive as the core tabs; the hero stays neutral.

### B-11 — See-through "divider gap" below the sticky chrome (recurring) · Fixed #552
- A sticky DateDivider sat *below* the desktop scroll pane's 14px top padding
  (Watchlist/Collecting at 0 never showed it). Zeroed the pane top padding on
  all tabs — removed at the root after years of band-aids. The broader
  shared-chrome unification stays a future item (see chrome-unification memory).

### B-13 — Grey band "in front of" the Search-all strips (esp. auctions) · Fixed #557
- The strip scroll container used `background: var(--border)` + 16/20px
  horizontal padding, so the edge inset rendered as a grey band before the
  first card. Most visible on the light-image auction cards; subtler on
  dark wrist/sold shots. Fixed by making the strip background transparent (the
  inset is now page-colored), on all strips for consistency.

### B-12 — Search-all article cards looked different from the other strips · Fixed #556
- The Articles strip used a separate tile (`ArticleStrip`) with a 16/10 landscape
  image + no placeholder, while Listings/Auctions/Sold use the shared `Card`
  (square 1:1 image). Chose to **align the tile to Card's look** (not route
  articles through Card — articles are a genuinely distinct, price-less,
  external-link type; see CLAUDE.md consistency-principle nuance). Squared the
  image (1:1 + favicon placeholder, always rendered) and matched the title to
  Card (12px / 500 / 2-line). Strip-item widths already matched.

### B-09 — Search-all returned zero articles for any query (e.g. 5513) · Fixed #555
- **Real cause (my earlier "no bodies" hypothesis was wrong — bodies *were* being fetched):** the editorial meta files are **dict-keyed** (`{url: record}`) per the `editorial_corpus_io` split. `EditorialView` reads them via `Object.values`, but the **Search-all fetch in `App.js` did `if (!Array.isArray(arr)) return []`** — discarding *every* source. So Search-all had **zero articles for ANY query**; 5513 is just where Mark noticed. Fix: parse both array + dict shapes (`Object.values`), filtered to real records (`url` + `title`) like EditorialView. Body matching already worked once articles exist (`bodies[article.url]`, rec.url matches the bodies key).
### B-03 — Main tabs pinned on scroll (all tabs) · Fixed #550
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

### B-02 — Screening copy: auction catalogs distinguish watch vs save · Fixed #546
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
