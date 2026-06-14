#!/usr/bin/env python3
"""
Per-house auction health check (B-75).

The dealer scrape-health gate (B-66) catches a *dealer* source that produced
no CSV. The AUCTION side has its own silent-failure mode that bit us
repeatedly in June 2026:
  - Sotheby's swapped to a GraphQL lot API → enumerator returned 1 lot;
  - Christie's "Watches Online" runs on a separate platform → 0 lots;
  - Bonhams' calendar page started 403-ing CI → no sales at all.
In each, a house's enumerator broke and its lots quietly fell to ~zero while
the calendar still listed the sale — invisible until Mark spotted it.

This flags any house that has a **published, current catalog** on the
calendar (`auctions.json`: hasCatalog true + a near-term date) but **zero
lots** in the merged feed (`auction_lots.json`; Bonhams lives in
`bonhams_lots.json`, folded separately). Debounced like B-66: a house must
be empty for THRESHOLD consecutive runs before it pages (rides out a
transient block / a between-scrapes window), state in
`data/auction_health_state.json`.

Two modes (the workflow runs both, like scrape_health_gate):
  --record  recompute per-house empties, bump/reset consecutive counts,
            write the state file, ALWAYS exit 0. Runs BEFORE the commit so
            `git add data/` persists the count.
  --check   (default) read the state, exit 1 (::error::) when a house has
            been empty THRESHOLD+ consecutive runs. Runs LAST (always()).
"""
from __future__ import annotations

import json
import sys
from datetime import date, datetime
from pathlib import Path

AUCTIONS = Path("public") / "auctions.json"
LOTS = Path("public") / "auction_lots.json"
BONHAMS_LOTS = Path("public") / "bonhams_lots.json"
STATE = Path("data") / "auction_health_state.json"

THRESHOLD = 3            # consecutive empty runs before paging
RECENT_DAYS = 3         # ignore sales that ended more than this many days ago
LOOKAHEAD_DAYS = 45     # ignore catalogs whose sale is further out than this


def _parse_day(s):
    if not isinstance(s, str) or len(s) < 10:
        return None
    try:
        return datetime.fromisoformat(s[:10]).date()
    except ValueError:
        return None


def _load_list(path):
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text())
    except (json.JSONDecodeError, OSError):
        return []
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        # tolerate {"lots": [...]} / {"auctions": [...]} / url-keyed dicts
        for k in ("lots", "auctions", "items"):
            if isinstance(data.get(k), list):
                return data[k]
        return [v for v in data.values() if isinstance(v, dict)]
    return []


def lots_by_house(lots_path=LOTS, bonhams_path=BONHAMS_LOTS):
    """house -> lot count, merging the residential Bonhams feed."""
    counts = {}
    for path in (lots_path, bonhams_path):
        for lot in _load_list(path):
            if isinstance(lot, dict):
                h = lot.get("house") or lot.get("auction_house") or "?"
                counts[h] = counts.get(h, 0) + 1
    return counts


def expected_houses(auctions_path=AUCTIONS, today=None):
    """Houses that have a published, current/near-term catalog — i.e. a sale
    we'd expect lots for. (hasCatalog true + date within [today-RECENT_DAYS,
    today+LOOKAHEAD_DAYS].)"""
    today = today or date.today()
    out = {}
    for s in _load_list(auctions_path):
        if not isinstance(s, dict):
            continue
        house = s.get("house")
        if not house:
            continue
        if not (s.get("hasCatalog") or s.get("has_catalog")):
            continue
        d_end = _parse_day(s.get("dateEnd")) or _parse_day(s.get("dateStart"))
        d_start = _parse_day(s.get("dateStart")) or d_end
        if d_end and (today - d_end).days > RECENT_DAYS:
            continue            # ended too long ago
        if d_start and (d_start - today).days > LOOKAHEAD_DAYS:
            continue            # too far out — lots may not be loaded yet
        out.setdefault(house, []).append(s.get("title") or s.get("url") or "?")
    return out


def broken_houses(auctions_path=AUCTIONS, lots_path=LOTS,
                  bonhams_path=BONHAMS_LOTS, today=None):
    """Houses with a current published catalog but ZERO lots in the feed."""
    exp = expected_houses(auctions_path, today)
    counts = lots_by_house(lots_path, bonhams_path)
    return {h: sales for h, sales in exp.items() if counts.get(h, 0) == 0}


def load_state(state=STATE):
    if not state.exists():
        return {}
    try:
        data = json.loads(state.read_text())
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def record(auctions_path=AUCTIONS, lots_path=LOTS, bonhams_path=BONHAMS_LOTS,
           state=STATE, today=None):
    broken = broken_houses(auctions_path, lots_path, bonhams_path, today)
    prior = load_state(state)
    new_state = {
        h: {"empty_runs": prior.get(h, {}).get("empty_runs", 0) + 1,
            "sales": sales}
        for h, sales in broken.items()
    }
    state.parent.mkdir(parents=True, exist_ok=True)
    state.write_text(json.dumps(new_state, indent=2, sort_keys=True) + "\n")
    return new_state


def evaluate(state=STATE):
    st = load_state(state)
    failing, warning = [], []
    for h, d in sorted(st.items()):
        n = int(d.get("empty_runs", 0) or 0)
        line = f"{h} — published catalog but 0 lots for {n} consecutive run(s) ({len(d.get('sales', []))} sale(s))"
        (failing if n >= THRESHOLD else warning).append(line)
    return failing, warning


def main(argv):
    mode = argv[1] if len(argv) > 1 else "--check"
    if mode == "--record":
        st = record()
        if st:
            print(f"Auction health: {len(st)} house(s) with a catalog but 0 lots:")
            for h, d in sorted(st.items()):
                print(f"  - {h}: {d['empty_runs']} consecutive")
        else:
            print("Auction health: every house with a current catalog has lots. ✓")
        return 0
    failing, warning = evaluate()
    for w in warning:
        print(f"::warning::Auction health (transient, not paging): {w}")
    if not failing:
        print(f"Auction health: no house empty for {THRESHOLD}+ consecutive runs. ✓")
        return 0
    print(f"::error::Auction health: {len(failing)} house(s) with a published "
          f"catalog but 0 lots for {THRESHOLD}+ consecutive runs")
    for f in failing:
        print(f"  - {f}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
