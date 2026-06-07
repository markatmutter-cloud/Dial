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

---

# Addendum — second session, 2026-06-06 (usability → design → speed)

**One-line:** Mark's live user test → cold usability audit (C+) → 21 PRs
merged same-day (#813–#833): sub-tab/segmented-control restyle, desktop
top-bar rework, audit quick fixes, admin article removal, the PageSpeed
remediation wave, responsive chrome ladder, past-sale catalogs.

## The arc

1. **Field test → audit.** Mark watched a target-competency user fail to
   find Sold (tapped filter pills when told "click the subtab", feared
   exploring). Cold audit #813 reproduced it on the live site; findings
   routed (report: docs/audits/2026-06-06-usability/ — repeatable via
   `walk.py`; playwright venv at /tmp/wl-audit-venv, recreate per README
   repro block).
2. **Audit fixes** #814–#817 (segmented sub-tabs + "For sale" · copy
   sweep · B-63 Escape · Saved empty state) and #820/#821 (Articles in
   Home search menu · visible search field).
3. **Desktop top bar** #818/#819/#822/#823 — tabs left, wordmark
   centered ≥1280, ⌂ leads the tab row at every width. TWO collision
   regressions shipped + fixed same-hour (see coaching notes).
4. **Speed** (Mark ran 8 PageSpeed reports): #825–#829 + #828 Maunder.
   Root cause: article images bypassed imgSrc. Page weight ~8.4→~3MB.
   Saved desktop now 68 with zero image/cache findings. Remaining gap =
   **B-22 JS split — the agreed next perf lever, needs Mark in-app.**
5. **#830 BREAK-NOW**: my #826 edit referenced `aspect` out of scope in
   CardImage → prod ReferenceError on every card. Root: shells' jest
   tests render MOCK grids; CardShell had zero direct render coverage.
   Fixed + CardShell.test.jsx added + CLAUDE.md rule.
6. **Calendar**: #831 house-logo stand-ins (mechanism live, **logo files
   pending Mark** — 8 slugs in public/logos/README.md) and #833
   past-sale catalogs ("View results →").

## Open threads / next session

1. **Dispatch layer (Epic 9 Phase 2) = the agreed next big build** —
   audit's headline finding; plan-mode session with Mark on card content.
2. **B-22 JS split** = the next perf lever (own session, Mark verifying
   in-app surface by surface; report names CollectionsTab/ChallengeFlow/
   151KB unused as first targets).
3. **House logos**: Mark collecting 8 SVG/PNGs → drop in public/logos/.
4. Optional perf: precomputed `home_articles.json` slice (~3MB off Home
   idle load; scraper-side).
5. **wok-post-sale-state branch carries an UNMERGED WIP commit**
   (ccee761, B-62 archive-hammer follow-up superseded by #812? verify
   against main before deleting — don't let it orphan silently).
6. Audit deferred offers: moderated-test kit for Mark's next user
   sessions; LOUPE THIS verb-shaped source labels (Mark's call); guide
   title flip E2643→human name (Epic 5 template).

## Coaching notes (for LEARNING)

- Mark's first real user test produced the season's best design input —
  the observation was specific, behavioral, emotionally precise.
- Two of my regressions shipped because I edit render paths I can't
  execute; the durable fix (direct render tests for blind-edited
  components) is now a CLAUDE.md rule.
- Mark drove design iteration tightly (wordmark→center, house→front of
  tabs at every width) — three rounds to the right answer, each round
  shipped within minutes.
