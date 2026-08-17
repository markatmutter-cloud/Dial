#!/usr/bin/env python3
"""
Auction-CALENDAR health gate.

The third leg of the health tripod. We already had:
  - scrape_health_gate.py   — a DEALER source produced no CSV (B-60/B-66)
  - auction_health.py       — a HOUSE has a published catalog but zero
                              LOTS in the merged feed (B-75)
and nothing at all watching the calendar itself, which is upstream of
both. That gap cost real coverage:

  Monaco Legend  — calendar scraper broken since ~2026-07-04
  Phillips       — calendar scraper broken since ~2026-06-30

Both printed "No auctions parsed — site template may have changed" and
then `sys.exit(0)`. A green step, a green workflow, no alert, for six
weeks. And because the lot enumerator walks the sales in auctions.json,
a house missing from the calendar has its lots silently skipped too —
which is why the live-lot feed had shrunk to two houses (Christie's and
Sotheby's) before anyone looked.

WHAT COUNTS AS A MISS

Per house, this run:
  - no `data/<house>_auctions.csv` at all   → miss
  - the CSV exists but has zero data rows   → miss

The second case matters as much as the first. A scraper that writes an
empty file looks healthier than one that writes nothing (the move step's
"<house> auctions missing" line never fires), while doing more damage —
it overwrites the previous good file. Checking the committed artifact
rather than the scraper's exit code also means this gate can't be fooled
by a scraper that mis-reports its own success, which is the exact bug
being fixed here.

WHY "ZERO ROWS" IS A SAFE SIGNAL

These scrapers return past sales as well as upcoming ones, so a working
scraper yields rows even when a house has nothing scheduled: Watches of
Knightsbridge parses 2 past sales, Marteau 3. Zero rows means the parse
found nothing at all, which is a broken selector, not a quiet season.

Debounced exactly like its two siblings: a house must miss THRESHOLD
consecutive runs before it pages, so a transient block or a between-
scrapes window stays green. State lives in a committed JSON so the count
survives across runs.

Two modes (the workflow runs both, once each):
  --record  recompute this run's misses, bump/reset the consecutive
            counts, write the state file, ALWAYS exit 0. Runs BEFORE the
            commit step so `git add data/` persists the count.
  --check   (default) read the state and exit 1 with an ::error::
            annotation when a house has missed THRESHOLD+ consecutive
            runs. Runs LAST with always(), so healthy houses' data is
            already committed before this can red the job. Below-
            threshold misses print a ::warning:: (visible, non-failing).
"""
from __future__ import annotations

import csv
import json
import sys
from pathlib import Path

DATA = Path("data")
STATE = DATA / "auction_calendar_health_state.json"

# house key -> the CSV its calendar scraper is expected to produce.
# Keys match the labels used in scrape-auctions.yml's move step.
HOUSES = {
    "antiquorum": DATA / "antiquorum_auctions.csv",
    "monacolegend": DATA / "monacolegend_auctions.csv",
    "phillips": DATA / "phillips_auctions.csv",
    "christies": DATA / "christies_auctions.csv",
    "sothebys": DATA / "sothebys_auctions.csv",
    "watchesofknightsbridge": DATA / "watchesofknightsbridge_auctions.csv",
    "marteauandco": DATA / "marteauandco_auctions.csv",
    # Bonhams is deliberately absent: its calendar 403s datacenter IPs
    # (B-72) and is scraped from the residential agent, not this
    # workflow. Gating it here would page every single run for a
    # condition CI cannot fix. See scripts/RESIDENTIAL_SCRAPE_SETUP.md.
}

# Consecutive missed runs before a house pages. This workflow runs once
# daily, so 3 ≈ three days of silence — long enough to ride out a
# transient block, short enough that a dead selector surfaces in days
# rather than the six weeks Monaco Legend and Phillips went unnoticed.
THRESHOLD = 3


def _row_count(path: Path) -> int:
    """Data rows (header excluded). -1 when the file can't be read."""
    try:
        with path.open(newline="", encoding="utf-8") as f:
            rows = list(csv.reader(f))
    except (OSError, UnicodeDecodeError):
        return -1
    return max(0, len(rows) - 1) if rows else 0


def current_misses(houses: dict[str, Path] | None = None) -> dict[str, str]:
    """house -> reason, for THIS run only (empty dict == healthy)."""
    houses = HOUSES if houses is None else houses
    misses: dict[str, str] = {}
    for house, path in sorted(houses.items()):
        if not path.exists():
            misses[house] = "no CSV produced this run"
            continue
        n = _row_count(path)
        if n < 0:
            misses[house] = "CSV unreadable this run"
        elif n == 0:
            misses[house] = "CSV written but empty (0 sales parsed)"
    return misses


def load_state(state: Path = STATE) -> dict[str, dict]:
    """{house: {"misses": int, "reason": str}}; {} if absent/corrupt."""
    if not state.exists():
        return {}
    try:
        data = json.loads(state.read_text())
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def record(houses: dict[str, Path] | None = None,
           state: Path = STATE) -> dict[str, dict]:
    """Bump counts for currently-missing houses, drop recovered ones,
    write the state file, return the new state."""
    misses = current_misses(houses)
    prior = load_state(state)
    new_state = {
        house: {"misses": prior.get(house, {}).get("misses", 0) + 1,
                "reason": reason}
        for house, reason in misses.items()
    }
    state.parent.mkdir(parents=True, exist_ok=True)
    state.write_text(json.dumps(new_state, indent=2, sort_keys=True) + "\n")
    return new_state


def evaluate(state: Path = STATE) -> tuple[list[str], list[str]]:
    """(failing, warning) human-readable lines from the state file."""
    st = load_state(state)
    failing, warning = [], []
    for house, d in sorted(st.items()):
        n = int(d.get("misses", 0) or 0)
        line = f"{house} — missed {n} consecutive run(s) ({d.get('reason', '')})"
        if n >= THRESHOLD:
            failing.append(line)
        elif n > 0:
            warning.append(line)
    return failing, warning


def main(argv: list[str]) -> int:
    mode = argv[1] if len(argv) > 1 else "--check"

    # HOUSES/STATE are read here, not taken as default arguments, so the
    # module globals stay overridable (tests, and any future per-run
    # override). Default args would bind once at import and silently
    # ignore them.
    if mode == "--record":
        new_state = record(HOUSES, STATE)
        if new_state:
            print(f"Calendar-health: {len(new_state)} house(s) missing this "
                  f"run (counts updated, threshold {THRESHOLD}):")
            for house, d in sorted(new_state.items()):
                print(f"  - {house}: {d['misses']} consecutive ({d['reason']})")
        else:
            print("Calendar-health: every house produced a non-empty "
                  "calendar CSV. ✓")
        return 0

    # --check (default)
    failing, warning = evaluate(STATE)
    for w in warning:
        print(f"::warning::Calendar-health (transient, not paging): {w}")
    if not failing:
        print(f"Calendar-health gate: no house has missed {THRESHOLD}+ "
              f"consecutive runs. ✓")
        return 0
    print(f"::error::Calendar-health gate: {len(failing)} house(s) missing "
          f"{THRESHOLD}+ consecutive runs")
    for f in failing:
        print(f"  - {f}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
