#!/bin/bash
# Remove the residential Bonhams scrape host (B-25): unload + delete the
# LaunchAgent. Leaves the dedicated clone and throttle state in place (rm them
# by hand for a full wipe — see below).
set -uo pipefail

LABEL="com.thewatchlist.bonhams-scrape"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null; then
  echo "✓ unloaded agent"
else
  echo "· agent was not loaded"
fi
rm -f "$PLIST" && echo "✓ removed $PLIST"

echo ""
echo "Left in place (remove manually for a full wipe):"
echo "  rm -rf ~/watchlist-bonhams                  # dedicated clone"
echo "  rm -f  ~/.watchlist_bonhams_scrape.json     # throttle clock"
