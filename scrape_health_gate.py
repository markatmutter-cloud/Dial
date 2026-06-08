#!/usr/bin/env python3
"""
Scrape-health gate (B-60).

Every scraper step in scrape-listings.yml carries `continue-on-error:
true` so one failing site can't kill the batch. The cost: a single
source can produce no CSV (geoblock, truncation-abort, parser break)
and the workflow still reports success — the move step quietly echoes
"<source> missing", merge.py keeps the prior state, and nothing alerts.
That's exactly how Watch Center (B-58) rotted unnoticed for six days.

This gate runs as the FINAL step (after the commit, so every healthy
source's data still lands) and fails the job when it finds a silent
failure, turning the workflow red so notify-scrape-failure.yml opens
the usual GitHub issue. Two signals:

  1. scrape_move.log — lines ending " missing" (a source whose scraper
     produced no CSV this run). Catches geoblocks (B-58) and the
     truncation safety-abort (B-59), both of which skip the CSV write.
  2. public/verification.json — verify_sources.py ERROR alerts (a
     source's live count dropped to zero or it disappeared from the
     merged feed). Catches breakage that still wrote a (broken) CSV.

WARN-level verify_sources alerts (below-median dips) are deliberately
NOT failed — they're noisy seasonal signal, visible in the committed
verification.json for the admin UI without paging anyone.

Run: python3 scrape_health_gate.py
Exits 1 (with an Actions ::error:: annotation) on any problem, else 0.
"""
from __future__ import annotations

import json
from pathlib import Path

MOVE_LOG = Path("scrape_move.log")
VERIFICATION = Path("public") / "verification.json"


def collect_problems(move_log: Path = MOVE_LOG,
                     verification: Path = VERIFICATION) -> list[str]:
    """Return a list of human-readable problem strings (empty == healthy)."""
    problems: list[str] = []

    if move_log.exists():
        for line in move_log.read_text().splitlines():
            line = line.strip()
            if line.endswith(" missing"):
                source = line[: -len(" missing")]
                problems.append(f"no CSV produced this run: {source}")

    if verification.exists():
        try:
            alerts = json.loads(verification.read_text()).get("alerts", [])
        except (json.JSONDecodeError, OSError):
            alerts = []
        for a in alerts:
            if a.get("level") == "ERROR":
                problems.append(
                    f"verify_sources ERROR: {a.get('source')} — {a.get('note')}"
                )

    return problems


def main() -> int:
    problems = collect_problems()
    if not problems:
        print("Scrape-health gate: every source produced a CSV; "
              "no ERROR alerts. ✓")
        return 0
    print(f"::error::Scrape-health gate: {len(problems)} silent "
          f"failure(s) detected this run")
    for p in problems:
        print(f"  - {p}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
