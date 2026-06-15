# Session handoff — 2026-06-09

**One-line:** Built the Lumé **"What You Missed"** feature end-to-end (voice +
retrieval + journey + two same-session bug-fix rounds found in real testing),
plus closed the open scraper defects (B-58/59/60). Recurring lesson, now a rule:
**test the conversation / real path, not the plumbing.**

## What shipped (8 PRs, all merged)

**Scrapers (Epic 0/1):**
- **#859 B-60** — scrape-health gate: a final `always()` step fails the workflow
  when any source produced no CSV (or `verify_sources` logs ERROR), so the
  existing notifier opens an issue. Closes the silent-rot gap that hid B-58.
- **#860 B-59** — Watch Club liveness fix: keyed "sold" on `status==30` (not
  `status=="1"`); recovered ~48 live listings, unfroze the source. (B-58 was
  already self-healed by the curl_cffi probe; confirmed.)

**Lumé "What You Missed" (Epic 10) — the main build, 5 PRs:**
- **#861 voice** — merged the tone brief into `lume_system_prompt.txt` (plain
  words, open-with-substance, no-price-ladder, never-invent-constructs, concrete
  reasons, recommendation distance, don't-pad, the missed-this-week workflow) +
  a CI static guard (`lume_prompt_guard.test.js`) + live tone evals. Full brief
  saved as **docs/LUME_TONE_GUIDANCE.md** (the design bible).
- **#862 retrieval** — `find_missed` tool, saved-state aware, 3 modes:
  `live_unsaved` / `sold_unsaved` (the ones that got away, sorted fastest-sale
  first w/ `time_to_sell_days` + sold price) / `sold_saved`. Pure `selectMissed`
  unit-tested.
- **#863 journey** — body links → in-app shared surface, "← Back" control, chips
  stay clickable.
- **#864 link-every-watch** — every surfaced watch linked inline up front;
  never re-search and claim a watch already shown "isn't in our system"; no
  counts for find_missed.
- **#868 in-app routing + em-dash** — resolve reply links by **URL match** (the
  feed id is merge.py SHA1, which `shortHash` never reproduces — the hash-based
  resolver sent every link to the dealer); strip em-dashes **server-side** in
  api/chat.js (model ignores the rule unreliably).
- **#865 tools/lume_probe.py** — conversation+judge eval: runs multi-turn
  scenarios through the real prompt+data on the real models, judges each reply
  against the tone rubric. **Not yet run** (needs the API key, see below).

## The story (read this)

The feature was repeatedly green-in-CI but broken-in-conversation, because the
tests checked the **data plumbing / mocks** instead of the **real conversation
or real resolution**:
1. find_missed unit tests passed; Mark's first real chat showed no inline links,
   a lossy cross-turn re-search, and "isn't in our system" for a watch just
   shown. Fixed in #864 — **verified by running the actual conversation** (via
   Claude subagents driven by the real prompt + real tool data).
2. The PR3 in-app routing render test **mocked the resolver**; the real resolver
   hashed URLs with the wrong function and never matched, so every link went to
   the dealer. Fixed in #868 with a **real** resolution test (`url_resolver.test.js`).

Rule saved to memory + CLAUDE.md: for Lumé/AI, verify by running real
conversations (multi-turn) and reading the answers; for resolvers, test the real
lookup, not a mock. ([[feedback_test_the_conversation]])

## Open / next

- **Run the probe.** Drop the key into a gitignored `.env.local`
  (`ANTHROPIC_API_KEY=sk-ant-…`) and run `python3 tools/lume_probe.py` — 6
  multi-turn scenarios + LLM judge against LUME_TONE_GUIDANCE. This is the
  systematic replacement for finding issues one-at-a-time live.
- **B — in-app reference card for SOLD got-away items** (ROADMAP Epic 10). Their
  links still open externally; they're not in the live feed so there's no in-app
  target yet. The clear next build.
- **C — progression chips** ("show more / push further / widen to a month")
  instead of duplicate-link chips, + the model reliably emitting an actions
  block. (Mark flagged this in the original review.)
- **The home Lumé surface** (Epic 10) is gated on tone being reliable — the
  probe is the gate.

## B-57 (carried)

The two flagged refs were **adjudicated via web search (research only, no index
edit)**: **Cartier WJTA0001** → the "Crash Tigrée" label is wrong (`TA`=Tank
family; real Crash Tigrée is HP101529) → remove from the Crash Refs line, keep
under Tank Américaine. **Breitling 765** → no misfile (annotated "covered above"
cross-ref). The one-line Cartier edit awaits Mark's greenlight.

## Don't bump (storage keys)

`LEGACY_WATCHLIST_KEY`, `LEGACY_HIDDEN_KEY`, `dial_watch_anon_id`,
`dial_collections_sub_tab`, `dial_listings_sub_tab`, `dial_watch_top_tab`.
