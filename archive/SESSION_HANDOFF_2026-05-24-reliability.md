# Watchlist — Session Handoff (2026-05-24)

For working conventions, see [CLAUDE.md](CLAUDE.md). For roadmap, see
[ROADMAP.md](ROADMAP.md). Durable rules graduate to CLAUDE.md;
durable direction graduates to ROADMAP.md. This doc is the in-flight
snapshot.

## TL;DR

**Scrape-pipeline reliability + observability session.** Mark woke
up to no scrape data for ~7h because Falco's products.json hit a
transient Shopify 503 and the scrape-listings.yml step had no
`continue-on-error: true`. That one missing flag killed the whole
batch — 40+ downstream scrapers, the merge step, and the commit step
never ran.

Diagnosed the immediate failure, then went through a structured set
of reliability / observability / performance improvements (PR α–ζ +
a few follow-ups). **10 PRs shipped, all merged.**

Six arcs:

1. **Immediate fix (#530)** — added `continue-on-error: true` to the
   5 scraper steps that were missing it (Wind Vintage, Menta,
   Collectors Corner NY, Falco, Tropical Watch) + a 3-attempt
   exponential-backoff retry on Falco's `fetch_page` for transient
   5xx.

2. **Reliability — shared retry helper (#531, "α")** — lifted
   Falco's inline retry into `scraper_lib.fetch_json_with_retry` and
   applied it to every Shopify products.json scraper (14 dealers
   total: analogshift, belmont, bulangandsons, collectorscorner,
   craftandtailored, falco, hairspring, huntington, oliverandclarke,
   somlo, ssongwatches, swisshours, thevintagewatch,
   vintagewatchfam). When a Shopify fetch raises, merge.py's
   disappearance logic marks every previously-tracked item as sold —
   for Analog Shift that's 624 items, Vintage Watch Fam 424. The
   retry kills this entire class of "single 503 wipes the source"
   failures.

3. **Observability (#532 β + #533 γ + #535 ε)** —
   - `health.py` one-command CLI: workflow failures per workflow
     (last 20 runs via `gh`), `verify_sources.py` alerts, flapping
     sources detection, data freshness.
   - `notify-scrape-failure.yml` workflow: listens for completion of
     every scrape workflow, auto-opens a GitHub Issue (labelled
     `scrape-failure`) on failure; auto-closes on the next success.
     Dedupes by title so recurring failures comment on the open
     issue rather than spamming.
   - `verify_sources.py` + `verify_auction_lots.py` now emit
     `updated_at` ISO timestamp. AdminTab + health.py render
     "Updated 2h ago" (normal) / "STALE — last run 14h ago"
     (danger, bold) above 12h. Wired AdminTab fetch for
     `/verification_lots.json` (previously not loaded).

4. **Watch Club flap fix (#534 δ)** — Watch Club's catalog
   (`watchclub.com/upload/js/watches2018_bis.js`) intermittently
   served a truncated subset on certain GitHub runner IPs:
   `[16, 54, 15, 15, 52, 15]` over recent runs. Caused items to
   ghost into Sold then reappear as new every other day. Fix: if
   parsed count is <50% of prior good run AND <25 items, abort the
   write — workflow's `[ -f X ] && mv ... || echo missing` leaves
   the prior CSV in place so merge.py keeps the old state.
   Root cause is upstream Cloudflare cache state, not fixable
   client-side.

5. **Performance — matrix-parallelized scrape workflow (#536 ζ)** —
   New `.github/workflows/scrape-listings-matrix.yml` fans out all
   40 dealer scrapers as parallel matrix jobs + aggregate job that
   downloads every CSV artifact and runs Hairspring Finds + merge +
   verify + commit. **Confirmed real-world wall-clock: 16m 20s vs
   the sequential 33-40 min** — ~2× speedup. Intentionally
   `workflow_dispatch` only for now so the daily cron stays on the
   battle-tested sequential workflow. One-line PR each direction to
   swap once Mark wants it as the cron.

6. **Quality-of-life follow-ups** —
   - **FilterRow primitive (#537)** — extracted shared
     `src/components/FilterRow.js` so Listings + Editorial filter
     rows can't drift apart again on subsequent edits.
     (Pinned refactor from the 2026-05-22 evening handoff.)
   - **desc-restore for hearted dealer listings (#538)** — PR
     #437's `desc:""` zeroing meant hearted listings lost their
     description forever once the dealer pulled the page. Fix:
     `merge.py` emits `public/listings_desc.json` sidecar (id →
     desc); App.js lazy-fetches it after first paint; `handleWish`
     hydrates desc into the snapshot at heart-time. Initial paint
     stays slim; descriptions for new hearts are preserved.
   - **Sotheby's archive support (#539)** — `manual_archive_scraper`
     gains a `sothebys.com/en/buy/auction/` URL-fragment branch
     re-using `enumerate_sothebys`. Closes the gap where Sotheby's
     had 0 ended lots in `auction_lots.json` (vs 200-550 for other
     houses) because their calendar scraper only exposes upcoming
     sales.

## PRs shipped this session

| PR | Title | Theme |
|---|---|---|
| #530 | Scrape listings: continue-on-error on all steps + Falco retry | Hotfix |
| #531 | scraper_lib: shared fetch_json_with_retry helper for Shopify scrapers | Reliability |
| #532 | health.py: one-command scrape + verification health check | Observability |
| #533 | notify-scrape-failure: open GitHub Issue on scrape failure | Observability |
| #534 | watchclub: skip CSV write on suspicious low-count snapshot | Bug |
| #535 | verify_sources + AdminTab: updated_at timestamp + STALE freshness signal | Observability |
| #536 | scrape-listings-matrix: parallel matrix workflow (manual dispatch) | Performance |
| #537 | FilterRow: extract shared primitive (Listings + Editorial) | Refactor |
| #538 | Restore desc for hearted dealer listings via lazy sidecar | UX |
| #539 | manual_archive_scraper: support Sotheby's URLs | Backend |

**10 PRs landed.**

## Architectural decisions worth keeping in mind

### scraper_lib is opt-in, not a driver

`scraper_lib.fetch_json_with_retry` is the FIRST helper to land in a
shared scraper module. Per CLAUDE.md scraper conventions, this is
opt-in only — per-dealer files still exist and own their quirks
(Bulang collection-scoping, Falco's nonstandard fields,
Cloudflare-vs-not, etc.). Adding driver-style "one config-driven
script for all Shopify dealers" was explicitly rejected before and
still is. The helper is for boilerplate that is GENUINELY identical
across sources — retry-on-5xx is one such case. If a future helper
is tempting, ask: "is this truly identical across all sources, or
am I about to absorb meaningful per-source variation?" The latter
belongs in the per-dealer file.

### `health.py` is the read-only diagnostic

Run `python3 health.py` to get a one-screen view of:
- Workflow run failures (last 20 runs per scrape workflow)
- `verify_sources.py` alerts
- Flapping sources (>25% variance across 6 recent runs — catches
  Watch Club-style oscillation that the median-only DROP_THRESHOLD
  misses)
- Data freshness (from `updated_at` in verification.json + git log
  on listings.json)

Exits 0 if clean / 1 if issues. Read-only, never mutates. Use it
before reaching for the Actions UI.

### Failure → GitHub Issue path

`notify-scrape-failure.yml` listens for `workflow_run` completion on
every scrape workflow and opens (or comments on) a GitHub Issue
labelled `scrape-failure`. Auto-closes on the next success.
No SMTP, no secrets, no third-party. Notifications route through
Mark's existing GitHub setup (mobile / email / web) the same way
@-mentions do.

**Don't bypass this** by trying to swallow failures elsewhere — the
issue-tracker surface is the point. If a particular failure mode is
noisy in a way that doesn't warrant an issue (e.g. a dealer that
intermittently 503s but recovers within minutes), fix the underlying
flap with retries like `scraper_lib.fetch_json_with_retry` or the
watchclub low-count abort — not by silencing the alert.

### updated_at field + STALE rendering

`verify_sources.py` (dealer listings) and `verify_auction_lots.py`
(auction lots) both write `updated_at: <ISO-8601-UTC>` on every
run. AdminTab renders the relative time + flips to "STALE — last
run Nh ago" (danger, bold) above 12 hours. health.py applies the
same threshold. Old snapshots without `updated_at` fall back to
the legacy `date: YYYY-MM-DD` field.

### Matrix workflow is opt-in (dispatch only)

`.github/workflows/scrape-listings-matrix.yml` is the parallel
version that delivers ~2× speedup (16m vs 33-40m). It's
`workflow_dispatch` only — daily cron still runs the sequential
`.github/workflows/scrape-listings.yml`. The matrix workflow was
smoke-tested end-to-end (0 failed jobs, 16m20s wall-clock,
produced a clean `Listings update (matrix) ...` commit) but the
cron stays on the battle-tested sequential workflow until Mark
explicitly wants to swap. Swap is a one-line PR each direction
(move the `on: schedule:` block between the two files).

### Watch Club low-count abort

If a Shopify catalog ever returns a suspiciously truncated dataset
(N < 50% of prior run AND N < 25 absolute), the right move is to
SKIP writing the CSV so merge.py preserves the prior state. The
workflow's `[ -f X ] && mv X data/X || echo "X missing"` step
silently no-ops; merge.py reads the prior data and doesn't
disappearance-flag any items. Cost: one day of slightly stale data
if there's a genuine ~50% inventory drop (next consecutive run
unblocks naturally since prior_count is then the new baseline).
Benefit: kills the "items vanish into Sold then reappear as new"
UX flap. The same pattern fits any source where a transient
upstream cache can serve a partial view.

### FilterRow primitive shape

`src/components/FilterRow.js` standardizes the inner flex strip
(display, gap, borderBottom, flexWrap) for Listings + Editorial.
What stays at the call site:
- Editorial's outer sticky wrapper with negative horizontal margins
  (edge-to-edge through the scroll container's padding)
- The chip expansion panels (Source / Brand) rendered as siblings
  of the strip
- Mobile shell's horizontal-scroll filter row (different shape:
  overflowX:auto, smaller gap, count chip leading) — intentionally
  NOT routed through the primitive

If you touch either Listings or Editorial filter rows, route
changes through the FilterRow primitive — don't fork inline
declarations again.

### desc-restore sidecar pattern

PR #437 zeroed `desc` in listings.json for wire-weight reasons.
PR #538 restores it for HEARTED items via a lazy-loaded sidecar:
- `merge.py` emits `public/listings_desc.json` (id → desc map)
- App.js lazy-fetches it AFTER first paint resolves
- `handleWish` hydrates `desc` into the item before
  `toggleWatchlist` snapshots it

Initial paint stays slim (4.1MB listings.json). Sidecar adds
~700KB gzipped on a lazy fetch — never on the critical render
path. New hearts get desc; pre-PR-#538 hearted items still have
`desc:""` (acceptable; a backfill script could revisit them).

This sidecar pattern is reusable for any future per-item field
that's too heavy for the main payload but needed at action-time
(image, full body text, etc.).

### Sotheby's archive workflow

To add a past Sotheby's sale to the archive:
1. Find the URL on `sothebys.com/en/buy/auction/<year>/<slug>`
2. Append to `data/manual_archive_sales.json`:
   `{ "url": "...", "house": "Sotheby's", "title": "...", "date": "YYYY-MM-DD" }`
3. Run `python3 manual_archive_scraper.py`
4. Commit `public/manual_archive_lots.json`

Same workflow as Phillips / Christie's / Antiquorum. The
`enumerate_sothebys` enumerator works fine on past sales —
algoliaJson + lotCards stay populated post-sale.

## Active queue carried forward

| Item | Notes |
|---|---|
| **Bulk-add past 2026 Sotheby's sales to archive** | Now unblocked. Need a list of past Sotheby's 2026 watch sale URLs/slugs. Mark to provide or I can attempt discovery via `/en/results` page (Option B from this session — auto-discovery; deferred in favour of the per-URL manual flow). |
| **Make matrix workflow the cron** | One-line PR each direction. Swap once Mark wants the speed bump on the daily pipeline. |
| **Backfill desc on existing hearted items** | PR #538 only restores desc for NEW hearts. A one-off backfill script could walk `watchlist_items` rows with `desc:""` and update the snapshot from the current `listings_desc.json`. Mark's call whether to bother. |
| **Hide regression verify** | Carried from late-night handoff. Mark reported Live-auctions cards "don't have the hide feature anymore". Quick verify needed. |
| **Mobile Sale filter chip** | Desktop got the Sale chip in PR #525; mobile drawer didn't. Parity gap. |
| **Reference page pilot (Epic 0)** | Carried from prior session. Pick one of GMT-Master 1675 (65 articles), Speedmaster 145.022 (35), Sub 5513 (67). |

## Things to graduate to CLAUDE.md (future)

If these patterns prove out, candidates for graduation:
- The scraper_lib opt-in helper rule (already documented inline
  in scraper_lib.py; CLAUDE.md scraper conventions could
  cross-link)
- The desc-sidecar pattern as a reusable "lazy per-item heavy
  field" approach
- The Watch Club low-count abort as a generic "transient upstream
  truncation" recipe

None are urgent; defer until a second occurrence proves the
pattern's worth.

## Bottom line

Reliability + observability foundation upgrade. The Falco crash
that triggered today's session can't repeat in the same shape: every
Shopify-pattern scraper has retry, every workflow step has
`continue-on-error`, scrape failures auto-open GitHub Issues, and
`health.py` gives a one-command status surface. Matrix workflow is
proven and ready to swap in. Watch Club flap is fixed. Sotheby's
archive is unblocked (waiting on a URL list). Plus FilterRow
refactor + desc-restore as bonus quality-of-life wins.

Local repo state is clean — all 10 PRs squash-merged with
`--delete-branch`. Local main is in sync with origin/main.

Next session is wide open: docs (Mark's stated focus), Sotheby's
bulk archive once URLs are in hand, swap matrix to cron, or
continue down the carried-forward queue.
