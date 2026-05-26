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
