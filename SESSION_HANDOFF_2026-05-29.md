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
