# Watchlist — Session Handoff (2026-05-27, screening collapse + auction redesign)

Conventions: [CLAUDE.md](CLAUDE.md). Direction: [ROADMAP.md](ROADMAP.md).
History: [SHIPPED.md](SHIPPED.md). Backlog: [BUGS.md](BUGS.md). Plan archive:
`.claude/plans/declarative-drifting-bonbon.md` (Phase 4 plan). Prior handoff
archived to `archive/SESSION_HANDOFF_2026-05-26.md`.

## TL;DR — a marathon: 24 PRs (#598–621), all merged + CI-green, branches deleted
Two big arcs + ~10 live-polish rounds.

**1. Screening collapse (#598–603 + #602).** The swipe screener is now **binary
skip/heart**: swipe right = heart→watchlist, left = skip (records nothing); Undo
reverses a save. The **entire collaborative-reaction system is GONE — code AND
data**: `collection_item_reactions` table + 3 RPCs (`list_item_reactions`,
`list_reaction_counts_for_user`, `my_reactions_with_items`) + `get_or_create_auction_list`
were **DROPPED from prod** (PR4 migration `supabase/schema/2026-05-26_drop_reaction_substrate.sql`,
applied via MCP); 191 reaction rows + 3 auction-type collections + 740 items
deleted. Removed from the frontend: the To-review/Loved/Liked/Passed buckets,
per-card 👍/❌ rating, `ReactionAggregateChips`, the "My reactions" Saved row +
`MyReactionsView`, realtime sub, the 4 supabase fns. Lists render a **flat grid**;
shared lists get a **"Screen"** button. **Do NOT reference** `reactionsByItem`,
`toggleReaction`, `onRate`/`myRating`, sentiment buckets, or `collection_item_reactions`.

**2. Auction redesign — Phases 1–4 (#604–617) + cover foundation (#619).**
- **Grid**: flat (no per-sale dividers); **closing-time date headers** back
  (Ending now / Closing today / tomorrow / this week / month / Later). A single
  **house · title · date · N lots** header shows only when filtered to one sale.
- **Calendar = modal** (not a sub-tab) — **auto-opens on first Auctions visit**
  per session; brand-olive header; launched by a **Calendar pill far-left** on
  the filter row. Sub-tabs now **Listings · Auctions · Sold** (4→3). The Sale
  filter pill is gone (the modal IS the sale-picker; `filterSaleUrls` + the
  Active-Filters chip remain).
- **Cards**: image-forward, fixed-size/uniform, `imgSrc(a.image || top-lot →
  colored placeholder)`. Month-jump nav (sticky; Archive→"Closed" pinned right).
- **Heart/save a sale** → `saved_auctions` table (mirrors `tracked_lots`, RLS) +
  Hearted filter + a **"Saved auctions"** row in Watchlists (`useSavedAuctions`).
- Dates show the **year** now.

## ⭐ NEXT PICKUP — cover-image scraping, remaining 5 houses
Frontend + plumbing are DONE: `merge.py process_auctions` reads/emits `image`;
the calendar prefers `a.image` over the top-lot hero. **Christie's shipped** (#619)
as the pattern — its `__NEXT_DATA__` ships `ImageUrl` (host not hot-link-protected,
no proxy needed). **Remaining: Antiquorum, Bonhams, Monaco Legend, Phillips,
Sotheby's** — each needs per-house cover extraction (Phillips calendar is
client-rendered / no static covers; Sotheby's CDN is hash-signed; Bonhams runs on
the residential host). Each adds an `image` column to its `*_auctions.csv`; verifies
only on a live `scrape-auctions` run. **Christie's covers populate at the next
`scrape-auctions` (06:00 UTC) or a manual `gh workflow run scrape-auctions.yml`** —
not yet visible on prod until then.

## Other open threads (don't lose)
- **B-26** share-link leaks into brand-filtered Listings (held).
- **B-27** inert-code visibility scan + `DORMANT` marker convention.
- **B-16** JS lockfile · **B-18** FX drift · **B-19** RLS versioning · **B-20**
  scraper rename — audit-track, open.
- **Heritage** developer API (Mark to register a key); **Phillips essays**
  (CI-WAF-blocked, testable via the residential host).
- Reference-page follow-ups (synthesis prompt tightening, browse index, gap
  backlog) — see ROADMAP NOW #2.

## Operating note
The laptop launchd agent pushes "Bonhams lots refresh" commits to `main` a few
times/day — expected (`scripts/RESIDENTIAL_SCRAPE_SETUP.md`). The calendar modal
auto-opens once per browser session on the Auctions sub-tab (sessionStorage
`auctions_calendar_autoopened_v1`).

## Bottom line
Clean close: main synced, no open PRs, no stranded branches, tree clean. Screening
is binary + reaction-free (DB clean); the auction surface is fully redesigned
(grid + calendar modal + heart/save + covers-ready). Next: finish cover scraping
for the other 5 houses, then trigger a scrape to see covers live.
