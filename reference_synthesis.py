#!/usr/bin/env python3
"""Reference synthesis — Stage 2 of the reference-intelligence pipeline
(scrape → synthesis → RAG).

Reads a node's reference corpus (public/reference_corpus_<node>.json[+_bodies])
and runs ONE Claude Opus 4.7 pass producing a structured, source-grounded
synthesis: model-level context, consensus facts (each cited to source URLs),
each source's unique contribution, mark explanations, agreements/conflicts, the
interesting stories, module candidates, and a gap report. Writes
public/reference_synthesis_<node>.json for human review before it feeds a page.

Design (per the claude-api skill):
  - model claude-opus-4-7; adaptive thinking + effort=high.
  - the corpus + frozen instructions live in `system` with a cache breakpoint so
    re-runs (and the future RAG pass) read the cache instead of re-paying.
  - structured output via output_config.format (json_schema); streamed because
    the output is large.

Voice rules baked into the prompt (BRAND.md / memory feedback_reference_voice_intrinsic):
about the WATCH, never about collectors' journey/typology; no hierarchy or
diminishment; relationships lateral; "famous for X" ok. Synthesised, never
near-verbatim — every claim cites its source URL(s).

Run:  ANTHROPIC_API_KEY=... python3 reference_synthesis.py [submariner speedmaster]
Deps: requirements-pipeline.txt (anthropic).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import anthropic

from editorial_corpus_io import load_existing, derive_bodies_path

PUBLIC = Path("public")
SOURCES_DIR = Path("reference_sources")
MODEL = "claude-opus-4-7"
BODY_CAP = 12000  # chars per source — keeps token cost sane; 1M ctx handles the rest

INSTRUCTIONS = """\
You are building a source-grounded reference guide for a single watch model line \
and its anchor reference(s). You are given a CORPUS of source articles (each with \
a URL, publication, and body text) plus the node's metadata.

Produce a synthesis that a knowledgeable editor will review before publishing.

VOICE & STANCE (non-negotiable):
- Write about the WATCH — its history, design, variants, what to look for, the \
human/cultural stories. NEVER about collectors' journey, taste, or "where they \
are"; no typology. No hierarchy or diminishment — never "starter/entry/first \
serious", never rank a watch as lesser or "overshadowed". Describe watch-to-watch \
relationships LATERALLY (linked / alternative / complementary), never up/down a \
ladder. "Famous for / widely regarded for X" is fine.
- SYNTHESISE — never reproduce source prose near-verbatim. Facts aren't \
copyrightable; the author's exact words are. Paraphrase.

GROUNDING (non-negotiable):
- Every consensus claim must cite the source URL(s) it rests on (>=1, prefer >=2).
- Where sources disagree, record BOTH positions with their sources — do not \
smooth it over. Flag claims that are contested or that sources hedge.
- Do not invent sources or URLs. Only cite URLs present in the corpus.

REQUIRED COVERAGE:
- model_context: where this model sits in the brand's range, why it was made, \
  where it came from, and why people wanted it (the demand story). This must be \
  first-class — do not let it get crowded out by reference-level minutiae.
- The interesting/surprising human stories (who wore it, who loved it, notable \
  examples) — surface the genuinely distinctive ones with a one-line "why", not \
  the repetitive coverage.
- Module candidates: which adjacent topics (e.g. Bond, COMEX, MilSub, \
  Sea-Dweller, Alaska Project, Snoopy) deserve their own page later.
