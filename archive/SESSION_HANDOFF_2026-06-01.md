# Session handoff — 2026-06-01

Supersedes SESSION_HANDOFF_2026-05-31.md (archived). A Lumé knowledge + testing day:
shipped web search, the first VERIFIED reference guide, the reference-enrichment SOP,
the knowledge-gap log, and a real eval harness (Phase 1) — then designed the testing
roadmap. **Next session pivots to the Lists tab UI; Lumé takes a deliberate break.**

## ⏭ Next session — Lists tab UI (NOT Lumé)
Mark wants to get back to **UI on the Lists tab** (internal `watchlist` /
`WatchlistTab.js`, UI label "Lists"). Lumé is parked. When Lumé resumes, the
orientation Mark asked for lives in **docs/LUME_ROADMAP.md → "State of Lumé
(2026-06-01) — resume brief"**: what we built, where we got to, how it fits the tool +
the ChatGPT-conversation model, and the behavioral target.

## ⚠ Open PRs — green, ready to merge (Mark merges)
Not orphans — this session's finished work, awaiting Mark's merge (the agent was
blocked from self-merging; Mark merges his own PRs):
- **#726** — reference hero rendered at 1600px (sharper banner; was 720 via imgSrc).
- **#727** — `lume_knowledge_gaps` log (migration ALREADY applied + verified via MCP).
- **#728** — Lumé eval Phase 1 (auto-gate + LLM-judge + grounding answer-key +
  N-sampling). The live-eval check is `continue-on-error` (informational), so it shows
  green even when a flaky scenario fails — read the run log for findings.

## What shipped (merged this session)
- **#722 Lumé web search** — Anthropic native `web_search`, corpus-FIRST, cited, max_uses 3.
- **#723 JLC E2643 reference guide** — first VERIFIED, source-authored node (not scraped);
  index entry + regenerated `watch_references_index.json`.
- **#724 Reference-enrichment runbook + helper** — `docs/REFERENCE_ENRICHMENT.md` +
  `scripts/add_reference_sources.py` (dedup/stub-append sources to a node).
- **#725 "Always suggest a next step" rule + config-requests ledger** —
  `docs/LUME_CONFIG_REQUESTS.md`.

## Testing harness — where we got to (Phase 1, in #728)
- Three tiers: free unit + render-smoke (every push) · the **behavioral eval**
  (`src/lume_eval.test.js`, now auto-gating on prompt/tool PRs, paid, ~$2-3/run).
- Phase 1 added: **LLM-judge** vs a charter rubric (`src/lume_eval_rubric.js`, 9 dims,
  6 critical) · **grounding answer-key** (`src/lume_eval_answer_key.js`, 8 verified
  facts from the Submariner + JLC guides) · **N-sampling** (majority 2/3 de-flake) ·
  **retrieval-source helper** (`groundingSource`/`groundedInKnowledge`/`ledWithListings`
  — the hook to assert the retrieval hierarchy next phase).
- **The eval works — it caught real bugs on day one** (quarantined as `[deferred]`,
  tracked in memory `project_lume_product_behavior_phase`): "tell me about X" →
  **ungrounded free-recall** (5513 scored grounded:2 — fabricated "2024 Rolex figures");
  the E2643 LeCoultre-signature error (temporal vs US-market); Tudor-snowflake free-recall;
  and from Mark's real transcript, **fabricated user history** ("given how carefully
  you've been tracking E2643s through Christie's…").
- Full strategy + budget split in `~/.claude/plans/radiant-exploring-pillow.md`.

## Lumé — the resumption picture (full brief in LUME_ROADMAP)
Diagnosis from Mark's ChatGPT working session + the eval: Lumé's failures are **plumbing,
not intelligence** — broken retrieval (doesn't surface our own guide → leads with a
listing or free-recalls), machinery-exposure, fabricated context. The #1 next fix is the
**retrieval hierarchy** (guide → notes → auctions → articles → listings → web; listings
must NOT outrank guides for learning prompts). Product-behavior phase spec (collecting-
guide reframe, collector-value scored rubric, Learn/Evaluate/Explore/Compare mode tests,
no-fabricated-history, possibly route "tell me about" turns to Opus) → memory
`project_lume_product_behavior_phase`.

## Gotchas surfaced today
- **Live eval is flaky-as-BINARY** — nondeterministic Lumé + small N means the failing
  scenario moves run-to-run even at 2/3 sampling. Don't chase a green binary gate; the
  real signal is the per-scenario pass-RATE **trend** (the scorecard — top Phase-1
  groundwork still unbuilt). Hence `continue-on-error`.
- **The gap log + verified guides + charter ledger = the eval's substrate** (signal /
  answer-key / rubric). This session's builds feed the testing roadmap directly.
- The pre-existing untracked files (`The Watch List — what Mark built.md`,
  `docs/WATCH_LEXICON.md`) are not ours — left untouched.
