# Watchlist — Session Handoff (2026-05-28, performance / load-speed marathon)

Conventions: [CLAUDE.md](CLAUDE.md). Direction: [ROADMAP.md](ROADMAP.md).
History: [SHIPPED.md](SHIPPED.md). Backlog: [BUGS.md](BUGS.md). Prior handoff
(2026-05-27, B-08 Watchlists) superseded — recoverable via git.

## TL;DR — fixed the "site is slow / not working"
Started on B-08 empty-list onboarding, then pivoted hard: real users said the
site was "not working" — it was just **brutally slow to load**. Root-caused +
shipped a **6-PR performance epic (#646–#651, all merged, CI green)** that
addresses **B-34**. Also handled an emergent **Vercel Blob pause** (free-tier
transfer cap) and two side tweaks (mobile calendar, Tropical Watch grain).

## What shipped (all merged to main)
- **#646 — Image resize via wsrv.nl.** Every dealer/auction image now served
  through the free wsrv resize CDN (~720px WebP) in `imgSrc()`. Loupe This 5 MB
  photos → ~40 KB. **First-load payload ~198 MB → ~12–13 MB; desktop LCP 19 s → 6 s.**
- **#647 — Home first-paint diet.** Below-the-fold strips render on scroll
  (`DeferUntilVisible` in HomeTab); first LCP image eager; `listings_desc`
  (0.9 MB) idle-loaded; Bonhams served direct.
- **#648 — Blob images → thumbnails.** `cache_watchlist_images.mjs` stores
  ~600px WebP (via wsrv), not full-res. One-time re-process (workflow_dispatch
  `reprocess_thumbnails=true`) **shrank 382 existing blobs, 0 skipped → storage
  ~242 MB → ~20 MB.**
- **#649 — Code-split AuctionCalendar + Search-all (B-22 phase 2).**
- **#650 — Mobile: no auto auction-calendar popup** (desktop unchanged).
- **#651 — Tropical Watch served direct** (240px CloudFront source went grainy
  through the resizer).

## Key decisions / mental model (so they're not relitigated)
- **Storage ≠ transfer.** Blob *storage* is cheap (~1 GB free); **transfer/egress**
  is the metered cap that paused us (23.84 / 10 GB). The frontend wsrv serve +
  thumbnail-store both target the right meters.
- **Store thumbnails, not full-res** (Mark's call): dropped the full-res archival
  promise — he downloads keepers manually. Was 242 MB/1 GB in *one month, one user*.
- **Vercel is on Pro** (Mark upgraded — "option B" — to run the re-process now).
  **Can downgrade back to Hobby next cycle**: transfer handled by wsrv, storage now tiny.
- Vercel-downgrade-slowed-the-site? No — site bandwidth was 6/100 GB. Only Blob capped.

## ⭐ NEXT PICKUP
- **Re-run PageSpeed mobile** for the after-baseline (was 35; everything's stacked now).
- **Lazy-load the ReferencesTab subtree** (EditorialView/SizeCompare/ChallengeFlow/
  ChallengesView, ~3k lines) — the biggest remaining bundle chunk; its own PR + an
  in-browser check of the Collecting tab. (B-34's one follow-up.)
- **Code review + hygiene** (Mark asked about review agents): run `/code-review`
  per branch going forward; `/tidy` for orphaned code + the stranded branches
  below; **B-27** (inert-code scan) is the tracked sweep.
- **Optional:** refresh the grainy *hearted* Tropical Watch images (re-fetch from
  live CloudFront — the re-process shrank them before #651 served TW direct).
- **Parked, not built:** B-08 **empty-list onboarding** (+Listings/+Articles blocks
  · title-seeded `+` suggestions) — this session's original pick; branch
  `watchlists-empty-onboarding` exists but is **empty/unused**.

## Loose ends
- **No open PRs.** Working tree clean after this close.
- **Stranded local branches** (flag for `/tidy`): `watchlists-empty-onboarding`
  (mine, unused), `session-close-2026-05-27`, `session-close-2026-05-27-ia-build`,
  `session-handoff-next`, `bk-bonhams-curlcffi-*`, `fix-screening-auction-copy-b02`.
- Today's perf feature branches were auto-deleted on squash-merge.

## Bottom line
The "site is broken/slow" complaint is fixed (payload −93 %, desktop LCP −70 %)
and the Blob cost is structurally solved (thumbnails + transfer via wsrv). Real
proof pending one mobile PageSpeed re-run. Remaining is polish (ReferencesTab
split) + hygiene (code review / orphaned-code scan).

---

## ADDENDUM — `/tidy` hygiene pass (2026-05-28, later)
Ran the repo/code hygiene sweep + B-27 inert-code scan. The "Loose ends" /
stranded-branches list above is now **resolved**.

- **Root-caused the recurring orphan pattern.** Session-close branches normally
  *do* merge (squash); the mess was two things: (1) squash-merge leaves the
  local branch looking "1 ahead" forever → residue that hides real strands, and
  (2) the 2026-05-28 close **genuinely never merged** — its SHIPPED #646–651 +
  handoff were stranded (recovered via **#652**).
- **Structural fix (#653, merged):** doc-only closes now commit **straight to
  `main`, no PR** (`/wrap` step 5 + CLAUDE.md, in lockstep). This is *why* the
  close can't strand again — and it answers Mark's ask: nothing left uncommitted
  when the terminal closes. Branch-before-editing stays the rule for **code**.
- **Branches:** deleted 17 dead remotes (merged/closed) + 9 local residue +
  `wrap-close-direct-to-main` after merge. Now just `main` + the open scraper PR.
- **Worktrees:** primary `/Documents/watchlist` was parked on the dead
  `session-close-2026-05-28` → moved back to `main`; removed 2 empty leftover
  worktrees (`ui-consistency`, `watchlist-v2`).
- **B-27 scan:** removed orphaned `phillips_known_auctions_scraper.py` (**PR #654,
  open — merge it**); **kept** `windvintage_guides_scraper.py` (corpus, Mark's
  call). No other inert code. Full findings in BUGS B-27.
- **Issue #569** (Tropical Watch scrape-fail) closed — fixed by #651.

### ⭐ NEXT PICKUP (unchanged + one add)
Still: mobile PageSpeed re-baseline, lazy-load ReferencesTab subtree (B-34
follow-up). **Add:** merge **PR #654** (phillips scraper removal).
