"""Guards for the saved-watch node pipeline (node_slug + node derivation).

Pure / read-only — no API, no Supabase, no file writes (derive_nodes only reads
public/). The corpus-assembly + synthesis stages run in CI.
"""
from pathlib import Path

from node_slug import node_slug, node_aliases
import build_saved_node_corpus as b

FIXTURE = str(Path(__file__).parent / "fixtures" / "saved_sample.json")


def test_slug_folds_variant_labels():
    assert node_slug("Rolex", "Submariner") == "rolex-submariner"
    # parentheticals + " — " variants fold to one node
    assert node_slug("Rolex", "Submariner (additions — gold variants)") == "rolex-submariner"
    # " / " takes the first segment
    assert node_slug("Rolex", "GMT-Master / GMT-Master II") == "rolex-gmt-master"
    assert node_slug("Rolex", "Sea-Dweller / Deepsea") == "rolex-sea-dweller"
    # hyphenated model names (no surrounding spaces) are NOT split
    assert node_slug("Rolex", "Day-Date") == "rolex-day-date"


def test_aliases_include_legacy_bare_slug():
    # the two pre-existing hand-curated nodes keep resolving via the bare alias
    assert node_aliases("Omega", "Speedmaster") == ["omega-speedmaster", "speedmaster"]
    assert node_aliases("Rolex", "Submariner") == ["rolex-submariner", "submariner"]


def test_derive_nodes_folds_and_skips_already_synthesised():
    snaps = b.load_saved_snapshots(FIXTURE)
    nodes, stats = b.derive_nodes(snaps, max_nodes=8)
    # Submariner + its "(additions…)" variant fold to one node, which already has
    # a hand-curated synthesis → excluded from the fresh set, reported as "have".
    assert "rolex-submariner" not in nodes
    assert "rolex-submariner" in stats["already_have"]
    # New nodes are derived for synthesis.
    assert "rolex-datejust" in nodes
    assert "rolex-gmt-master" in nodes
    assert stats["skipped_no_model"] == 0
