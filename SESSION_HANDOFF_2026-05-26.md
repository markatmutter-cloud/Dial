# Watchlist — Session Handoff (2026-05-26, reference-intelligence + reference-page)

For conventions see [CLAUDE.md](CLAUDE.md); direction [ROADMAP.md](ROADMAP.md);
history [SHIPPED.md](SHIPPED.md). This is the in-flight snapshot — archived, not
graduated. Rich project context is in memory ([[project_reference_page_design]],
[[reference_synthesis_outputs]], [[feedback_reference_voice_intrinsic]],
[[feedback_recommender_trust]], [[anthropic_api_config]],
[[project_watches_diving_feature]], [[feedback_take_on_heavy_lifts]]).

## TL;DR
Shipped, live on prod: the **Collecting ▸ References reference-page pilot**
(Rolex Submariner 5512/5513) **+ a repeatable reference-intelligence pipeline**
(scrape → Opus 4.7 synthesis → readable digest), wired the synthesis into the
page, scope-tagged it so a reference page shows only its slice, then a full **UX
pass** (wayfinding, journey, section tier). All merged; no open PRs.

## ⭐ TOMORROW MORNING — what to check on the new interface
`the-watch-list.app` → **Collecting → References** (pull-to-refresh the PWA for
the new bundle). Judge on-device:
- **Sticky section nav (chip bar)** — does it track where you are + jump cleanly? (mobile + desktop)
- **Section legibility** — kicker + serif title + guided intro + rule: do sections read as distinct chapters now?
- **Desktop width** — model intro + the 5512/5513 story sit **side by side**.
- **"Look at real examples"** — the market cards are now **inside the grey box** (one unit); the segment defaults to the first non-empty bucket.
- **Debated** — only **real two-sided** debates; the **helium-valve item is correctly GONE** (it's Sea-Dweller/COMEX scope, not 5512/5513).
- **Stories** — moved **down**; titles are the links; edges aligned; intro line.
- **Credibility** — the "part machine, still learning" hedge is demoted to a tight Sourcing footer.

## UX review — done / not done  (vs `docs/REFERENCE_PAGE_UX_REVIEW.md`)
**DONE:** P0-1 wayfinding (sticky scroll-spy) · P0-2 section-header tier ·
P0-3 journey order + guided intros · P0-4 stories aligned/title-link/intro + moved
down · P0-5 debated both-sides + non-debate filter + confident copy · P0-6 market
cards inside the grey box · P0-7 desktop side-by-side intro/story + one shared
width (`MAXW`) · P1-1 hedge demoted to footer · P1-4 market defaults to first
non-empty segment · P2 module-candidates now plain text · width constants hoisted.

**NOT DONE / deferred:** desktop **gutter-rail** nav (shipped the safer **chip
bar** instead — upgrade once you've eyeballed it) · P1-2 drop-cap (set to `text1`
+ guarded, not fully reconsidered) · P1-3 two-tier section spacing (only partial)
· **P2 accessibility** (↗ / "Read ↗" tap targets <44px on an iOS PWA; `--text3`
used for full sentences is below AA — move to `--text2`; route segmented pills
through `innerToggleButton`; guard empty `img src`) · `node.inItsTime` is **dead
content** (left unrendered — decide: render as a pull-quote or remove).

## The pipeline (how to re-run it)
Manual workflow `reference-synthesis.yml` → input `node = submariner | speedmaster
| all`:
- **Stage 1** `reference_corpus_scraper.py` — reads `reference_sources/<node>.json`
  manifest, reuses our editorial corpus where we hold a URL, fetches + extracts
  the rest (trafilatura), skips bot-blocked as link-only.
- **Stage 2** `reference_synthesis.py` — one **Opus 4.7** pass (`ANTHROPIC_API_KEY`
  in GH secrets, ~$1/node), structured cited JSON, every item `applies_to`-tagged.
- **Stage 3** `reference_digest.py` → `docs/reference_synthesis_<node>.md` (the
  readable review surface + gap backlog).
Outputs: `public/reference_corpus_<node>.json(+_bodies)`, `..._synthesis_<node>.json`,
`docs/reference_synthesis_<node>.md`. Submariner + Speedmaster both run.

## Carried threads (Mark-actions / next session)
1. **Feed the gap wishlist → a targeted source scan** (MilSub, 5517, COMEX-HEV,
   primary Cousteau letter). The gaps live in each digest.
2. **Relay book takeaways** (Rolex-authorized Submariner book, *Moonwatch Only*)
   — attributed — to fill what web sources miss.
3. **Build the next nodes** from module candidates (MilSub / COMEX / Sea-Dweller /
   1680 / Bond / pre-crown-guard…). **Speedmaster** synthesis + digest exist; its
   *page* isn't built — hero image is captured in [[reference_synthesis_outputs]].
4. **Review-gate LLM output before wiring** (this session's lesson — the synthesis
   padded a non-debate that shipped); **tighten the synthesis prompt** to surface
   only genuine, high-stakes debates.
5. **UX follow-ups:** desktop gutter-rail nav; the P2 a11y polish; resolve
   `Eyebrow.js` (created then inlined in ReferencePage — adopt it or delete it).
6. **Phase 2:** templatize the page, build the browse index over multiple nodes.
7. **RAG bot (next era):** the chunked corpus is the input — chat over the
   reference corpus, then a collector-support AI.

## Notes / loose ends
- `Eyebrow.js` exists but ReferencePage inlines the kicker pattern — reconcile.
- `docs/ref_5512_5513_inventory.md` is **untracked scratch** (superseded by the
  pipeline) — keep or bin.
- Pre-existing stray local branches (not from this session): `audit-system`,
  `bk-bonhams-curlcffi-…`, `fix-screening-auction-copy-b02`, `review-callout-sidebar`,
  `session-handoff-next` — clean when convenient.

## Bottom line
Clean atomic close. On `main` (after this branch merges), synced, **no open PRs,
no stranded branches from this session** (all merged + deleted). Reference-page
pilot + the full reference-intelligence pipeline are live and verified. Next
session: judge the UX on-device, then work the carried threads.

---

# Addendum — Vibe-code audit + remediation (2026-05-26, second session)

A separate session, same day. Mark asked for a cold "vibe-code audit" (his
friends' thesis: vibe-coded projects collapse under their own weight), then we
worked the findings.

## What shipped (7 PRs, all merged + branches deleted)
- **Audit (#574, #575).** 6 parallel read-only subagents (architecture,
  correctness, security, data, frontend, maintainability). **Overall grade B−**
  — *not* the "garbage" thesis; a well-governed core with 3–4 real cliffs.
  3 Critical · 19 High · 25 Medium · 19 Low. Report + 6 `findings-*.md` archived
  to `docs/audits/2026-05-24-vibe-code/` (+ `AUDIT_PLAIN_ENGLISH.md`). Wired in:
  CLAUDE.md doc-set pointer + close routing, BUGS.md B-15–B-22 tagged
  `[audit:2026-05-24]`, ROADMAP refactor-track items.
- **B-15 (#576) — the lone Critical.** Empty/HTTP-200 scrape used to flip a
  whole source to SOLD on the first miss. Central debounce in
  `merge.update_state` (`DISAPPEARANCE_MISS_THRESHOLD=2`): held live + re-emitted
  from cache until absent N consecutive runs; a seen run resets `missCount`.
  Tests rewritten to the 2-miss contract + 3 regressions.
- **B-17 (#577).** Deferred ~15 MB of non-critical mount JSON to
  `requestIdleCallback` (auction/editorial archives feed only Auctions + Sold).
- **B-16 Python (#578).** `requirements.txt`/`-auctions`/`-ai`; 11 workflow
  steps repointed. **JS lockfile NOT done** — `npm`/`node` unavailable locally.
- **B-22 AdminTab (#579).** `React.lazy` admin-only code out of the public bundle.
- **B-21 (#580).** SW `isJsonData` now covers post-split feed files; added
  `src/service-worker.test.js` drift-guard (rebuilds the SW regex from source,
  asserts it covers every App.js `*_URL`).

## Carried forward (all Open in BUGS.md → resurface via /start)
- **B-18 — FX tables drift (Medium, money correctness).** Not polish; real.
- **B-19 — 5 user-data tables' RLS state un-versioned (Medium, security).** Real.
- **B-16 JS lockfile** — needs a Node env (or a CI-generates-it job).
- **B-20 — rename `auctionlots_scraper.py` → `tracked_lots_scraper.py`** (mechanical).
- **B-22 phase 2 — code-split.** Messier than line-counts implied (below).
- **B-06 / B-08 / B-14** — design/plan-mode threads (not cleanup).

## Notes worth keeping
- **Code-split survey reality (B-22):** the receivers (Share/Challenge/List) are
  **always-mounted + self-gating**, so naive `React.lazy` loads their chunk
  anyway — needs intent-gating (touches the #310-sensitive lifecycle). App.js
  *imports* `ListReviewMode` but renders it 0× (CollectionsTab renders it → dead
  import). `SearchResultsView` (~572 lines, conditional) is the one clean
  remaining App.js-level candidate. EditorialView/SizeCompare/ChallengeFlow are
  multi-imported (split at every site). AdminTab was the clean win.
- **CI doesn't exercise scrape installs** (cron/dispatch only) — B-16 validated
  by version existence + next scheduled scrape. The B-21 test *does* run in CI.
- **Minor drift:** README's dev-setup line still says `pip install requests`
  (now `requirements.txt`) — fix on next touch.
- The audit's organizing idea for Mark: **promote expensive rules from notes →
  guardrails** (a check that fails the build), not docs you must remember.

## Bottom line
Clean close. The lone Critical is fixed, the biggest mobile first-load hit is
gone, Python deps pinned, the audit fully captured + tracked so nothing's lost.
No open PRs, no stranded branches from this session.
