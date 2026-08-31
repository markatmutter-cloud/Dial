#!/bin/bash
# Residential scrape tick — driven by a launchd LaunchAgent (B-25).
#
# This started as the Bonhams-only agent and is now the residential HOST
# agent: everything here is a source that 403s GitHub's datacenter IPs and
# therefore cannot run in CI at all. Three of them as of 2026-08-30:
#
#   1. Bonhams lots     → public/bonhams_lots.json   (B-25)
#   2. Bonhams calendar → data/bonhams_auctions.csv  (B-72)
#   3. Watches of Lancashire → data/watchesoflancashire.csv (B-81)
#
# The filename still says "bonhams" because the installed LaunchAgent plist
# points at this path; renaming both is a tidy-up for when someone is next
# reinstalling the agent, not something to do underneath a running host.
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

  # Watches of Lancashire (B-81, 2026-08-30). The whole domain 403s CI —
  # homepage included, so there is no page to warm a clearance cookie from and
  # curl_cffi impersonation alone no longer suffices from a datacenter IP. From
  # here it is an ordinary WooCommerce Store API walk. Non-fatal exactly like
  # the calendar above: a transient block leaves the prior
  # data/watchesoflancashire.csv untouched and merge.py keeps emitting it.
  if "$PY" watchesoflancashire_scraper.py && [ -f watchesoflancashire_listings.csv ]; then
    mv -f watchesoflancashire_listings.csv data/watchesoflancashire.csv
    echo "Watches of Lancashire CSV refreshed"
  else
    echo "Watches of Lancashire scrape produced no CSV (transient block?) — keeping prior"
    rm -f watchesoflancashire_listings.csv
  fi

  # Scrape lots (throttled). Non-zero = transient block / guard tripped.
  #
  # This USED to `exit 1` here, which threw away whatever the steps above had
  # already refreshed — a Bonhams block would discard a perfectly good calendar
  # or Lancashire CSV sitting in the working tree. That is the same failure
  # shape as B-79 (one bad fetch discarding good data already in hand), so
  # record the status and still commit what succeeded; the exit code is
  # preserved to the end so a real block still surfaces as a failed tick.
  lots_status=0
  if ! "$PY" bonhams_lots_scraper.py --throttle; then
    echo "lots scraper exited non-zero (throttled-skip is exit 0) — committing whatever else refreshed"
    lots_status=1
  fi

  # Commit whichever of the two refreshed (lots and/or calendar).
  "$GIT" add public/bonhams_lots.json data/bonhams_auctions.csv data/watchesoflancashire.csv
  if "$GIT" diff --cached --quiet; then
    echo "no change to bonhams lots/calendar or Lancashire"
    exit "$lots_status"
  fi

  "$GIT" commit -m "Residential refresh (Bonhams + Lancashire) $(date -u '+%Y-%m-%d %H:%M UTC')" || exit 1

  # Race-resilient push (CI commits to main several times a day).
  for i in 1 2 3; do
    if "$GIT" push origin main; then
      echo "pushed"
      exit "$lots_status"
    fi
    echo "push rejected, rebase + retry ($i/3)"
    "$GIT" pull --rebase --autostash origin main || "$GIT" rebase --abort 2>/dev/null || true
  done
  echo "push still failing after 3 retries"
  exit 1
} >> "$LOG" 2>&1
