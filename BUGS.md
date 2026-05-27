# BUGS — usability + defect backlog

The durable home for bugs Mark spots while using the app. Survives across
sessions so nothing gets lost in a screenshot folder or a rotating handoff.

## How this works

Mark drops a **`Bug:`** into *any* open session (no dedicated session needed —
this file is the memory, not the conversation). Claude then:

1. **Triages severity.** Break-now (white screen, broken core flow, can't
   load) → fix immediately, abandon current tidy-up. Everything else →
   logged here, work continues.
2. **Writes an *enriched* entry** — Claude's reconstruction (surface,
   component, likely cause, repro), not Mark's terse note. The point is that
   future-Claude's "B-07 still open" is something Mark can actually recognise.
3. **Echoes back the one-liner + stable ID** in the moment, so Mark sees it
   was captured correctly.

`/start` surfaces every **Open** entry so they resurface each session.

**Entry format:** `### B-NN — <one-line title>` then a bullet block:
`Reported` (date) · `Severity` (1 break-now / 2 usability / 3 polish) ·
`Surface` · `Status` (Open / In progress / Fixed PR#### / Won't-fix) ·
`Detail` (enriched) · `Hypothesis` (likely cause/location, if known).

When a bug ships fixed, move it to **Resolved** with the PR number. Don't
delete — the history is useful.

---

## Open

Grouped by **epic** (see [docs/IA_REDESIGN.md](docs/IA_REDESIGN.md) Deliverable 1)
so `/start` reads the backlog as coherent threads, not a flat list. **Clean-close
rule:** a partial ship *closes* its item and opens **one** crisply-scoped
follow-up — no vague "phase 2 open" tails.

### ⓐ Epic A — IA / UX Redesign
*Design threads, not defects — this epic's working checklist. Also tracked outside
BUGS as memories: chrome-unification, card-design-system.*

### B-06 — Post-screening flow is underspecified (design thread → plan-mode)
- **Reported:** 2026-05-24 · **Type:** Design/product question · **Status:** Largely RESOLVED by the screening collapse 2026-05-26 (PRs #598–602). The original four questions are answered or obsoleted by the new binary model:
  1. *Done screening?* → light `CompletionView` ("Saved N of M"); results = your watchlist.
  2. *Where are results?* → the **Saved/watchlist** (the swipe hearts there; there's no separate per-list result set anymore).
  3. *Rescreen / reset / share?* → rescreen = tap **Screen** again; reset is obsolete (no reactions to clear); share = the normal list Share. Unsave-while-screening shipped (#602, Undo reverses a save).
  4. *Who likes what on a shared list?* → **deliberately deferred** — collaborative reactions were removed in the collapse; "who-hearted-what" is a planned LATER re-add (memory [[feedback_reaction_context_lives_in_lists]]).
- **What remains (the only open slice):** collaborative per-person visibility on shared lists when the team re-adds it. Not a current defect — a future feature. Connects to [[feedback-screening-mode-surfaces]] and [[project_auction_tab_redesign]] (Phase 3 heart-an-auction / Phase 4 integrated tab).

### B-08 — Unify the Watchlists tab into one sectioned screen (design thread → plan-mode)
- **Reported:** 2026-05-24 · **Type:** Design/product thread, **not** a defect · **Severity:** — (needs plan) · **Surface:** Watchlists tab (UI "Watchlists"/"Saved") · **Status:** Open — flagged for plan-mode
- **Detail:** The Watchlists tab currently has **two sub-tabs** (Lists +
  Searches). Mark's idea: **integrate them into one screen** with **sections**
  rather than a plain list — **cards on mobile**, and **make more of the width
  on desktop**. This unified screen could also become the home for **Watchbox**
  (owned-watches view) so it lives alongside lists/searches instead of separate.
- **Why this is a plan item:** it's a re-architecture of a whole tab's IA
  (merging sub-tabs, a new sectioned layout, responsive card/grid treatment,
  and absorbing Watchbox) — design + layout decisions up front, not a quick
  edit. Internals reminder (CLAUDE.md): UI "Watchlists"/"Saved" ↔ internal
  `watchlist`/`WatchlistTab.js`; the broader `collections` umbrella (Lists,
  Wishlist, Owned/Watchbox, Sold) is the relevant data model. Pairs with B-06
  for a screening/collecting plan-mode session.

### B-14 — BRAND.md review (Plan thread)
- **Reported:** 2026-05-24 (`Plan:`) · **Type:** Plan-mode thread, not a bug · **Status:** Queued for a coming session. Mark wants a review of `BRAND.md` (voice/brand). Pairs naturally with the card design system's "breathing-space & brand impact" dial — brand voice + visual brand expression. Surface at a replanning step.

### ⓑ Epic B — Platform Health
*Audit remediation + reliability. Low-risk, noise-reducing; mostly independent of
the redesign.*

### B-16 — Dependencies unpinned (no lockfiles, JS + Python)
- **Reported:** 2026-05-24 · **Source:** `audit:2026-05-24` · **Severity:** 2 (reliability + supply-chain) · **Surface:** build / CI / workflows · **Status:** Partly fixed — **Python pinned #578**; **JS lockfile still open** (pending a Node environment — `npm` unavailable locally).
- **Detail:** No `package-lock.json`; workflows `pip install` latest unpinned. A build that works today can break tomorrow with no code change, and it's a supply-chain exposure (updates run with the scrapers' secret keys). Cheapest high-leverage fix in the audit.
- **Done (#578):** pinned `requirements.txt` / `requirements-auctions.txt` / `requirements-ai.txt`; all 11 runtime workflow steps now `pip install -r`.
- **Remaining:** commit `package-lock.json` + switch CI/Vercel to `npm ci` (needs Node); optionally Dependabot for deliberate bumps. Detail: `findings-maintainability.md` (HIGH-1), `findings-security.md` (MED-2/3).

### B-18 — Currency FX tables duplicated, can silently drift
- **Reported:** 2026-05-24 · **Source:** `audit:2026-05-24` · **Severity:** 2 (price correctness) · **Surface:** `merge.py` + `utils.js` · **Status:** Open
- **Detail:** Exchange rates are hardcoded in two places that must match, with nothing enforcing it. Drift → silently wrong prices (the "8× off" class) and fabricated "biggest price drops" feeding the deals sort.
- **Fix:** single source of truth, or a parity test that fails if the two disagree. Detail: `findings-correctness.md` (F2/F9), `findings-data.md` (H4).

### B-19 — 5 user-data tables' RLS state not version-controlled
- **Reported:** 2026-05-24 · **Source:** `audit:2026-05-24` · **Severity:** 2 (security provability) · **Surface:** Supabase / migrations · **Status:** Open
- **Detail:** `watchlist_items`, `hidden_listings`, `saved_searches`, `tracked_lots`, and the base collections/challenges table have correct policies in the repo but **no committed CREATE / enable-RLS** — so "RLS is on" can't be proven from code, and a dashboard change could silently disable it (private → world-readable). No active leak found; this is a provability + regression-safety gap. Also: the `listing_events` insert policy lets a client forge `user_id`.
- **Fix:** commit DDL + `enable row level security` for the 5; tighten the `listing_events` insert policy. Detail: `findings-security.md` (HIGH-1, MED-1).

### B-20 — Two near-identical auction-scraper filenames
- **Reported:** 2026-05-24 · **Source:** `audit:2026-05-24` · **Severity:** 3 (footgun) · **Surface:** auction scrapers · **Status:** Open
- **Detail:** `auction_lots_scraper.py` (catalog walker) and `auctionlots_scraper.py` (tracked-URL tracker) differ by one underscore and both run in the same workflow — easy to edit the wrong one. Flagged independently by 3 auditors.
- **Fix:** rename `auctionlots_scraper.py` → `tracked_lots_scraper.py` + update importers/workflows. Detail: `findings-architecture.md` (M1), `findings-maintainability.md` (MED-4).

### B-22 — App ships as one bundle; heavy tabs aren't code-split
- **Reported:** 2026-05-26 · **Source:** `audit:2026-05-24` (H1) · **Severity:** 2 (perf / first-load) · **Surface:** `src/App.js`, `src/index.js` · **Status:** Partly fixed — **AdminTab code-split #579**; phase 2 open.
- **Detail:** No `React.lazy`/`Suspense` anywhere; `App.js` statically imports every heavy surface (AdminTab, EditorialView, SizeCompare, ChallengeFlow, the share/list/challenge receivers, all modals, SearchResultsView), so every visitor downloads + parses their code on first load even though most never open them.
- **Done (#579):** AdminTab (admin-only) `React.lazy` + `Suspense` — its chunk now loads only when an admin opens the tab.
- **Remaining (phase 2):** the receivers (mount only on inbound share/challenge/list links), `EditorialView`, `SizeCompare`, `ChallengeFlow`, modals. Confirm where each is imported (some are inside sub-components, not App.js). Detail: `docs/audits/2026-05-24-vibe-code/findings-frontend.md` (H1).

### B-27 — Inert-code visibility scan (maintenance thread)
- **Reported:** 2026-05-26 · **Type:** Maintenance/hygiene thread, not a defect · **Severity:** 3 (maintainability) · **Status:** Open — queued for a maintenance pass.
- **Why:** building B-24 surfaced that `enumerate_bonhams` was complete and wired into `ENUMERATORS` but **inert in CI** (Cloudflare 403) — code that exists, looks live, but never produces output in its current environment. Its docstring even claimed "works cleanly from CI" (true once, then false). This is a *different* axis than the 2026-05-24 vibe-code audit (which covered correctness/security/perf, not dormant-but-valid code), so it's not tracked anywhere. Mark's question (2026-05-26): "how much of this is in the codebase, just not visible?"
- **Scope of the scan:** find code that is wired in but effectively inert — enumerators/scrapers that return `[]` in their runtime, workflows built but never scheduled (e.g. `scrape-listings-matrix.yml`), flag-guarded **retired UI surfaces** (CLAUDE.md's "don't reintroduce" list), dead imports (e.g. App.js imports `ListReviewMode` but renders it 0× — noted in a prior handoff). For each: decide keep-with-marker / reactivate / delete.
- **Convention to adopt:** dormant-but-valid code carries a `DORMANT:` marker stating *why it's inert + what reactivates it* (done for `enumerate_bonhams`, #-this-PR). And: sanity-check plan docs (BUGS/ROADMAP) against actual code before writing "build X" (the B-24 framing miss). Pairs with the `/maintenance` skill.

### ⓒ Epic C — Auctions & Scraping
*The parallel backend session's domain. Phase-0-adjacent; mostly shipped, with
install/decision tails remaining.*

### B-23 — Browse AI 403 (Tropical Watch) + in-batch scrape failures are invisible
- **Reported:** 2026-05-26 · **Severity:** 2 (a source stops updating; operability) · **Surface:** `tropicalwatch_scraper.py`, `.github/workflows/scrape-listings.yml`, `notify-scrape-failure.yml` · **Status:** Partly fixed — **error-surfacing shipped (this branch)**; **account-side fix pending Mark**; **silent-gap proposal pending decision**.
- **Detail:** Tropical Watch (the **only** active Browse AI source — Analog Shift fetches Shopify directly, Grey & Patina migrated to WooCommerce) started getting **`403 Forbidden`** from `POST /robots/{id}/tasks` on 2026-05-26 06:09Z, opening scrape-failure issue **#569**. The key is present (not 401), so 403 = account-side: most likely **exhausted Browse AI task credits**, lapsed billing, or a rotated key. Not a code bug — needs the Browse AI dashboard.
- **Two findings:** (1) the scraper called `raise_for_status()` and **discarded Browse AI's response body**, so CI logs showed only "403" with no reason. (2) Tropical Watch fails *loudly* (own workflow → red → issue), but every source **inside** `scrape-listings.yml` runs `continue-on-error`, so an Analog Shift / Grey & Patina failure keeps the run **green** and never notifies — `health.py` detects it (STALE >12h + missing CSV) but only on-demand.
- **Done (this branch):** `_raise_for_status()` helper in `tropicalwatch_scraper.py` prints the response body + a 403 hint before raising, at all three API call sites — the next failure self-diagnoses.
- **Root cause (confirmed 2026-05-26):** Browse AI **free tier = 50 credits/mo**; our usage is **~17 credits/day** (the dedicated `scrape-tropicalwatch.yml` triggers a **fresh 15-credit** capture 2×/day — `python tropicalwatch_scraper.py`, no `--latest`). So the free allowance is structurally impossible to stay under, and a fresh trigger gets **403** once the balance drops below the ~15 a fresh run needs (dashboard still shows a small positive balance + 100% success). The two "Notify on scrape failure: All jobs have failed" emails were a **red herring** — GitHub's own CDN failed to download `actions/github-script` (transient infra), unrelated to Browse AI.
- **Not data loss:** the main `scrape-listings.yml` batch reads TW via `tropicalwatch_scraper.py --latest` (cheap/free read of the last capture), so `data/tropicalwatch.csv` kept updating after the failures (last 06:33 UTC). TW degrades only once Browse AI's own Daily Update also can't run.
- **MAJOR UPDATE (2026-05-26, same session) — TW is directly scrapable; Browse AI is NOT required.** Tested from a residential IP: `tropicalwatch.com/` returns HTTP 200, plain **server-rendered HTML** with watch detail links — no Cloudflare challenge, no JS-app (`__NEXT_DATA__`=0, no react root). Detail pages return 200 with price + the `color-red`/Sold marker, and the scraper **already** fetches those directly (the sold-sweep) — even from CI. The earlier "it's a SPA / needs a browser" read was **wrong**, based on a 404 from the wrong path (`/watches`; the real listings live on `/`). So Browse AI for TW is **historical convenience** (it bundled all ~150 listings incl. pagination), not necessity. **Plan: replace it with a direct `requests` scraper and drop Browse AI for TW** — this kills the credit problem. Two checks first: (a) the pagination scheme to reach all ~150 from `/`; (b) whether the **index** also works from a datacenter IP — if yes, TW needs NO special host and runs free in existing CI; if no, it runs on the residential host (B-25). (Detail pages already prove TW isn't IP-blocked.)
- **Direction shift (supersedes the earlier "subscribe to Browse AI" call):** testing showed **both TW and Bonhams scrape directly** (TW from anywhere; Bonhams from a residential IP). So the plan moved from *buy Browse AI* → **residential direct-scrape, drop Browse AI** (B-24 Bonhams, B-25 host). A Browse AI top-up is now only a short-term *bridge* for TW until its direct scraper ships.
- **Remaining:** (a) **Mark (short-term bridge only):** top up Browse AI credits to keep TW alive until the direct scraper lands — OR pause `scrape-tropicalwatch.yml`'s `schedule:` (keep `workflow_dispatch`) to stop the ~2×/day fail emails (TW still flows via the main batch's `--latest`). (b) **Build:** the direct TW scraper (next session, after the two checks). (c) **Decide later:** in-batch silent-failure visibility (daily `health.py` digest vs loud-batch vs in-app Admin badge) — deferred.

### B-24 — Bonhams direct residential scrape, schedule-driven
- **Reported:** 2026-05-26 · **Type:** Plan/build thread · **Status:** Code SHIPPED (#590 scraper + frontend fold; #591 host throttle + launchd) — **LaunchAgent install on the laptop pending** (with Mark, per scripts/RESIDENTIAL_SCRAPE_SETUP.md).
- **FRAMING CORRECTION (2026-05-26):** the "Build plan" below was written as build-from-scratch, but most of it **already existed**. `enumerate_bonhams` (+ `_bonhams_lot_to_record`, `_bonhams_fetch` with curl-cffi) was complete in `auction_lots_scraper.py` and wired into `ENUMERATORS`; the **calendar** (`bonhams_auctions_scraper.py`) already runs in CI and keeps the schedule fresh. It was dormant-in-CI (Cloudflare 403s lot pages from datacenter IPs), not missing. What actually shipped: a thin `bonhams_lots_scraper.py` reusing the existing enumerator + window logic, writing a **separate `public/bonhams_lots.json`** (NOT seeded into auctions_state) so CI's auction_lots.json sweep can't clobber it; the frontend folds it by URL key (mirror of manual_archive_lots.json); an adaptive throttle (hourly tick → ~6h normal / hourly near a close) + launchd host. Note from build: Bonhams' JSON exposes **no live bid**, only estimates + realised `hammerPremium` at close — so the ramp targets prompt results capture, not live bidding. The enumerator now carries a `DORMANT IN CI` marker (see [[B-27]]).
- **Tested 2026-05-26:** Bonhams redesigned to a **Next.js** site. From a **residential IP** it serves HTTP 200 + a `__NEXT_DATA__` JSON blob with full lot data: `pageProps.lotData.auctionLots` (~28 lots/page), each with title/ref, currency (HKD), slug, image; `pageProps.auction` carries lifecycle fields (`sSaleStatus`, **`auctionEndDate`**, `number_of_lots`=125, `catalogLiveAt`-equivalents, dept **`sDepartment: WCH`**=Watches). Route: `/auction/{auctionId}/{slug}/?page=N`. **No browser needed** (data is in the initial HTML). **CI-blocked confirmed** via the `source-probe` workflow (#584): GitHub datacenter IP → **403 + Cloudflare challenge**. ⇒ Bonhams must run from a **residential IP** (B-25), but needs **neither Browse AI nor Playwright** — plain `requests` + parse `__NEXT_DATA__`.
- **Build plan:** (1) seed list of Bonhams watch sales (`bonhams_known_auctions.json`, mirroring `phillips_known_codes.json`) → entries in the auction schedule (`public/auctions_state.json`, which already has `catalogLiveAt`/`dateStart`/`dateEnd`/`statusHint`). (2) direct lot scraper reads the schedule, scrapes any sale **in-window** `[catalogLiveAt, dateEnd]`, walking `?page=1..ceil(number_of_lots/perPage)`. (3) after `dateEnd` (or `has_results_report`=true): one final results capture → archive, stop polling. (4) **adaptive ramp** — scrape frequency rises as `dateEnd` nears (logic in the scraper, gated by time-to-end; host ticks at a fixed base cadence). (5) optional later: auto-discovery scrape of the WCH dept index to auto-populate the schedule. Per-source-file convention; runs on the residential host (B-25). Same two-tier "calendar + lots" shape as the 5 existing houses.

### B-25 — Residential scrape host: laptop now → Raspberry Pi / Mac mini
- **Reported:** 2026-05-26 · **Type:** Plan/infra thread · **Status:** Code SHIPPED (#591: wrapper `scripts/bonhams_residential_scrape.sh`, hourly LaunchAgent plist, setup doc, scraper `--throttle`). **Install on the laptop pending** (with Mark — clone to ~/watchlist-bonhams, smoke-test, `launchctl bootstrap`). Design note: runs from a **dedicated clone on main** so it never disturbs the working copy.
- **The model (two independent axes):** (1) **Capability** = IP type (residential vs datacenter) + whether a browser is needed → **laptop = Pi = Mac mini** (all residential, same code); if one works, all work. (2) **Availability** = on-when-needed → the *only* laptop-vs-always-on difference, and it only matters for catching a live auction's **final hours** (lowest-value slice).
- **Plan:** start on **Mark's laptop + a `launchd` LaunchAgent** — runs a few times/day while on; `launchd` auto-runs a *missed* job on next wake (unlike cron, which skips). The scraper reads the schedule, no-ops when nothing's in-window, and **pushes results to the repo** so `merge.py` folds them in (same as any source CSV). Later: a **Raspberry Pi 4/5 (4GB+)** or Mac mini as an always-on residential box — **code unchanged, host swap only**. (Pi only needs system-Chromium *if* a source ever needs Playwright; Bonhams + TW don't.) Auction catalogs change slowly, so laptop-when-on covers ~95%; always-on only adds live-finale capture.
- **Pluggable-fetcher abstraction:** the orchestration (schedule → URL → window → results → merge) is identical whether the fetcher is direct-`requests`, Playwright, or Browse AI. Build it **once**; the fetcher is a swap. For both Bonhams and TW, **direct fetch works → Browse AI is droppable.**
- **Security:** needs git push creds on the box (Mark has git set up). If ever a self-hosted GitHub *runner* instead of `launchd`, lock it down — self-hosted runners on a public repo are a known risk.

### B-28 — Editorial sources may be filtering out fresh (non-vintage) articles
- **Reported:** 2026-05-27 · **Type:** Scrape/content completeness · **Severity:** 3 · **Surface:** editorial scrapers / corpus inclusion filter · **Status:** Open — **log only, not now** (Mark).
- **Detail:** Mark saw new Fratello articles today that aren't on our site; believes the scrape IS running and working. Hypothesis: a **vintage-only inclusion filter** excludes fresh/non-vintage posts, so new general articles never enter the corpus. Verify whether the filter is intentional (we only want vintage-relevant) or too aggressive, and check the Fratello (+ peer source) scraper's inclusion predicate + recency window.

### ◆ One-off (no epic)
*Small correctness fix.*

### B-26 — A shared item leaks into the brand-filtered Listings grid
- **Reported:** 2026-05-26 · **Severity:** 2 (correctness; possible cross-user/private-content leak — verify) · **Surface:** Listings brand filter / user-data projection into listings · **Status:** Open — held for later (Mark, 2026-05-26)
- **Detail:** Filtering Listings by brand **Enicar** surfaces a card that links to a **share URL** — `https://the-watch-list.app/share/484b499a302c?from=Mark+Mutter` — instead of a real dealer listing. A `/share/<id>` link is a *shared item*, not a marketplace listing, so it shouldn't appear in the public brand-filtered grid at all.
- **What I found (triage):** the `/share/` item is **not** in static `public/listings.json` (none of the 9 Enicar items there have a `/share/` URL). So it's coming from **user data** — a Supabase row (collection/shared item) carrying a `listing_snapshot`, which is projected into the listings memo client-side (`src/supabase.js` `listing_snapshot` pattern; CLAUDE.md "Articles flow through the listing tables"). The snapshot's `brand` is `Enicar`, so it matches the Enicar brand filter, but its link resolves to the `/share/<id>` URL rather than a dealer URL.
- **Hypothesis:** the listings projection / brand filter doesn't exclude share-kind (or non-dealer `listing_snapshot`) items — they should live only in their own surface, not the cross-source Listings grid. Likely fix near the listings memo in `src/App.js` (gate out share/`listing_snapshot`-only items) or wherever shared snapshots are folded into the grid. **Verify the privacy dimension:** confirm whether this leaks one user's shared item into *another* user's listings, or only the sharer's own session.
- **Adjacent smell (maybe separate):** one static Enicar item is titled "Richard Mille RM 002-V2 Tourbillon…" but `brand: Enicar` (windvintage URL) — a brand-misclassification worth a look while in this code.

### B-29 — Sold tab: "Calendar" button → "Auctions"; closed-auction click should open its lots
- **Reported:** 2026-05-27 · **Type:** Auction-surface UX (Epic 9 / Phase 0 follow-up) · **Severity:** 2 · **Surface:** Listings ▸ Sold filter row + the auction calendar modal "Closed" path · **Status:** Open — queued.
- **Detail (two parts):** (1) On the **Sold** sub-tab the **"Calendar"** filter-row button should read **"Auctions"** and take the user to / filter the **closed auctions** (the modal's Closed view). (2) Clicking a **closed (past) auction** should open the **closed listings for that sale** (its lots) — the same way a live sale opens its lots. Mark: "I want it to work like that." Likely the closed-sale card's onClick (`handleOpenSale`) doesn't filter the Sold grid by that sale's lots.

### B-30 — Auction calendar modal: month pills don't filter (only scroll); "ALL" + CLOSED layout
- **Reported:** 2026-05-27 · **Type:** Auction redesign defect + polish · **Severity:** 2 · **Surface:** `AuctionCalendar` modal (month nav + house filter row) · **Status:** Fixed (auction-cal-closed-left) — Mark's call: month pills stay **scroll-to** (NOT filtering), the no-op **"ALL" removed**, **"CLOSED" moved left** ahead of the months.
- **Detail:** (1) **Filtering:** tapping a month pill (MAY/JUN/…) does NOT filter to that month — all sales still render, it just **scrolls** to the month. Mark questions whether **"ALL"** should exist if months don't actually filter. Decide: make month pills *filter* (hide other months) OR keep scroll-to + drop "ALL". (2) **Layout:** the **"CLOSED"** pill sits far-right on the month row; Mark wants it on the **same line but left-aligned**, ahead of the months.

### B-31 — Search results: Auctions strip cards misaligned
- **Reported:** 2026-05-27 · **Severity:** 3 (visual) · **Surface:** `SearchResultsView` Auctions strip (`Strip`→`CardStrip`/`Card`) · **Status:** Open — queued (needs visual diagnosis; no local Node to verify).
- **Detail:** In the Home "search all" results, the **Auctions** strip cards don't line up with the Listings strip above (Mark screenshot 2026-05-27). Likely the auction item renders at a different card height/aspect in the shared `CardStrip` (countdown badge / image aspect / price line). Compare auction-vs-listing `Card` rendering and align the card dimensions within the strip.

### B-32 — Home: content strips (recently added · articles · sold · hearted · auctions ending soon)
- **Reported:** 2026-05-27 · **Type:** Feature (Home landing) · **Severity:** 3 · **Surface:** `HomeTab` strips + editorial corpus · **Status:** Open — queued.
- **Detail:** Mark wants the home/landing page to carry horizontal strips: **Recently added · Articles (recent) · Sold · Hearted · Auctions ending soon.** (Articles = the long-deferred editorial strip — load editorial meta lazily, sort by `published_at`.) Each a `CardStrip` deep-linking into the relevant surface. Mind first-paint weight — idle/lazy-load like the other deferred fetches.

### B-33 — Horizontal strips don't signal they scroll sideways
- **Reported:** 2026-05-27 · **Type:** UX affordance · **Severity:** 2 (discoverability) · **Surface:** `CardStrip` (shared — Home + search results + every strip) · **Status:** Open — queued.
- **Detail:** Users (Mark + others) don't realise the horizontal card strips scroll sideways. Add a scroll affordance — "like Claude's scroll indicator but horizontal": a slim always-visible scrollbar track/thumb and/or a **right-edge fade gradient** hinting more content (fades out at the end). Global fix in the shared `CardStrip` so every strip benefits.

---

## Resolved

### B-21 — Service-worker JSON regex out of sync with post-split feed filenames · Fixed #580
- The SW's `isJsonData()` matched only the pre-split filenames, so the live/sold
  split + auction/editorial archives the app fetches fell through to
  pass-through (no offline fallback; the freshness guarantee held only because
  App.js sets `cache:"no-cache"`). Fixed by deriving the matcher from a named
  `JSON_DATA_FILES` list, plus `src/service-worker.test.js` — a drift guard that
  rebuilds the SW regex from source and asserts it covers every App.js `*_URL`
  feed constant, so it can't silently drift again. Detail:
  `docs/audits/2026-05-24-vibe-code/findings-frontend.md` (H2).

### B-17 — ~19 MB of non-critical JSON loaded eagerly on every app open · Fixed #577
- The mount effect fetched 5 heavy archive/auction sources (auction_lots 5.2 MB,
  loupethis 4.4 MB, hodinkee_shop 3.2 MB, hairspring_finds 1.7 MB,
  manual_archive_lots 1.1 MB) concurrently with the critical `listings_live`
  fetch, though they feed only the Auctions tab + the Sold-archive projection —
  never the default Listings>Live first paint. Deferred them past first paint
  via `requestIdleCallback` (timeout 2000 ms; `setTimeout(1200)` fallback),
  taking ~15 MB of fetch+parse off the mobile first-paint window. The
  service-worker-regex sub-item (H2) was split to B-21. Detail:
  `docs/audits/2026-05-24-vibe-code/findings-frontend.md` (C1).

### B-15 — Scrapers could silently mark a source's whole stock "Sold" on an empty scrape · Fixed #576
- An HTTP-200-but-empty/truncated scrape used to flip **every** previously-live
  item from that source to SOLD on the first miss (permanent, in the archive),
  with no alert because every workflow step is `continue-on-error`. Fixed with a
  central debounce in `merge.update_state`: a listing must be absent from
  `DISAPPEARANCE_MISS_THRESHOLD` (=2) consecutive runs before flipping to sold —
  the first miss is held live (re-emitted from the state cache), and a seen run
  resets the per-entry `missCount`, so an every-other-run flap never flips.
  Protects all ~41 sources + future ones centrally (no per-scraper edits).
  Detail: `docs/audits/2026-05-24-vibe-code/findings-data.md` (C1).

### B-01 — Editorial filter chrome squashed on scroll (mobile) · Fixed #554
- EditorialView portals its filter chrome into a slot in the shell's sticky
  stack (`#editorial-filter-slot`) on mobile, so editorial's filters live in
  the same chrome as every other tab — no 2nd sticky layer squashing search.

### B-07 — Olive Home nav band (smooths Home → core-tabs jump) · Fixed #547
- Home masthead nav band (tabs + search) made full `--brand-olive` so Home ends
  in the same olive as the core tabs; the hero stays neutral.

### B-11 — See-through "divider gap" below the sticky chrome (recurring) · Fixed #552
- A sticky DateDivider sat *below* the desktop scroll pane's 14px top padding
  (Watchlist/Collecting at 0 never showed it). Zeroed the pane top padding on
  all tabs — removed at the root after years of band-aids. The broader
  shared-chrome unification stays a future item (see chrome-unification memory).

### B-13 — Grey band "in front of" the Search-all strips (esp. auctions) · Fixed #557
- The strip scroll container used `background: var(--border)` + 16/20px
  horizontal padding, so the edge inset rendered as a grey band before the
  first card. Most visible on the light-image auction cards; subtler on
  dark wrist/sold shots. Fixed by making the strip background transparent (the
  inset is now page-colored), on all strips for consistency.

### B-12 — Search-all article cards looked different from the other strips · Fixed #556
- The Articles strip used a separate tile (`ArticleStrip`) with a 16/10 landscape
  image + no placeholder, while Listings/Auctions/Sold use the shared `Card`
  (square 1:1 image). Chose to **align the tile to Card's look** (not route
  articles through Card — articles are a genuinely distinct, price-less,
  external-link type; see CLAUDE.md consistency-principle nuance). Squared the
  image (1:1 + favicon placeholder, always rendered) and matched the title to
  Card (12px / 500 / 2-line). Strip-item widths already matched.

### B-09 — Search-all returned zero articles for any query (e.g. 5513) · Fixed #555
- **Real cause (my earlier "no bodies" hypothesis was wrong — bodies *were* being fetched):** the editorial meta files are **dict-keyed** (`{url: record}`) per the `editorial_corpus_io` split. `EditorialView` reads them via `Object.values`, but the **Search-all fetch in `App.js` did `if (!Array.isArray(arr)) return []`** — discarding *every* source. So Search-all had **zero articles for ANY query**; 5513 is just where Mark noticed. Fix: parse both array + dict shapes (`Object.values`), filtered to real records (`url` + `title`) like EditorialView. Body matching already worked once articles exist (`bodies[article.url]`, rec.url matches the bodies key).
### B-03 — Main tabs pinned on scroll (all tabs) · Fixed #550
- Main tab pills (Listings/Watchlists/Collecting) used to be a non-sticky
  "Row 2" that scrolled away. Moved them into the `data-sticky-chrome` stack
  in `MobileShell.js` as its first child (the same lift a prior PR did for the
  sub-tabs), so they stay visible at any scroll depth on every tab. Wordmark
  brand row stays non-sticky to keep the pinned chrome compact. Note: main tabs
  no longer show during cross-tab Search-all (SearchResultsView has its own
  Exit). B-01 (editorial search squash) split out as a separate follow-up.

### B-10 — Home nav band (tabs + search) sticky · Fixed #549
- Pinned the HomeTab masthead band with `position: sticky;
  top: env(safe-area-inset-top); zIndex: 30` — Home tabs + search stay
  reachable on scroll; hero scrolls away above, strips scroll under.

### B-04 — "Take a break" interstitial fires too early (25 → 50) · Fixed #544
- Screening break prompt fired after 25 cards; Mark wanted 50. Changed
  `BREAK_INTERVAL` 25 → 50 in `ListReviewMode.js`; the `Math.floor(idx /
  BREAK_INTERVAL)` cadence now fires at 50/100/150…

### B-02 — Screening copy: auction catalogs distinguish watch vs save · Fixed #546
- Auction-catalog screening onboarding now reads: Yes = "Watches you want to
  watch", Heart = "Watches you want to save and are very interested in", Pass =
  "Not interested" (Mark's wording). Threaded `isAuctionCatalog` (=
  `selected.type === 'auction'`) → `OnboardingCard`. Non-auction lists keep
  their original consider/save/Not-for-you copy. One-time intro gated by
  `screening_intro_seen_v1`.

### B-05 — Saved auction catalogs need house + date · Fixed #545
- Auction-catalog rows in Lists showed only title + count, so two
  similarly-named catalogs were indistinguishable. Now append "· {House} ·
  {date}" to the row subtitle, read from the saved lots' `house` +
  `auction_date_label` (carried in the listing_snapshot) — frontend-only, no
  migration. Degrades to count-only for old snapshots / manual items.
