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
(B-52) + **article heart/⋯** (B-37); **Lumé remembers you** (ai_user_profile taste-memory
store + reliable RPC write + Settings on/off/reset panel); **explore-not-shop + hedge +
exposed-code-leak fixes**. Mentality tagging fully done on the 5 essay sources (383
articles). **Mark authorised Claude to merge PRs** this session — merge on green only.

## Open / next (priority order)

1. **In-app share links** (Mark keeps flagging this). Listing links Lumé gives go to the
   external DEALER, and article links to the raw SOURCE — should both open the app's
   `/share/<id>` surface so the user stays in-app + can save. Fix: make `search_listings`
   return an in-app share URL per listing + tell Lumé to link to that (not the dealer url).
   Check the share-id scheme (e.g. the-watch-list.app/share/f49153c5e1fa). Build an in-app
   ARTICLE view too (B-51).
2. **Index Tudor snowflake reference data** (the REAL accuracy fix). Lumé asserted "7021 is
   the only dated snowflake" — wrong (9411 has a date, per its own linked source). The new
   prompt HEDGES, but the durable fix is getting Tudor Submariner (snowflake) into the
   reference index/synthesis (reference_sources/<slug> → corpus → reference_synthesis.py).
3. **Lumé sees on-screen context** (last UI-cluster piece). Filters are App.js React STATE
   (filterBrands/Models/Sources/search/tab), NOT the URL. **Hook-safe:** a self-contained
   `<LumeContextPublisher>` App mounts next to the shell → a `LumeContext` bus; ChatBubbleHost
   reads it at send-time. Do NOT add a hook deep in App.js after the early returns (#310).
   Reuses B-52's LumeBus.
4. **Coaching mode** — actually USE the 383 mentality-tagged articles: a "how to be a better
   collector / the psychology" experience (pillar 2). search_articles returns `themes`.
5. **Search by attributes (B-45)** — the big one Mark keeps hitting: enrich listings with
   facets (material/dial colour/markers) so "gold / silver dial / no-numerals" is filterable.
   Recommender substrate.
6. **Discovery eval** — LLM-judge over generated prompts, graded vs LUME_UX_PRINCIPLES +
   the charter + BRAND, to find NEW issues (regression scenarios already guard fixes).
   NB current eval: **8/9 green**; 1 slip = attribute-in-query on wordy "advice" phrasing
   (a quick prompt tighten).
7. **Explorer-as-Submariner (B-54)** — 14270 wrongly filed under Submariner in
   `watch_references_index.json`; fix the index + re-tag + the brand-resolution gap.
8. **Cheap mentality top-up** — retag the 3 small sources (bring_a_loupe / onthedash /
   hodinkee_reference, ~50¢) for more coaching coverage. Fire SEQUENTIALLY (concurrency
   cancels parallel). Big sources stay un-tagged (low yield).
9. Then: **recommender (pillar 5)** · **proactive nudges (pillar 6)** · **onboarding/dossier
   coaching** · **per-user depth tiers** · lexicon Phase 2 · About page · bot UI/UX polish.

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
