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

SNOOZES (2026-08-30). Debouncing answers "is this a flap?" but not "we already
know, and the fix is not ours". Watch Center's storefront went down at the
dealer's end (B-80, confirmed from a browser as well as CI) — nothing in this
repo can fix it, yet it paged three times a day for a fortnight. That is how an
alert channel gets tuned out, which costs more than the alert is worth.

So a source can be snoozed until a DATE, in data/scrape_health_snooze.json:

    {"watchcenter": {"until": "2026-09-13", "reason": "B-80 — ..."}}

A snoozed source still shows up every run as a ::notice::, so it is muted, not
invisible. On the expiry date it pages again all by itself — the snooze buys
time, it never closes the question, and nobody has to remember to un-mute.

The whole thing fails LOUD by design: a missing, unreadable, malformed or
undated entry mutes nothing. Silence must be something you asked for
explicitly, never something a broken config gave you by accident.
"""
from __future__ import annotations

import json
import sys
from datetime import date, timezone, datetime
from pathlib import Path

MOVE_LOG = Path("scrape_move.log")
VERIFICATION = Path("public") / "verification.json"
STATE = Path("data") / "scrape_health_state.json"
# Per-source mute-until-a-date. Committed, so it is reviewable in git and
# survives runs the same way the miss counts do. See the module docstring.
SNOOZE = Path("data") / "scrape_health_snooze.json"

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


def load_snoozes(snooze: Path = SNOOZE) -> dict[str, dict]:
    """{source: {"until": "YYYY-MM-DD", "reason": str}}; {} if absent/corrupt.

    Unreadable config returns {} — i.e. mutes nothing. See `_snooze_state`.
    """
    if not snooze.exists():
        return {}
    try:
        data = json.loads(snooze.read_text())
    except (json.JSONDecodeError, OSError):
        return {}
    return data if isinstance(data, dict) else {}


def _snooze_state(entry: object, today: date) -> str:
    """One entry -> "active" | "expired" | "invalid".

    Anything we cannot read as a date is "invalid", and callers treat that
    exactly like no snooze at all: the source pages. A typo'd date must never
    buy silence — the only way to mute something here is to say so correctly.
    """
    if not isinstance(entry, dict):
        return "invalid"
    until = entry.get("until")
    if not isinstance(until, str):
        return "invalid"
    try:
        expires = date.fromisoformat(until)
    except ValueError:
        return "invalid"
    return "active" if today <= expires else "expired"


def _today() -> date:
    """UTC, to match the workflow clock the miss counts are recorded on."""
    return datetime.now(timezone.utc).date()


def evaluate(state: Path = STATE,
             snooze: Path = SNOOZE,
             today: date | None = None,
             ) -> tuple[list[str], list[str], list[str]]:
    """Return (failing, warning, snoozed) human-readable lines.

    failing: count >= THRESHOLD and not snoozed (page).
    warning: 0 < count < THRESHOLD (transient flap, never paged).
    snoozed: count >= THRESHOLD but muted until a date (notice only).

    Snoozes deliberately apply ONLY to the failing bucket. A source below the
    threshold is not paging anyway, so muting it would just hide the early
    warning that it is starting to flap.
    """
    st = load_state(state)
    snoozes = load_snoozes(snooze)
    now = today or _today()

    failing, warning, snoozed = [], [], []
    for src, d in sorted(st.items()):
        n = int(d.get("misses", 0) or 0)
        reason = d.get("reason", "")
        line = f"{src} — missed {n} consecutive run(s) ({reason})"
        if n >= THRESHOLD:
            entry = snoozes.get(src)
            status = _snooze_state(entry, now) if entry is not None else None
            if status == "active":
                until = entry.get("until")
                why = entry.get("reason") or "no reason recorded"
                snoozed.append(f"{line} — snoozed until {until} ({why})")
            elif status == "expired":
                until = entry.get("until")
                failing.append(f"{line} — SNOOZE EXPIRED {until}, paging again")
            else:
                if status == "invalid":
                    line += " — unreadable snooze entry, ignoring it"
                failing.append(line)
        elif n > 0:
            warning.append(line)
    return failing, warning, snoozed


def stale_snoozes(state: Path = STATE, snooze: Path = SNOOZE) -> list[str]:
    """Snoozed sources that are no longer missing — the mute outlived the
    problem and should be deleted so it can't hide a future outage."""
    st = load_state(state)
    return sorted(src for src in load_snoozes(snooze) if src not in st)


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
    failing, warning, snoozed = evaluate()

    for w in warning:
        print(f"::warning::Scrape-health (transient, not paging): {w}")

    # Snoozed sources print every run. Muted, not invisible — the whole point
    # is that a known-broken source stays in front of you without reddening
    # a run nobody can act on.
    for sz in snoozed:
        print(f"::notice::Scrape-health (snoozed, not paging): {sz}")

    for stale in stale_snoozes():
        print(f"::warning::Scrape-health: '{stale}' is snoozed but is no "
              f"longer missing — delete it from {SNOOZE} so the snooze "
              f"can't mask a future outage")

    if not failing:
        print(f"Scrape-health gate: no source has missed {THRESHOLD}+ "
              f"consecutive runs unsnoozed. ✓")
        return 0
    print(f"::error::Scrape-health gate: {len(failing)} source(s) missing "
          f"{THRESHOLD}+ consecutive runs")
    for f in failing:
        print(f"  - {f}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
