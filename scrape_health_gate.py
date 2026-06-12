#!/usr/bin/env python3
"""
Scrape-health gate (B-60) — debounced (B-66).

Every scraper step in scrape-listings.yml carries `continue-on-error:
true` so one failing site can't kill the batch. The cost: a single
source can produce no CSV (geoblock, truncation-abort, parser break)
and the workflow still reports success — the move step quietly echoes
"<source> missing", merge.py keeps the prior state, and nothing alerts.
That's exactly how Watch Center (B-58) rotted unnoticed for six days.

The gate's job is to fail the job (red badge) so notify-scrape-failure.yml
opens the usual GitHub issue. But failing on a SINGLE missed run is too
loud: dealer sites behind Cloudflare/Wordfence routinely serve a one-run
anti-bot interstitial (HTTP 202) or time out transiently, then recover
the very next run — and merge.py's disappearance debounce (B-15) means a
one-run miss loses zero data. So a naive gate paged Mark on every flap
(watchcenter, maunderwatches, watchesoflancashire, wok all flapped in a
few days, June 2026), which is the noise B-66 fixes.

Debounce: a source must be missing for THRESHOLD **consecutive runs**
before it pages — the same philosophy B-15 uses for listings. State lives
in a committed JSON (data/scrape_health_state.json) so the count survives
across runs. A genuinely-dead source (B-58) still crosses the threshold
within a day; a transient flap stays green.

Two run-modes (the workflow runs both, once each):

  --record  reads this run's signals, increments the miss-count for every
            currently-missing source and clears recovered ones, writes
            the state file, and ALWAYS exits 0. Runs BEFORE the commit
            step so `git add data/` persists the updated count.
  --check   (default) reads the state file and exits 1 (with an Actions
            ::error:: annotation) only when some source's consecutive-miss
            count has reached THRESHOLD. Runs LAST with always() so every
            healthy source's data is already committed before this can red
            the job. Below-threshold flaps print a ::warning:: (visible,
            non-failing).

Two miss signals, same as before:
  1. scrape_move.log — lines ending " missing" (scraper produced no CSV).
     Catches geoblocks (B-58) and the truncation safety-abort (B-59).
  2. public/verification.json — verify_sources.py ERROR alerts (a source's
     live count dropped to zero / it vanished from the merged feed).
     WARN-level dips are deliberately NOT counted (noisy seasonal signal).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

MOVE_LOG = Path("scrape_move.log")
VERIFICATION = Path("public") / "verification.json"
STATE = Path("data") / "scrape_health_state.json"

# Consecutive missed runs before a source pages. At 3 scrapes/day, 3 ≈ a
# full day of silence — long enough to ride out transient anti-bot/timeout
# flaps, short enough to catch real rot the day it starts (B-58 took 6).
THRESHOLD = 3


def current_misses(move_log: Path = MOVE_LOG,
                   verification: Path = VERIFICATION) -> dict[str, str]:
    """source -> human-readable reason, for THIS run only (empty == healthy)."""
    misses: dict[str, str] = {}

    if move_log.exists():
        for line in move_log.read_text().splitlines():
            line = line.strip()
            if line.endswith(" missing"):
                misses[line[: -len(" missing")]] = "no CSV produced this run"

    if verification.exists():
        try:
            alerts = json.loads(verification.read_text()).get("alerts", [])
        except (json.JSONDecodeError, OSError):
            alerts = []
        for a in alerts:
            if a.get("level") == "ERROR":
                src = a.get("source") or "unknown"
                note = a.get("note") or ""
                reason = (f"verify_sources ERROR: {note}").rstrip(": ")
                # If the move step already flagged this source, combine.
                misses[src] = (f"{misses[src]}; {reason}" if src in misses
                               else reason)

    return misses


def load_state(state: Path = STATE) -> dict[str, dict]:
    """{source: {"misses": int, "reason": str}}; {} if absent/corrupt."""
    if not state.exists():
        return {}
    try:
        data = json.loads(state.read_text())
        return data if isinstance(data, dict) else {}
    except (json.JSONDecodeError, OSError):
        return {}


def record(move_log: Path = MOVE_LOG,
           verification: Path = VERIFICATION,
           state: Path = STATE) -> dict[str, dict]:
    """Bump consecutive-miss counts for currently-missing sources, drop the
    ones that recovered, write the state file, return the new state."""
    misses = current_misses(move_log, verification)
    prior = load_state(state)
    new_state = {
        src: {"misses": prior.get(src, {}).get("misses", 0) + 1,
              "reason": reason}
        for src, reason in misses.items()
    }
    state.parent.mkdir(parents=True, exist_ok=True)
    state.write_text(json.dumps(new_state, indent=2, sort_keys=True) + "\n")
    return new_state


def evaluate(state: Path = STATE) -> tuple[list[str], list[str]]:
    """Return (failing, warning) human-readable lines from the state file.
    failing: count >= THRESHOLD (page). warning: 0 < count < THRESHOLD."""
    st = load_state(state)
    failing, warning = [], []
    for src, d in sorted(st.items()):
        n = int(d.get("misses", 0) or 0)
        reason = d.get("reason", "")
        line = f"{src} — missed {n} consecutive run(s) ({reason})"
        if n >= THRESHOLD:
            failing.append(line)
        elif n > 0:
            warning.append(line)
    return failing, warning


def main(argv: list[str]) -> int:
    mode = argv[1] if len(argv) > 1 else "--check"

    if mode == "--record":
        new_state = record()
        if new_state:
            print(f"Scrape-health: {len(new_state)} source(s) missing this "
                  f"run (counts updated, threshold {THRESHOLD}):")
            for src, d in sorted(new_state.items()):
                print(f"  - {src}: {d['misses']} consecutive ({d['reason']})")
        else:
            print("Scrape-health: every source produced a CSV; "
                  "no ERROR alerts. ✓")
        return 0

    # --check (default)
    failing, warning = evaluate()
    for w in warning:
        print(f"::warning::Scrape-health (transient, not paging): {w}")
    if not failing:
        print(f"Scrape-health gate: no source has missed {THRESHOLD}+ "
              f"consecutive runs. ✓")
        return 0
    print(f"::error::Scrape-health gate: {len(failing)} source(s) missing "
          f"{THRESHOLD}+ consecutive runs")
    for f in failing:
        print(f"  - {f}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
