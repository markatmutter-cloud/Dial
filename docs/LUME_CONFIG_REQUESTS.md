# Lumé config requests — the ledger

A running log of Mark's **"make Lumé do X"** behavioral/config requests, so none
get lost and the encoded behaviour can be audited against intent.

**Three docs, three jobs:**
- **This file** — the chronological *request ledger* (what was asked, when, where
  it landed, status).
- [LUME_ROADMAP.md](LUME_ROADMAP.md) *Behavioral charter* — the synthesised
  *principles* those requests roll up into.
- **`public/lume_system_prompt.txt`** — the *operational source of truth*; the
  externalised prompt Lumé actually runs (edit there + redeploy to change behaviour).

When Mark fires a behavioral request (often prefixed nothing / `Remember:` / mid-
test), add a row here, encode it in the prompt, and note where.

## How to add a request
1. Add a row to the table (date · request in plain English · where encoded · status).
2. Encode it in `public/lume_system_prompt.txt` (the relevant section).
3. If it's a durable principle, fold it into the LUME_ROADMAP charter too.
4. Redeploy; if there's an eval scenario that guards it, add/adjust it (`src/lume_eval.test.js`).

## Ledger

| Date | Request (plain English) | Encoded in | Status |
|---|---|---|---|
| 2026-05-31 | **Always suggest a next step from Lumé's real capability** — every reply ends with a concrete, do-able next step; never offer what it can't do. | prompt `NEVER DEAD-END — ALWAYS SUGGEST A NEXT STEP`; memory `feedback_lume_always_next_step` | ✅ prompt |
| 2026-05-31 | **Web search, but corpus-first + always cite** — reach beyond our library only when the corpus is empty; knowledge only (never inventory); cite sources. | prompt `REACHING BEYOND OUR LIBRARY`; PR #722 | ✅ shipped |
| 2026-05-31 | **Never tell a user their real listing is mislabeled** on an unverified belief — defer to the evidence, flag uncertainty humbly. | prompt `WHEN YOU DON'T HAVE IT`; BUGS B-46 | ✅ prompt |
| 2026-05-31 | **Don't quote listing counts; "there are N listed", never "we have N"** — taste statements are a conversation, not a search. | prompt `DON'T QUOTE LISTING COUNTS`; PR #713 (B-53) | ✅ shipped |
| 2026-05-31 | **Knowledge-first, humble, no plumbing-talk** — answer ABOUT a watch with knowledge before listings; if the corpus lacks it, say so plainly, never explain internal mechanics. | prompt `ANSWER ABOUT THE WATCH`, `WHEN YOU DON'T HAVE IT`; PR #709 (B-49) | ✅ shipped |
| 2026-05-31 | **Know the filter limits — coach, don't thrash** — can't filter dial colour/material/markers; don't loop search on attributes, steer instead. | prompt `PITCH YOUR SEARCH AT THE RIGHT LEVEL`; BUGS B-45/B-49 | ✅ prompt (real fix = B-45 attribute search) |
| 2026-05-29 | **Accuracy over colour** — pin dates/specs to tool output; if unsure, omit rather than embellish. | prompt `ACCURACY BEATS COLOUR`; BUGS B-40 | ✅ prompt |
| 2026-05-29 | **Never join multiple references in one query** (ANDs → 0 results). | prompt `SEARCH — KEEP THE QUERY FILTERABLE`; BUGS B-42 | ✅ shipped |
| 2026-05-29 | **Header name + descriptor; friendlier cold open** that says what Lumé can do. | client greeting + header (`ChatBubbleHost.js`); BUGS B-42 | ✅ shipped |
| ongoing | **Grounding is non-negotiable** — state watch facts only from a tool; always include a source URL. | prompt `GROUNDING` | ✅ prompt |
| ongoing | **Scope = watches, porous at the edges** — relevance test, hard-refuse the genuinely unrelated. | LUME_ROADMAP charter #4 | ⏳ partial (tighten in prompt) |
| ongoing | **No hierarchy / diminishment** — never "starter/entry-level/overshadowed"; describe watches intrinsically + laterally. | prompt `VOICE`; memory `feedback_reference_voice_intrinsic` | ✅ prompt |

## Queued (requested, not yet encoded)
- **Watch-slang normalisation before grounding** (AP/speedie/sub/QP/panda → canonical) — partly via the lexicon glossary; full pass = lexicon Phase 2. (memory `project_bot_language_currency`)
- **Currency inferred from locale, but confirm** (GBP "50k" = £50k) — folds into the profile build. (memory `project_bot_language_currency`)
- **Tier-gate web search** (anon corpus-only · subscriber web+Opus) — economics in memory `project_lume_web_search_gaps`.
