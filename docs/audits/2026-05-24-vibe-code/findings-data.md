# Data & Pipeline Audit — watchlist

Cold, read-only audit. Domain: data & pipeline. Date: 2026-05-24.
Scope: git/payload bloat, merge.py + state.json correctness, scraper
resilience, auction scrapers, migrations, data validation.

Severity: CRITICAL (data loss / guaranteed break-at-scale) · HIGH (real
reliability risk or a cliff within months) · MEDIUM (meaningful
fragility) · LOW (hygiene).

---

## CRITICAL

### C1 — Empty/partial CSV on a "successful" scrape silently mass-marks a source SOLD
- **Severity:** CRITICAL
- **Evidence:**
  - merge.py:437-442 — load_csv returns [] for a missing OR empty CSV; no minimum-count guard.
  - merge.py:664-676 — any state ID not seen today is flipped active=False + soldAt=TODAY on the FIRST miss.
  - oliverandclarke_scraper.py:137-141 — CSV written unconditionally even when results==[] (the if results: at 143 only gates the summary print). This is the norm across dealer scrapers.
  - watchclub_scraper.py:165-173 — the ONLY scraper with a low-count abort (MIN_HEALTHY_RATIO=0.5, sys.exit(0)). 1 of 41 listing sources protected.
  - .github/workflows/scrape-listings.yml:268-307 — move step `[ -f x_listings.csv ] && mv … || echo missing`. A missing CSV is safe (prior data/x.csv survives); an empty/partial CSV is NOT (it exists, gets moved, overwrites good prior).
- **Why it matters:** A Shopify endpoint returning HTTP 200 with zero/truncated products.json (CDN hiccup, pagination break, soft rate-limit, schema drift) makes the scraper "succeed" and emit a near-empty CSV. merge.py then marks every previously-live item from that dealer SOLD in one run. ~40 sources × 3 runs/day = when-not-if. Flip is on first miss (no debounce). Ghost-sold rows then persist permanently (C2/H1).
- **Fix:** Generalize the watchclub guard into scraper_lib and call before every CSV write — OR enforce centrally in merge.py (load_csv compares row count to prior committed CSV; on >50% collapse reuse prior rows + hard alert). Add a debounce (N consecutive misses before active=False). Centralizing in merge.py is higher leverage.
- **Effort:** M

---

## HIGH

### H1 — Unbounded growth of state.json + the sold archive (committed AND served)
- **Severity:** HIGH
- **Evidence:**
  - No entry-level prune in merge.py — only field-level pops (merge.py:590,632). Old 30-day prune explicitly removed (merge.py:929-933).
  - public/state.json holds 5,463 entries (measured), 2.8 MB, 226 git revisions.
  - merge.py:711-740 — every disappeared item re-emitted as a ghost sold row into enriched every run forever; sold half grows monotonically.
  - merge.py:866-876 — each run rewrites listings.json (4.1MB) + listings_live.json (2.9MB) + listings_sold.json (1.2MB) + listings_desc.json (3.4MB). 276 revs of listings.json.
- **Why it matters:** (1) Client: listings_sold.json fetched by every visitor (lazy but downloaded), only grows. (2) Git: ~11.6MB of churning JSON committed 3×/day, no ceiling. Linear-forever climb degrading sold first-paint and clone/CI time.
- **Fix:** Cap served sold window (last 12–18 months of soldAt) in listings_sold.json, keep full history in state for analytics; OR move sold archive behind paginated/Supabase endpoint. Prune state entries inactive > N months with no heart/snapshot reference.
- **Effort:** M

