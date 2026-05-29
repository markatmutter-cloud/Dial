"""Mine a watch-domain lexicon from the corpus for Lumé.

Reads the human-edited seed (docs/watch_lexicon_seed.json), runs Claude over
prioritised corpus chunks (editorial `*_bodies.json` + the reference
deep-dives), and emits `public/watch_lexicon.json` — the deduped, mined lexicon
the concierge loads to normalise watch shorthand before grounding.

Per docs handoff (lume_watch_lexicon_research_handoff.md): the model only emits
terms ATTESTED in the chunk (with an evidence quote), skips anything already in
the seed / reference-index nicknames / BRAND_ALIASES, and maps to canonical
watch fields. The seed is prompt-cached so the big static prefix is cheap across
calls.

COST CONTROL (Mark is cost-conscious): bounded by --max-chunks and a source
priority order. Haiku by default. Use --dry-run to validate chunking/known-set
without any API spend (and to size a run).

Run in CI (mine-lexicon.yml, ANTHROPIC_API_KEY secret) or locally with the key
set. Pinned deps via requirements-ai.txt (anthropic).
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED_PATH = ROOT / "docs" / "watch_lexicon_seed.json"
REF_INDEX = ROOT / "public" / "watch_references_index.json"
MERGE_PY = ROOT / "merge.py"
PUBLIC = ROOT / "public"
OUT_PATH = PUBLIC / "watch_lexicon.json"

# Source priority (handoff §"Source priorities"): reference / collector guides
# first (canonical terms), then dealer/editorial prose (real-world phrasing).
PRIORITY_SOURCES = [
    "hodinkee_reference_points_bodies.json",
    "reference_corpus_submariner_bodies.json",
    "reference_corpus_speedmaster_bodies.json",
    "bring_a_loupe_bodies.json",
    "onthedash_bodies.json",
    "acollectedman_journal_bodies.json",
    "bulang_watch_talks_bodies.json",
    "woe_dispatch_bodies.json",
    "screwdowncrown_bodies.json",
    "christies_stories_bodies.json",
    "hairspring_finds_bodies.json",
    "rolex_magazine_bodies.json",
    "fratello_bodies.json",
    "hodinkee_shop_bodies.json",
]

CHUNK_CHARS = 6000  # ~1.5k tokens of corpus text per call
MAX_OUTPUT = 1500

TASK = """You are building a watch-domain lexicon for a vintage-watch app.

TASK: Extract watch shorthand actually USED in the CHUNK below — slang, model nicknames, brand abbreviations, dial/bezel/complication terms, era/condition jargon, bracelet/case/component jargon, and collector-intent language — that is NOT already in the SEED.

RULES:
- Only extract terms attested in the chunk. Quote the supporting phrase as `evidence`.
- Never invent terms or definitions. Give a plain, correct `definition`.
- Map to structured `canonical` fields where possible: brand, model_line, reference, complication, dial, bezel, component, condition, lume_material, movement, provenance, collector_intent. If unsure, set `canonical` to null and lower `confidence`.
- Skip anything already in the SEED, matching term or alias case-insensitively.
- `type` must be one of: brand_abbrev, model_nickname, dial, bezel, complication_abbrev, era/condition, general.
- Output VALID JSON only — a JSON array, no prose, no markdown fences.

