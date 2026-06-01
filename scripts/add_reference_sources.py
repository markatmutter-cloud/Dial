#!/usr/bin/env python3
"""
add_reference_sources.py — dedup + stub-append new source URLs to a reference
node's manifest (reference_sources/<slug>.json), ready for you to curate and run
the synthesise workflow.

This is step 2-4 of the reference-enrichment runbook (docs/REFERENCE_ENRICHMENT.md):
you have extra links/articles for a reference and want them in the corpus + guide.
The script does the boring part — checks each URL isn't already known anywhere,
then appends the genuinely-new ones as STUB source objects for you to fill in
(title / publication / type / focus) before synthesising.

It does NOT scrape or call an LLM — that's the synthesise workflow's job. It only
curates the manifest so you never double-add a source.

Usage:
  python3 scripts/add_reference_sources.py <slug> <url> [<url> ...]
  python3 scripts/add_reference_sources.py <slug> --file urls.txt
  python3 scripts/add_reference_sources.py <slug> --create <url> ...   # make a skeleton manifest first
  python3 scripts/add_reference_sources.py <slug> --dry-run <url> ...  # report only, write nothing

Dedup scans, in order: the target manifest, EVERY other reference_sources/*.json
manifest, and every public/reference_corpus_*.json (the already-scraped bodies).
A URL found in any of them is reported as a duplicate and skipped.
"""
import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES_DIR = ROOT / "reference_sources"
PUBLIC = ROOT / "public"


def norm_url(u):
    """Normalise for comparison: drop scheme, leading www., trailing slash, lowercase."""
    if not isinstance(u, str):
        return ""
    s = u.strip().lower()
    for pre in ("https://", "http://"):
        if s.startswith(pre):
            s = s[len(pre):]
            break
    if s.startswith("www."):
        s = s[4:]
    return s.rstrip("/")


def walk_urls(obj):
    """Yield every value under a 'url' key, anywhere in a nested JSON structure."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "url" and isinstance(v, str):
                yield v
            else:
                yield from walk_urls(v)
    elif isinstance(obj, list):
        for it in obj:
            yield from walk_urls(it)


def load_known_urls(target_path):
    """Map normalised-url -> human label of where it already lives."""
    known = {}
    scan = list(SOURCES_DIR.glob("*.json")) + list(PUBLIC.glob("reference_corpus_*.json"))
    for p in scan:
        try:
            data = json.loads(p.read_text())
        except Exception:
            continue
        for u in walk_urls(data):
            n = norm_url(u)
            if n and n not in known:
                known[n] = p.name
    return known


def main():
    ap = argparse.ArgumentParser(description="Dedup + stub-append source URLs to a reference manifest.")
    ap.add_argument("slug", help="node slug, e.g. submariner or jlc-shark-vogue (file: reference_sources/<slug>.json)")
    ap.add_argument("urls", nargs="*", help="source URLs to add")
    ap.add_argument("--file", help="read URLs from a file (one per line, blank lines / # comments ignored)")
    ap.add_argument("--create", action="store_true", help="create a skeleton manifest if it doesn't exist")
    ap.add_argument("--dry-run", action="store_true", help="report only; write nothing")
    args = ap.parse_args()

    target = SOURCES_DIR / f"{args.slug}.json"

    urls = list(args.urls)
    if args.file:
        for line in Path(args.file).read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                urls.append(line)
    if not urls:
        ap.error("no URLs given (pass them as args or via --file)")

    # Load or create the target manifest.
    if target.exists():
        manifest = json.loads(target.read_text())
    elif args.create:
        manifest = {
            "node": args.slug,
            "brand": "",
            "model_line": "",
            "reference_focus": [],
            "where_next_refs": [],
            "sources": [],
            "books": [],
        }
        print(f"• creating skeleton manifest {target.name} (fill brand / model_line / reference_focus)")
    else:
        sys.exit(f"ERROR: {target} not found. Re-run with --create to start a new node, "
                 f"or check the slug (existing: {', '.join(sorted(p.stem for p in SOURCES_DIR.glob('*.json')))}).")

    manifest.setdefault("sources", [])
    known = load_known_urls(target)
    # Also dedup against URLs already queued earlier in THIS run.
    seen_this_run = set()

    added, dupes = [], []
    for u in urls:
        n = norm_url(u)
        if not n:
            continue
        if n in known:
            dupes.append((u, known[n]))
        elif n in seen_this_run:
            dupes.append((u, "(repeated in this run)"))
        else:
            seen_this_run.add(n)
            manifest["sources"].append({
                "url": u.strip(),
                "title": "",
                "publication": "",
                "type": "",
                "focus": "",
            })
            added.append(u)

    print(f"\n{len(added)} new · {len(dupes)} duplicate(s) skipped\n")
    for u in added:
        print(f"  + {u}")
    for u, where in dupes:
        print(f"  = {u}   (already in {where})")

    if args.dry_run:
        print("\n[dry-run] nothing written.")
        return
    if added:
        target.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
        print(f"\nWrote {target.name} (+{len(added)} stub source(s)). "
              f"Next: fill title/publication/type/focus, add the slug to "
              f"reference_sources/_saved_slugs.txt, then run the synthesise-saved-nodes workflow.")
    else:
        print("\nNothing to write — all URLs already known.")


if __name__ == "__main__":
    main()
