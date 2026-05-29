# Watchlist — Session Handoff (2026-05-29, **Lumé AI concierge** build)

Conventions: [CLAUDE.md](CLAUDE.md). Direction: [ROADMAP.md](ROADMAP.md).
History: [SHIPPED.md](SHIPPED.md). Backlog: [BUGS.md](BUGS.md). The earlier 05-29
handoff (UI-tidy/polish batch, #670–#676) is superseded by this one — recoverable
via git.

> **This is the in-session compaction anchor.** Everything below is **built and
> merged to `main`** (real code, not aspirational). If context compacts, this doc
> + the memory files named at the bottom hold the full state. The next phase is at
> the end.

## TL;DR
Built the **Lumé watch-expert concierge end-to-end** (ROADMAP Epic 9, "AI
spine") — grounded chat that only answers from our corpus + cites, a floating
bubble, the **offer→do action set**, and a **watch lexicon (phase 1)**. ~18 PRs,
all CI-green, **all merged to `main`**. `ANTHROPIC_API_KEY` is live in Vercel
(Production+Preview) + GitHub. **Next phase:** deepen Lumé's knowledge of the
user's *saved* watches by mining the corpus for per-reference insights (it
currently trips on watch/reference detail), plus **prompt-behaviour tuning**.

## What's built + merged (the Lumé system) — file map
- **Endpoint `api/chat.js`** (the brain). Verifies the Supabase JWT (user_id from
  the token, never the body) → `consume_chat_quota` RPC (20/day cap, P0001→429)
  **before** any spend → manual tool-use loop. **Haiku default, Opus routed** on
  compare/why/recommend turns. Prompt-caches the system prefix.
  - **Grounding tools (cite-or-don't):** `get_user_context` (RLS reads of the
    caller's hearts/searches/owned/tracked/sold-this-week), `search_listings`
    (returns each item's `id`), `get_auction_state`, `get_reference` (curated
    index + the Submariner/Speedmaster syntheses).
  - **`SYSTEM_PROMPT`** = **Lumé's entire voice + behaviour** — THIS is where "how
    Lumé reacts to prompts" is tuned (one versioned constant). Cold-open rapport,
    accuracy-over-colour, never-dead-end, intrinsic/no-hierarchy house style,
    OFFER-ACTIONS spec.
  - **Structured actions:** model appends `<actions>[…]</actions>`; endpoint
    extracts/validates vs `ACTION_TYPES` allow-list (only wired types)/clamps ≤3/
    strips → returns `{reply, actions, model}`.
  - **Lexicon glossary** injected as a cached system block (`buildLexiconGlossary`)
    so Lumé expands shorthand (speedie/panda/QP/DON) before grounding.
- **Actions bus:** `src/components/ActionBus.js` (module-level dispatch/register,
  ConfirmModal pattern) + the registration `useEffect` in `App.js` (after
  `liveStateById`). **Six actions:** `show_listings`, `open_watch` (→ ShareReceiver
  external `openTick`/`openListingId` trigger), `read_more`, `add_to_list` /
  `create_list` (→ `openCollectionPicker`), `save_note` (→ `NotePickerModal` +
  `addNoteToCollection` in supabase.js).
- **Bubble `src/components/ChatBubbleHost.js`** — mounted next to `<ConfirmHost/>`
  (decoupled, no shellProps). Header "**Lumé · Watch chat**", auto-expanding
  textarea, markdown + clickable links, thinking dots, action buttons that
  **minimise the bubble on success** (see result behind), 429 banner, signed-in
  only, panel ring+shadow to lift off the olive chrome.
- **Mark `src/components/LumeIcon.js`** — white inverted triangle (~1:1.5) on a
  brand-olive circle (a 20%-smaller + soft lume-glow tweak is in flight, PR #694).
- **DB:** `supabase/schema/2026-05-29_ai_chat_usage.sql` — `ai_chat_usage` +
  `consume_chat_quota`/`log_chat_tokens`/`set_chat_cap_by_email` (default 20/day;
  per-user override via `user_limits.chat_cap`). **Applied to the live DB.**
- **Reference index:** `build_references_index.py` → `public/watch_references_index.json`
  (26 brands / 1849 refs; reuses `reference_index_match.parse_index`).
- **Lexicon:** `public/watch_lexicon.json` (88-term ChatGPT seed = **phase 1, live**),
  `docs/watch_lexicon_seed.json`; **phase-2 tooling** `scripts/mine_lexicon.py`
  + `.github/workflows/mine-lexicon.yml` (Claude over the corpus in CI, cost-capped
  via `max_chunks`; full corpus ≈ 16.8k chunks / 15M tokens → keep scoped). NOT run yet.

## Ops / config
- `ANTHROPIC_API_KEY`: **Vercel Production+Preview** and GitHub Actions; server-only
  (api/chat.js). Endpoint live; smoke-tested (401 unauth / 405 GET).
- Models `claude-haiku-4-5` default, `claude-opus-4-8` for hard turns. 20 msgs/day/user.
- Lexicon phase 2: Actions → "Mine watch lexicon (phase 2)" → Run workflow → pick `max_chunks`.

## Queued follow-ups (tree clean — buildable now). Detail: memory project_lume_followups
- **B-42:** **reference-search bug** (real defect — `show_listings` AND-ed two refs
  in the filter → 0 results; fix = a SINGLE ref in the SEARCH box, App.js) + a
  friendlier server cold-open (SYSTEM_PROMPT).
- **B-43 launcher/onboarding** (ChatBubbleHost): "**Ask me**" translucent callout;
  **speech-bubble** launcher shape; "**Lumé (loo-may)**" pronunciation; **signed-out →
  sign-in prompt** (show launcher, tap → signInWithGoogle); **device-native dictation**
  mic in the composer.
- In flight: **#694** (triangle 20% smaller + lume glow).

## ⭐ NEXT PHASE (after compaction — the focus)
**1. Deepen Lumé's saved-watch knowledge (priority).** Watch/reference details trip
Lumé up because grounding for arbitrary refs is thin (only 2 deep-dive syntheses +
the index + raw editorial search). Plan: **mine the corpus for detailed,
source-cited insights about the references/models the user has SAVED**
(hearts/lists/owned) and store them so `get_reference` returns real depth —
extend the existing **reference-synthesis** pattern (`reference_synthesis.py` →
`public/reference_synthesis_<node>.json`, like Submariner/Speedmaster) to the
user's saved nodes. Decide first: which nodes to synthesise (driven by saved
data?), storage shape, retrieval wiring into `get_reference`, cost/triggering
(CI, scoped). See memory reference_synthesis_outputs, project_direction_collecting_intelligence.

**2. Prompt-behaviour tuning ("how Lumé reacts" — where it's saved).** Lives in
**`SYSTEM_PROMPT` in `api/chat.js`** today (one constant). As it grows, decide
whether to **externalise it** (e.g. `docs/lume_system_prompt.md` loaded at runtime)
for easier iteration/versioning. This is the lever for the prompt-reaction issues
Mark hits.

(Also open: lexicon **phase 2** run; the fluid **profile/memory store** —
recommender substrate, memory project_ai_profile_memory; **content** = About/Nexus
3 sections, memory project_about_page_sections.)

## Memory anchors (durable detail; survives compaction)
project_ai_concierge_bot · project_ai_profile_memory · project_lume_followups ·
project_bot_language_currency · project_about_page_sections ·
feedback_reference_voice_intrinsic · feedback_recommender_trust · anthropic_api_config.
