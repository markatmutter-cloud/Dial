# Session handoff — 2026-06-06

**One-line:** Two new comprehensive auction houses + a one-off Hodinkee
articles pipeline + B-58/B-62 scraper fixes (Watch Center silent block,
WoK post-sale hammer-price recovery).

## What shipped

Nine PRs, all merged into main:

- **#805 / #806** — Chrono24 references: Omega Seamaster 145.006 +
  Heuer 1153 added to `chrono24_lots_scraper.REFERENCES`.
- **#807** — **B-58 Watch Center silent CI block** fixed via curl-cffi
  Chrome impersonation. Spotted by Mark ("Watch Center doesn't seem to
  have many new updates"); audit found the scraper had been errno-101'ing
  every cron for 6 days, silently swallowed by `continue-on-error: true`.
  Also logged **B-59** (Watch Club chronic truncation-abort, log-only)
  and **B-60** (silent-fail notifier gap — the meta-bug behind B-58).
- **#808** — **Watches of Knightsbridge: 7th comprehensive auction
  house.** Metropress / ab-initio platform, server-rendered HTML, ~60
  lots per sale inline. Same pattern as the existing 5 + Bonhams. Heat
  Wave (Jun 6 2026, 60 lots) live-tracked.
- **#809** — **Marteau & Co: 8th comprehensive house.** Geneva Tandem
  Auctions platform, contemporary independents (Daniel Roth, Furlan
  Marri, F.P. Journe, MB&F). CHF with U+2019 thousands separator.
  Previous 2 sales (Echo + First Strike, 55 lots / 53 with realised
  prices) one-shot backfilled because they're outside the orchestrator's
  30-day past window.
- **#810** — **Hodinkee Picks**: curated one-off articles pipeline.
  `data/hodinkee_picks_urls.json` — paste a URL, next editorial cron
  picks it up. Mirrors the existing Christie's Stories pattern. Seeded
  with the James Stacey Tudor-collector meet-up piece.
- **#811 + #812** — **B-62 WoK post-sale hammer-price recovery.** Mark
  spotted that yesterday's Heat Wave lots still showed only the original
  estimate. Initial hypothesis (login-gated) was wrong — the parallel
  `/past-auctions/<slug>` archive surface exposes `data-current-bid`
  publicly. Enumerator now fetches both URLs, merges hammer by lot UUID,
  and falls back to prior `auction_lots.json` for fields the post-sale
  grid strips (estimate, description). Heat Wave: **46 sold, GBP 127,700
  realised**, 14 unsold. New `lot_outcome` field — `sold`,
  `sold_price_withheld`, `unsold`, `active`.
- **#813** — **Cold usability audit (C+).** First-time-user walkthrough
  + findings routed.

## State on close

- 8 comprehensive auction houses (Antiquorum, Bonhams, Christie's,
  Marteau & Co, Monaco Legend, Phillips, Sotheby's, Watches of
  Knightsbridge).
- 46+ dealer sources; the 3-stale "no commit in >1 week" trio
  (thevintagewatch, classicheuer, ssongwatches) audited as healthy
  slow-rotation (byte-identical CSVs).
- Hodinkee corpus now has 3 surfaces: Bring a Loupe, Reference Points,
  **Hodinkee Picks** (curated).
- B-62 fully resolved. B-58 fixed. B-59 / B-60 open (log-only and CI
  observability respectively).

## Coaching note for the close

The session had two recurring patterns:

1. **"I missed something" → it was actually there.** PR #811 stamped 60
   WoK lots "hammer withheld" because I assumed a login gate from the
   live URL's stripped HTML. Mark's "the link isn't working anymore"
   comment was the hint that the live-bidder URL was dead post-sale, but
   the public archive URL had the prices the whole time. **One probe of
   `/past-auctions/<slug>` would have caught this on day one** —
   surface-coverage check should be habit when a primary surface looks
   gated.
2. **PR #811's "fix" silently regressed estimates.** A re-scrape of an
   ended sale lost the pre-sale estimates because WoK strips them from
   sold lots' grid blocks post-close. PR #812 added a prior-record
   fallback (`prior_by_url`) — small change, broad protection against
   "post-sale re-scrape regresses fields we already had."

## Open in-flight

None blocking. The follow-up surfaces queued from earlier sessions are
unchanged.

## Don't bump (storage keys)

`LEGACY_WATCHLIST_KEY`, `LEGACY_HIDDEN_KEY`, `dial_watch_anon_id`,
`dial_collections_sub_tab`, `dial_listings_sub_tab`,
`dial_watch_top_tab`. (Carried forward.)
