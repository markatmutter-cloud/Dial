# Session handoff — 2026-06-22

**One-line:** A "live cleanup" session — Mark stacked five asks up front, then
I worked them in order with worktree-per-change + auto-merge-on-green. Four PRs
merged (#904 #905 #906 #907), two scraper defects root-caused live and logged
(B-77 Sotheby's, B-78 Bonhams). Nothing stranded.

## What shipped (all merged)
- **#904 — Removed the finishing-soon Home section (both strips).** Dropped the
  "Finishing soon" followed-lots strip AND the "Auctions you're following"
  catalog tiles. Mark lived with them and judged the on-Home ending-soon
  surfacing wrong; a better approach is TBD (don't rebuild without it).
- **#905 — Removed the standalone Lumé top tab; re-homed its design in the
  desktop expanded bubble.** Killed the 5th pill + `lumeTabJSX` + the App-owned
  `lumeChat` instance + the "Make Lumé my home" landing pref (DB column left
  dormant). The bubble's ⤢ desktop-expanded mode now mounts the full
  `LumeCanvas` (greeting + lead + shelves + chat rail); corner frame + mobile
  stay the bare `LumeConversation`. `ChatBubbleHost` gained the feed props.
  `LumeTab.test.jsx` → `LumeCanvas.test.jsx` (direct coverage).
- **#906 — Fix B-78(1): demote stale 'upcoming' auctions to past.** Extracted
  `emit_auction_status()` in merge.py; the date-sanity override now demotes BOTH
  stale 'live' and 'upcoming' hints to 'past' once the end date passes (Bonhams
  recycles weekly-sale ids → a closed Weekly stayed 'upcoming' forever). +5
  pytest cases. Shared fix, all houses. Stale entries self-correct next run.
- **#907 — Fix: exclude backfilled items from Home "Recently added".** A newly-
  onboarded source (Menta) lands its whole catalog flagged `backfilled` with
  firstSeen=today, so the strip flooded with it while "View all" parked it at
  the bottom (the live feed already excludes backfilled from "new"). Added
  `!i.backfilled` so the strip mirrors the live feed.

## Logged, not built (defects — full evidence in BUGS.md)
- **B-77 — Sotheby's LIVE-auction sold prices not captured.** Root-caused live:
  it's auction *type*, not a blanket sign-in issue. *Timed online* sales (Fine
  Watches) return `bidState.sold = ResultVisible{finalPriceV2}` via the
  `lotCardsConnection` GraphQL → captured fine (519/574). *Live in-room* sales
  (Important Watches, incl. the McQueen Heuer Monaco lot 71) return
  `ResultHidden` for every lot even days after close, AND the unauthenticated
  lot-detail SSR is also `ResultHidden` — the "Lot Sold 640,000" renders
  client-side from a signed-in session. **Mark chose: build the authenticated
  fetch.** BLOCKED ON MARK: needs a signed-in sothebys.com `graphql` request
  capture — the operation name + variables + the `Authorization` header/session
  cookie from the request whose response carries `finalPrice`. With that I build
  `refresh_sothebys_unsold_lots` (mirrors `refresh_antiquorum_unsold_lots`) on
  the residential agent with the session as a secret.
- **B-78(2) — Bonhams affiliated houses.** Bruun Rasmussen (`bruun-rasmussen.dk`)
  + Bukowskis (`bukowskis.com`) appear on Bonhams' MAIN calendar (`/auctions/`)
  but NOT the watches department page the scraper reads → invisible. New-source
  build, routed to ROADMAP Epic 2.

## MUST verify live (I can't run the app here)
1. **#905 desktop expanded bubble** — open Lumé bubble → ⤢ expand → confirm the
   `LumeCanvas` two-pane (content + 380px chat rail) lays out right in the
   880×820 panel: rail/composer position, cold-open shelves render. Mobile +
   corner frame unchanged. If the composer sits high/low, nudge the panel body.

## Open / next
- **B-77** — hand me the Sotheby's signed-in GraphQL capture, then I build it.
- **B-78(2)** — affiliated-houses source build (ROADMAP Epic 2), unstarted.
- **A better on-Home "ending soon" surfacing** to replace the removed strips
  (design TBD — Mark's call; ROADMAP Epic 2 marks the old strips REMOVED).
- Carried from 06-18: the email-reminder thread (Phase B, Resend) stands on its
  own, unaffected by the #904 strip removal.

## Process notes (mine)
- **Clean discipline this session.** Branched in worktrees every time (parallel
  session was live early on), held all code work until Mark confirmed asks +
  the other session's close landed, auto-merge-on-green kept it rolling. No
  orphans, no main edits mid-flight.
- **`gh pr create` with `"` in --body silently failed once** (#907 — the PR
  wasn't created; the auto-merge poll then found no PR). Use `--body-file` for
  any body with quotes/backticks.

## Don't bump (storage keys)
`LEGACY_WATCHLIST_KEY`, `LEGACY_HIDDEN_KEY`, `dial_watch_anon_id`,
`dial_collections_sub_tab`, `dial_listings_sub_tab`, `dial_watch_top_tab`,
`lume_opened_v1`. (Carried forward.)
