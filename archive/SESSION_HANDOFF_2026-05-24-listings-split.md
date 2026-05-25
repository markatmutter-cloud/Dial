# Watchlist — Session Handoff (2026-05-24, listings-split session)

For working conventions, see [CLAUDE.md](CLAUDE.md). For roadmap, see
[ROADMAP.md](ROADMAP.md). Durable rules graduate to CLAUDE.md; durable
direction graduates to ROADMAP.md. This is the in-flight snapshot.

> Third session of 2026-05-24. Earlier today: scrape-reliability (10 PRs,
> archived as `archive/SESSION_HANDOFF_2026-05-24-reliability.md`) and the
> doc-system reset (`personal/SESSION_HANDOFF_2026-05-24-docreset.md`,
> gitignored). This session = the listings.json live/sold split.

## TL;DR

Shipped **PR #542 — listings.json live/sold split, Phase 1.** Merged to
main, deployed, production-verified. First-paint payload **4.15 MB →
2.93 MB (~29% lighter)**; the sold half now loads lazily after first paint.

- `merge.py` `split_live_sold()` writes `listings_live.json` (3,613) +
  `listings_sold.json` (1,785) alongside the full `listings.json`.
- `App.js` fetches live eager (critical path), sold lazy-appended
  (deduped against live + manual historical).
- Full `listings.json` deliberately **kept** → backend tools
  (verify_sources, reference matcher, health) + stale-cached PWA bundles
  untouched = zero pipeline risk. Split files pre-generated & committed so
  the new bundle can't 404 on deploy.
- pytest 16 ✅ (new partition test) · jest ✅ · Vercel ✅ · prod serves
  both files 200 with correct counts.

## ⭐ NEXT FOCUS (Mark's pre-sleep request)

**Top of the list: Phase 2 of the listings split** — Mark explicitly asked
to be reminded. Once deployed PWA bundles have cycled (give it a few days /
a couple of scrape commits so phones refresh), point the 5 backend
consumers at the splits and **drop the duplicated `listings.json`** to kill
the ~+4 MB/commit cost:
- `verify_sources.py` (CRITICAL — runs in the scrape workflow; test
  locally after a merge before trusting)
- `reference_index_match.py`, `reference_survey.py`, `purge_ebay_junk.py`
  (manual tools — lower risk)
- `health.py` (point staleness check at `listings_live.json`)
- Best done via a tiny shared loader (`load_all_listings()` reading both
  splits) so the "read both" logic lives in one place.
- Also delete `public/listings.json` and drop its `git add`/write paths.
Low-risk by then since nothing fetches the full file. Tracked in ROADMAP.

If Phase 2 feels premature (bundles not cycled yet), good alternatives:
- **Hide-regression verify** — Live-auction cards reportedly lost the hide
  feature (carried, quick).
- **Mobile Sale filter chip** — desktop got it (#525), mobile drawer didn't.
- **Reference page pilot (Epic 0)** — GMT 1675 / Speedmaster 145.022 /
  Sub 5513 — first step into the collecting-intelligence era (ROADMAP #1).

## Carried-forward queue

| Item | Notes |
|---|---|
| **listings split Phase 2** | See NEXT FOCUS. Mark-requested reminder. |
| **History rewrite** (from doc-reset) | Purge `personal/` docs + family-name scrub from git history; re-point `doc-review-restore-point` tag; force-push (Mark's action). EXCLUDE dealer-CSV celebrity refs. ~15–30 min. |
| **Hide regression verify** | Live-auction cards "don't have the hide feature anymore". |
| **Mobile Sale filter chip** | Parity gap vs desktop #525. |
| **Reference page pilot (Epic 0)** | Pick one model line; ROADMAP priority #1 (collecting intelligence). |
| **Sotheby's bulk archive** | Unblocked (#539); needs a URL list from Mark. |
| **Backfill desc on existing hearted items** | #538 only restores desc for new hearts. |
| **Open decision** (doc-reset) | Move all handoffs to `personal/` + repoint `/start` `/wrap`? For now they stay at root so `/start` sees them. |
| **Matrix workflow → cron** | One-line PR each direction; swap when Mark wants the speed bump on the daily pipeline. |

## Notes worth keeping

- **Static data file the frontend fetches must ship committed in the same
  PR**, or the new bundle 404s on deploy (eager fetch → white screen). For
  the split, the files were pre-generated from the current `listings.json`
  and committed. Same spirit as the Supabase "ship the migration before the
  JS" rule, applied to static JSON.
- **Phase-1-keep-the-old-file** is the safe migration shape when both
  backend tooling and stale PWA bundles read a file you're restructuring:
  keep the old file, add the new ones, cut over the frontend, drop the old
  file later once clients have cycled.

## Bottom line

Clean atomic ship. Working tree clean, on main, synced with origin. No open
PRs, no stranded branches (`listings-live-sold-split` squash-merged &
deleted). Next session: Phase 2 if bundles have cycled, else the
collecting-intelligence pilot or a quick carried-queue item.
