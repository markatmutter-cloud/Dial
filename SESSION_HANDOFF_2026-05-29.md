# Watchlist — Session Handoff (2026-05-29, UI tidy + polish batch)

Conventions: [CLAUDE.md](CLAUDE.md). Direction: [ROADMAP.md](ROADMAP.md).
History: [SHIPPED.md](SHIPPED.md). Backlog: [BUGS.md](BUGS.md). Prior
handoff (2026-05-28) superseded — recoverable via git.

## TL;DR
A listening/batching session: Mark fired reactions while testing the live
build, a parallel session handled typography. **7 PRs total merged**
(#670–#676), CI green, working tree clean, no open PRs.

## What shipped (this session)

- **CardStrip scroll smooth (#670).** Dropped the laggy React-state custom
  thumb (drove setState every scroll frame + eased 0.06s → trailed the
  scroll). Affordance is now right-edge fade + peeking next tile. Snap
  `mandatory → proximity`. Zero scroll jank.
- **Shared SubTabBar component (#671).** All underline sub-tab rows now share
  one component (`src/components/SubTabBar.js`). The Lists-page section-nav
  was hand-rolled at a different font size/weight/underline — unified. Works
  for real tab-switchers and jump-to-section nav alike; surface chrome
  (`containerStyle`) varies per caller.
- **Articles: date pill left of search (#672).** Sort/Date pill reordered
  ahead of the search input in the Editorial filter row.
- **Listings: search bar stable across sub-tabs (#673).** On desktop the
  Calendar pill only appeared on Auctions/Sold, widening the left cluster and
  shoving the centered search bar right. Ghost-pill reserves constant width on
  all three sub-tabs; search stays put.
- **Account menu: unified left edge, drop "Settings" label (#676).** Sign-out /
  Site-stats / settings block all now share one 8 px left inset. Removed the
  redundant "Settings" umbrella that duplicated + clashed with
  Currency/Theme/Columns.
- **B-26 fixed (#674, parallel session).** Richard Mille mis-branded as Enicar
  via "002" ref collision fixed in `merge.py`; share-URL leak in Listings grid
  also resolved.
- **B-18 fixed (#675, parallel session).** FX parity guard — CI-enforced test
  asserts `merge.py` FX table matches `utils.js` FX_RATES_USD_PER.

## Mental model — so it's not relitigated

- **One sub-tab component** (`SubTabBar.js`) for all underline rows. The
  Reference page chip-bar (`innerToggleButton`) is a deliberately different
  look — not SubTabBar.
- **CardStrip scroll affordance = fade + peek, no thumb.** Don't re-add a
  custom scrollbar; the fade is intentional.
- **Account-menu left edge = 8 px** (all rows). "Settings" umbrella label
  deliberately removed — the hairline divider marks the section break.
- **Calendar pill ghost** (invisible `visibility:hidden` placeholder on
  Listings/Live) is load-bearing — it keeps the search centered. Don't remove
  it without re-solving the centering.

## ⭐ PARKED DECISIONS (from last session, unchanged)
1. **"Collecting" → "Explore"?** Keep Collecting or go Explore — NOT "Reference(s)".
2. **"Lists" collision.** Both the `watchlist` tab and the `collections` sub-section
   are labelled "Lists". Rename one if confusing in-app.
3. **Home-icon colour** on non-olive surfaces (currently white-only).

## Open backlog highlights (BUGS.md)

- **B-37** — can't heart/add-to-list from article or reference pages (fast-follow).
- **B-22** — code-split phase 2 (receivers, EditorialView, SizeCompare, ChallengeFlow).
- **B-34** — re-run PageSpeed mobile + lazy-load ReferencesTab subtree.
- **B-16** — JS lockfile (needs Node).
- **B-19** — RLS DDL not version-controlled.
- **B-20** — two near-identical scraper filenames.
- **B-23/24/25** — residential scrape install still pending with Mark on the laptop.
- **B-31** — Auctions strip cards misaligned in search results.
- **B-32** — Home content strips (recently added · articles · sold · hearted · auctions).
- **About modal overhaul** — plan-mode thread, pairs B-14 (BRAND.md review). Not
  batched here — needs content + design pass together.

## Loose ends

- **No open PRs.** All 7 merged; CI green.
- **Local branches to clean** (all squash-merged, safe to delete):
  `articles-datepill-left`, `listings-search-stable`, `settings-menu-tidy`,
  `subtabs-shared-component`, `b26-richard-mille-brand`, `fix-share-leak-brand-grid`
  — run `/tidy` next session.
- **Two worktrees** from the parallel session still alive:
  `watchlist-b18` (`b18-fx-parity`) + `watchlist-tidy` (`rm-phillips-known-auctions`).
  Neither is this session's — leave for `/tidy`.
- **B-28** (editorial vintage filter) — log-only, unchanged.

## Bottom line

The chrome is now coherent: one sub-tab component, no laggy scroll thumb,
search bar stable, account menu aligned. Three small naming decisions still
parked for Mark. About modal is the one sizeable open thread — plan-mode when ready.

---

## ADDENDUM — platform-health batch (2026-05-29, later)

Ran B-16/18/19/22/26/27 (Epic B audit-remediation). **4 PRs merged
(#675, #677, #678, #679); 2 deferred.** CI green, tree clean, no open PRs.

### Shipped (all merged — detail in SHIPPED.md / BUGS.md)
- **B-26 (#674 code + #679 data).** Richard Mille "RM 002-V2" was undetected
  as a brand → matcher matched bare "002" to Enicar ref 002 → `brand: Enicar`.
  Added "Richard Mille" to `merge.py` BRANDS + `utils.js` FRONTEND_BRANDS (the
  cross-pollination guard then rejects it) + fixed cached `lastBrand`. **The
  `/share/…` link was a red herring (the listing's own id) — no privacy leak.**
- **B-18 (#675).** FX parity pytest — fails if `merge.py` FX ↔ `utils.js`
  FX_RATES_USD_PER drift.
- **B-19 (#677, APPLIED TO PROD + verified).** Idempotent enable-RLS for the 4
  dashboard-made user tables (provability) + tightened `listing_events` insert
  to `user_id is null or = auth.uid()` (was `true` — forge hole). Migration
  applied live via MCP; verified the old "Anyone insert" policy is gone.
- **B-27 pass 2 (#678).** Deleted orphaned `SubTabIntro.js`; marked
  `useLastVisit.js` DORMANT (planned pulse consumer). An automated dead-code
  finder mis-called 3 of 6 (Eyebrow = forward prep, windvintage = settled keep,
  ListReviewMode = live) — filtered against plan-context before acting.

### Deferred (Mark's call this session)
- **B-22 (code-split phase 2)** — hold until Mark can verify in-app; a
  `React.lazy` export slip could white-screen and there's no local Node/CI-only.
- **B-16 (JS lockfile)** — confirmed `npm`/`node` absent on the machine (builds
  are all cloud); not worth a toolchain install for non-urgent hardening.

### Notes / mental model
- **`merge.py` FX (line ~339) and `utils.js` FX_RATES_USD_PER are now drift-
  guarded** — change a rate in BOTH or the test fails.
- **`listing_events` insert is now own-or-anonymous** in prod — don't re-widen
  to `with check (true)`.
- **B-31/B-32**: Mark said "B-31/32/33 all done" verbally; B-33 = #670 confirmed,
  B-31/B-32 PRs not identified — flagged in BUGS to verify + close at /tidy.
- **Process lesson:** working a platform-health batch *concurrently* with the UI
  session in the **same checkout** caused branch thrash (a commit landed on the
  wrong branch; a scrape commit clobbered a data fix). Moved all my work into
  **isolated git worktrees** after that — clean from then on. (See LEARNING.)

### Loose ends
- **No open PRs.** All 4 platform PRs merged.
- **Temp worktrees removed** (b18/b19/b27/b26b). `watchlist-tidy`
  (`rm-phillips-known-auctions`) remains — pre-existing, for /tidy.
- **Merged local branches** from this batch cleaned at close (see git).
