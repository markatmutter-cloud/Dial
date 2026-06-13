#!/bin/bash
# Bonhams residential lot scrape — driven by a launchd LaunchAgent (B-25).
#
# Bonhams' lot pages 403 GitHub's datacenter IPs (Cloudflare), so the lots
# are scraped from a residential machine (Mark's laptop) and pushed so the
# app folds public/bonhams_lots.json into the Auctions projection.
#
# IMPORTANT: this is meant to run from a DEDICATED clone that only ever sits
# on main (e.g. ~/watchlist-bonhams), NOT the main working copy — a launchd
# job must never hijack the branch you're working on. The script refuses to
# run unless HEAD is main.
#
# The scraper self-throttles (--throttle): most hourly ticks are cheap no-ops;
# it ramps to hourly near a sale's close to capture final hammer prices
# (B-24 adaptive ramp). See bonhams_lots_scraper.py for the cadence logic.
set -uo pipefail
export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin"

# Resolve the repo root from this script's location (works in any clone).
REPO="$(cd "$(dirname "$0")/.." && pwd)"
GIT=/usr/bin/git
PY=/usr/bin/python3
LOG="${HOME}/Library/Logs/watchlist-bonhams-scrape.log"

cd "$REPO" || exit 1
{
  echo "=== $(date -u '+%Y-%m-%dT%H:%M:%SZ')  repo=$REPO ==="

  # Guard: never run from a non-main checkout (don't disturb feature work).
  branch="$("$GIT" rev-parse --abbrev-ref HEAD 2>/dev/null)"
  if [ "$branch" != "main" ]; then
    echo "ABORT: HEAD is '$branch', not main. Use a dedicated clone on main."
    exit 1
  fi

  # Get the freshest schedule (CI maintains auctions.json) and minimise races.
  if ! "$GIT" pull --rebase --autostash origin main; then
    echo "ABORT: git pull failed"
    exit 1
  fi

  # Calendar scrape (B-72, 2026-06-13): Bonhams' department page now also 403s
  # GitHub Actions, so the CALENDAR — not just the lots — must run from this
  # residential host. Non-fatal: a transient block just leaves the prior
  # data/bonhams_auctions.csv untouched, and CI's merge.py keeps emitting it.
  # The lots scrape below still reads the schedule from auctions.json (which CI
  # re-emits from this CSV on its next run), so a fresh sale's lots land on the
  # following tick — a one-cycle lag, by design.
  if "$PY" bonhams_auctions_scraper.py && [ -f bonhams_auctions_listings.csv ]; then
    mv -f bonhams_auctions_listings.csv data/bonhams_auctions.csv
    echo "calendar CSV refreshed"
  else
    echo "calendar scrape produced no CSV (transient block?) — keeping prior"
    rm -f bonhams_auctions_listings.csv
  fi

  # Scrape lots (throttled). Non-zero = transient block / guard tripped — bail
  # without committing so prior good data survives.
  if ! "$PY" bonhams_lots_scraper.py --throttle; then
    echo "scraper exited non-zero (throttled-skip is exit 0); nothing committed"
    exit 1
  fi

  # Commit whichever of the two refreshed (lots and/or calendar).
  "$GIT" add public/bonhams_lots.json data/bonhams_auctions.csv
  if "$GIT" diff --cached --quiet; then
    echo "no change to bonhams lots or calendar"
    exit 0
  fi

  "$GIT" commit -m "Bonhams refresh (lots + calendar) $(date -u '+%Y-%m-%d %H:%M UTC')" || exit 1

  # Race-resilient push (CI commits to main several times a day).
  for i in 1 2 3; do
    if "$GIT" push origin main; then
      echo "pushed"
      exit 0
    fi
    echo "push rejected, rebase + retry ($i/3)"
    "$GIT" pull --rebase --autostash origin main || "$GIT" rebase --abort 2>/dev/null || true
  done
  echo "push still failing after 3 retries"
  exit 1
} >> "$LOG" 2>&1
