# Watchlist — Session Handoff (2026-05-20 → 2026-05-21)

For working conventions, see [CLAUDE.md](CLAUDE.md). For roadmap, see
[ROADMAP.md](ROADMAP.md). Durable rules graduate to CLAUDE.md;
durable direction graduates to ROADMAP.md. This doc is the
in-flight snapshot.

## TL;DR

**Articles became first-class objects: hearted, listable, shareable,
filterable, aggregated in their own virtual list.** Editorial corpus
grew from 8 → 11 sources (~12,600 articles, ~6M words). Built a
review-and-clean-up surface for reactions ("My reactions" virtual
list). The collector analyzer got the Robustness Anxiety strategy
principle and a fresh Sonnet 4.6 profile run. Image-perf root cause
found and fixed (workflow hang from a missing fetch timeout). And a
deep round of Editorial UX polish: sticky filter chrome, header
symmetry, dark Featured band, single search bar across tabs.
**23 PRs shipped, all merged.**

Five arcs:

1. **Articles as first-class entities (PRs #403, #404, #405).** Heart
   button + Hearted filter on Editorial cards; auto-populated "Saved
   articles" virtual row in Collections > Lists; per-article "..."
   menu with Add-to-list + Share; user collections now render an
   Articles section below the listings grid. All without a DB
   migration — `kind: 'article'` marker on the existing
   `listing_snapshot` jsonb across `watchlist_items` +
   `collection_items`.

2. **Editorial corpus expansion (PRs #393, #397, #406).** Watches of
   Espionage (294), Screw Down Crown free posts (79), Fratello
   Watches with explicit brand allowlist + vintage filter (3,734).
   Eleven sources total now.

3. **Review-my-reactions surface (PR #399).** "My reactions" synthetic
   row in Collections > Lists, aggregating every reaction the user
   has placed across every list. New SECURITY DEFINER RPC
   `my_reactions_with_items` returns reactions + item snapshots in
   one round-trip. Drill-in renders sentiment-bucketed cards with
   tap-emoji-to-remove + breadcrumb to source list.

4. **Strategy + analyzer evolution (PRs #392, #396, plus a Sonnet 4.6
   profile re-run).** Added the "Robustness Anxiety" psychology
   principle to RECOMMENDER_STRATEGY.md with a case-study section
   (Mark's broken-AP-5548 + 1675-bracelet-failure pattern). Wired
   `source_of_entry` into the collector analyzer so `auction_bulk`
   noise gets discounted. Generated COLLECTOR_HANDOFF.md (sent to
   Mark as a discovery-chat handoff artifact).

5. **Image-perf root cause + UX polish (PRs #410, #411, #412 +
   #408, #409, #413, #414, #415).** The frequent-auctions cron had
   been silently failing since May 15 because
   `cache_watchlist_images.mjs` had no fetch timeout — one hung
   dealer URL stalled the whole workflow. Fixed with AbortController
   + `timeout-minutes` workflow guard. Plus: share-receive image
   onError fallback + sender name; sticky Editorial filter chrome;
   header symmetry (search lifted to top-bar); dark "header band
   only" Featured treatment; mobile tile sizing tuned; emergency
   `visibleSources` hotfix on DesktopShell.

## PRs shipped this session

| PR | Title | Theme |
|---|---|---|
| #392 | Collector analyzer: framework lens + source_of_entry weighting | Analyzer |
| #393 | Add WOE Dispatch as 9th editorial corpus source | Corpus |
| #394 | Add Watch Center (watchcenter.ch) — Swiss WooCommerce dealer | Dealer |
| #395 | Admin: per-collection source_of_entry cleanup tool | Admin |
| #396 | Strategy doc: add Robustness Anxiety principle + case-study | Strategy |
| #397 | Add Screw Down Crown (Substack, free posts) | Corpus |
| #398 | Editorial: featured-on-top + denser scroll + relevance search | Editorial UX |
| #399 | Collections: 'My reactions' virtual row + drill-in | Reactions |
| #400 | Home: bump mobile tile size 28% → 38% | Mobile UX |
| #401 | Home: suppress native-currency line on compact tiles | Mobile UX |
| #402 | Mobile: fixed Filter header + X close button on filter sheet | Mobile UX |
| #403 | Editorial: heart articles + Hearted filter pill | Articles |
| #404 | Collections: 'Saved articles' virtual row auto-populated from hearts | Articles |
| #405 | Articles: "..." menu (Add to list / Share) + Articles section in drill-in | Articles |
| #406 | Add Fratello Watches as 11th editorial source (brand-allowlist filtered) | Corpus |
| #407 | Editorial: sticky filter chrome on scroll | Editorial UX |
| #408 | Share-receive: sender attribution + image-error fallback | Sharing |
| #409 | Editorial: close sticky gap + dedupe search bar | Editorial UX |
| #410 | Workflows: timeout-cap the image-caching step (was hanging) | Infra |
| #411 | Image perf: decoding="async" + fetchpriority hook on Cards | Perf |
| #412 | cache_watchlist_images: 15s timeout on every fetch | Infra (root cause) |
| #413 | Hotfix: restore visibleSources in DesktopShell destructure | Bug |
| #414 | Editorial: dark color block on Featured + revert filter chrome to standard bg | Editorial UX |
| #415 | Editorial: dark header band only + lift search to top-bar | Editorial UX |

**23 PRs landed.**

## Corpus state at handoff

| Source | Articles | Where | Cron |
|---|---:|---|---|
| Hairspring Finds | 1,613 | `public/hairspring_finds.json` | listings (3×/day, dual-track) |
| Hodinkee Bring a Loupe | 251 | `public/bring_a_loupe.json` | editorial (Sun) |
| Rolex Magazine | 3,810 | `public/rolex_magazine.json` | editorial (Sun) |
| On The Dash | 205 | `public/onthedash.json` | editorial (Sun) |
| Bulang & Sons Watch Talks | 161 | `public/bulang_watch_talks.json` | editorial (Sun) |
| Hodinkee Shop | 2,346 | `public/hodinkee_shop.json` | editorial (Sun, dual-track) |
| Hodinkee Reference Points | 10 | `public/hodinkee_reference_points.json` | editorial (Sun) |
| A Collected Man Journal | 160 | `public/acollectedman_journal.json` | editorial (Sun) |
| **Watches of Espionage** | **294** | `public/woe_dispatch.json` | editorial (Sun) |
| **Screw Down Crown (free)** | **79** | `public/screwdowncrown.json` | editorial (Sun) |
| **Fratello (filtered)** | **3,734** | `public/fratello.json` | editorial (Sun) |
| **Total** | **~12,663** | | |

Up from 8,556 at the 2026-05-19 handoff (+4,107 articles, +48%).

## Architectural decisions worth keeping in mind

### Articles share infrastructure with listings via `kind` marker

No new tables. Articles flow through `watchlist_items` and
`collection_items` with `listing_snapshot.kind = 'article'`. Frontend
projections check the kind and route appropriately. The
`articleAsListing(article)` helper in EditorialView.js converts an
article record into the listing-shaped item that `useWatchlist` /
`addItemToCollection` expects.

Downstream surfaces filter by kind:
- Watchlists > Saved sub-tabs filter out kind=article (listings only)
- Saved articles virtual row aggregates kind=article from `watchlist`
- Collection drill-in splits items into listings + articles sections

### Single search across tabs (post-PR #415)

App.js's `search` state is shared between Listings and Editorial.
The top-bar input renders on all tabs except Home, with a
context-aware placeholder ("Search reference or brand…" on Listings
/ Watchlists; "Search articles by title, author, body…" on
Collecting). EditorialView consumes `search` as a prop from
ReferencesTab → App.js. **The in-Editorial search input was retired
in PR #415.** Type once, search travels across tabs.

### Filter chrome + sticky stacking on Editorial

ReferencesTab's subStrip (Editorial / Size comparison / Links) and
EditorialView's filter strip both use `position: sticky`. subStrip
sticks at `top: 0` (z=25), filter at `top: 40` (z=20). The 40px
matches the tabPill subStrip rendered height — brittle but the
simplest fix without lifting filter chrome out of EditorialView
into the shell chrome (which would be the proper architecture
fix, queued as PR_U). See CLAUDE.md note.

### Image-caching fetch timeout (15s)

`cache_watchlist_images.mjs` wraps every `fetch()` with an
AbortController + 15-second timeout. Without this, a single
hung dealer URL stalled the entire workflow indefinitely — the
May 15 → May 21 bid-data gap was caused by exactly this. Plus
`timeout-minutes: 15` on the workflow step is the
belt-and-suspenders backup. Both layers should stay.

### Dark Featured band (header-only)

Editorial Featured strip uses a dark "header band only" pattern:
~52px band with the FEATURED label, cards sit below on standard
background. Achieved via `background: var(--text1) + color:
var(--bg)` so it inverts cleanly in both themes (dark slab in
light mode, light slab in dark mode). Negative horizontal margins
push the band edge-to-edge through the scroll container's padding.

### Robustness Anxiety as recommender principle

New principle in `docs/RECOMMENDER_STRATEGY.md` Collector Psychology
Principle Library, plus a dedicated case-study section. Signals to
detect: vintage piece already broken, repair-cost surprise, mentor-
watch scare. Twin behavioral pivots: toward modern-enough-to-
service complications + lower-stakes vintage experiments. Product
implications: repair-quote integration (potential affiliate channel
with watchcheck.com per memory), per-reference robustness
intelligence, wishlist bucket annotations.

## Known followups for next session

### Active queue (Mark explicitly wants)

| Item | Notes |
|---|---|
| **Moonphase widget (Level 2)** | Mark is generating 29 phase images in a separate Claude chat. Small clickable indicator near top wordmark → modal with large moon visual + phase name + UTC time. ~30 min math + a few hours visual. Image assets will arrive ready-to-wire. |
| **PR_S — Related articles** | "If you liked this…" on article cards. Score by shared brand / model_line / reference_no across the corpus. Light pass surface; collector analyzer plumbing already exists. |
| **PR_W — Article-share landing surface** | Articles currently share as the publisher URL directly. Routing through `/share/article/<hash>` + ShareReceiver article variant + `api/share.js` article OG handler would let recipient see a Watchlist landing surface like listings. |
| **PR_U — Lift Editorial filter chrome to shell** | Cleaner architecture fix than the current sticky-top:40 hack. Filter would live OUTSIDE the scroll container like Listings does. ~200–300 LOC across shells + ReferencesTab + EditorialView. |

### Personal-corpus loader (paid Substack export)

Mark saved 205 SDC articles to `~/Desktop/Screwdowncrown Articles/`.
Loader script (`screwdowncrown_personal_loader.py`) is written and
committed but not yet run end-to-end. Would write to
`personal_corpus/screwdowncrown.json` (gitignored — paid content
stays off the public repo). Free articles already in public corpus
via PR #397; this loader picks up the paid majority.

### Other queued (lower priority)

| Item | Notes |
|---|---|
| **PR_D** — Brand prefix on eBay seller-bait titles (Zeitwerk, Calatrava etc.) | Partly mitigated by PR_I exclude_keywords; full fix queued |
| **PR_G** — Desktop filter row "watches" / Clear-all overlap + chip clipping | Visual polish |
| **CLAUDE.md ACL note** | Out of date — direct anon grants on new functions vs PUBLIC inheritance. Caught while building PR_K. |
| **Reference page first build** | Data analysis surfaced 3 strong starters: Rolex GMT-Master 1675 (your daily, 65 articles), Omega Speedmaster 145.022 (35 articles, your saved search), Rolex Submariner 5513 (67 articles, highest coverage). Pilot one of these. |

## Repo / corpus size status

- `public/` total: ~57 MB pre-session → ~97 MB post-session (added 11 → +3 sources, +4,107 articles, ~2 MB scraper data + 38 MB corpus body files)
- 23 PRs through the queue without a blocked-merge incident
- Vercel deploys held through the session except the brief
  `visibleSources` ReferenceError on desktop Source filter (caught
  by ErrorBoundary, hotfix landed in #413)

## PR hygiene incidents this session

- **#407 sticky gap**: shipped the Editorial sticky filter without
  also making the parent subStrip sticky. The gap between top bar
  and filter showed scrolling content underneath. Fixed in #409.
  Lesson: when applying `position: sticky` to a nested element,
  audit the full sticky-ancestor chain. Otherwise you get partial
  stickiness with visible scrolling content under the sticky element.

- **#413 visibleSources hotfix**: DesktopShell's props destructure
  was missing `visibleSources` while lines 308–309 referenced it
  directly. ReferenceError on clicking the Source filter. Caught
  by ErrorBoundary. Lesson: when adding a new variable to MobileShell's
  destructure, mirror the same change in DesktopShell. (Probably
  worth a small test that exercises both shells via mockShellProps.)

- **#414 → #415**: shipped dark Featured block; Mark immediately
  flagged density was too high + header still asymmetric. Re-shipped
  as header-band-only + lifted search to top-bar. Lesson: visual-
  weight calls benefit from a screenshot exchange before committing
  to the full implementation. The lighter pattern would have been
  obvious on a paper sketch.

## Bottom line

Articles are now a first-class object across the app. The editorial
corpus is genuinely deep enough to power Reference pages,
recommender training, and editorial-coverage surfaces. The
collector analyzer reads cleaner with `source_of_entry` weighting +
Robustness Anxiety in its strategy lens. Image-perf root cause is
identified and patched. The Editorial UI has been through three
rounds of polish in one session and now looks close to the Hodinkee
reference quality bar.

Next session has a clean queue: the moonphase widget (with images
arriving), PR_S related articles, PR_W article-share landing
surface, and the first per-reference page pilot.
