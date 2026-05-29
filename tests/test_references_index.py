"""Shape guard for build_references_index.build (Epic 9 PR2).

build_references_index.py reuses reference_index_match.parse_index to emit
public/watch_references_index.json — the machine-readable reference index
the AI concierge's get_reference tool grounds on. This test asserts the
emitted structure stays the shape the endpoint expects (brand → model_line
→ {refs, nicknames, years, notes}), so a parser change can't silently
reshape what api/chat.js reads.
"""
import build_references_index


def test_build_shape():
    index = build_references_index.build()
    assert isinstance(index, dict) and index, "index should be a non-empty dict"

    # Spot-check a known anchor: Rolex Submariner with the 5513 reference.
    assert "Rolex" in index, "Rolex should be present"
    sub = index["Rolex"].get("Submariner")
    assert sub is not None, "Rolex → Submariner model line expected"
    assert "5513" in sub["refs"], "Submariner refs should include 5513"

    # Every leaf carries the four fields the endpoint reads, correctly typed.
    for brand, lines in index.items():
        assert isinstance(brand, str) and brand
        for ml, entry in lines.items():
            assert isinstance(ml, str) and ml
            assert set(entry.keys()) == {"refs", "nicknames", "years", "notes"}
            assert isinstance(entry["refs"], list)
            assert isinstance(entry["nicknames"], list)
            assert isinstance(entry["years"], str)
            assert isinstance(entry["notes"], str)
