# Watchlist — shipped log

The single changelog for the project. Everything that ships lands here
as a two-line entry (title + date + one sentence). ROADMAP holds
direction only; this holds history. For design rationale, see commit
history and the SESSION_HANDOFF archives.

## How this is organized

Grouped by epic (matching ROADMAP epic numbering), plus a cross-cutting
**UI & chrome** section for work that doesn't sit under one epic. Each
entry is two-line max: title + ship date + one-sentence what. Newest
within each section roughly last.

> A handful of older entries carry `2026-05-XX` where the exact ship
> date wasn't recovered — fill on next touch, don't guess.

---

## Epic 0 — Foundations

- **2026-05-02 — verify_sources.py.** Per-source liveness counter +
  rolling-7-day-median delta tracker; outputs verification.json.
- **2026-05-XX — verify_auction_lots.py (PR #35).** Same shape as
  verify_sources but for `auction_lots.json` per house.
- **2026-05-01 — User settings / currency preference.** `user_settings`
  Supabase table + USD/GBP/EUR picker in Settings.
- **2026-05-XX — SEO basics (PR #39).** Descriptive `<title>`, meta
  description, OG / Twitter card, canonical, JSON-LD, robots, sitemap.
- **2026-05-17 — Reference index + matcher.** Curated
  `docs/watch_references.md` (26 brands · 312 model lines · 1,666 refs) +
  `reference_index_match.py` + regenerated gap report; research-chat
  patch workflow established.
- **2026-05-19 — Matcher wired into every scrape path (PR #378).**
  merge.py + all auction enumerators + editorial scrapers fill
  reference_id / model / model_line where the matcher hits.
- **2026-05-24 — Scrape reliability + observability (PRs #530–#536).**
  continue-on-error on all steps, `scraper_lib.fetch_json_with_retry`,
  `health.py` CLI, notify-scrape-failure GitHub-Issue workflow,
  verify_sources `updated_at` + STALE signal, parallel matrix workflow
  (dispatch-only, ~2× faster).
- **2026-05-26 — Cold vibe-code audit (grade B−).** 6-agent read-only audit of
  the whole codebase; report + 6 domain findings archived to
  `docs/audits/2026-05-24-vibe-code/`, findings filed as BUGS B-15–B-22
  (`[audit:2026-05-24]`), direction items to ROADMAP (#574, #575).
- **2026-05-26 — Scrape integrity: disappearance debounce (B-15).** A listing
  must be absent 2 consecutive runs before flipping to sold — a single
  empty/failed scrape can no longer silently mark a whole source SOLD (#576).
- **2026-05-26 — Pinned Python scraper deps (B-16).** `requirements.txt` /
  `-auctions` / `-ai`; scrape workflows install via `-r` instead of
  latest-on-the-day. JS lockfile still pending a Node env (#578).
- **2026-05-26 — Service-worker feed coverage + drift test (B-21).** SW
  network-firsts the post-split feed files again; `service-worker.test.js`
  fails if its file list drifts from App.js's `*_URL` constants (#580).
- **2026-05-26 — Browse AI 403 surfacing + notifier hardening (B-23).** Tropical
  Watch scraper now prints Browse AI's error body on failure; the
  failure-notifier uses the pre-installed `gh` CLI (no action download at setup)
  so a GitHub-CDN blip can't crash it into a misleading "all jobs failed" email
  (#582).
- **2026-05-29 — Richard Mille mis-branded as Enicar fixed (B-26).** "RM 002-V2"
  matched Enicar's ref 002 because Richard Mille wasn't on the brand-detection
  lists; added it (merge.py + utils.js) so the cross-pollination guard rejects
  the hit, + corrected the cached `lastBrand` (#674, #679). No share-URL leak —
  the `/share/` link was just the listing's own id.
- **2026-05-29 — FX parity guard (B-18).** pytest fails if `merge.py` FX and
  `utils.js` FX_RATES_USD_PER drift (currency sets + rates), so a one-sided edit
  can't go "8× off" silently (#675).
- **2026-05-29 — RLS provability + listing_events forge fix (B-19).** Committed
  idempotent enable-RLS for the 4 dashboard-made user tables (was unprovable
  from code); tightened the `listing_events` insert from `with check (true)` to
  own-or-anonymous so a client can't forge another user's `user_id` — applied to
  prod + committed (#677).
- **2026-05-29 — Inert-code sweep pass 2 (B-27).** Deleted orphaned
  `SubTabIntro.js`; marked `useLastVisit.js` DORMANT (planned pulse consumer);
  kept Eyebrow/windvintage/ListReviewMode (finder mis-called them). Thread stays
  open as a recurring sweep (#678).

## Epic 1 — Sources

- **2026-04-30 — eBay integration.** Free Browse API source; admin
  configures `data/ebay_searches.json`; BIN items in main feed.
- **2026-05-02 — Vintage Watch Collective.** Wix
  productsWithMetaData (Chronoholic clone), EUR, ~40 listings.
- **2026-05-03 — Vintage Watch Shop (Vintage Heuer).** WordPress
  custom-post + detail-page walker for "Our price: £NNNN"; ~20 items.
- **2026-05-XX — Brand and listing curation (PR #50, partial #52).**
  Hard exclusions, brand consolidations, Force-Other pooling, suppress-at-sold.
- **2026-05-19 — Editorial corpus, 8 sources end-to-end (PRs #346–#364).**
  ~8,556 articles; body-split persistence via `editorial_corpus_io.py`
  (meta eager, bodies lazy).
- **2026-05-20→22 — Editorial corpus grew to 12 sources.** WOE Dispatch,
  Screw Down Crown (free + paid), Fratello (brand-filtered), Christie's
  Stories.
- **2026-05-24 — Shopify retry + Watch Club low-count abort (PRs #531/#534).**
  Kills "single 503 wipes the source" and the truncated-catalog flap.
- **2026-05-26 — Tropical Watch off Browse AI → direct scraper (B-23).**
  Server-rendered index walker (`requests`, no key), reachable from CI. Browse
  AI now fully removed from the project; sold-price history preserved via the
  URL-hash IDs (#586/#587).

## Epic 2 — Auction houses

- **2026-05-XX — Calendar.** Six house calendars (Antiquorum, Bonhams,
  Christie's, Monaco Legend, Phillips, Sotheby's) scraped daily into
  `auctions.json`; month-banded UI.
- **2026-05-XX — Live lots.** Comprehensive per-lot scrape for
  Antiquorum / Christie's / Sotheby's / Phillips into `auction_lots.json`.
- **2026-05-XX — Archive (PR #42).** Manual-archive pipeline +
  Phillips CH080317 (42 Heuer lots, Geneva 2017) as first sale in.
- **2026-05-03 → retired 2026-05-04 — Auction urgency surfacing.**
  "Ending soon" pinned strip; superseded by Saved Auctions sub-tab.
- **2026-05-10 — Auction calendar archive (PR #173).** Past auctions kept
  in `auctions.json` indefinitely; collapsible Archive section.
- **2026-05-19 — Auction lot essays.** Sotheby's catalogueNote /
  provenance / literature (#374), Christie's Lot Essay (#377), Antiquorum
  Notes / Provenance / Literature (#377).
- **2026-05-22 — Monaco Legend comprehensive lots (PR #477).** 5th house
  live via server-rendered Livewire HTML (~428 lots).
- **2026-05-22 — Antiquorum live-URL fallback (PR #473).** Enumerate sales
  whose catalog page hasn't published yet.
- **2026-05-22 — Archive +3 landmark sales (PR #484).** OAK Part 1,
  Daytona Lesson One 2013, Antiquorum Monaco 2023 (399 lots, 272 realised).
- **2026-05-22 — Bonhams comprehensive scrape — blocked from CI.** Code
  works locally; Cloudflare IP-reputation 403s from GitHub Actions (PRs
  #486/#488 didn't clear it).
- **2026-05-24 — Sotheby's archive support (PR #539).** manual_archive_scraper
  gains a Sotheby's URL branch.
- **2026-05-26 — Bonhams lots live, via a residential host (B-24/B-25).** The
  existing-but-CI-blocked `enumerate_bonhams` now runs from a laptop `launchd`
  agent → separate `bonhams_lots.json` folded into the Auctions grid; adaptive
  throttle, one-command portable installer, non-watch (dept≠WCH) sales filtered
  out (#590/#591/#593/#594).
- **2026-05-26 — Auction calendar: house filter + sale→grid (Phase 1A).** Chip
  row filters the calendar by house (#595); "View lots" / title click open the
  in-app grid pre-filtered to that sale — Auctions if live, Sold if past, with a
  subtle ↗ to the house page (#596).
- **2026-05-27 — Auction redesign Phases 2–4 (#604–617).** Image-forward
  calendar cards (top-lot/cover hero → branded colored placeholder); heart/save a
  SALE → `saved_auctions` table + Hearted filter + a "Saved auctions" Watchlists
  row; merged the Calendar sub-tab into a **modal** (sub-tabs 4→3) auto-opening on
  first Auctions visit, launched by a far-left Calendar pill; flat grid with
  **closing-time date headers** + a single sale header when filtered to one sale;
  month-jump nav (Archive→"Closed", pinned right); removed the Sale-picker pill.
- **2026-05-27 — Auction sale cover images: plumbing + Christie's (#619).**
  `merge.py` carries an `image` field end-to-end to `auctions.json`; Christie's
  maps its `__NEXT_DATA__` `ImageUrl`. Other 5 houses are a follow-up (per-house
  extraction); frontend already renders `a.image`.
- **2026-05-28 — Non-watch catalogs removed (#656).** Catalog-level exclusion
  (`EXCLUDE_CATALOG_TITLES` + `is_excluded_catalog`, kept lockstep in
  `auction_lots_scraper.py` for lots + `merge.py` for the calendar) drops
  Sotheby's "Noble & Private Collections" + Bonhams "Espionage: Fact & Fiction"
  from scrape + calendar; purged the existing lots/sales.

## Epic 3 — Watchlist

- **2026-05-XX — Sub-tab structure.** Five Watchlist sub-tabs (Saved
  listings / auctions / sold / Favorite searches / Lists).
- **2026-05-04 — Lists (Collections renamed in UI).** User-created
  lists via `collections` + `collection_items`; Hidden as virtual list.
- **2026-05-06 — Collections refactor (PRs #85–#90).** "Everything is
  a list": Owned/Sold/Wishlist hard system lists, manual entry, force-rank.
- **2026-05-XX — Permanency across live → sold transition.** Saved
  entries keep price-at-save + cached image post-disappearance.
- **2026-05-08 — Saved searches \$ Min/Max persistence (PRs #136 + #137).**
  `saved_searches` gained nullable min_price / max_price + full wiring.
- **2026-05-06 — User limits.** 2,500-heart default cap, soft-warn at
  80%, BEFORE-INSERT trigger, admin expansion via `user_limits` table.
- **2026-05-09 — Watchlists IA pass (PRs #144–#148).** Tab rename
  Saved→Watchlists, Saved virtual list, drill-in filter row, inline view
  settings.
- **2026-05-10 — Usernames + image-cache extension (PRs #174, #180).**
  `user_profiles` table + display name; image cache extended to
  `collection_items` via `cached_img_url`.
- **2026-05-24 — desc-restore for hearted listings (PR #538).** Lazy
  `listings_desc.json` sidecar hydrates desc at heart-time; initial paint
  stays slim.

## Epic 4 — Sharing

- **2026-05-01 — Single-listing share.** Web Share API + clipboard
  fallback; `?listing=<id>&shared=1` deep link with Save/Dismiss banner.
- **2026-05-06 — Shared-link landing surface.** Focused full-width
  landing card (PRs #63–#72); browse chrome hides when share-receive active.
- **2026-05-06 — Dynamic OG preview (PR #70).** `api/share.js` emits
  per-listing og:image / og:title; rewrites `/share/:id`.
- **2026-05-07 — Sharing collections (List Share v1, PR #119).**
  `?list=<id>&shared=1` with read-only landing + Save-a-copy flow.
- **2026-05-07/08 — Collaborator lists slices 1–3 (PRs #121–#123).**
  Schema + RLS + RPCs + Manage-list sheet + accept-invite on share link.
- **2026-05-09 — Share flow rewrite (PR #146).** Collaboration vs
  view-only links; token-based accept (`?invite=<id>`).
- **2026-05-10 — Reactions on shared lists (PRs #177, #183–#185).**
  `collection_item_reactions` + realtime; sentiment-bucket grid + list-row
  count chip.
- **2026-05-11 — Recipient journey (PRs #245–#253).** Recipient banner,
  To-review bucket, ListReviewMode Tinder swipes, undo affordances.
- **2026-05-11 → retired 2026-05-14 — Top-level Share tab (#248/#251 → #282).**
  Discovery folded into Watchlists > Lists; send via per-list Share button.
- **2026-05-14/15 — Screening on new entry points (PRs #283, #310).**
  feed-mode (new-since-last-visit) + auction Review as list-mode screening.

- **2026-05-26 — Reference-intelligence pipeline (PRs #566, #567, #570).**
  Repeatable per-node scrape → Opus 4.7 synthesis → readable digest
  (`reference_sources/` manifests, `reference_corpus_scraper.py`,
  `reference_synthesis.py`, `reference_digest.py`); source-grounded cited JSON,
  every item `applies_to`-scoped so a reference page shows only its slice;
  Submariner + Speedmaster run. First Anthropic-Opus integration.

## Epic 5 — References

- **2026-05-26 — Reference page pilot: Submariner 5512/5513 (PRs #564, #565,
  #568, #572).** New References sub-tab (2nd in Collecting) — magazine-style
  guide: story, marks, variants, live/auction/sold sliders, connections,
  debated, further reading; LLM synthesis wired in; sticky scroll-spy wayfinding
  + section-header tier + guided learning journey.
- **2026-06-01 — JLC E2643 verified reference guide (#723).** First VERIFIED,
  source-authored node (hand-built from a research dossier cross-checked against
  dealer/auction/forum sources — NOT scraped/synthesised): Shark/Vogue naming,
  Valjoux 72/726, bezel system, marks, variants, all bridge refs; index entry +
  regenerated `watch_references_index.json`. The authored-not-scraped moat.
- **2026-06-01 — Reference-enrichment runbook + helper (#724).** `docs/REFERENCE_ENRICHMENT.md`
  (the 3 homes a source lives in → guide/corpus/synthesis; 7-step add process) +
  `scripts/add_reference_sources.py` (dedup + stub-append source URLs to a node's manifest).
- **2026-04-29 — Watch size comparison.** Two case dimensions →
  preview + print-to-scale on US Letter via React Portal pattern.
- **2026-05-XX — Curated link aggregator (Collecting > Links).**
  Dealers / References / Topics accordion sections.

## Epic 6 — Collection mentality

- **2026-05-03 — Watch Challenges v1.** Constrained hypothetical
  collections; ONE collection per challenge with `type='challenge'`.
- **2026-05-06 — Watch Challenges rebuild (PRs #71, #73, #74, #75, #76).**
  3-stage stepper, click-pick everywhere, source picker over Lists/Favorites.
- **2026-05-06 — Watch Challenges v1.5 (PRs #78, #80, #90).**
  `?newchallenge=1` + `?challenge=<id>&shared=1` receive flows + sender attribution.
- **2026-05-14 — Watchbox top-level tab (PR #289).** My Watches lifted to
  `tab=watchbox`, reached via the avatar dropdown (no main-nav pill).

## Epic 7 — Discovery & recommender

- **2026-05-18 — RECOMMENDER_STRATEGY.md.** Three-layer model (reference
  knowledge / collector mentality / recommendation) + Robustness Anxiety
  case pattern.
- **2026-05-20 — Articles as first-class (PRs #403–#405, #399).** Hearted
  articles, saved-articles virtual row, add-to-list + Articles section in
  drill-ins, my-reactions virtual list.
- **2026-05-20 — collector_profile_analyzer.py.** LLM collector-profile
  generation from hearts / lists / reactions (→ COLLECTOR_HANDOFF).
- **2026-05-27 — Screening collapse → binary skip/heart (#598–603).** The swipe
  screener reshaped to right=heart→watchlist / left=skip; Undo reverses a save.
  Retired the whole emoji-reaction system — code AND data: dropped the
  `collection_item_reactions` table + 3 RPCs + `get_or_create_auction_list`,
  deleted 191 reactions + the auction auto-list collections (migration
  `2026-05-26_drop_reaction_substrate.sql`); removed the buckets, per-card rating,
  "My reactions" row, Screening sub-tab, and the auction Review/Add-to-list flow.

## Epic 8 — Site analytics (admin-only)

- **2026-05-02 — Source quality dashboard.** Per-source admin table:
  live count, hearts, heart-rate, avg price, top brand, earning-its-keep chip.
- **2026-05-05 — Total throughput in value.** Per-source rolling
  30-day `$ added` and `$ sold` columns on Source quality table.
- **2026-05-05 — Auction-house quality dashboard.** Six-house table:
  sales counts, sold rate, $ sold (90d), median Hammer/Low ratio.
- **2026-05-05 — User stats v1 (`listing_events`).** Raw events table +
  daily rollup + telemetry hook + engagement columns on Source quality.
- **2026-05-09 — Realtime + listing velocity (PRs #150, #151/#152).**
  Live shared-list sync; "SOLD · Nd" chip + per-brand cycle-speed rollup.
- **2026-05-24 — AdminTab freshness signal (PR #535).** `updated_at`
  render + "STALE — last run Nh ago" above 12h.

## Epic 9 — IA / UX redesign

- **2026-05-27 — IA/UX redesign plan filed (#623).** docs/IA_REDESIGN.md canonical
  (three-speeds tab model · dossier keystone); BUGS → Epics A/B/C + phase tracker; ROADMAP Epic 9.
- **2026-05-27 — Reference browsing tree (#625/#627).** Brand › Model line › Reference +
  breadcrumbs (ReferenceBrowse); 5512/5513 live + 2 Omega "coming soon" stubs + subscribe teaser.
- **2026-05-27 — Watchlists dossier, Phase 1b (#628).** `collection_blocks` table + DossierBlocks
  (note/reference/saved-search free-order blocks) in list drill-ins. Plumbing only; B-08 tab-unify pending.
- **2026-05-27 — Editorial → "Articles" (#626).** Sub-tab + saved-articles copy renamed.
- **2026-05-27 — Search: Articles bar + reference guides in results (#630/#631).** In-Articles search
  restored; reference-guides strip in global search; results use current tab names.
- **2026-05-27 — Watchlists unified into one rich scroll · Phase 1 / B-08 (#638).** Lists + Searches
  sub-tabs collapsed into a single landing — Watchbox anchor · unified Saved (type filter) · cover-image
  list cards · Saved searches · Shared; pills retired, legacy `?sub=` coerced to the landing.
- **2026-05-27 — Watchlists landing polish (#639–#644).** Magazine look-and-feel (serif = editorial,
  sans = UI), article-style list cards, favicon image fallback (B-38), Watchbox → slim link with
  hearted/Saved leading, bigger tiles, distinct in-list header, drill-in back-nav fix, list rename/delete
  (cards + in-list), hearted "♡ Saved" filter chip, Saved band on the shared CardStrip.

- **2026-06-02 — Lists tab redesign · Phases 1–5 (#729–#734, #742, #750, #755, #758).**
  Sub-tabbed Lists landing on **♡ Saved** (typed bookmark sections Watches/Articles/Sales;
  search matches dealer); **save reference guides** + Guides type (closes B-37); bigger
  list cards (title-below, matched to guide/article cards); land-in-new-list + boxed
  empty-list onboarding; **sectioned Lists page** (Your lists · Shared · Saved sales,
  retiring the Shared sub-tab); auctions get a **prominent catalog header + save/share**.
- **2026-06-02 — Collecting tab redesign (#733, #743, #753, #757).** Reference guides
  flattened to **cards + search/filter**; size/links/challenges bundled under **"Tools"**;
  "References" → "Reference guides"; bespoke H1/explainer dropped to match other surfaces;
  guide cards get **heart + ⋯ menu** (save / add-to-list / share / Ask Lumé).
- **2026-06-02 — Unified share surface · Phase 6 (#735–#741, #746–#749, #752).** Extracted
  **`SharedReceiveFrame`** — one parametrized bleed shell (attribution + hero/identity slots
  + fixed-verb action bar + responsive two-column desktop + viewport-dynamic hero); listing
  receiver renders through it; **seeded "Ask Lumé"** via the floating launcher callout (not
  a button), generic launcher suppressed on share surfaces; sender `?from` preserved.
- **2026-06-02 — Chrome unification + curation (#744, #745, #751, #754, #756, #759).**
  Unified **bleed-bar `PageHeader`** across catalog / Saved / Lists / Searches / Reference
  guides (Watchbox folded into the Lists header, vault card retired); **red-heart → Saved**
  shortcut in the top-right, white-outline icon matching Home, fills red on hover; Home
  **"×"** overlay retired (admin Hide is the single curation tool); duplicate signed-out
  "About" removed; filter bar left-aligned + reset-to-base on Auctions return.

### Lumé — the AI spine (Epic 9 / Phase A)

- **2026-05-29 — Lumé AI concierge v1 (#680/#681/#682).** Grounded watch-expert chat in a
  bottom-right bubble — signed-in only, daily-capped (`ai_chat_usage` + `consume_chat_quota` RPC).
  `api/chat.js` runs a bounded tool-use loop over the corpus (user's saved data, live/sold listings,
  auction state, reference index + deep-dive syntheses); cites source URLs, never free-generates facts.
- **2026-05-29 — Lumé bubble polish + offer→do actions.** Markdown + clickable links, mic dictation,
  "Ask me" callout, signed-out→sign-in prompt, hide-on-action; action set show_listings / open_watch /
  read_more / add_to_list / create_list / save_note wired via an ActionBus to App handlers.
- **2026-05-29 — Watch lexicon Phase 1 (#691).** `public/watch_lexicon.json` seed injected as a cached
  glossary so Lumé expands collector slang (speedie/panda/QP/DON) to canonical terms; Phase-2 corpus
  miner + workflow built (cost-capped, not yet run).
- **2026-05-30 — Lumé Phase 2: generic reference grounding (#702).** `get_reference` now serves ANY
  saved model line's deep-dive by node slug (drops the hardcoded Sub/Speedy grep) and returns named dial
  "marks"; SYSTEM_PROMPT externalised to `public/lume_system_prompt.txt`; ref search-term discipline +
  sold/auction offers. Built on `node_slug` + saved-node pipeline (#698) + `min_sources` knob (#703).
- **2026-05-30 — Lumé saved-node syntheses (fan-out).** Mined 607 saved watches → 5 source-cited
  model-line deep-dives synthesised + live (Heuer Carrera/Autavia, Omega Seamaster 300, Rolex
  Day-Date/Datejust); Lumé's deep coverage 2 → 7 model lines.
- **2026-05-30 — Lumé mark + chat timeout hotfix (#700/#701/#704).** Vintage flat-patina lume-triangle
  icon; `api/chat` `maxDuration: 60` — Opus tool-loop turns were being killed at Vercel's ~10–15s
  default (the "Something went wrong" outage); same PR repaired two tests the fan-out had broken on main.
- **2026-05-31 — Lumé knowledge + behaviour pass (#702/#709/#713/#714/#715).** `search_articles` tool
  (Lumé can finally read the 13k-article editorial corpus — fixed the Enicar blindness); prompt: lead
  with knowledge not listings, know-your-limits (filter tiers: brand/model/single-ref only; attributes
  aren't filterable → coach), don't quote listing counts ("there are N listed", not "we have N"), never
  join two refs, humble + no plumbing-talk, never call a real listing mislabeled, never reply actions-only.
  Fixed two empty-answer dead-ends (loop-exhaustion + actions-only).
- **2026-05-31 — Lumé eval harness (#710 + fixes).** `src/lume_eval.test.js` drives the real prompt+tools
  over regression scenarios (LUME_EVAL=1 workflow, gated/skipped on normal CI); first live run confirmed
  6/8 fixes + auto-caught 2 real bugs. Foundation for the discovery eval (LLM-judge, next).
- **2026-05-31 — Collector-mentality tagging live on essay sources.** `corpus_topic_indexer` taxonomy +4
  mentality themes (collecting_philosophy/collector_mindset/life_lessons/community_ethics) + 4 sources;
  tagged Screwdown Crown (175 mentality) / A Collected Man / Christie's (WOE re-running). search_articles
  returns `themes` so Lumé sees them. Fixed the commit step that had discarded a 3.5h/$12 run (B-44 class).
- **2026-05-31 — Lumé mobile + reach (#705/#700/#701/#712).** Full-screen mobile chat + scroll-lock +
  minimise; flat mint-pip → glowing-pip icon; SW cache-version bump (purged a stale old-build cache).
- **2026-05-31 — Share with Lumé + article actions (#717/#718).** B-52: a built-in "Share with Lumé" ⋯
  row on every card (LumeBus, app→Lumé) opens the bubble seeded with that listing. B-37: heart + ⋯
  (add-to-list/share/Share-with-Lumé) on Home article tiles via articleAsListing.
- **2026-05-31 — Lumé remembers you (#719/#721).** `ai_user_profile` table (RLS own-row, `enabled` switch)
  — an evolving per-user taste profile loaded into chat context (durable across sessions + survives the
  20-msg history truncation = fixes long-chat forgetfulness), refreshed by a cheap gated Haiku pass. Write
  via SECURITY DEFINER RPC (direct authenticated upserts are rejected on this project). Settings →
  "Lumé memory" panel: view / on-off / reset.
- **2026-05-31 — Lumé: explore-not-shop + hedge + leak fix (#720).** Stop driving to buy (journey not
  checkout); never claim a complete list / superlative it can't ground ("three notable ones", not "the
  only"); strip dangling `<actions>` so truncated replies can't leak raw code.
- **2026-06-01 — Lumé web search (#722).** Anthropic native `web_search` server tool, corpus-FIRST
  (last resort for knowledge only, never inventory), always cited (auto Sources footer), `max_uses` 3 —
  Lumé's reach beyond our library and the knowledge-gap SENSOR.
- **2026-06-01 — Lumé "always suggest a next step" + config ledger (#725).** Prompt rule: every reply
  ends with a concrete next step from a REAL capability. `docs/LUME_CONFIG_REQUESTS.md` = the running
  ledger of Mark's behavioral/config requests (date · request · where encoded · status).

## UI & chrome (cross-cutting)

- **2026-05-27 — Home "Articles" strip + reorder (#636).** Idle-loaded recent editorial; Home strips
  reordered added·articles·sold·hearted·ending.
- **2026-05-27 — CardStrip scroll indicator (#635).** Slim desktop-only horizontal scroll indicator on every shared strip.
- **2026-05-27 — Auction calendar nav (#632).** Removed the no-op "ALL"; "CLOSED" moved left of the month chips.
- **2026-05-27 — Settings green + mobile view-settings (#634).** Selected buttons use brand green; view settings off the mobile filter tray → Display settings.
- **2026-05-15 — Maintenance session (PRs #296–#307).** Test hardening,
  dead-code deletion, 8 new design tokens, `confirm()`/ConfirmHost
  replacing every `window.confirm`.
- **2026-05-22 — Olive chrome identity zone (PRs #445–#453).** Olive
  (`#3b4a36`) on non-Home tabs both shells; identity bands retired (#448);
  dynamic PWA theme-color.
- **2026-05-22 — Mobile shell redesign (PRs #432–#443).** Main tabs to the
  top stack, bottom nav retired, Spotify-pattern search-focus overlay.
- **2026-05-22 — Cross-tab "Search all" destination (PR #444).** Reworked
  into a 4-strip search-results surface (live / auctions / articles / sold).
- **2026-05-22 — Editorial density pass (PR #454).** Card excerpt dropped,
  initial page 100→40, infinite scroll.
- **2026-05-22 — Screening relocated to a Collecting destination (#512–#522).**
  Pool cards (auction catalogs / your lists / shared lists) instead of an action.
- **2026-05-22 — Auction tab closing-time bands + Sale filter chip (#524–#528).**
  "Closing today / this week / …" grouping replaces sale-grouping.
- **2026-05-24 — Shared FilterRow primitive (PR #537).** Listings +
  Editorial filter rows extracted so they can't drift apart.
- **2026-05-24 — listings.json live/sold split, Phase 1 (PR #542).**
  merge.py emits listings_live.json (eager) + listings_sold.json (lazy);
  first-paint payload 4.15→2.93 MB (~29%). Full file kept for backend +
  stale PWA bundles; Phase 2 (drop the dup) tracked in ROADMAP.
- **2026-05-24 — Unified card design system, S1–S4 (PRs #558/#560/#561/#562).**
  Shared `CardShell` (image + L1/L2/L3 text slots + action stack + one portal
  menu) and `CardStrip`; priced cards, all horizontal strips, the Search-all
  article strip, and the Collections article grids now render through one
  primitive. Editorial magazine card is the deliberate exception, parked for
  the design-uplift pass.
- **2026-05-24 — Sticky-chrome pass (PRs #547/#549/#550/#552).** Main tabs
  pinned on scroll across all tabs; Home nav band made olive + sticky; the
  long-recurring desktop see-through "divider gap" fixed at the root (a sticky
  child sitting below the scroll-pane's top padding).
- **2026-05-24 — Search-all + editorial fixes (PRs #554/#555/#556/#557).**
  Search-all returns articles for any query (was a meta-only parse bug that
  dropped every source); article cards squared + strip grey edge removed;
  editorial filter chrome portaled into the shell sticky stack so search no
  longer gets squashed.
- **2026-05-24 — Screening + catalog polish (PRs #544/#545/#546).** "Take a
  break" interstitial 25→50; auction-catalog rows show house + sale date;
  auction-screening onboarding distinguishes watch (Yes) vs save (Heart).
- **2026-05-24 — Bug-backlog workflow + consistency principle (PRs #543/#553).**
  BUGS.md durable backlog + `Bug:`/`Plan:` prefixes (nothing lost between
  sessions); CLAUDE.md cross-surface consistency rule (divergence is a smell →
  fix the shared root, not per-surface band-aids).
- **2026-05-28 — Doc-only close lands straight on main (#653).** Fixed the
  recurring strand: `/wrap` step 5 + CLAUDE.md now commit the doc-only close
  directly to main (no PR/side-branch), so SHIPPED can't silently fall behind
  what shipped (root cause of the 2026-05-28 SHIPPED gap, recovered via #652).
- **2026-05-26 — Defer ~15 MB of non-critical JSON off first paint (B-17).**
  Auction/editorial-archive fetches moved to `requestIdleCallback` after first
  paint, so the default Listings>Live no longer competes with ~15 MB of
  fetch+parse on mobile (#577).
- **2026-05-26 — Code-split AdminTab (B-22 phase 1).** `React.lazy` + Suspense
  so admin-only code leaves every public visitor's initial bundle (#579).
- **2026-05-28 — Image resize via wsrv.nl (#646).** All dealer/auction images
  served through the free wsrv resize CDN at display width as WebP (5 MB Loupe
  This photos → ~40 KB); first-load payload ~198→~13 MB, desktop LCP 19→6 s.
- **2026-05-28 — Home first-paint diet (#647).** Below-the-fold strips render
  on scroll (`DeferUntilVisible`); first LCP image eager; `listings_desc` idle-
  loaded; Bonhams served direct.
- **2026-05-28 — Blob images → thumbnails (#648).** `cache_watchlist_images.mjs`
  stores ~600 px WebP via wsrv (not full-res); one-time re-process shrank 382
  existing blobs (storage ~242→~20 MB). Transfer, not storage, was the capped meter.
- **2026-05-28 — Code-split AuctionCalendar + Search-all (#649, B-22 phase 2).**
  `React.lazy` + Suspense — each its own chunk, fetched only when opened.
- **2026-05-28 — Mobile: no auto auction-calendar popup (#650).** Desktop keeps
  the calendar-first popup; mobile drops straight into the grid (button still opens it).
- **2026-05-28 — Tropical Watch images served direct (#651).** TW's ~240 px
  CloudFront source got grainy through the resizer; serve it (and Bonhams) direct.
- **2026-05-28 — Top tabs renamed (#655).** Labels Listings→Watches,
  Watchlists→Lists (Collecting unchanged); internal keys / URLs / storage keys
  unchanged (label-only).
- **2026-05-28 — Auction filter "Calendar" pill + catalog card (#657/#663).**
  Launcher restyled to a filter pill ("Calendar"); a single-sale view shows an
  olive catalog-context card (house·location·date → name → lot count) with
  "← Exit Auction"; mobile dead-end fixed (always-visible exit); the sale filter
  no longer applies on Sold for a LIVE sale (closed sales still show their sold
  lots); redundant "Closing this…" divider suppressed in single-catalog view;
  modal title → "Auction Calendar".
- **2026-05-28 — Pill/button library unified on olive (#658–#662).** One shared
  `SELECTED_FILL` (olive tint + `--brand-olive-ink` + 0.5 px hairline) for every
  active toggle (`pillBase`/`innerToggleButton`/`iconButton`/Chip); new
  `clearAllPill` + `dismissChip` helpers; a SINGLE "Clear all" in the active-
  filters chips strip (per-panel + filter-bar copies removed); primary CTAs
  (`signInButton`/`producedPill` + ~16 inline) swept blue→olive — `--brand` blue
  is now links / text-accents only. DESIGN_SYSTEM documents the state + clear rules.
- **2026-05-28 — Home masthead + account-menu polish (#664–#667).** Account pill
  → bare "M" (Watchbox label dropped; settings popout decluttered — Sign out under
  the name, "Settings" header); desktop subtab font bump; Articles strip's right-
  edge fade moved INTO the shared CardStrip (all strips match); minimal Home top
  bar made an absolute overlay so the moonphase isn't clipped + small top spacing;
  home icon added to the wordmark home-button (a user couldn't tell it was "home").
- **2026-05-28 — CardStrip scroll: drop the laggy thumb (#670).** The custom JS
  thumb drove setState every scroll frame + eased 0.06s behind the scroll; replaced
  with a right-edge fade (hides at end) + snap `mandatory→proximity`. Zero scroll jank.
- **2026-05-28 — Shared SubTabBar component (#671).** All underline sub-tab rows
  (Watches/Collecting sub-tabs + the Lists-page section-nav) now share one component.
  The Lists row was hand-rolled at a different font size/weight/underline — unified.
- **2026-05-28 — Articles: date pill left of search bar (#672).** Sort/Date pill
  reordered ahead of the search input in the Editorial filter row.
- **2026-05-28 — Listings: search bar stable across sub-tabs (#673).** Desktop
  search bar jumped right when switching Listings→Auctions (Calendar pill conditionally
  widened the left cluster). Ghost-pill reserves constant width; search stays put.
- **2026-05-28 — Account menu: unified left edge, drop "Settings" label (#676).**
  Sign-out / Site-stats / settings block all now share one 8 px left inset. Removed the
  redundant "Settings" umbrella label (it duplicated + clashed with Currency/Theme/Columns).
- **2026-05-28 — Typography system: serif/sans codified (#668, #669).** Font
  stacks consolidated into `FONT_SANS`/`FONT_SERIF`/`FONT_SERIF_DISPLAY` tokens
  (the 4 duplicated serif consts + the two colliding `SANS_STACK` removed; editorial
  serif unified on **Hoefler Text**; CardShell's portal stack → `PORTAL_SANS`).
- **2026-05-28 — Editorial type ramp (#669).** `editorialDisplay`/`Heading`/
  `Title`/`Prose` factories bundle the full reading recipe (face+leading+tracking);
  existing editorial surfaces consume them; extended only to the ReferenceBrowse
  teaser. DESIGN_SYSTEM carries the system + the "serif = read, never on chrome"
  guardrail. Serif deliberately NOT added to search hero / empty states / list names.
