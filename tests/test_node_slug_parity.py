"""Python half of the JS≡Python node-slug parity guard.

Both this file and src/lume_reference.test.js read the SAME fixture
(tests/fixtures/node_slug_cases.json) and assert their language's slug logic
produces the listed slug + aliases. If node_slug.py and api/lume_reference.js
ever drift, exactly one suite goes red — Lumé's get_reference would otherwise
silently fail to resolve a saved node. Pure: no API, no Supabase, no I/O beyond
the fixture.
"""
import json
from pathlib import Path

from node_slug import node_slug, node_aliases

CASES = json.loads(
    (Path(__file__).parent / "fixtures" / "node_slug_cases.json").read_text()
)["cases"]


def test_slug_matches_fixture():
    for c in CASES:
        assert node_slug(c["brand"], c["model_line"]) == c["slug"], c
        assert node_aliases(c["brand"], c["model_line"]) == c["aliases"], c
