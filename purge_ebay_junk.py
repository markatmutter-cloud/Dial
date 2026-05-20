#!/usr/bin/env python3
"""One-shot purge: drop eBay items that don't pass the tightened
filters in data/ebay_searches.json.

Mark feedback 2026-05-20: eBay clogging the feed with shitty
watches. PR_I added per-search `must_contain` + `exclude_keywords`
to the scraper, but existing eBay items in state.json /
listings.json predate the tightening — they need a one-shot
cleanup so the live UI clears immediately, not after the items
naturally expire from eBay over the next few weeks.

What it does:
  1. Loads data/ebay_searches.json
  2. Loads public/state.json + public/listings.json
  3. For each eBay item, applies the SAME per-search filter logic
     the scraper now uses
  4. Drops items that pass no active search

Run from repo root:
    python3 purge_ebay_junk.py            # dry-run, shows what would drop
    python3 purge_ebay_junk.py --apply    # write the cleaned files

Re-runnable. If a future search broadens the filters again, just
delete from state.json by hand or re-tighten via ebay_searches.json
and re-run.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

EBAY_SEARCHES = Path("data/ebay_searches.json")
LISTINGS = Path("public/listings.json")
STATE = Path("public/state.json")


def load_searches() -> list[dict]:
    if not EBAY_SEARCHES.exists():
        print(f"ERROR: {EBAY_SEARCHES} missing.", file=sys.stderr)
        sys.exit(1)
    with EBAY_SEARCHES.open() as f:
        data = json.load(f)
    return [s for s in data if isinstance(s, dict) and not s.get("_note") and s.get("query")]


def title_passes_search(title: str, search: dict) -> bool:
    """Mirror of ebay_search_scraper._excluded_by_search_filter — but
    returns the inverse (True = keep). Same logic, kept in lockstep."""
    if not title:
        return False
    tl = title.lower()
    must = search.get("must_contain") or []
    if must and not any(s.lower() in tl for s in must if isinstance(s, str)):
        return False
    for kw in (search.get("exclude_keywords") or []):
        if isinstance(kw, str) and kw.lower() in tl:
            return False
    return True


def item_passes_any_search(title: str, searches: list[dict]) -> bool:
    """Item is kept if it passes the filters of AT LEAST ONE active
    search. (An item that matched search A's query but doesn't fit
    A's tightened filters AND doesn't fit B's filters is junk.)"""
    return any(title_passes_search(title, s) for s in searches)


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--apply", action="store_true",
                        help="Write cleaned files. Default is dry-run.")
    args = parser.parse_args()

    searches = load_searches()
    if not searches:
        print("No active searches with queries. Nothing to do.")
        return

    print(f"Loaded {len(searches)} active eBay searches:")
    for s in searches:
        print(f"  - {s.get('label')}: must_contain={s.get('must_contain') or '[]'}, "
              f"exclude_keywords={s.get('exclude_keywords') or '[]'}")
    print()

    # listings.json — current snapshot, array of items.
    with LISTINGS.open() as f:
        listings = json.load(f)
    arr = listings if isinstance(listings, list) else list(listings.values())
    ebay_items = [a for a in arr if isinstance(a, dict) and a.get("source") == "eBay"]
    purge_listings = [a for a in ebay_items if not item_passes_any_search(a.get("ref", ""), searches)]

    print(f"listings.json: {len(ebay_items)} eBay items total, "
          f"{len(purge_listings)} would be purged.")
    if purge_listings[:8]:
        print(f"  Sample to-be-purged:")
        for a in purge_listings[:8]:
            print(f"    - {a.get('ref', '')[:100]}")
    print()

    # state.json — durable cross-run memory, dict keyed by stable_id.
    with STATE.open() as f:
        state = json.load(f)
    ebay_state = [(k, v) for k, v in state.items()
                  if isinstance(v, dict) and v.get("lastSource") == "eBay"]
    purge_state_keys = [
        k for k, v in ebay_state
        if not item_passes_any_search(v.get("lastTitle", ""), searches)
    ]
    print(f"state.json: {len(ebay_state)} eBay records total, "
          f"{len(purge_state_keys)} would be purged.")

    if not args.apply:
        print("\nDry-run only. Pass --apply to write.")
        return

    # Apply: write cleaned listings.json + state.json.
    keep_listings = [a for a in arr if not (
        isinstance(a, dict) and a.get("source") == "eBay"
        and not item_passes_any_search(a.get("ref", ""), searches)
    )]
    with LISTINGS.open("w") as f:
        json.dump(keep_listings, f, ensure_ascii=False, indent=0)
        f.write("\n")
    print(f"  Wrote {LISTINGS}: dropped {len(arr) - len(keep_listings)} item(s).")

    for k in purge_state_keys:
        del state[k]
    with STATE.open("w") as f:
        json.dump(state, f, ensure_ascii=False, indent=0)
        f.write("\n")
    print(f"  Wrote {STATE}: dropped {len(purge_state_keys)} record(s).")


if __name__ == "__main__":
    main()