- Gaps: what's missing or thin, and which sources to add next.
"""

SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "model_context": {"type": "string"},
        "consensus": {
            "type": "array",
            "items": {
                "type": "object", "additionalProperties": False,
                "properties": {
                    "claim": {"type": "string"},
                    "sources": {"type": "array", "items": {"type": "string"}},
                    "confidence": {"type": "string", "enum": ["high", "medium", "low"]},
                },
                "required": ["claim", "sources", "confidence"],
            },
        },
        "source_contributions": {
            "type": "array",
            "items": {
                "type": "object", "additionalProperties": False,
                "properties": {
                    "source": {"type": "string"},
                    "publication": {"type": "string"},
                    "unique_contribution": {"type": "string"},
                },
                "required": ["source", "publication", "unique_contribution"],
            },
        },
        "marks": {
            "type": "array",
            "items": {
                "type": "object", "additionalProperties": False,
                "properties": {
                    "name": {"type": "string"},
                    "explanation": {"type": "string"},
                    "sources": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["name", "explanation", "sources"],
            },
        },
        "conflicts": {
            "type": "array",
            "items": {
                "type": "object", "additionalProperties": False,
                "properties": {
                    "topic": {"type": "string"},
                    "positions": {"type": "array", "items": {"type": "string"}},
                    "note": {"type": "string"},
                },
                "required": ["topic", "positions", "note"],
            },
        },
        "stories": {
            "type": "array",
            "items": {
                "type": "object", "additionalProperties": False,
                "properties": {
                    "title": {"type": "string"},
                    "why": {"type": "string"},
                    "source": {"type": "string"},
                },
                "required": ["title", "why", "source"],
            },
        },
        "module_candidates": {
            "type": "array",
            "items": {
                "type": "object", "additionalProperties": False,
                "properties": {
                    "module": {"type": "string"},
                    "rationale": {"type": "string"},
                },
                "required": ["module", "rationale"],
            },
        },
        "gaps": {
            "type": "array",
            "items": {
                "type": "object", "additionalProperties": False,
                "properties": {
                    "gap": {"type": "string"},
                    "suggestion": {"type": "string"},
                },
                "required": ["gap", "suggestion"],
            },
        },
    },
    "required": [
        "model_context", "consensus", "source_contributions", "marks",
        "conflicts", "stories", "module_candidates", "gaps",
    ],
}


def build_corpus_block(node: str) -> tuple[str, int]:
    manifest = json.loads((SOURCES_DIR / f"{node}.json").read_text())
    meta_path = PUBLIC / f"reference_corpus_{node}.json"
    records = load_existing(meta_path, derive_bodies_path(meta_path))

    header = {
        "brand": manifest["brand"],
        "model_line": manifest["model_line"],
        "reference_focus": manifest.get("reference_focus"),
        "framing_note": manifest.get("framing", ""),
        "where_next_refs": manifest.get("where_next_refs", []),
    }
    parts = [f"NODE METADATA:\n{json.dumps(header, ensure_ascii=False, indent=2)}\n"]
    used = 0
    # deterministic order (sorted URLs) so the cached prefix is stable
    for url in sorted(records):
        rec = records[url]
        body = (rec.get("body_text") or "").strip()
        if not body:
            continue  # bot-blocked / link-only — cited in metadata, no body to synthesise
        if len(body) > BODY_CAP:
            body = body[:BODY_CAP] + " …[truncated]"
        used += 1
        parts.append(
            f"\n----- SOURCE -----\n"
            f"URL: {url}\nPublication: {rec.get('publication','')}\n"
            f"Title: {rec.get('title','')}\nFocus: {rec.get('focus','')}\n\n{body}\n"
        )
    return "\n".join(parts), used


def synthesise(node: str) -> None:
    corpus, n_sources = build_corpus_block(node)
    print(f"=== {node}: synthesising over {n_sources} sources ({len(corpus):,} chars) ===")
    client = anthropic.Anthropic()

    with client.messages.stream(
        model=MODEL,
        max_tokens=32000,
        thinking={"type": "adaptive"},
        output_config={"effort": "high", "format": {"type": "json_schema", "schema": SCHEMA}},
        system=[
            {"type": "text", "text": INSTRUCTIONS},
            {"type": "text", "text": "CORPUS:\n" + corpus, "cache_control": {"type": "ephemeral"}},
        ],
        messages=[{"role": "user", "content": f"Synthesise the {node} corpus into the required structured guide."}],
    ) as stream:
        msg = stream.get_final_message()

    text = next((b.text for b in msg.content if b.type == "text"), "")
    data = json.loads(text)
    out_path = PUBLIC / f"reference_synthesis_{node}.json"
    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2, sort_keys=True))

    u = msg.usage
    print(f"--- {node}: wrote {out_path}")
    print(f"    consensus={len(data['consensus'])} marks={len(data['marks'])} "
          f"stories={len(data['stories'])} conflicts={len(data['conflicts'])} "
          f"modules={len(data['module_candidates'])} gaps={len(data['gaps'])}")
    print(f"    tokens: in={u.input_tokens} cache_write={u.cache_creation_input_tokens} "
          f"cache_read={u.cache_read_input_tokens} out={u.output_tokens}")


if __name__ == "__main__":
    nodes = sys.argv[1:] or ["submariner", "speedmaster"]
    for n in nodes:
        try:
            synthesise(n)
        except anthropic.AuthenticationError:
            sys.exit("ANTHROPIC_API_KEY missing or invalid.")
        except FileNotFoundError as e:
            print(f"[skip {n}: {e} — run reference_corpus_scraper.py first]")
