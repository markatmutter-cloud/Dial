# Residential scrape host setup (B-25)

Bonhams' auction **lot** pages 403 GitHub's datacenter IPs (Cloudflare), so the
lots can't be scraped from CI. This sets up a residential host — Mark's laptop,
via a `launchd` LaunchAgent — to scrape Bonhams lots a few times a day and push
`public/bonhams_lots.json`, which the app folds into the Auctions projection.
(The Bonhams **calendar** still updates in CI; only the lots run here.)

Code unchanged, this same setup later moves to an always-on box (Raspberry Pi /
Mac mini) — only the host changes.

## Why a dedicated clone

The agent runs `git pull`/`commit`/`push` on `main` every hour. If it ran in
your main working copy it would fight whatever branch you're on. So it runs in a
**separate clone that only ever sits on `main`** — your working copy is never
touched. The wrapper refuses to run unless `HEAD == main`.

## One-time setup

```bash
# 1. Dedicated clone (only ever on main). Adjust the path if you like, but then
#    update the plist's ProgramArguments path to match.
git clone https://github.com/markatmutter-cloud/watchlist.git ~/watchlist-bonhams

# 2. Confirm the lot scraper's dependency is present (curl-cffi, for Bonhams'
#    Chrome-TLS fetch). It installs to your user site-packages, shared across
#    clones, so this is usually already true:
/usr/bin/python3 -c "import curl_cffi; print('curl_cffi', curl_cffi.__version__)"
#    If missing:  /usr/bin/python3 -m pip install --user -r ~/watchlist-bonhams/requirements-auctions.txt

# 3. Smoke-test the wrapper by hand FIRST (this will pull, scrape, and push if
#    anything changed — watch for a one-time keychain prompt to allow git to use
#    your stored GitHub credential):
bash ~/watchlist-bonhams/scripts/bonhams_residential_scrape.sh
cat ~/Library/Logs/watchlist-bonhams-scrape.log    # check the run

# 4. Install the LaunchAgent (edit the plist path first if you cloned elsewhere):
cp ~/watchlist-bonhams/scripts/com.thewatchlist.bonhams-scrape.plist \
   ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.thewatchlist.bonhams-scrape.plist

# 5. Verify it's loaded:
launchctl print gui/$(id -u)/com.thewatchlist.bonhams-scrape | head -20
```

## What it does each tick

Hourly (while the laptop's awake; a missed tick runs on next wake), the wrapper:
`git pull --rebase` → `python3 bonhams_lots_scraper.py --throttle` → commit +
race-resilient push **only if `bonhams_lots.json` changed**.

The `--throttle` flag means most ticks are cheap no-ops: the scraper scrapes
roughly every 6h normally, **every hour when a sale ends today or ended in the
last ~2 days** (to capture final hammer prices before the page archives — B-24's
adaptive ramp). Bonhams' JSON exposes no live bid, only estimates and the
realised price at close, so there's nothing to chase between closes.

## Operating it

```bash
# Run once now, ignoring the throttle:
cd ~/watchlist-bonhams && /usr/bin/python3 bonhams_lots_scraper.py --throttle --force

# Logs:
tail -f ~/Library/Logs/watchlist-bonhams-scrape.log      # wrapper + scraper
tail -f ~/Library/Logs/watchlist-bonhams-launchd.log     # launchd-level

# Stop / remove:
launchctl bootout gui/$(id -u)/com.thewatchlist.bonhams-scrape
rm ~/Library/LaunchAgents/com.thewatchlist.bonhams-scrape.plist
```

## Notes

- Throttle clock lives at `~/.watchlist_bonhams_scrape.json` (per-machine, not
  committed). Delete it to force the next run to scrape.
- Catalogs change slowly, so laptop-when-on covers ~95%; an always-on box only
  adds live-finale timing. To move hosts: clone there, install the plist, done.
- `git push` uses the macOS keychain credential helper. If pushes fail from
  launchd, run the wrapper by hand once (step 3) to seed/allow the keychain item.