OUTPUT: a JSON array where each item is {"term","aliases","type","canonical","definition","evidence","confidence"}."""


def load_known():
    """Return (seed, known-set). known = seed terms+aliases + reference-index
    nicknames + merge.py BRAND_ALIASES (all lowercased) — the miner skips these."""
    seed = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    known = set()
    for it in seed.get("terms", []):
        if it.get("term"):
            known.add(it["term"].lower())
        for a in it.get("aliases", []) or []:
            known.add(str(a).lower())
    # reference-index nicknames
    try:
        idx = json.loads(REF_INDEX.read_text(encoding="utf-8"))
        for _brand, lines in idx.items():
            for _ml, entry in (lines or {}).items():
                for nn in entry.get("nicknames", []) or []:
                    known.add(str(nn).lower())
    except Exception as e:  # noqa: BLE001
        print(f"[warn] reference index not loaded: {e}", file=sys.stderr)
    # BRAND_ALIASES from merge.py (best-effort regex; keys + values)
    try:
        txt = MERGE_PY.read_text(encoding="utf-8")
        m = re.search(r"BRAND_ALIASES\s*=\s*\{(.*?)\n\}", txt, re.DOTALL)
        if m:
            for k, v in re.findall(r'["\']([^"\']+)["\']\s*:\s*["\']([^"\']+)["\']', m.group(1)):
                known.add(k.lower())
                known.add(v.lower())
    except Exception as e:  # noqa: BLE001
        print(f"[warn] BRAND_ALIASES not parsed: {e}", file=sys.stderr)
    return seed, known


def iter_chunks(sources, max_chunks):
    n = 0
    for fname in sources:
        p = PUBLIC / fname
        if not p.exists():
            continue
        try:
            blob = json.loads(p.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            continue
        if not isinstance(blob, dict):
            continue
        for url, text in blob.items():
            if not isinstance(text, str) or len(text) < 200:
                continue
            for i in range(0, len(text), CHUNK_CHARS):
                if n >= max_chunks:
                    return
                yield {"source": fname, "url": url, "text": text[i:i + CHUNK_CHARS]}
                n += 1


def parse_json_array(s):
    s = (s or "").strip()
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z]*\n?", "", s)
        s = re.sub(r"\n?```$", "", s).strip()
    try:
        d = json.loads(s)
        return d if isinstance(d, list) else []
    except Exception:  # noqa: BLE001
        m = re.search(r"\[.*\]", s, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:  # noqa: BLE001
                return []
        return []


def merge_item(mined, item, source_url, known):
    if not isinstance(item, dict):
        return
    term = (item.get("term") or "").strip()
    if not term or term.lower() in known:
        return
    key = term.lower()
    quote = (item.get("evidence") or "").strip()
    ev = {"source": source_url, "quote": quote}
    if key in mined:
        m = mined[key]
        if quote:
            m["evidence_examples"].append(ev)
        if (item.get("confidence") or 0) > (m.get("confidence") or 0):
            m["canonical"] = item.get("canonical")
            m["confidence"] = item.get("confidence")
            if item.get("definition"):
                m["definition"] = item["definition"]
    else:
        mined[key] = {
            "term": term,
            "aliases": item.get("aliases", []) or [],
            "type": item.get("type", "general"),
            "canonical": item.get("canonical"),
            "definition": item.get("definition", ""),
            "evidence_examples": [ev] if quote else [],
            "confidence": item.get("confidence", 0.5),
        }


def main():
    ap = argparse.ArgumentParser(description="Mine the Lumé watch lexicon.")
    ap.add_argument("--max-chunks", type=int, default=150, help="cost cap (corpus chunks)")
    ap.add_argument("--sources", nargs="*", default=PRIORITY_SOURCES)
    ap.add_argument("--model", default=os.environ.get("LEXICON_MODEL", "claude-haiku-4-5"))
    ap.add_argument("--dry-run", action="store_true", help="no API calls — report sizing only")
    args = ap.parse_args()

    seed, known = load_known()
    chunks = list(iter_chunks(args.sources, args.max_chunks))
    print(f"seed terms: {len(seed.get('terms', []))} | known (skip) set: {len(known)} | chunks: {len(chunks)}")

    if args.dry_run:
        approx_tokens = sum(len(c["text"]) for c in chunks) // 4
        print(f"[dry-run] no API calls. ~{approx_tokens:,} corpus tokens across "
              f"{len(chunks)} chunks (model {args.model}).")
        by_src = {}
        for c in chunks:
            by_src[c["source"]] = by_src.get(c["source"], 0) + 1
        for s, n in by_src.items():
            print(f"  {n:>4}  {s}")
        return

    from anthropic import Anthropic  # imported lazily so --dry-run needs no SDK
    client = Anthropic()
    system = [
        {"type": "text", "text": TASK},
        {"type": "text",
         "text": "SEED (already known — skip these terms/aliases):\n" + json.dumps(seed, ensure_ascii=False),
         "cache_control": {"type": "ephemeral"}},
    ]

    mined = {}
    for i, chunk in enumerate(chunks, 1):
        try:
            resp = client.messages.create(
                model=args.model, max_tokens=MAX_OUTPUT, system=system,
                messages=[{"role": "user", "content": f"CHUNK (source={chunk['source']}):\n{chunk['text']}"}],
            )
            text = "".join(b.text for b in resp.content if b.type == "text")
        except Exception as e:  # noqa: BLE001
            print(f"[warn] chunk {i} failed: {e}", file=sys.stderr)
            continue
        for item in parse_json_array(text):
            merge_item(mined, item, chunk["url"], known)
        if i % 25 == 0:
            print(f"  …{i}/{len(chunks)} chunks, {len(mined)} new terms so far")

    out = {
        "schema_version": "1.0.0",
        "generated": datetime.date.today().isoformat(),
        "source": "seed + corpus-mined",
        "terms": seed.get("terms", []) + list(mined.values()),
    }
    OUT_PATH.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH.relative_to(ROOT)}: {len(seed.get('terms', []))} seed + "
          f"{len(mined)} mined = {len(out['terms'])} terms.")


if __name__ == "__main__":
    main()
