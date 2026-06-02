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

## Quick install (fresh machine — one command)

This is the whole thing. On any Mac (your laptop, a replacement, a Mac mini):

```bash
git clone https://github.com/markatmutter-cloud/watchlist.git ~/watchlist-bonhams
bash ~/watchlist-bonhams/scripts/install_residential_host.sh
```

`install_residential_host.sh` is **idempotent and portable** (uses `$HOME`/your
uid, so it works for any user on any Mac): it sets up the dedicated clone,
installs `curl-cffi`, generates the launchd plist with this machine's paths,
loads the agent, and does one smoke-test run (approve the one-time git keychain
prompt when it appears). Re-run it anytime to update or reload. Remove with
`bash ~/watchlist-bonhams/scripts/uninstall_residential_host.sh`.

The manual steps below are what the installer automates — for reference / if you
want to do it by hand.

## Manual setup (what the installer does)

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

---

# Chrono24 per-reference scraper (residential, manual for now)

Same reason as Bonhams: Chrono24 is Cloudflare-fronted, so CI (datacenter IPs)
gets a 403 challenge — and even a residential *plain* request is blocked. Only
**curl-cffi impersonating Chrome** from a residential IP gets through. So
`chrono24_lots_scraper.py` runs from the laptop and writes its own
`public/chrono24_lots.json` (the daily CI listings sweep never touches it).

Unlike Bonhams it is **deliberately narrow** — it scrapes only the references in
the `REFERENCES` list at the top of the script (the watches we have reference
guides for), not all of Chrono24. The results fold into the main Listings feed
by URL; the reference-guide page filters them by its `market` spec to highlight.

The data path is robust: the search results page embeds a JSON-LD
`AggregateOffer` block (one Offer per listing) — we parse that, not the HTML.
Two URL details matter: `&dosearch=true` (without it the page is an empty JS
landing) and the Chrome impersonation (without it, 403).

## Operating it

```bash
cd ~/Documents/watchlist
pip install -r requirements-auctions.txt        # curl-cffi (once)
python3 chrono24_lots_scraper.py                 # writes public/chrono24_lots.json
git add public/chrono24_lots.json && git commit -m "Refresh Chrono24 lots" && git push
```

To add a reference: append `{"brand": "...", "query": "..."}` to `REFERENCES`
and re-run. No `launchd` agent yet — this is a manual refresh while we validate
the one-reference test (JLC E2643). Promote to a `launchd` agent (mirror the
Bonhams plist above) once we want it on a schedule.
