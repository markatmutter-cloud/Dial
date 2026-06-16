# Session handoff — 2026-06-15

**One-line:** A long auction-data repair run (Sotheby's / Christie's / Monaco
Legend / Bonhams all broke in different ways) + two new builds: the **full-page
auction catalogue** and the **Follow feature Phase A** (Home "Finishing soon").
Recurring lesson, hard-won over 4 Christie's rounds: **verify the CI-committed
data, not just the residential function run** — auction houses IP-gate
datacenter (CI) requests differently from residential.

## What shipped (16 PRs merged + a per-house health check)

**Auction-data repairs (Epic 2):**
- **#876 (B-66/67/68)** — scrape-health gate **debounced** (consecutive-miss
  counter in `data/scrape_health_state.json`, pages only at THRESHOLD=3, not on
  one transient flap) + maunderwatches → curl_cffi + Node-20 actions bumped
  (checkout@v5/setup-python@v6/setup-node@v5).
- **#877 (B-69)** — **Sotheby's lots** rewritten onto their GraphQL
  `lotCardsConnection` (`clientapi.prod.sothelabs.com`); the old SSR algoliaJson
  went empty. 1 lot → 414.
- **#878 (B-70)** — **Monaco Legend sold prices** ~1000× too small: CHF
  thousands separator was the HTML entity `&#039;`; `html.unescape()` first.
- **#880 (B-71)** — excluded 2 non-watch Sotheby's sales (Artistic Luxury /
  Maurice Tempelsman) from the calendar.
- **#882 (B-72)** — **Bonhams calendar → residential**: its department page now
  403s CI too (froze 2026-04-28); the laptop wrapper (`bonhams_residential_
  scrape.sh`) now runs the calendar scraper + commits `data/bonhams_auctions.csv`
  alongside the lots. Also fixed `has_catalog` (the `View <span>N</span> lots`
  count-span broke the regex).
- **#881 → #883 → #884 → #886 (B-73)** — **Christie's "Watches Online"** (online
  sales on `onlineonly.christies.com`), four layered fixes: read the whole-blob
  `window.chrComponents` form (#881); **route the sso URL to the enumerator**
  (#883, the dispatcher needle was the miss); **curl_cffi** the online-only fetch
  (#884, CI read-timed-out); **reconstruct lot images** from the deterministic
  `www.christies.com/img/LotImages/...` path (#886, CI gets a roundel
  placeholder). 0 → 87 lots with estimates + images, verified in CI.
- **#885 (B-74)** — **DKK** added to both lockstep FX tables (Bonhams Copenhagen
  prices were showing the raw DKK as `$`).
- **#888 (B-75)** — **per-house auction health check** (`auction_health.py`):
  flags a house with a published current catalog but 0 lots, debounced like
  B-66, wired into `scrape-auction-lots-frequent.yml`.

**Builds:**
- **#879** — **Auction catalogue = full-page surface** (Epic 9): green bar +
  sale title + persistent × → calendar; Save/Share/Auction-house row; both
  shells via a shared `catalogFullPage` takeover.
- **#887** — removed the Auction-Calendar pill from the **Sold** sub-tab (it's
  upcoming-sales nav) so the filter pills fit one line.
- **#889 + #890** — **Follow feature, Phase A** (Epic 2). "Follow" = the
  existing heart / Save-catalog (no new signal). New Home **"Finishing soon"**
  strip: followed (hearted) auction lots closing ≤3 days, featured at top; plus
  **"Auctions you're following"** calendar-style catalog tiles (shared
  `auctionThumb.js` — `houseTint`/`HouseLogo` moved there so HomeTab doesn't
  pull the lazy calendar into the main bundle).

## Open / next

- **Follow Phase B — email reminders (NEXT SESSION, voiced as Lumé).** Settings
  opt-in toggle + daily cron (Resend) emailing followed lots ≤3 days / followed
  auctions on publish-open; dedup table. **Reads as a message *from Lumé***, not
  a generic alert (ties into Epic 10). **Gated on Mark:** pick provider (Resend)
  + add the API key as a GitHub secret. (ROADMAP Epic 2.)
- **B-75 follow-up** — also wire `auction_health.py --check` into
  `scrape-auctions.yml` (calendar) so a house with *no calendar sales at all*
  (the Bonhams-403 mode) is caught there too; this session only covered the lots
  producer.
- **B-72 follow-up** — confirm the laptop launchd agent picked up the new
  wrapper and that lots populate for the fine-watch sales on its next tick (it
  worked when run by hand; can't verify the cron from CI).
- The full-page catalogue + Finishing-soon strip are visual — eyeball on device.

## Still-open defects (unchanged this session)

B-16/22/34 (platform-health tech-debt: JS lockfile rollout, code-split phase 2,
load-speed JS split), B-27 (inert-code sweep), B-28 (editorial vintage filter),
B-31 (auction strip card spot-check), B-57 (one Cartier ref edit awaits
greenlight).

## Don't bump (storage keys)

`LEGACY_WATCHLIST_KEY`, `LEGACY_HIDDEN_KEY`, `dial_watch_anon_id`,
`dial_collections_sub_tab`, `dial_listings_sub_tab`, `dial_watch_top_tab`.
