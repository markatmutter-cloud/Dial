# Session handoff — 2026-06-18

**One-line:** Rebuilt the **Lumé tab** from a static page into a **morphing,
prompt-driven canvas**, then re-cut it to Mark's revised spec as a **guided
editorial session** (one "Start here" lead with visible evidence → curated
shelves → contextual chat rail). Shipped a **model-routing A/B switch** to
isolate weak-chat-feel (Haiku-tier vs prompt-overload), ran the diagnostic, and
reverted the temp force-Opus. Diagnosed a **credit burn** (~$50/day) to the
**eval workflow**, not live chat. All code merged + CI-green; nothing open,
nothing stranded (one parallel-session worktree noted below — not mine).

## What shipped (all merged this session, Epic 10)
- **#894** Morphing prompt-driven canvas (Phase 1): host-agnostic `LumeCanvas`
  with a view router (home/result/search/chat); journey cards → visual result
  panels (cards, not text-link lists).
- **#895** Unified in-canvas search over listings / sold / auctions.
- **#896** Warm, designed landing: greeting + hero + live counts.
- **#897** Desktop two-pane: content left, always-on chat rail right (380px).
- **#898** Perceptive greeting + **hook library** (`lumeHooks.js` `buildHook` →
  one named "it-knew-that" opener from real data) + top-3 context-ranked heroes.
- **#899** Warmer chat-rail cold open + saved-search hook grammar fix (quote the
  free-text label, don't pluralize it).
- **#900** `LUME_FORCE_SMART_MODEL` diagnostic switch + `chooseModel` /
  `MODEL_FAST` / `MODEL_SMART` moved into `api/lume_reference.js` (SDK-free so
  jest can import it; `api/chat.js` imports from there).
- **#901** **Guided editorial session** (Mark's revised spec): ONE `START HERE`
  lead with visible evidence (`buildLead` + `LumeLead`), curated shelves (Worth
  your attention / Useful comps / Rabbit holes via `LumeModule`, not feature
  categories), grounded reason chips (`lumeReasons.js` + `LumeReasonChip`),
  demoted counts, contextual session-guide rail ("Ask Lumé about this view",
  greeting-repeat removed), chat-driven search.
- **#902 → #903** Temp force-Opus for a live A/B, then reverted (chat back on the
  Haiku-default router).

## New client modules (all in `src/`, NOT `src/lib/` — `lib/` is gitignored)
- `lumeMissed.js` — client-safe `norm`/`urlKey`/`selectMissed`/`deriveTasteSets`
  (api/lume_reference.js imports fs/path, can't be bundled by CRA).
- `lumeColdOpen.js` — `readUsage`/`recordVisit`/`recordJourney`/`lumeColdOpen`/
  `buildGreeting`/`rankJourneys` (localStorage `lume_canvas_usage_v1`).
- `lumeHooks.js` — `buildHook` (perceptive opener) + `buildLead` (the lead with
  evidence).
- `lumeReasons.js` — `reasonFor(item, source)` grounded chips + `timeOnMarket`.
- Components: `LumeCanvas` `LumeLead` `LumeModule` `LumeReasonChip` `LumeHome`
  `LumeComposer` `lumeCards` `LumeConversation` (+ `onAction`).

## The credit burn — diagnosed, NOT fixed (logged B-76)
- Symptom: ~$50 Anthropic credit gone in <1 day; Mark assumed the temp-Opus push.
- Verified via Supabase `ai_chat_usage`: **live chat was Haiku-only and <$1**.
  The burn is the **eval/test path**: `.github/workflows/lume-eval.yml` triggers
  on `pull_request` for changes to `lume_system_prompt.txt` / `api/chat.js` /
  `api/lume_reference.js` / `src/lume_eval*`, and runs the full multi-turn suite
  against the **real** models (Opus-routed turns at $5/$25 per M) + an LLM judge.
  ~8 Lumé PRs this session each touched those paths → the suite ran ~8×; #902
  pushed every chat turn to Opus on top.
- **Fix (next session, cheap):** gate `lume-eval.yml` to `workflow_dispatch`
  (+ optional `schedule`) instead of per-PR — a one-line `on:` change. Plus set
  an **Anthropic Console spend alert/cap**. Keep the judge on Haiku. See **B-76**.
- Mark has reloaded / will reload credit. (Pricing reference, authoritative:
  Opus 4.8 $5/$25, Haiku 4.5 $1/$5 per M — Opus = 5×.)

## Build/test constraints carried (still true)
- **No local node/npm/jest/vercel** — CI is the only test gate. Shell tests render
  MOCK grids; leaf components (Card/CardShell) need their own direct render test or
  a ReferenceError ships green.
- `api/` is NOT linted by CRA eslint (only `src/`). jest can't import `api/chat.js`
  (Anthropic ESM SDK) — SDK-free logic lives in `api/lume_reference.js`.
- `eslint-config-react-app` `no-unused-vars` is `args:'none'`; `CI=true` turns
  warnings into errors.
- Tests added: `lume_missed_parity`, `lumeColdOpen`, `lumeReasons`,
  `lume_model_routing`, `lumeHooks`, `LumeTab`, `LumeLead`, `LumeModule`.

## MUST verify live (I can't run the app here)
- The guided-session **feel** on the real shell: one clear lead, curated shelves,
  reason chips + time-on-market on evidence cards, demoted counts, contextual
  rail, obvious (non-chatbox) search. Mark has been verifying via screenshots.

## Open / next
- **B-76 (do first, ~1 line):** gate `lume-eval.yml` off per-PR + add a spend cap.
- **Diagnosed next chat-quality levers (deferred):** prompt trim + chat-renders-
  cards-not-link-lists; the OpenAI/ChatGPT provider abstraction is parked (Mark:
  do the model A/B + design pass first — don't jump to the swap).
- **lume_probe** eval is the systematic chat-quality check (needs API key).
- **B-57** Cartier `WJTA0001` reference edit awaiting Mark's greenlight.
- Carried from 2026-06-16: Saved-tab restructure (promote Auctions to a top
  sub-tab) — logged ROADMAP Epic 9, not built, needs live verify.

## Process notes (mine)
- **Cost mis-diagnosis, corrected with data.** I first agreed the temp-Opus push
  burned the credit; the Supabase logs + per-call math proved it was the eval
  runs. Lesson: pull the usage data before attributing a cost spike.
- **Engine-swap mis-step.** I turned "let's get ChatGPT in" into an architecture
  quiz; Mark was disappointed. Reset to building with sensible defaults. Then he
  scoped it: model A/B + design pass FIRST, provider swap later.
- **Live verification = Mark's screenshots.** When I suggested "verify before
  building more," Mark pushed back — his screenshots *were* the verification.
  Don't re-ask for proof he's already given.

## Parallel-session note
- A worktree `.claude/worktrees/rm-finishing-soon` (branch `rm-finishing-soon`)
  is present — another live session's. Left untouched; not mine to clean.

## Don't bump (storage keys)
`LEGACY_WATCHLIST_KEY`, `LEGACY_HIDDEN_KEY`, `dial_watch_anon_id`,
`dial_collections_sub_tab`, `dial_listings_sub_tab`, `dial_watch_top_tab`,
`lume_opened_v1`, `lume_canvas_usage_v1` (new this session).
