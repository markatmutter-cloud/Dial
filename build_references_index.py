"""Emit a machine-readable JSON form of the curated reference index.

`docs/watch_references.md` is human-authored markdown. The AI concierge
(api/chat.js `get_reference` tool) and any other programmatic consumer
need it as JSON to ground answers in canonical brand → model-line → ref
data. This script reuses `reference_index_match.parse_index` (the same
regex parser the matcher already runs) so there is ONE parser, and writes
`public/watch_references_index.json`.

Shape:
    {
      "<Brand>": {
        "<Model line>": {
          "refs": ["5512", "5513", ...],
          "nicknames": ["James Bond", ...],
          "years": "1953–present",
          "notes": "<prose>"
        }, ...
      }, ...
    }

Re-run whenever watch_references.md changes (wire into the build/scrape
pipeline). Idempotent. Doesn't touch any other file.
"""

from __future__ import annotations

import json
from pathlib import Path

from reference_index_match import INDEX_PATH, parse_index

ROOT = Path(__file__).parent
OUT_PATH = ROOT / "public" / "watch_references_index.json"


def build() -> dict:
    text = INDEX_PATH.read_text(encoding="utf-8")
    # parse_index → {brand: [{model_line, refs, nicknames, years, notes}, ...]}
    # Reshape to brand → {model_line: {...}} so a lookup by (brand, line)
    # is O(1) for the matcher/bot, and model_line keys read cleanly.
    parsed = parse_index(text)
    out: dict[str, dict] = {}
    for brand, lines in parsed.items():
        out[brand] = {}
        for ml in lines:
            name = ml.get("model_line") or ""
            if not name:
                continue
            out[brand][name] = {
                "refs": ml.get("refs", []),
                "nicknames": ml.get("nicknames", []),
                "years": ml.get("years", ""),
                "notes": ml.get("notes", ""),
            }
    return out


def main() -> None:
    index = build()
    OUT_PATH.write_text(
        json.dumps(index, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    n_brands = len(index)
    n_lines = sum(len(v) for v in index.values())
    n_refs = sum(len(ml["refs"]) for v in index.values() for ml in v.values())
    print(f"Wrote {OUT_PATH.relative_to(ROOT)}: "
          f"{n_brands} brands, {n_lines} model lines, {n_refs} refs.")


if __name__ == "__main__":
    main()
