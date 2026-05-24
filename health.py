#!/usr/bin/env python3
"""
One-command health check across scrape workflows + verification data.

Surfaces:
  - Recent workflow run failures per workflow (last 20 runs).
  - Sources flagged by verify_sources.py (current verification.json).
  - Flapping sources (count varies by >25% across recent runs) from
    verification_history.json — catches Watch Club-style 15↔54 bugs
    that the median-only check doesn't flag.
  - Data staleness (last commit timestamp on public/listings.json).

Read-only — never mutates state. Safe to run anytime.

Usage:
    python3 health.py

Requires:
    gh (GitHub CLI, authenticated) — for workflow run history.
    requests — already a project dependency.
"""
from __future__ import annotations

import json
import statistics
import subprocess
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

PUBLIC = Path("public")
VERIFICATION = PUBLIC / "verification.json"
VERIFICATION_LOTS = PUBLIC / "verification_lots.json"
HISTORY = PUBLIC / "verification_history.json"

# Source counts that vary by more than this fraction across recent runs
# get flagged as flapping. Tuned to catch Watch Club's 15↔54 oscillation
# while ignoring normal day-to-day drift.
FLAP_THRESHOLD = 0.25
FLAP_LOOKBACK = 6  # most-recent N snapshots to inspect

WORKFLOWS_TO_CHECK = [
    "Scrape listings",
    "Scrape auctions",
    "Scrape auction lots (frequent)",
    "Scrape eBay",
    "Scrape Tropical Watch only",
    "Tests",
]


def header(label: str) -> None:
    print(f"\n{'─' * 64}\n  {label}\n{'─' * 64}")


def workflow_health() -> int:
    header("Workflow runs (last 20)")
    try:
        out = subprocess.run(
            ["gh", "run", "list", "--limit", "20", "--json",
             "workflowName,conclusion,status,createdAt,databaseId"],
            capture_output=True, text=True, check=True,
        ).stdout
        runs = json.loads(out)
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print(f"  (gh CLI unavailable: {e})")
        return 0

    issues = 0
    for wf in WORKFLOWS_TO_CHECK:
        wf_runs = [r for r in runs if r["workflowName"] == wf]
        if not wf_runs:
            continue
        ok = sum(1 for r in wf_runs if r["conclusion"] == "success")
        fail = sum(1 for r in wf_runs if r["conclusion"] == "failure")
        latest = wf_runs[0]
        latest_state = latest["conclusion"] or latest["status"]
        marker = "✓" if latest_state == "success" else "✗" if latest_state == "failure" else "·"
        line = f"  {marker} {wf:<35} {ok} ok / {fail} fail  latest: {latest_state} ({latest['createdAt'][:16]})"
        if fail or latest_state == "failure":
            issues += 1
            print(line + "  ← #" + str(latest["databaseId"]))
        else:
            print(line)
    return issues


def _relative_age(iso: str | None) -> tuple[str, bool]:
    """Return ('Nh ago' / 'STALE', stale_bool). stale if >12h old."""
    if not iso:
        return ("no timestamp", True)
    try:
        ts = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return (iso, False)
    delta = datetime.now(timezone.utc) - ts
    minutes = int(delta.total_seconds() / 60)
    stale = minutes >= 12 * 60
    if minutes < 60:
        rel = f"{minutes}m ago"
    elif minutes < 48 * 60:
        rel = f"{minutes // 60}h ago"
    else:
        rel = f"{minutes // (60 * 24)}d ago"
    return (rel, stale)


def verification_alerts() -> int:
    header("verify_sources.py alerts + freshness")
    issues = 0
    for label, path in (
        ("Dealer listings", VERIFICATION),
        ("Auction lots", VERIFICATION_LOTS),
    ):
        if not path.exists():
            print(f"  {label}: {path} missing")
            continue
        data = json.loads(path.read_text())
        alerts = data.get("alerts", [])
        date = data.get("date", "?")
        total = data.get("total_listings") or data.get("total_live_lots") or 0
        rel, stale = _relative_age(data.get("updated_at"))
        freshness = f"  ⚠ STALE {rel}" if stale else f"  fresh ({rel})"
        if stale:
            issues += 1
        if alerts:
            issues += len(alerts)
            print(f"  ✗ {label} ({date}, {total} live):{freshness} · {len(alerts)} alerts")
            for a in alerts:
                print(f"      [{a['level']}] {a['source']}: {a['note']}")
        else:
            marker = "✗" if stale else "✓"
            print(f"  {marker} {label} ({date}, {total} live):{freshness} · no alerts")
    return issues


def flapping_sources() -> int:
    header(f"Flapping sources (>{int(FLAP_THRESHOLD * 100)}% variance over last {FLAP_LOOKBACK} runs)")
    if not HISTORY.exists():
        print(f"  {HISTORY} missing")
        return 0
    try:
        history = json.loads(HISTORY.read_text()).get("history", [])
    except json.JSONDecodeError:
        print(f"  {HISTORY} unreadable")
        return 0
    if len(history) < 3:
        print(f"  Not enough history yet ({len(history)} snapshots)")
        return 0

    recent = history[-FLAP_LOOKBACK:]
    by_source: dict[str, list[int]] = defaultdict(list)
    for snap in recent:
        for src, count in snap.get("counts", {}).items():
            by_source[src].append(count)

    issues = 0
    for src in sorted(by_source.keys()):
        counts = by_source[src]
        if len(counts) < 3:
            continue
        median = statistics.median(counts)
        if median == 0:
            continue
        spread = (max(counts) - min(counts)) / median
        if spread > FLAP_THRESHOLD:
            issues += 1
            print(f"  ✗ {src:<32}  counts: {counts}  spread {spread:.0%} of median")
    if not issues:
        print("  ✓ No flapping sources detected")
    return issues


def data_staleness() -> int:
    header("Data freshness")
    issues = 0
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cr|%h|%s", "--",
             "public/listings.json", "public/auction_lots.json"],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        if out:
            rel, sha, subj = out.split("|", 2)
            print(f"  Last commit touching listings/auction-lots: {rel} ({sha})")
            print(f"    \"{subj}\"")
            if "day" in rel or "week" in rel or "month" in rel:
                issues += 1
                print("  ✗ Data hasn't refreshed in days/weeks — investigate cron")
        else:
            print("  Could not determine last commit timestamp")
    except subprocess.CalledProcessError as e:
        print(f"  git log failed: {e}")
    return issues


def main() -> int:
    print("Watchlist health check")
    print(f"  cwd: {Path.cwd()}")

    total = (
        workflow_health()
        + verification_alerts()
        + flapping_sources()
        + data_staleness()
    )

    print(f"\n{'═' * 64}")
    if total == 0:
        print("  All checks green")
    else:
        print(f"  {total} issue(s) flagged — see sections above")
    print(f"{'═' * 64}")
    return 0 if total == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
