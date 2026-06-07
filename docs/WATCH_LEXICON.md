# Watch Lexicon — build brief

The bot's shorthand-normalization layer: expand watch slang / nicknames /
abbreviations → canonical fields **before** `api/chat.js` calls the grounding
tools. Spec'd by Mark 2026-05-29. Part of the Epic 9 concierge track; pairs
with the currency-inference work in [project_bot_language_currency] and feeds
the per-user profile build.

## What it is

Broader than "slang" — it's the **watch lexicon**: model nicknames + brand
abbreviations + dial/bezel/complication terms + era/condition jargon. One
machine-readable file the bot loads at runtime.

## Files

- **`public/watch_lexicon.json`** — machine-readable, loaded at runtime by
  `api/chat.js` exactly like `watch_references_index.json`. This is the artifact
  the bot reads.
- **`docs/watch_lexicon_seed.json`** — optional human-editable ChatGPT seed.
  The mining run emits `public/watch_lexicon.json`; the seed is the hand-curated
  starting point.

## Don't duplicate what already exists

The mining run must treat these as **already known** (seed them in) so it only
surfaces *new* terms (panda, QP, gilt, tropical, exotic dial, …):
- **Reference index** already carries per-model-line nicknames (Pepsi / Hulk /
  James Bond …) — `docs/watch_references.md` / `public/watch_references_index.json`.
- **`BRAND_ALIASES`** lives in `merge.py` + `utils.js` (lockstep).

## Entry format

One entry per term. The `canonical` block is what lets the bot normalize — it
maps to the **same fields the listings / reference data use** (brand /
model_line / reference / dial / bezel / complication), so normalization is a
clean lookup.

```json
{
  "terms": [
    { "term": "speedie", "aliases": ["speedy"], "type": "model_nickname",
      "canonical": { "brand": "Omega", "model_line": "Speedmaster" },
      "definition": "Omega Speedmaster", "confidence": 0.95, "evidence": "…quote…" },
    { "term": "panda", "type": "dial", "canonical": { "dial": "panda" },
      "definition": "white dial with contrasting black subdials" },
    { "term": "AP", "type": "brand_abbrev", "canonical": { "brand": "Audemars Piguet" },
      "definition": "Audemars Piguet" },
    { "term": "QP", "type": "complication_abbrev", "canonical": { "complication": "perpetual calendar" },
      "definition": "perpetual calendar" }
  ]
}
```

`type` ∈ `brand_abbrev` · `model_nickname` · `dial` · `bezel` ·
`complication_abbrev` · `era/condition` · `general`.

## Mining prompt

Run in **batches over corpus chunks** (editorial `*_bodies.json` +
`watch_references.md` notes) with the seed pasted in:

> You are building a watch-domain lexicon for a vintage-watch app.
> INPUTS: (1) a SEED list of terms already known: `<paste seed JSON + the
> reference-index nicknames>`. (2) a CHUNK of real watch-world text: `<paste chunk>`.
> TASK: Extract watch shorthand actually used in the chunk — slang, model
> nicknames, brand abbreviations, dial/bezel/complication terms, era/condition
> jargon — that is not already in the seed.
> RULES: Only terms attested in the chunk — quote the supporting phrase as
> evidence; never invent. Give a plain, correct definition and map to structured
> canonical fields where possible (brand / model_line / reference / complication
> / dial / bezel); if unsure, set `canonical: null` and lower confidence. Skip
> anything in the seed (match term or alias, case-insensitive).
> OUTPUT: a JSON array of `{term, aliases, type, canonical, definition, evidence,
> confidence}` only — no prose.

Then dedupe/merge the batch outputs into `public/watch_lexicon.json`.

## The runner

`mine_lexicon.py` — small script over `editorial_corpus_io` bodies, calling the
Anthropic API in batches **like `reference_synthesis.py`**. Reuse the corpus IO
helpers (never raw `json.load`/`dump` on corpus files) and the pinned
`requirements-ai.txt` install path. This is the "slang track" Claude owns.
