# Session handoff — 2026-08-30

**One-line:** Ran down the scrape-failure emails and the missing Screw Down
Crown articles. One real repo bug found and fixed; the rest were upstream
blocks, now routed or muted. Added Watchfid as an editorial source.
**All five PRs merged.**

## Status: all landed
Mark merged all five (plus #936, another session's) after the first close pass,
so a second pass followed: SHIPPED gained the five entries, B-80/B-81 were
corrected in BUGS, and B-83 was opened. Nothing is left in flight.

| PR | Branch | What |
|---|---|---|
| **#933** | `claude/email-errors-crown-articles-uv26ag` | Luna Royster partial-walk fix (B-79) + BUGS.md B-79/B-80/B-81/B-82 |
| **#934** | `claude/watchfid-editorial-source` | watchfid.com editorial scraper + 5-place lockstep wiring |
| **#935** | `claude/gitignore-js-artifacts` | `.gitignore` for `node_modules/`, `.eslintcache`, `/coverage` |
| **#937** | `claude/lancashire-residential` | Move Watches of Lancashire to the residential host (B-81) |
| **#938** | `claude/gate-source-snooze` | Dated per-source snooze for the health gate; Watch Center muted to 2026-09-13 (B-80) |

All five merged 2026-08-30 (PT), CI-green on every head. #936 (Lumé share
intro) is another session's — merged by Mark, logged by them, not by this close.

## The emails: one workflow, three unrelated causes
Only `Scrape listings` fails. Every other workflow on `main` is green. The
scrape itself always succeeds — it scrapes, merges and pushes fine. The step
that reds the job is the last one, `scrape_health_gate.py --check`.

