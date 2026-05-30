"""Build per-node source manifests for the model lines users have SAVED, so the
reference-synthesis pipeline can deepen Lumé's knowledge of those watches.

Pipeline position (all reused, generic-by-slug):
  build_saved_node_corpus.py   → reference_sources/<slug>.json   (THIS script)
  reference_corpus_scraper.py  → public/reference_corpus_<slug>.json (+ bodies)
  reference_synthesis.py       → public/reference_synthesis_<slug>.json  (Opus, CI)

What it does:
 1. Reads SAVED watches (Supabase `watchlist_items` + `collection_items`
    listing_snapshot — ALL users, since syntheses are shared corpus), or a local
    `--from-json` sample (no Supabase/API — for dry-run + tests).
 2. Derives the distinct reference NODES (brand, model_line, refs) via node_slug.
    Skips brand-only (no model_line) + nodes that ALREADY have a synthesis
    (don't clobber the hand-curated Submariner/Speedmaster).
 3. AUTO-ASSEMBLES each node's corpus from the EXISTING editorial corpus: scans
    every `public/*_bodies.json` source, matches each article to a node by TITLE
    via reference_index_match.match_or_extract (+ structured meta + reference-index
    nicknames) — metadata is sparse so the title matcher does the work. Emits a
    `reference_sources/<slug>.json` whose sources[] are URLs we ALREADY hold (so
    reference_corpus_scraper reuses them — fetches nothing).
 4. THIN-corpus skip: < MIN_SOURCES with bodies → skip the node + log it.

Cost: zero (no API). Prints the emitted slug list (one per line) AND writes
reference_sources/_saved_slugs.txt for the workflow to feed the next stages.

Env (Supabase mode): SUPABASE_URL + SUPABASE_SERVICE_KEY (or _SERVICE_ROLE_KEY).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from node_slug import node_slug, node_aliases
import reference_index_match as rim

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
SOURCES_DIR = ROOT / "reference_sources"
REF_INDEX_MD = ROOT / "docs" / "watch_references.md"
REF_INDEX_JSON = PUBLIC / "watch_references_index.json"

MIN_SOURCES = 4          # below this a node is "thin" → skipped
MAX_SOURCES = 40         # cap per node (the hand-curated nodes are ~34) — keeps
                         # the Opus synthesis context + cost sane; longest bodies win
DEFAULT_MAX_NODES = 8    # cost cap on the downstream Opus runs


# ── saved watches ─────────────────────────────────────────────────────
def _supabase_rows(table, select):
    import requests  # lazy — keeps the module importable in the test env (no requests dep)
    base = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        print("ERROR: SUPABASE_SERVICE_KEY (or SUPABASE_SERVICE_ROLE_KEY) not set.", file=sys.stderr)
        sys.exit(1)
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"}
    r = requests.get(f"{base}/rest/v1/{table}", params={"select": select, "limit": "5000"},
                     headers=headers, timeout=30)
    r.raise_for_status()
    return r.json()


def load_saved_snapshots(from_json=None):
    """Return a list of {brand, model_line, ref} from saved watches."""
    rows = []
    if from_json:
        data = json.loads(Path(from_json).read_text(encoding="utf-8"))
        rows = data if isinstance(data, list) else data.get("snapshots", [])
        snaps = [{"listing_snapshot": s} if "listing_snapshot" not in s else s for s in rows]
    else:
        snaps = []
        snaps += _supabase_rows("watchlist_items", "listing_snapshot")
        snaps += _supabase_rows(
            "collection_items",
            "listing_snapshot,manual_brand,manual_model,manual_reference",
        )
    out = []
    for row in snaps:
        snap = row.get("listing_snapshot") or {}
        brand = snap.get("brand") or row.get("manual_brand") or ""
        model_line = snap.get("model_line") or snap.get("model") or row.get("manual_model") or ""
        ref = snap.get("reference_id") or snap.get("reference_no") or row.get("manual_reference") or ""
        out.append({"brand": str(brand).strip(), "model_line": str(model_line).strip(), "ref": str(ref).strip()})
    return out


def synthesis_exists(brand, model_line):
    for alias in node_aliases(brand, model_line):
        if (PUBLIC / f"reference_synthesis_{alias}.json").exists():
            return True
    return False


def derive_nodes(snapshots, max_nodes):
    """Distinct (brand, model_line) → node; skip no-model_line + already-synthesised."""
    nodes = {}  # slug -> {brand, model_line, refs:set}
    skipped_no_model = 0
    for s in snapshots:
        if not s["brand"] or not s["model_line"]:
            skipped_no_model += 1
            continue
        slug = node_slug(s["brand"], s["model_line"])
        if not slug:
            skipped_no_model += 1
            continue
        n = nodes.setdefault(slug, {"brand": s["brand"], "model_line": s["model_line"], "refs": set()})
        if s["ref"]:
            n["refs"].add(s["ref"])
    # Drop nodes that already have a (hand-curated) synthesis.
    fresh = {k: v for k, v in nodes.items() if not synthesis_exists(v["brand"], v["model_line"])}
    have = [k for k in nodes if k not in fresh]
    # Most-saved (by ref count, then breadth) first; cap for cost.
    ordered = sorted(fresh.items(), key=lambda kv: (-len(kv[1]["refs"]), kv[0]))
    capped = dict(ordered[:max_nodes])
    return capped, {"skipped_no_model": skipped_no_model, "already_have": have, "dropped_over_cap": len(fresh) - len(capped)}


# ── corpus matching ───────────────────────────────────────────────────
def build_matcher():
    if not REF_INDEX_MD.exists():
        return None
    brands = rim.parse_index(REF_INDEX_MD.read_text(encoding="utf-8"))
    return {
        "ref_index": rim.build_ref_index(brands),
        "model_name_index": rim.build_model_name_index(brands),
        "brands_in_index": set(brands.keys()),
    }


def build_nickname_map():
    """lower(nickname) -> node slug, from the curated index nicknames."""
    out = {}
    try:
        idx = json.loads(REF_INDEX_JSON.read_text(encoding="utf-8"))
    except Exception:
        return out
    for brand, lines in idx.items():
        for ml, entry in (lines or {}).items():
            for nn in entry.get("nicknames", []) or []:
                if nn:
                    out.setdefault(str(nn).lower(), node_slug(brand, ml))
    return out


def editorial_sources():
    """[(meta_dict, bodies_dict, name)] for each editorial source (paired *_bodies.json)."""
    out = []
    for bodies_path in sorted(PUBLIC.glob("*_bodies.json")):
        name = bodies_path.name[: -len("_bodies.json")]
        if name.startswith("reference_corpus"):
            continue  # those are per-node corpora, not source editorial
        meta_path = PUBLIC / f"{name}.json"
        if not meta_path.exists():
            continue
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            bodies = json.loads(bodies_path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if isinstance(meta, dict) and isinstance(bodies, dict):
            out.append((meta, bodies, name))
    return out


def article_slug(rec, matcher, nick_map):
    """Best node slug for an editorial article, or None."""
    title = rec.get("title") or ""
    meta_brand = rec.get("brand") or None
    # 1) structured meta already resolves.
    if rec.get("model_line") and (rec.get("brand")):
        return node_slug(rec["brand"], rec["model_line"])
    # 2) title matcher (the workhorse — metadata is sparse).
    if matcher and title:
        hit = rim.match_or_extract(
            title, matcher["ref_index"], brand=meta_brand,
            brands_in_index=matcher["brands_in_index"], model_name_index=matcher["model_name_index"],
        )
        if hit and hit.get("model_line") and (hit.get("brand") or meta_brand):
            return node_slug(hit.get("brand") or meta_brand, hit["model_line"])
    # 3) nickname in title.
    low = title.lower()
    for nn, slug in nick_map.items():
        if nn and nn in low:
            return slug
    return None


def main():
    ap = argparse.ArgumentParser(description="Build saved-watch reference-node manifests.")
    ap.add_argument("--from-json", help="local sample of saved snapshots (no Supabase/API)")
    ap.add_argument("--max-nodes", type=int, default=DEFAULT_MAX_NODES)
    ap.add_argument("--min-sources", type=int, default=MIN_SOURCES)
    ap.add_argument("--max-sources", type=int, default=MAX_SOURCES)
    args = ap.parse_args()

    snapshots = load_saved_snapshots(args.from_json)
    nodes, stats = derive_nodes(snapshots, args.max_nodes)
    print(f"saved snapshots: {len(snapshots)} | candidate nodes: {len(nodes)} "
          f"| skipped(no model_line): {stats['skipped_no_model']} "
          f"| already synthesised: {len(stats['already_have'])} "
          f"| dropped over --max-nodes: {stats['dropped_over_cap']}")
    if not nodes:
        print("No new nodes to build.")
        return

    matcher = build_matcher()
    nick_map = build_nickname_map()

    # Group editorial article URLs by node slug (one pass over the corpus).
    by_slug = {}  # slug -> list of (url, rec, publication)
    target_slugs = set()
    for slug, n in nodes.items():
        for a in node_aliases(n["brand"], n["model_line"]):
            target_slugs.add(a)
    for meta, bodies, name in editorial_sources():
        for url, rec in meta.items():
            if not isinstance(rec, dict):
                continue
            body = bodies.get(url)
            if not isinstance(body, str) or len(body) < 200:
                continue
            slug = article_slug(rec, matcher, nick_map)
            if slug and slug in target_slugs:
                by_slug.setdefault(slug, []).append((url, rec, name, len(body)))

    SOURCES_DIR.mkdir(exist_ok=True)
    emitted, thin = [], []
    for slug, n in nodes.items():
        # collect under the full slug + any alias, de-dupe by url (longest body wins)
        arts = []
        for a in node_aliases(n["brand"], n["model_line"]):
            arts += by_slug.get(a, [])
        best = {}
        for url, rec, name, blen in arts:
            if url not in best or blen > best[url][3]:
                best[url] = (url, rec, name, blen)
        # Most substantive articles first; cap for synthesis context/cost.
        ranked = sorted(best.values(), key=lambda t: -t[3])[: args.max_sources]
        if len(ranked) < args.min_sources:
            thin.append((slug, len(ranked)))
            continue
        sources = [{
            "url": url,
            "title": rec.get("title") or "",
            "publication": rec.get("source") or rec.get("publication") or name,
            "author": rec.get("author") or "",
            "type": rec.get("source_type") or "editorial",
            "focus": n["model_line"],
        } for url, rec, name, _blen in ranked]
        manifest = {
            "node": slug,
            "brand": n["brand"],
            "model_line": n["model_line"],
            "reference_focus": sorted(n["refs"]),
            "where_next_refs": [],
            "auto_generated": True,
            "sources": sources,
        }
        (SOURCES_DIR / f"{slug}.json").write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        emitted.append(slug)
        print(f"  ✓ {slug}: {len(sources)} sources")

    for slug, n_src in thin:
        print(f"  – thin (skip): {slug} ({n_src} sources < {args.min_sources})")

    (SOURCES_DIR / "_saved_slugs.txt").write_text("\n".join(emitted) + ("\n" if emitted else ""), encoding="utf-8")
    print(f"\nEmitted {len(emitted)} manifest(s): {' '.join(emitted) if emitted else '(none)'}")


if __name__ == "__main__":
    main()
