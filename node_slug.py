"""Canonical reference-node slug from (brand, model_line).

Shared by the saved-node corpus builder; the same normalisation is mirrored in
JS (api/chat.js `nodeSlug`) for get_reference, with a fixture test asserting they
agree.

Folds variant model-line labels onto one node:
  Rolex + "Submariner (additions — gold variants)" -> "rolex-submariner"
  Rolex + "Sea-Dweller / Deepsea"                  -> "rolex-sea-dweller"
  Rolex + "GMT-Master / GMT-Master II"             -> "rolex-gmt-master"

node_aliases() also returns the legacy BARE model-line slug ("submariner") so the
two pre-existing hand-curated nodes (reference_synthesis_submariner/speedmaster)
keep resolving without renaming any committed files.
"""
from __future__ import annotations

import re


def _base_model(model_line: str) -> str:
    m = (model_line or "").strip()
    m = re.sub(r"\(.*?\)", "", m)                  # drop parentheticals
    m = re.split(r"\s+[—–-]\s+|\s*/\s*", m)[0]      # before " — " / " - " / " / "
    return m.strip()


def _slugify(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")


def node_slug(brand: str, model_line: str) -> str:
    """brand-modelline slug, variant labels folded. Collision-safe across brands."""
    return _slugify(f"{(brand or '').strip()} {_base_model(model_line)}")


def node_aliases(brand: str, model_line: str) -> list:
    """[full brand-modelline slug, legacy bare model-line slug]."""
    full = node_slug(brand, model_line)
    bare = _slugify(_base_model(model_line))
    out = [full]
    if bare and bare != full:
        out.append(bare)
    return out