| Source | Cause | Disposition |
|---|---|---|
| Luna Royster | **Ours** — one 502 page discarded an 18-page walk | Fixed, #933 |
| Watch Center | Dealer-side outage (503 to CI; also dead in Mark's browser) | Muted 2 weeks, #938 |
| Watches of Lancashire | Whole domain 403s datacenter IPs | Moved to laptop, #937 |

**Luna Royster has since dropped off the miss list on its own** (0 misses; it
completed its walk in both of 08-30's runs on unpatched code). #933 is still
worth landing — it's the guard against the next drop, not a live firefight.

## Corrections made during the session — don't re-derive
- **B-81's original hypothesis was wrong** — it said Lancashire's 403 was the
  `/wp-json/` endpoint wanting a clearance cookie, warmable from the homepage.
  A CI probe of the homepage returned `403, challenge markers present`: the
  whole domain blocks datacenter IPs. #937 is the real answer. **Corrected in
  BUGS.md after the merge** and marked DISPROVEN — do not retry the warm-up.
- **The scrape crons are not stalled.** GitHub schedule delivery on this repo
  runs chronically hours late (`scrape-auctions` at `0 6 * * *` fired 11:48 and
  17:44 UTC). A late run is lag. Don't raise an alarm for it.

## Verified healthy — don't re-investigate
- **Screw Down Crown**: healthy end-to-end, 283→284 articles, rank 10 of
  10,580 in the feed, not admin-hidden. Confirmed live when the corpus
  refreshed at 19:17 UTC.
- **Collectors Corner NY**: survived their redesign. `/products.json` is a
  Shopify *platform* endpoint, independent of their theme. Produced its CSV in
  the 17:51 run, 0 gate misses, 101 rows, `lastChanged` 08-29. A byte-identical
  CSV across runs also rules out product-URL churn — which would have caused a
  silent false-sold storm that row counts alone can't see.

## Open thread: Watches of Knightsbridge (`wok`)
At **1 miss of 3** as of run 402 — logged "transient, not paging", so it is not
what's reddening the job. **Not new**: #933's body records `wok` flapping at 1
miss with an HTTP 202 interstitial. It clears and re-flaps. Watch the streak in
`data/scrape_health_state.json`; at 3 it pages, and the playbook is the
residential host (its Cloudflare TLS/JA3 fix from 2026-08 was
`impersonate="chrome"` on the floating alias — `chrome124` was 403).

**Now logged as B-83:** `watchesofknightsbridge_scraper.py` has the *same
all-or-nothing pagination as B-79* — `raise_for_status()` inside the page loop,
no partial-walk keep, no truncation guard. Fix is to port the B-79 shape.

## Consequence of the two upstream blocks
A missed scrape goes **stale**, it doesn't disappear. 427 Watch Center listings
and 84 Lancashire listings stay live on the site, served from frozen CSVs, for
as long as the block lasts — Watch Center's through the whole two-week snooze.

## Environment note
This session ran in the remote sandbox, whose egress proxy blocks
`collectorscornerny.com`, `watchesofknightsbridge.com` and `watchfid.com` (403
at the proxy, not at the sites). Direct probes are impossible here — use
`source-probe.yml` from CI instead, remembering it uses **plain curl**, so it
cannot tell you anything about a curl_cffi path.

---

# Addendum — session 2 (same day)

**One-line:** The "nothing landed" warning above is now **stale — everything landed.**
All six draft PRs merged, plus ten more from this session covering the diagnostics
gap and the auction-calendar repair. `main` is green at **217 pytest**, zero open PRs.

## ⚠️ Supersedes "Read first: nothing landed"
That section described the state at the end of session 1. All five PRs it lists
(#933/#934/#935/#937/#938) plus #936 are merged. SHIPPED.md, BUGS.md and CLAUDE.md
on `main` are now current.

## What shipped this session

**Diagnostics (the "how do we catch unknown-unknowns" thread)**
| PR | What |
|---|---|
| #920, #924 | Push-retry loops can't bin a run's work — broad `git add` + `--autostash` across all 9 pushing workflows, guarded by `test_push_retry_safety.py` |
| #923 | Every cron is now watched by the notifier; `test_alert_coverage.py` fails the build otherwise |
| #926 | `source_freshness.py` (69 sources, all four surfaces) + `health-report.yml` daily sweep |

**Auction calendar**
| PR | What |
|---|---|
| #925 | Calendar health gate; four scrapers stop exiting 0 on an empty parse |
| #928 | One shared date grammar (`scraper_lib.parse_auction_date_range`) replacing five copies |
| #929 | `calendar_canary.py` — live fetch of all 7 houses, twice weekly, no debounce |
| #930 | Monaco Legend reads its schema.org `EventSeries`, card parser kept as fallback |
| #939 | `calendar_coverage.py` — CSV→`auctions.json` reconciliation, keyed on `merge.auction_id` |

**Sources:** #921 MVV → Sierra Time Co (rebrand + Shopify replatform); #922 Knightsbridge
+ Lancashire curl_cffi.

## Results worth not re-deriving
- **Editorial corpus is unfrozen.** 11,632 articles across 15 sources; the 08-17 run hit
  the push race again and the retry absorbed it (`! [rejected]` → `79b7830d..62f446cc`).
  `hodinkee_picks.json` committed for the first time ever — its omission from the
  hand-listed `git add` was the original bug.
- **Calendar 67 → 89 sales**, upcoming 33 → 37. Monaco Legend 4 → 22, Phillips 6 → 9,
  including The Geneva Watch Auction XXIV (2026-11-07).
- **Lots: 4,391 total, none currently open.** Genuinely seasonal — next catalogue is
  Phillips Geneva, 2026-09-04.
- **URL is NOT a unique key for auction sales.** Antiquorum points 5 upcoming sales at one
  placeholder page; Sotheby's reuses slugs. URL keying collapsed 89 sales into 70 lookups.
  Use `merge.auction_id(house, date_start, title)`.
- **Only Monaco Legend publishes usable schema.org event data.** Antiquorum has
  `LocalBusiness`, Phillips `Organization`, the other four nothing. Don't re-probe.
- **`merge.py`'s dealer table is now module-level `LISTING_SOURCES`** (44 entries) so
  tools can import it instead of keeping a parallel copy.

## Open, needing a Mark decision
- **B-81 Lancashire — corrected, still broken.** #937 moved it to the laptop on the
  premise of a datacenter-IP block. That premise is wrong: probing from Mark's home
  broadband returns `403` + `cf-mitigated: challenge` + `_cf_chl_opt`. It is a Cloudflare
  **JS challenge** served to every client; curl_cffi fixes TLS, not JavaScript, and moving
  hosts cannot fix it. Detection also slowed to ~21 days (stale CSV keeps `lastSeen`
  advancing; only `lastChanged` catches it). Real options: ask the dealer for a feed /
  allowlist, or retire the source.
- **B-85 Phillips lot enumerator** — calendar fixed, lots not. `_phillips_extract_lots`
  parses the old Turbo-Stream payload; the site is React/Remix now. 623 of 3,360 archive
  lots. Nothing live to miss until 2026-09-04 — fix before then.
- **B-86 Chronoholic** — sold-detection flap flips 115 archive items live (4 ↔ 83).
  Invisible to the CSV-shaped gates; `health.py` now reports it daily. Needs a captured
  bad payload.
- **B-80 Watch Center** — dealer-side outage, muted to 2026-09-13, re-pages itself.

## Concurrent-close collision (worth knowing)
A second session closed at the same time and landed its own docs first. Two
consequences, both resolved here rather than clobbered: my new bugs were renumbered
**B-85 / B-86** because B-83 (WoK pagination) and B-84 (Lumé replies) had just been
taken; and #937's close had marked **B-81 as ✅ Resolved**, which it is not — the status
is corrected to Open above. If you take one thing from this: two sessions closing into
the same doc set will silently collide on ID allocation.

## State
`main` clean and pushed, 0 open PRs, 217 pytest green. Untracked `.agents/` + `AGENTS.md`
predate this session and were left alone.