### H2 — 99 MB of JSON committed to git, churning 3×/day → .git already 270 MB
- **Severity:** HIGH
- **Evidence:**
  - du -sh .git → 270 MB (.git/objects 268 MB). History starts 2026-04-19 (~35 days) — 270 MB accrued in ~5 weeks.
  - git ls-files public/*.json | xargs du -ch → 99 MB tracked JSON working tree (42 files).
  - 334 of 1,145 commits are automated scrape commits; last 200 commits all touch public/*.json.
  - Largest blobs: fratello_bodies.json 28.6MB, rolex_magazine_bodies 7.7MB, hodinkee_shop_bodies 6.5MB, auction_lots.json 5.2MB (73 revs), hairspring_finds_bodies 4.4MB, loupethis_lots 4.4MB, listings.json 4.1MB.
  - Big editorial bodies barely churn (fratello_bodies 2 revs, hodinkee_shop_bodies 1 rev) — one-time ~50MB anchor. Churn drivers: listings/state/auction_lots/desc.
- **Why it matters:** Every JSON snapshot is a full new git blob (JSON diffs don't pack well). Clone/CI checkout/repo size climb unbounded. Editorial bodies bloat the base; listings/state bloat the rate.
- **Fix:** (a) Stop committing generated data into git — publish public/*.json via Vercel build-time fetch from blob store/Supabase storage, or an orphan branch periodically squashed. (b) git-LFS or blob storage for static editorial bodies. (c) Reclaim requires a destructive history rewrite (BFG) — coordinate, one-time. Decision needed: data does not belong in git history at this cadence.
- **Effort:** L

### H3 — continue-on-error makes the workflow conclude "success" when sources fail; the failure-notifier never fires
- **Severity:** HIGH
- **Evidence:**
  - scrape-listings.yml:34-307 — all 41 scrape steps have continue-on-error: true.
  - notify-scrape-failure.yml:40,57 — issue opened only when wf.conclusion === 'failure'. With continue-on-error everywhere, the run concludes SUCCESS regardless of how many scrapers errored.
  - verify_sources.py:41-117 — DOES detect zero/low counts (DROP_THRESHOLD=0.30, "count dropped to zero" alert) BUT runs `|| true` (scrape-listings.yml:318) AFTER merge.py wrote the sold flips, and never fails the job.
- **Why it matters:** The C1 corruption produces a green workflow and no GitHub Issue. Only signal is a JSON field in verification.json surfaced in admin UI — easy to miss, post-hoc. notify-scrape-failure only catches infra/merge crashes, not the data-quality failures that corrupt the feed.
- **Fix:** Make verify_sources.py exit non-zero on a zero/critical-drop alert; add a workflow step that fails (or opens an Issue) on that code — gating the commit or firing the notifier. Tie to the C1 guard.
- **Effort:** S

### H4 — Hardcoded FX table; drifts silently and lives in 3 places out of lockstep
- **Severity:** HIGH
- **Evidence:**
  - merge.py:337 — FX = {'GBP':1.27,'EUR':1.08,'CHF':1.13,'JPY':0.0067,'CNY':0.14,'HKD':0.128,'USD':1.0} — static literals, no source, no refresh.
  - ~20 of 41 sources priced GBP/EUR/CHF/HKD (merge.py:781-826) — whole non-USD half converted at frozen rates.
  - src/utils.js carries a duplicate FX; supabase/schema/2026-05-07_swisshours_currency_fix.sql:14 hardcodes 0.128 again — 3-place lockstep.
  - priceUSD baked at scrape time (merge.py:513) AND into Supabase snapshots — a rate change doesn't retroactively fix saved hearts.
- **Why it matters:** Real rates move several % per quarter; frozen rates make cross-currency sort/compare and USD display progressively wrong. The swisshours migration is direct evidence this bug class already shipped (an 8× error) needing a manual production data fix.
- **Fix:** Fetch FX daily from a free rates API in a tiny workflow step → data/fx.json read by merge.py + utils.js (single source of truth), with a hardcoded fallback. Saved snapshots stay at saved-time rate (correct for a "what I saw" record); compute live display from current FX.
- **Effort:** M

---

## MEDIUM

### M1 — Two near-identically-named auction scrapers; high mis-edit risk (NOT redundant)
- **Severity:** MEDIUM
- **Evidence:**
  - auction_lots_scraper.py:1-15 — comprehensive lot enumeration from public/auctions.json → public/auction_lots.json. Wired in scrape-auctions.yml:130 + scrape-auction-lots-frequent.yml:75.
  - auctionlots_scraper.py:1-13 — refreshes USER-tracked lot state from Supabase tracked_lots → public/tracked_lots.json. Wired in scrape-auctions.yml:68.
  - Both live, serve different files; NOT redundant. But names differ by one underscore and one imports from the other (auction_lots_scraper.py:162). 101KB vs 56KB.
- **Why it matters:** A future edit to "the auction scraper" lands in the wrong file ~half the time.
- **Fix:** Rename to intent-revealing names (auction_catalog_lots_scraper.py vs tracked_lots_scraper.py); update 2 workflow refs + cross-import.
- **Effort:** S

### M2 — Race rebase --strategy-option=theirs can regress state.json
- **Severity:** MEDIUM
- **Evidence:** scrape-listings.yml:334-346 — on a push race, `git pull --rebase --strategy-option=theirs` keeps the local run's listings.json/state.json wholesale (comment 337-341 acknowledges intentional, "later-finishing one is fresher").
- **Why it matters:** "Later-finishing" ≠ "later-started." If run A (started 14:00) finishes after run B (14:05) due to a slow source, A's staler state.json overwrites B's — silently dropping a price-history entry / firstSeen B recorded. State is append-mostly so the window is narrow, but 3 crons + manual dispatch + matrix workflow create overlap.
- **Fix:** Serialize with `concurrency: {group: scrape-listings, cancel-in-progress: false}` so runs queue instead of racing.
- **Effort:** S

### M3 — auction_lots.json grows permanently; live lots from a failed enumeration vanish that run
- **Severity:** MEDIUM
- **Evidence:**
  - auction_lots_scraper.py:2233-2243 — prior lots persisted forever IFF they carry a realized sold_price. No upper bound; file is 5.2MB (73 revs), on client fetch path (src/App.js fetches /auction_lots.json).
  - auction_lots_scraper.py:2161-2165 — if a sale's enumerator throws (WAF block, Phillips 403), the run continues and that sale's live/unsold lots are absent from out; only sold lots survive via the persistence pass. A tracked-but-unsold lot can disappear mid-sale until the next successful run.
- **Why it matters:** Same unbounded-growth shape as H1 for a client-served file. Transient live-lot disappearance is a smaller UX glitch (self-heals) but worth a debounce given Phillips/Bonhams block CI.
- **Fix:** Window served sold lots (recent N months) as in H1; for live lots, fall back to prior entry on enumeration failure rather than dropping them.
- **Effort:** M

### M4 — stable_id fallback key is fragile for URL-less rows
- **Severity:** MEDIUM
- **Evidence:** merge.py:405-408,508 — stable_id(url, fallback_key=f"{source_name}|{title}"). With no URL, ID hashes source|title (scraped free text).
- **Why it matters:** A title tweak ("1960 Rolex" → "1960 Rolex Explorer") gives a URL-less row a NEW stable_id — old one disappears (→ ghost-sold) and a new "first seen today" row appears. Spurious sold+new churn; breaks price-history continuity. Most rows have URLs so blast radius is URL-less sources, but it's a correctness landmine.
- **Fix:** Prefer a dealer-stable id (Shopify product id, eBay item id) over title when URL absent; most scrapers already have it in the payload. Else normalize title harder (strip year/brand) before hashing.
- **Effort:** M

---

## LOW

### L1 — listings.json is now redundant on the client path but still written every run
- **Severity:** LOW
- **Evidence:** merge.py:868-876 writes listings.json (4.1MB) plus the live/sold split. src/App.js:67-68 fetches only listings_live/listings_sold; the only remaining reader of the full file is src/components/AdminTab.js:310.
- **Why it matters:** ~4MB of git churn per run for one admin screen (compounds H2).
- **Fix:** Point AdminTab + backend tools at live+sold (or concat) and stop emitting the monolith — or keep it but gitignore it if a build step can regenerate.
- **Effort:** S

### L2 — Six migrations lack idempotency guards (low impact, already-applied)
- **Severity:** LOW
- **Evidence:** supabase/schema/ non-idempotent files: 2026-05-07_swisshours_currency_fix.sql, 2026-05-08_listing_events_daily_rls.sql, 2026-05-09_preload_mark_hearts.sql, 2026-05-09_preload_mark_watches.sql, 2026-05-09_realtime_publication.sql, 2026-05-10_revoke_anon_signed_in_rpcs.sql.
- **Why it matters:** Re-running would error/double-insert. Mitigated: preloads gate on `where not exists` (preload_mark_hearts.sql:41); currency fix gates on saved_currency='USD' — effectively idempotent via WHERE clauses. Files date-ordered, several note "already applied via MCP." Low real risk.
- **Fix:** Add if not exists / create or replace where the WHERE-clause guard isn't already doing the job. Hygiene.
- **Effort:** S

### L3 — Migrations are filesystem records, not an enforced ordered/applied ledger
- **Severity:** LOW
- **Evidence:** supabase/schema/*.sql are date-prefixed; several carry "Already applied to production via Supabase MCP" comments. No migrations table / no supabase CLI tooling — ordering + applied-state live in filenames + comments. Five 2026-05-06_* files sort alphabetically, not by intended order.
- **Why it matters:** CLAUDE.md's "ship the migration before the JS" rule is enforced by discipline, not tooling. A rebuild-from-scratch has no guaranteed apply order beyond lexical sort; intra-day order is ambiguous.
- **Fix:** Adopt supabase/migrations/ with CLI numeric timestamp prefixes, or at least NN_ numeric prefixes for intra-day order. Not urgent given MCP-applied workflow.
- **Effort:** S

---

## Checked and found SOUND (no finding)
- Missing-CSV safety: a scraper that CRASHES (no CSV) is safe — move step skips, prior data/x.csv reused (scrape-listings.yml:268-307). Only the empty-but-present CSV is dangerous (C1).
- Request timeouts: every requests-using scraper sets timeout= (zero offenders).
- CHECK-constraint expansion: collections.type widened safely via drop constraint if exists + re-add (2026-05-06_collections_hard_lists.sql:21-27) — CLAUDE.md's warned pattern is followed.
- Auction sold-price persistence keyed on realized sold_price; passed/unsold intentionally not persisted (auction_lots_scraper.py:2229-2243).
- Per-row eBay currency handled correctly (merge.py:466-474,822-826).
- scraper_lib.fetch_json_with_retry adopted by 14 Shopify scrapers; transient-5xx retry path exists.
- PT-anchored TODAY (merge.py:352-356) avoids the evening-run-writes-tomorrow bug.

---

## Counts
- CRITICAL: 1 (C1)
- HIGH: 4 (H1–H4)
- MEDIUM: 4 (M1–M4)
- LOW: 3 (L1–L3)
