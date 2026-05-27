# Watchlist — Session Handoff (2026-05-26, scrapers + residential host + auction overhaul)

Conventions: [CLAUDE.md](CLAUDE.md). Direction: [ROADMAP.md](ROADMAP.md).
History: [SHIPPED.md](SHIPPED.md). Backlog: [BUGS.md](BUGS.md). Rich plan
context in memory ([[project_auction_tab_redesign]], [[browse_ai]]).

(Earlier-today handoffs — reference-page pilot, vibe-code audit, Browse AI 403
incident — archived to `archive/SESSION_HANDOFF_2026-05-26-refpage-audit-browse403.md`.
The 403 incident is now *resolved* by today's direct TW scraper.)

## TL;DR — what shipped today (11 PRs, all merged + CI-green, branches deleted)
- **Browse AI fully retired.** Tropical Watch now has a direct `requests` index
  scraper (#586); reachable from CI (no residential host needed). Stale Browse-AI
  comments cleaned (#587). Sold-price history preserved (URL-hash IDs unchanged).
- **Bonhams lots, live on prod, via a residential host.** Found the
  `enumerate_bonhams` enumerator already existed but was dormant-in-CI
  (Cloudflare 403s datacenter IPs). New thin `bonhams_lots_scraper.py` →
  separate `public/bonhams_lots.json`, folded into the Auctions projection like
  manual_archive (#590). Adaptive throttle + launchd host (#591). One-command
  portable installer (#594). Non-watch sales (Espionage, dept≠WCH) filtered out
  (#593). The **launchd agent is installed + running on Mark's laptop** (verified
  end-to-end: scrapes + pushes under launchd).
- **Auction calendar:** house-filter chips (#595); **Phase 1A** — "View lots"/
  title click open the in-app grid **pre-filtered to that sale** (Auctions if
  live, Sold if past), keeping a subtle ↗ house link (#596).
- **Hygiene:** dormant-code `DORMANT` marker on `enumerate_bonhams`; B-24/B-25
  framing corrected; B-26 + B-27 logged (#592, #589).

## ⭐ NEXT PICKUP — auction-surface overhaul, screening simplification (Phase 1B+)
Full spec in memory [[project_auction_tab_redesign]]. Mark planned a 3-PR
screening collapse; **PR1 is fully specced + ready, not started:**
- **PR1 — reshape the swipe (`ListReviewMode`) to binary skip/heart.** Right =
  heart (save to watchlist); left = skip (records nothing). `⋯` menu → Share /
  Add to list. Remove (no orphans — Mark's hard rule): `recordReaction`,
  `handleYes/Pass`, `myReactionOnCurrent`, `cumulativeTally`, `sessionPassedSet`,
  `handleClearCurrent`, `RecapView` (results = the hearted filter), the dead
  `mode==="feed"` branches, `OnboardingCard`'s `isAuction`, unused props +
  **update the caller** (CollectionsTab). ~15 interlocking edits — do as ONE
  clean CI-verified pass (a half-done attempt was reverted this session).
- **PR2 — delete scaffolding + DB clean-slate.** Remove the Screening sub-tab
  (`ScreeningView` + `"screening"` in `REFERENCES_SUB_VALUES` + nav + ReferencesTab
  branch), the auction auto-list workflow (`getOrCreateAuctionList`, calendar
  Add/Review, CollectionsTab "Auction catalogs" group + `type==='auction'` →
  `screensEnabled = isSharedList`), and `pendingReviewListId` (orphaned once
  those go). **DB (show SQL + confirm — irreversible; Mark pre-authorized
  "clean slate"):** `DELETE FROM collection_item_reactions`; `DROP FUNCTION
  get_or_create_auction_list`; delete `type='auction'` rows + items.
- **PR3 — wire** the "Screen" button on shared lists (the existing
  `screensEnabled = isSharedList` gate already scopes it). Results = hearted filter.

Then the rest of the auction overhaul: **Phase 2** image-forward calendar cards
(top-lot image v1); **Phase 3** heart/save an auction (saved_auctions table +
Hearted chip + Watchlists "Saved auctions"; label = **House · Date**, truncate
title); **Phase 4** integrated Auctions tab (north star: a flat chip-filterable
sale layer — hearted/house/date — not per-sale silos; A-vs-B undecided).

## Other open threads (don't lose)
- **B-26** — share-link leaks into brand-filtered Listings (held by Mark; hypothesis logged).
- **B-27** — one-time inert-code visibility scan + `DORMANT` marker convention.
- **Heritage** — only fully-missing source; its **developer API** is the path
  (self-serve portal). Mark to register a key → then build (our first API source;
  4M realized-price archive). On ROADMAP Epic 2.
- **Phillips lot-detail/essays** — CI-WAF-blocked; now testable via the residential host.
- **Reference-page follow-ups** (from the archived handoff, still pending): P2
  a11y polish, desktop gutter-rail nav, reconcile `Eyebrow.js`, tighten the
  synthesis prompt.
- **B-16 JS lockfile**, **B-18 FX drift**, **B-19 RLS versioning**, **B-20**
  scraper rename — audit-track, open.

## Operating note
The laptop launchd agent pushes small "Bonhams lots refresh" commits to `main`
a few times/day while the laptop's on (hourly tick, scraper self-throttles).
That's expected. Manage it via `scripts/RESIDENTIAL_SCRAPE_SETUP.md` /
`uninstall_residential_host.sh`.

## Bottom line
Clean close. Main synced, no open PRs, no stranded branches, working tree clean.
Browse AI gone; Bonhams live via the residential host; auction Phase 1A shipped.
Next session: PR1 (swipe → skip/heart) as one clean pass.
