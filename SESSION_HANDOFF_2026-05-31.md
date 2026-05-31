# Session handoff — 2026-05-31

Supersedes SESSION_HANDOFF_2026-05-30.md (archived). A long Lumé-hardening day
driven by Mark's real-use testing. **Mark authorised Claude to merge PRs this
session** ("merge prs for me") — merge only on green CI.

## Where we are — Lumé got a lot more trustworthy + capable

Shipped today (see SHIPPED.md "Lumé — the AI spine"): **search_articles** (Lumé can
read the 13k-article corpus — fixed the Enicar blindness); a big behaviour
prompt-pass (knowledge-first vs shop, know-your-limits/filter-tiers, don't quote
counts, never join refs, humble/no-plumbing-talk, never call a real listing
mislabeled, never reply actions-only); **two empty-answer dead-ends fixed**
(loop-exhaustion + actions-only); the **eval harness** (`src/lume_eval.test.js`,
LUME_EVAL=1 workflow); **collector-mentality tagging live** on the essay sources;
mobile full-screen chat + glowing-pip icon + SW stale-cache fix; **Share-with-Lumé**
(B-52) + **article heart/⋯** (B-37).

## Open / next (priority order)

1. **B-47 — Lumé sees on-screen context** (last of the UI cluster). Filters live in
   App.js React STATE (filterBrands/filterModels/filterSources/search/tab), NOT the
   URL — so the app must publish them. **Do it hook-safely:** a small self-contained
   `<LumeContextPublisher>` component App mounts next to the shell (props = the live
   filters/tab/current item), with one useEffect → a `LumeContext` bus; ChatBubbleHost
   reads it at send-time and includes a brief context note. Do NOT add a useEffect deep
   in App.js after the early returns (React #310). Reuses B-52's seed plumbing (LumeBus).
2. **Discovery eval** — the "find NEW issues" build: an LLM generates varied prompts →
   Lumé runs → an LLM judge grades each against `LUME_UX_PRINCIPLES.md` + the
   LUME_ROADMAP behavioural charter + BRAND.md, flagging off-plan replies. (Regression
   scenarios already guard known fixes.)
3. **Finish mentality tagging:** WOE re-running now; **bulang_watch_talks** still
   0-mentality (topic-tagged but the retag was cancelled — re-fire it). Fire tagging
   **sequentially** — the workflow's concurrency cancels parallel dispatches. The big
   sources (fratello/rolex_magazine/hairspring/hodinkee_shop) are deliberately NOT
   mentality-tagged (low yield, high cost). Then build the **coaching MODE** (pillar 2)
   that uses the tags.
4. **B-54** — Rolex Explorer 14270 mis-tagged "Submariner": 14270 is wrongly under
   Submariner in `watch_references_index.json`. Fix the index + re-tag + check the
   brand-resolution gap. Quick data fix.
5. **B-45 attribute search** — the big one: enrich listings with facets (material/dial/
   markers) so "gold / silver dial / no-numerals" becomes filterable. Recommender substrate.
6. Then: **per-user depth tiers** · **profile/memory store (pillar 4)** · **recommender
   (pillar 5)** · **proactive nudges (pillar 6)** · **app-onboarding/dossier coaching** ·
   in-app article surface (B-51) · lexicon Phase 2 · About page · bot UI/UX polish.

## Gotchas surfaced today
- **index-corpus-topics commit step must keep its `git add` list in lockstep with
  SOURCE_META_PATHS** — a drift discarded a 3.5h/$12 retag (fixed #716; B-44 class).
  Also: it **cancels parallel dispatches** (concurrency group) — fire one source at a time.
- **Eval harness needs the polyfill** (jest 27 has no global fetch/ReadableStream) — undici
  + node:stream/web globals seeded in `load()`. Runs only under LUME_EVAL=1.
- **Lumé prompt is externalised** → `public/lume_system_prompt.txt`; tune there, redeploy.
- **Cost:** chat cap = default 50 / Mark (`markatmutter@gmail.com`) 10000. Be cost-conscious
  — validate cheap-first, watch background workflow runs to completion (the $12 waste was a
  silent background failure). Eval runs are ~$0.30–0.80.
- No local Node — jest + Vercel build verify in CI; UI verified by Mark on branch previews.
