# Session handoff — 2026-05-30

Supersedes SESSION_HANDOFF_2026-05-29.md (archived; don't fold into CLAUDE.md).

## Where we are

**Lumé (Epic 9 AI spine) is live and healthy.** Phase A v1 + Phase 2 shipped.
The whole arc over 2026-05-29/30: concierge bubble → offer→do actions →
lexicon Phase 1 → generic reference grounding → 5 saved-node syntheses → a
production timeout fix. All on `main`, all green, endpoint verified (clean 401).

### Shipped this session (see SHIPPED.md Epic 9 cluster for the list)
- **#702 — Lumé Phase 2.** `get_reference` is now generic (serves any saved
  model line's deep-dive by node slug; returns named dial "marks"). SYSTEM_PROMPT
  externalised → `public/lume_system_prompt.txt` (tune Lumé = edit prose + redeploy;
  short in-code FALLBACK so a missing file can't 500). Pure corpus logic split into
  `api/lume_reference.js` so jest covers it; `node_slug_cases.json` guards JS≡Python
  slug parity.
- **Saved-node fan-out.** Mined 607 saved watches → synthesised + committed 5
  source-cited deep-dives: heuer-carrera, heuer-autavia, omega-seamaster-300,
  rolex-day-date, rolex-datejust. Lumé's deep coverage went 2 → 7 model lines.
- **#700/#701 — Lumé icon.** Flat vintage-patina biscuit (#D6BC88) lume-triangle,
  no gradient/edge, pale-mint glow.
- **#703 — workflow `min_sources` input** (used to drop the thin 5-source AP node).
- **#704 — timeout hotfix.** `api/chat` had no `maxDuration` → Opus tool-loop turns
  were killed at Vercel's ~10–15s default = the "Something went wrong" outage Mark
  hit. Set to 60s. Same PR repaired two tests the fan-out had broken on main.

### Quota state (changed via SQL this session)
- `default_chat_cap()` = **50** (restored post-demo from the lifted 100000).
- Mark (`markatmutter@gmail.com`, user `3bf3f9e7-…`) `user_limits.chat_cap` = **10000**
  (CHECK ceiling; effectively uncapped for testing). `chat_cap` CHECK is 0..10000 —
  can't set a personal cap higher than 10000.

## Open / next (priority order)

1. **⭐ Attribute-level search — B-45 (the headline Lumé limitation).** Lumé can't
   search "Datejust, stainless, silver dial, no numerals" — `search_listings` only
   does brand/model/ref/price/title-substring; structured facets (case material, dial
   colour, markers, bezel, size) aren't extracted/indexed. Same substrate the
   recommender needs. Likely the biggest uplift to Lumé's usefulness. **Plan-mode it.**
   Direction: LLM attribute-extraction pass in `merge.py` → faceted search, OR
   embedding/semantic search.
2. **Fluid AI profile / memory store** ([[project_ai_profile_memory]]) — Mark's stated
   priority: persist transcripts + an evolving per-user taste profile, consent + Settings
   toggle. The recommender substrate. Plan-mode build.
3. **AI bot UI/UX** — Mark wants this as its OWN session (don't fold into the profile
   build). The bubble's interaction/visual polish pass.
4. **B-44 — fan-out workflow commits to main with no CI gate** (what turned main red).
   Fix: have it open a PR, or run tests before the commit step.
5. Smaller: lexicon Phase 2 mining run; budget-currency inference
   ([[project_bot_language_currency]]); About/Nexus 3-voice page
   ([[project_about_page_sections]]).

## Gotchas surfaced this session
- The saved-node fan-out commits straight to main **without CI** — it broke tests
  silently (B-44). Until fixed, after any fan-out run check `main` CI is green.
- Tests that assert a node is *un-synthesised* are fragile (the fan-out fills them).
  `derive_nodes` now takes an injectable `synth_exists`; the jest get_reference test
  asserts the no-fabrication invariant instead of a specific absence.
- No local Node — jest + Vercel build only verify in CI. pytest runs locally.
- `chat_cap` CHECK caps personal overrides at 10000.
