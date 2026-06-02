"""Brand-aware reference matching (B-54, 2026-06-02).

Guards two related fixes:
  1. Rolex 14270 belongs to Explorer, not Submariner (was mis-filed in the
     curated index; the Explorer refs sat under a parser-invisible
     `**Refs (Explorer)**` label and were never indexed).
  2. match_against_index prefers a same-brand token when a brand hint is
     given, so a leading year that collides with another brand's reference
     (e.g. "1991" → Cartier Panthère ref 1991) can't shadow the real ref in
     "1991 Rolex Explorer 14270".
"""
from pathlib import Path

import pytest

from reference_index_match import (
    parse_index,
    build_ref_index,
    build_model_name_index,
    match_or_extract,
    match_against_index,
)

INDEX_MD = Path(__file__).resolve().parents[1] / "docs" / "watch_references.md"


@pytest.fixture(scope="module")
def indices():
    brands = parse_index(INDEX_MD.read_text())
    return {
        "brands": brands,
        "ref_index": build_ref_index(brands),
        "model_name_index": build_model_name_index(brands),
        "brands_in_index": set(brands.keys()),
    }


def test_14270_maps_to_explorer_not_submariner(indices):
    entries = indices["ref_index"].get("14270")
    assert entries, "14270 should be indexed"
    model_lines = {ml for (_b, ml, _raw) in entries}
    assert all("Explorer" in ml for ml in model_lines), model_lines
    assert not any("Submariner" in ml for ml in model_lines), model_lines


def test_explorer_refs_are_indexed(indices):
    # Previously orphaned under the parser-invisible "Refs (Explorer)" label.
    for ref in ("14270", "114270", "214270", "124270", "224270", "216570"):
        assert indices["ref_index"].get(ref), f"{ref} should be indexed"


def test_leading_year_does_not_shadow_real_ref(indices):
    # "1991" is Cartier Panthère ref 1991 — must not win over Rolex 14270.
    hit = match_or_extract(
        "1991 Rolex Explorer 14270",
        indices["ref_index"],
        brand="Rolex",
        brands_in_index=indices["brands_in_index"],
        model_name_index=indices["model_name_index"],
    )
    assert hit and hit["brand"] == "Rolex"
    assert "Explorer" in (hit["model_line"] or "")
    assert hit["reference_id"] == "14270"


def test_brandless_match_unchanged(indices):
    # Editorial callers pass no brand — first-hit behaviour must be preserved.
    hit = match_against_index("Rolex Submariner 5513", indices["ref_index"])
    assert hit and hit["brand"] == "Rolex" and "Submariner" in hit["model_line"]
