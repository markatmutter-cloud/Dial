# Reference enrichment — adding new links/articles to a reference

The runbook for: *"I found extra sources about reference X — how do I get them
into the guide AND make them available to Lumé, without duplicating, scraping
junk, or leaving them untagged?"*

This is the demand-driven sibling of the synthesis pipeline (see
[REFERENCE_INTELLIGENCE.md](REFERENCE_INTELLIGENCE.md)). It's also the back half
of the **knowledge-gap loop**: Lumé's web search surfaces what our corpus can't
answer → you research it → you enrich the reference here → Lumé can now answer it
from the moat.

## What to enrich next — the gap backlog

You don't have to guess what to author. Every turn where Lumé reaches the open web
is logged to `public.lume_knowledge_gaps` (question · the search queries it ran ·
the URLs it cited · whether it tried the corpus first). That's a **demand-ranked
backlog**: the topics real users ask that our corpus can't answer — with the
research URLs already gathered. Read it (admin / MCP) with:

```sql
-- recent gaps
select created_at, question, queries, corpus_tried
from public.lume_knowledge_gaps order by created_at desc limit 50;

-- rough demand ranking: which search terms recur most
select jsonb_array_elements_text(queries) as query, count(*) as n
from public.lume_knowledge_gaps group by 1 order by n desc limit 30;
```

A recurring gap → author/enrich that reference (steps below); the cited URLs in
the row are your starting source list. Once it's in the corpus, Lumé stops needing
the web for it and the gap stops recurring — the loop closes.

## The three homes a source can live in

A source can feed up to three places, and **Lumé reaches each differently** — so
decide which you want before you start:

| Home | File(s) | How Lumé uses it | LLM? |
|---|---|---|---|
| **Guide node** | `src/data/referencePages/<name>.js` | Shown on the reference page; `read_more` links to it | No — hand-curated |
| **Editorial corpus** | per-source corpus JSON (via `editorial_corpus_io`) | `search_articles` — Lumé's searchable **knowledge** | Tagging only |
| **Reference synthesis** | `reference_sources/<slug>.json` → `public/reference_synthesis_<slug>.json` | `get_reference` deep-dive + the page's "Debated"/"Stories" sections | Yes — Opus |

"Make it available to Lumé" almost always means **the synthesis sources** (and/or
the editorial corpus). Citing it on the guide page is curation, not knowledge.

## The process

### 1. Triage the link
Is it a great **read** to cite on the page, factual **knowledge** Lumé should be
able to search, or **both**? Most good sources are both — cite on the page *and*
feed the synthesis.

### 2. Dedup + stub-append to the manifest (the helper does this)
Never double-add a source. Run:

```bash
# report only — see what's new vs already known
python3 scripts/add_reference_sources.py <slug> <url> [<url> ...] --dry-run

# or from a pasted list
python3 scripts/add_reference_sources.py <slug> --file new_urls.txt --dry-run
```

It scans the target manifest, **every** other `reference_sources/*.json`, and
every `public/reference_corpus_*.json` (already-scraped bodies) and reports each
URL as new or a duplicate (and where the dupe lives). Drop `--dry-run` to append
the genuinely-new ones as **stub** source objects:

```json
{ "url": "…", "title": "", "publication": "", "type": "", "focus": "" }
```

New node that doesn't have a manifest yet? Add `--create` to start a skeleton
(then fill `brand` / `model_line` / `reference_focus`).

### 3. Curate the stubs
Open `reference_sources/<slug>.json` and fill each new source's `title`,
`publication`, `type` (e.g. `definitive-guide`, `auction-record`, `dealer`,
`forum`, `brand-official`), and `focus` (one line on what it uniquely adds).
Quality of `focus` directly improves the synthesis.

### 4. Scrape + synthesise (the LLM pass)
- Ensure the slug is listed in `reference_sources/_saved_slugs.txt`.
- Trigger the **synthesise-saved-nodes** workflow (`.github/workflows/synthesise-saved-nodes.yml`):
  run `dry_run: yes` first (assembles + validates, no Opus cost), then
  `dry_run: no` with `max_nodes: 1` to synthesise just this node.
- It runs **scrape → Opus synthesis → readable digest**:
  `reference_corpus_scraper.py` → `reference_synthesis.py` → `reference_digest.py`,
  writing `public/reference_corpus_<slug>.json`, `public/reference_synthesis_<slug>.json`,
  and `docs/reference_synthesis_<slug>.md`.

> ⚠️ **Review the digest before it lands.** The workflow currently commits to
> `main` without a CI gate (BUGS.md **B-44**) — read `docs/reference_synthesis_<slug>.md`
> and sanity-check the consensus claims/citations. Fix any synthesis error in the
> digest/JSON before relying on it.

### 5. Tag + index (mostly automatic)
The reference matcher (`reference_index_match.py`) and topic/mentality tagging run
**inside the scrape paths** — they fill `reference_id` / `model` / `model_line`
(only when empty) and topic themes. If the source is a brand/model not yet in the
index, add it to `docs/watch_references.md` and regenerate:

```bash
python3 build_references_index.py   # rewrites public/watch_references_index.json
```

### 6. Cite it on the guide page (optional but nice)
Hand-add the best sources to the node's `guides` / `marks` / `variants` /
`storiesAndImages` with `title`, `publication`, `url`, `img`, and a `blurb`.
Keep the voice intrinsic and every link source-credited (see
`rolexSubmariner_5512_5513.js` / `jlcSharkVogue_e2643.js` for the shape).

### 7. Verify in Lumé
Ask Lumé about the reference and confirm the new material surfaces **with a
citation** (`get_reference` for synthesis claims, `search_articles` for corpus
articles). If it doesn't, check the slug made it into `_saved_slugs.txt` and the
synthesis JSON actually contains the new claims.

## Quick reference

| You have… | Do this |
|---|---|
| A few links for an **existing** synthesised node | steps 2 → 3 → 4 → 7 |
| Links for a node with **no synthesis yet** | step 2 `--create` → 3 → ensure `_saved_slugs.txt` → 4 |
| A link that's purely a **good read** | step 6 only (cite on the page) |
| A **new reference** entirely | add to `docs/watch_references.md` + `build_references_index.py`, then author a guide node (see the JLC E2643 build), then steps 2-4 to give it synthesis |
