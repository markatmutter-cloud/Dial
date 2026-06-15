# Watchlist Roadmap

Living document — **direction, not state.** For what shipped, see
[SHIPPED.md](SHIPPED.md). For conventions, [CLAUDE.md](CLAUDE.md). For what
the project is + architecture, [README.md](README.md).

## How to use this doc

Architecture and conventions live in CLAUDE.md; what shipped lives in
SHIPPED.md; in-flight work lives in the active handoff. This doc is
direction — north star, the jobs chain, the epics' *pending* work, and what's
explicitly out of scope.

**For Mark:** skim the priority order before a session. The order changes; the
epics rarely do. Check "explicitly NOT" before saying yes to new scope.

**For Claude Code:** read this after CLAUDE.md + the active handoff. Don't
propose work outside this roadmap without flagging it as out-of-scope. When
asked "what's next?", default to the priority order below. Name the epic a
piece of work lives under. When the user wavers on priorities mid-session,
point back here rather than just complying — discipline is part of the value.

## North star

Watchlist is a personal vintage-watch tool first, a public site second. Built
for Mark to discover, track, and understand vintage watches across the dealer
and auction market. Public access is a secondary benefit, not the purpose.

Long-term value compounds in two places: (1) the accumulated cross-source data
— listings, prices, what sold, what stuck, across dealers and auctions — and
(2) the analytics and learning experiences built on top of it. Listings are
today's surface; reference research, reference learning, and collection-as-play
are the next chapters.

Not trying to be Watchcharts or Chrono24. Don't compete on historical
price-per-reference; build what they don't.

## Jobs to be done

The product solves a chain of jobs, sequenced by the order a collector feels
each pain. Each step depends on the previous working. When two features
compete, pick the one earlier in the chain.

1. **Aggregator** — enough vintage stock from independent dealers + auction
   houses in one feed that the user doesn't bounce between Chrono24, eBay,
   Bezel, and dealer sites.
2. **Watchlist features** — monitor, filter, sort, save, file into lists, and
   keep permanency on sold lots after the dealer pulls the listing.
3. **Sharing** — bring others in via one-tap share to the native share sheet;
   recipient sees the listing in the same UI. No in-app messaging.
4. **Reference research** — the core value. Look across every listing of a
   given model/reference and answer: is this one priced reasonably? What
   variations come up? What did comparable ones sell for? Cross-source,
   cross-time.
5. **Reference learning** — synthesize what's known about a model/reference:
   accumulated dealer descriptions, curated links, notes, variation gallery.
6. **Collection mentality** — support the collecting journey: real watchbox
   tracking, reflections, a thinking-tool for "why do I collect / what
   mistakes have I made," and hypothetical-collection challenges.
7. **Discovery / recommender** — expand awareness beyond what the user already
   knows. Obscurity relative to their browsing pattern, not absolute.
8. **Commercial signals** — if anyone would pay for #1–#7, build the test path.
   An awareness item, not a driver.

## Strategic bets

- **Aggregator that respects the dealer ecosystem.** Every card links to the
  dealer's own site; Watchlist is a directory layer, not a marketplace. Staying
  clearly additive is the hedge against dealers blocking us.
- **The accumulated dataset is the moat.** Nobody else has dealer descriptions
  + realized auction prices + active inventory + per-user engagement stitched
  together. Jobs #4–#5 are the headline differentiators this enables.
- **Reflective-tool quality is a delighter.** Watchbox journey notes, the AI
  reflection layer, Watch Challenges — these make Watchlist read as a
  reflective collector tool, not a transactional one. A real differentiator;
  one characteristic among several, not the lens for every decision.
- **Personal-tool-first means me-centric curation is allowed.** Brand/model
  exclusions, sold-archive suppression — Mark's rules, baked in. Other users
  get the same lens.
- **Build with Claude as co-author.** The platform is itself an example of what
  a non-technical builder can ship. Mark's growth as a builder is tracked in
  [LEARNING.md](LEARNING.md) and is a first-class goal of the project.

## Constraints

- Solo non-technical builder, co-authoring with Claude.
- Budget under $20/month for hosted services. Free-tier-first (Vercel,
  Supabase, GitHub Actions). Mac mini at home is a later-phase capability for
  jobs that don't fit free tiers.
- Don't surface admin / commercial intent in any UI text reachable by regular
  users — "additive directory layer," not "commercial threat."
- References are 70–80% accurate via parsing, with LLM fallback for the long
  tail. Don't let perfect be the enemy of good.

## Priority order

Re-ranked 2026-05-24. The thesis: the aggregator / watchlist / sharing / chrome
eras are mature; the next era is **making the collecting + reference
intelligence visible** — and trusting that what's built actually works. See
Epics 0/5/7 for detail.

**IA / UX redesign (2026-05-27) — now the organizing initiative.** That era is
delivered through a navigation redesign: organize the three tabs by *tempo*
(Listings = fast · Watchlists = medium · Collecting = slow), not data type. Full
plan + phases + wireframes + AI prompts:
[docs/IA_REDESIGN.md](docs/IA_REDESIGN.md) (Epic 9 below). Phase 0 (auction
restructure) shipped; **the next build is Phase 1 — the Watchlists "living
dossier" keystone** (Epic 3's composable Lists, now specced).

### NOW
1. **"Does it work + is it surfaced right" audit.** The "is it surfaced" half
   ran 2026-06-06 (cold usability audit, C+ — docs/audits/2026-06-06-usability/);
   its quick fixes shipped same-day and the headline finding made the **Epic 9
   dispatch layer the agreed next big build** (see Epic 9 field-evidence block).
   Remaining: the "does it work" half — per-feature works/broken status on the
   live site. (Epic 0 — see "Product QA" below.)
2. **Reference pages — pilot SHIPPED (2026-05-26).** Submariner 5512/5513 is live
   (Collecting ▸ References) on a repeatable **scrape → Opus-synthesis → digest**
   pipeline. Next: **review-gate + tighten the synthesis prompt** (only real
   debates); feed each digest's **gap backlog** into the next source scan;
   templatize + a **browse index** over nodes; build more nodes from the
   synthesis **module candidates** (MilSub/COMEX/Sea-Dweller/1680/Bond/Speedmaster).
   Then: **RAG chat over the reference corpus → collector-support AI**; composable
   **Lists** ("Evernote for watches", Epic 3); a **watches-&-diving feature**.
   (Epic 5; pipeline = Epic 0.)
3. **AI collector-insight surface.** The Screwdown-Crown "collector matrix"
   idea, in the app: "you missed this," "what you've been gravitating to,"
   "thoughts on your collection," "what next." Built on the existing
   `collector_profile_analyzer` + corpus. Admin/household first. (Epic 7.)

#1 comes first (quick; it's the confidence floor). #2 and #3 can overlap — same
underlying data.

### NEXT (small, close open loops)
4. Matrix scrape workflow → make it the cron (one-line flip).
5. og:image asset (1200×630) + meta updates.
6. Carried bugs/parity: auction **cover-image scraping** for the remaining 5
   houses (Christie's shipped; merge.py plumbing done), Bonhams Vercel-proxy
   experiment, Sotheby's bulk-archive sweep.
7. Collector-mentality layer build-out — principle library + collector-arc
   inference feeding the AI collector-insight surface (#3). The analyzer
   already exists; this surfaces more of it. (Epic 7.)

### LATER (the reflective + recommender arc)
8. Strength-of-save (two-tier hearts) → entry to multi-signal taste capture
   (sharpens #3 and #7).
9. Watchbox v2 reflection layer + AI reflection bot — high personal value.
10. Recommender proper (embeddings, discover mode, "For [name]") — gated on
    taste signals + the model-line layer.
11. Mac mini Phase A — unblocks Phillips essays, Bonhams lots, local-LLM
    generation.
12. Encyclopedia (LLM-synthesized) — the headline learning feature; gated on
    corpus + Mac mini.
13. Source pruning at ~50 dealers (the Stop rule).

## Epic 0: Foundations

Cross-cutting infrastructure everything else depends on. Mostly invisible to
users.

### Model/reference intelligence as first-class entities — ACTIVE

The strategic read: nothing else on the site is unique except the cross-source
reference dataset. Strategy doc:
[docs/REFERENCE_INTELLIGENCE.md](docs/REFERENCE_INTELLIGENCE.md) — the
connoisseur-knowledge layer (variant taxonomy, condition signals, price-impact,
recommender) that sits on top of the index. Read it before deepening this work.

**Framing note (2026-05-24):** the user-facing browse unit is the **model line**
(GMT-Master, Speedmaster, Railmaster), not the reference number. The reference
number stays the data join key underneath (`reference_id`); `model_line`
(already populated by the matcher) is what users browse.

The data layer is built — the matcher runs in every scrape path, the reference
index covers the major brands, the editorial corpus is captured. What's pending
is the **visible surface** on top:

- **`reference_guides.json` corpus + AdminTab reading view** (items C + D). The
  per-model/reference corpus store keyed by `reference_id` with `source_type`
  tags, plus Mark's gated personal-research surface that renders it verbatim,
  source-attributed. Partly a prerequisite for the model-line page.
- **`editorial_index.py` layer 2** — enrich each corpus article with
  `references_mentioned` / `tags` / `audience` so the model-line page can show
  "editorial coverage" and listing cards can show "explore paths." *(Verify
  current state — may be partly shipped via the topic-index workflow.)*
- **Matcher tokenizer expansion** (item F) — close the false-zero gap on newer
  brands (Doxa SKUs, Enicar dashed refs, Blancpain/Breitling full-format),
  exclude bracelet/depth/caliber refs, add partial-prefix maps. ~80 lines.
- **Index growth** via research-chat patches (workflow in CLAUDE.md). Next:
  Tudor niche refs, Vacheron vintage, Breitling vintage. Skip Piaget / Movado.

The connoisseur layer (variant taxonomy → per-listing tagging → price-impact →
recommender) is multi-session future, detailed in the strategy doc. A vision
model augments it once the text layer is mature.

### Product QA — "does it actually work" — ACTIVE (top NOW priority)

The test suites only assert render-without-crash, not feature behaviour, so
there's no systematic answer to "does feature X still work / surface where users
expect." Pending: a live-site feature audit (per-feature works / broken /
hard-to-find status), close known regressions, and a lightweight repeatable
version. Where a recurring/costly rule keeps breaking, escalate enforcement
beyond docs → code comment → a test or lint that fails the build (e.g. the
App.js hook-ordering bug class — close the load→ready test gap).

### Verification + scrape health

Scrape reliability + observability shipped (continue-on-error, retry helper,
`health.py`, failure→GitHub-Issue, STALE freshness signal). Pending: auction
verification expansions — (a) flag sales whose `date_end` passed but status is
still active; (b) flag new sales that don't appear in our calendar within N
days. Both catch silent breakage the count-vs-median check misses.

**Browse AI direction (decided 2026-05-26):** the free 50-credit/mo tier can't
sustain our usage (~17/day, Tropical Watch only). Plan: subscribe and make it
pay by adding sources our CI *can't* reach (Bonhams + other Cloudflare-blocked
houses — B-24), then migrate those to a **self-hosted Playwright runner** on a
spare machine to drop the Browse AI cost entirely (B-25). In-batch silent-source
failures (a non-TW source erroring inside a green run) are detected by
`health.py` but not yet pushed — surfacing approach still TBD.

### Infrastructure / refactor track

Full cold audit 2026-05-24 lives in `docs/audits/2026-05-24-vibe-code/` (grade
B−; findings tracked in BUGS.md as `[audit:2026-05-24]`). Several items below
draw from it.

- **Internal-naming cleanup** — three UI renames left internals on the old name
  (DB `collections` ↔ "Lists", `watchlist` ↔ "Saved", `references` ↔
  "Collecting"). All deliberate and documented in CLAUDE.md; the DB umbrella
  names likely stay. Renaming the hooks/files/state is a mechanical but large
  sweep — parked, low urgency.
- **`listings.json` split — Phase 2** — Phase 1 shipped: `merge.py` emits
  `listings_live.json` (eager) + `listings_sold.json` (lazy); frontend reads
  the splits; the full `listings.json` is kept for backend tools + stale PWA
  bundles, so it's currently duplicated (~+4 MB/commit). **Phase 2:** once
  deployed PWA bundles have cycled, point the 5 backend consumers
  (`verify_sources`, reference matcher, `reference_survey`, `purge_ebay_junk`,
  `health`) at the splits and drop `listings.json` to remove the duplication.
  Low-risk by then — nothing fetches the full file anymore.
- **App.js extraction** — App.js is the largest file by far. Candidate extractions:
  an auction-lot-projection hook, a derived-taxonomies hook. Not urgent;
  cleanup-rhythm work.
- **Build toolchain — CRA → Vite** — `react-scripts` is unmaintained; migrate when
  build/test friction or a Node bump forces it. (audit 2026-05-24)
- **Incremental type-checking** — `// @ts-check` + JSDoc on `utils.js` / `supabase.js`
  / shellProps + `tsc --noEmit` in CI, to catch the white-screen / TDZ / ref-error
  class at build time. Not a full TS rewrite. (audit 2026-05-24)
- **Payload + data-growth budget** — `state.json` / sold-archive grow unbounded and
  ~22 MB JSON loads on first paint; cap/tier the archive, lazy-gate non-default
  fetches, add a CI size-budget guard. Pairs with the listings.json split Phase 2.
  (audit 2026-05-24)
- **Maintenance rhythm** — every 4th–5th session is hygiene only.

### Mac mini infrastructure (future hardware tier)

Phased. **Phase A:** Mac mini scrapes hard sources (Cloudflare/JS-heavy) via
headed Playwright. Immediate value: move Tropical Watch off Browse AI (only
paid dependency), unlock Bonhams / Heritage / Phillips-essay lot scraping.
**Phase A.5:** local-LLM reference-guide generation (powers the encyclopedia
without cloud LLM budget). **Phases B/C:** optional self-hosting later. Watch
for CGNAT, power/network reliability, backups. ~$600 M4 base.

### Site discoverability + welcome page — parked

og:image refresh (proper 1200×630) is a small near-term item (NEXT #5). The
AboutModal auto-open is retired (users click About); the proper cold-landing
welcome belongs to the B-56 About/Nexus redesign (Epic 9).

## Epic 1: Sources

Serves **job #1**. Cover enough of the dealer + auction-house universe.
Currently ~41 dealers + 6 auction houses; target ~50 dealers. Adding remains
the active mode until the Stop rule triggers.

- **Active candidates:** Wrist Icons (WooCommerce, confirm), ADM Horloger
  (identify platform). Specific pushers.io dealers reuse the Moonphase pattern.
- **Scraper helper library** — `scraper_lib.py` exists (opt-in helpers only;
  `fetch_json_with_retry` is the first). Per-source files stay the rule; never a
  config-driven driver. More opt-in helpers as genuinely-identical boilerplate
  appears.
- **Brand/listing curation** — Mark-as-curator. Exclusion + canonicalization
  rules accumulate in `merge.py` + `utils.js`. Pending: brand × price-floor
  rules as Mark spots low-tier inventory.
- **Stop rule** — at ~50 dealers, stop adding blindly; audit with Epic 8
  engagement data and prune underperformers. After that, only add a source that
  brings inventory we don't cover.
- **eBay** — a source like the dealers, via the free Browse API; admin
  configures `data/ebay_searches.json`. Targeted reference-level searches only
  (no broad "vintage Rolex"). Pending: an admin form to edit search topics
  in-app (deferred until GitHub-edit friction is real). Explicitly NOT:
  per-user eBay search config; re-listing detection.
- **Open submission v2 ("suggest a source" form)** — deferred until there are
  users beyond Mark's household.

## Epic 2: Auction houses

Serves **job #1** (auction side) and is the substrate **job #4** draws from.
Three layers: calendar ✓, live lots ✓, archive ✓ (expanding on demand).

**Follow + email reminders (2026-06-14, Mark). Phase A SHIPPED (#889):** Home
**"Finishing soon" strip** — followed (hearted) auction lots closing within 3 days,
featured at the top, signed-in only. "Follow" = the existing heart/Save-catalog
(no separate signal). **Remaining:** (a) auction-LEVEL follows (saved catalogs)
showing their catalog tile in the same Finishing-soon space (needs a sale-tile +
onOpenSale in HomeTab); (b) **Phase B email reminders** — Settings opt-in toggle
+ daily cron (Resend) emailing followed lots ≤3 days / followed auctions on
publish-open; dedup table. **NEXT SESSION + voiced as Lumé** (Mark 2026-06-15):
the reminder email reads as a message *from Lumé* (its voice/persona), not a
generic system alert — ties the reminders into the Lumé surface (Epic 10). **Open decisions:** email provider (Resend?) · keep
follow==heart or add a separate bell. Original plan detail: "Follow"
= opt into notifications for an **auction** (catalog) or a **lot**. Recommend
reusing the existing heart (lot) / Save-catalog (auction) as the follow signal,
gated by ONE Settings opt-in ("Email me auction reminders") — avoids a 2nd
per-item control (add a distinct bell later only if save≠notify is wanted).
Pieces: (1) Settings opt-in toggle (emails the account address) in a user-prefs
row; (2) data = hearted lots + saved catalogs (both exist) + a `reminders_sent`
dedup table; (3) **daily GitHub Actions cron** (Python) emails per opted-in user
when a followed *lot* is ≤3 days from close or a followed *auction* publishes/
opens — send via **Resend** (needs API key); (4) **Home "ending soon" strip**
(signed-in): followed *lots* ≤3 days from closing, soonest first; followed
*auctions* show their catalog card in the same space; hidden when empty.
**Sequence:** Phase A frontend (Settings toggle + Home strip, no email infra) →
Phase B backend (cron + Resend + dedup). **Open decisions:** email provider
(Resend?) · follow == save/heart vs a separate bell.

**All 6 houses scrape lots:** Antiquorum, Christie's, Monaco Legend, Sotheby's,
Phillips in CI; **Bonhams via a residential host** (B-24/B-25, shipped
2026-05-26). Bonhams' lot pages 403 GitHub's datacenter IPs (Cloudflare), so
they're scraped from a residential machine (Mark's laptop, launchd) into a
separate `bonhams_lots.json` the frontend folds in by URL key; the Bonhams
calendar still runs in CI. **Heritage** is parked behind DataDome (developer API
is the legit path; a residential test is worth trying now the host exists).

- **Residential host unlocks the CI-IP-blocked sources** (B-25, shipped). The
  same path that fixed Bonhams could now reach **Phillips lot-detail + essays**
  (WAF 403s only from CI) and is worth a residential test against **Heritage**
  (DataDome — tougher/fingerprint-based, so dev API may still win). The
  orchestration is built once; the fetcher/host is a swap. Earlier ranked escape
  paths (Vercel proxy, tls-client) are moot — residential direct fetch works.
- **Adjacent-interest (non-watch) surface — future.** Bonhams cross-lists
  genuinely interesting non-watch sales on the watches department (e.g.
  "Espionage: Fact & Fiction" — spy memorabilia); we now filter non-watch lots
  *out* of the watch listings (by lot department). Rather than discard that
  content, a future section could surface adjacent-interest collectibles for the
  same audience — incl. **Bring a Trailer** (cars) and similar. Its own surface,
  not the watch grid.
- **Calendar UX pending:** surface the date *range* (start + end) when they
  differ + a "live now" indicator. Render-only change.
- **Reference-led realized prices** — "every time the AP 5548BA has been to
  auction," pulled from accumulated lot data. UI work; lands once the model-line
  grouping (Epic 5) ships.
- **Comprehensive inventory capture (long horizon)** — every lot from every
  house, forever. Wants a Supabase table once lot count crosses ~5k + a slow
  backfill. Plan when the time comes.
- **Archive sales** are in-session work, not a roadmap item — append to
  `data/manual_archive_sales.json` + run the scraper. Supports Phillips /
  Christie's / Antiquorum / Sotheby's; MLA a one-block add; Bonhams now
  scrapes live via the residential host (B-24/B-25).

## Epic 3: Watchlist

Serves **job #2**. The saved-set surface.

- **Alerts on saved-search matches** — turn Watchlist into a daily-open tool.
  Covers dealer + eBay matches in one quiet daily digest. Built once the
  saved-search inventory is rich enough.
- **Strength-of-save** (a LATER priority) — replace single-tier hearts with two
  levels: **Love** (definitive) and **Watch** (lighter). Single-gesture
  three-state cycle; must not add friction. The entry point to multi-signal
  taste capture (Epic 7).

## Epic 4: Sharing

Serves **job #3**. One-tap export to the native share sheet + a lightweight
in-app receive banner. Everything social *between* users lives in their own
messenger.

- **Collaborator lists — slice 4 pending:** the `who_added` attribution chip on
  item cards (the column + RPC exist; re-add the write after confirming the SQL
  is live, then render the chip).
- **Reviewer / Writer journey (queued)** — current shape works for "send a list,
  get reactions" but doesn't yet support publishing a *take* with commentary.
  `collection_item_comments` exists (0 rows). Open questions: reviewer + writer
  same persona or two journeys? where does commentary surface? a `mode` enum on
  collections? Scope it before building.
- **Editorial emoji set (queued)** — the ❤️/👍/❌ set reads cellphone-y against
  the editorial chrome. Replace with monochrome SVG glyphs or refined text
  labels; keep legacy emoji strings for back-compat bucketing.

## Epic 5: References (research + learning)

Serves **jobs #4 + #5** — the core differentiator. Two sub-areas on the same
per-model/reference data substrate (Epic 0). UI label: **Collecting**.

### Reference research (job #4)

- **Per-model-line page (a NOW priority)** — the pilot. Keyed on model line; every
  active listing across dealers + recent auction results + editorial coverage +
  (later) a variation gallery, on one page. Depends on the data layer (built).
- **Model/reference grouping** — N saved 5548BAs collapse into one card with "N
  listings — expand."
- **Listing-quality signals** — per-listing "priced above/below this dealer's
  norm" chips (cross-references Epic 8's per-dealer price substrate).
- **Comparison view** for similar saved items — side-by-side specs/price/
  condition/dealer.
- **Guide market-strip segmentation** (from the 2026-06-06 E859 review) — on
  pages whose model line spans eras, split the matched-listings strip into tabs
  (e.g. Vintage E859 · Tribute/re-editions · Modern Polaris · related alarm
  divers) so the reference object stays sharp while discovery stays broad.
- **Source-confidence model as a visible element** — guides already follow the
  invisible rule (official for specs, auction houses for examples, collector
  scholarship flagged for nuance, dealers for images/condition); surface it as
  a compact per-guide "how this page knows what it knows" affordance.

### Reference-number encyclopedia (job #5 — the headline learning feature)

Model/reference-led learning, combining three layers: LLM-synthesised body
(from accumulated dealer descriptions + auction notes, source-credited),
curated links (public can suggest, Mark moderates), and a live layer (current
listings + past results + trends). Nobody has all three synthesized from the
dealer market itself. Depends on Epic 0 corpus + Mac mini Phase A.5 (or cloud
LLM). Public display is synthesized/cited only — never near-verbatim (see the
licensing posture in the strategy doc).

### Tools

- **Auction total-cost calculator (pending)** — hammer × buyer's premium +
  shipping + duty/VAT → all-in cost in the user's currency. Tactile, runs every
  time a collector eyes a lot. Resist building standalone lug-to-lug / strap
  calculators — that context belongs *inside* model/reference guides.

## Epic 6: Collection mentality

Serves **job #6**. The reflective layer over "watches I own / have owned / am
thinking about" — where Watchlist becomes a thinking-tool, not just a browsing
tool.

- **Watch Challenges** — constrained hypothetical collections. Shipped. Open:
  should completed challenges be editable (v1 says no, for share-stability)?
  "Save someone's complete-share back" as a child challenge (`parent_challenge_id`
  exists; the receive-side UI doesn't).
- **Watchbox v2 — real ownership tracking (a LATER priority).** The *surface* shipped
  (the Watchbox tab). What's pending is the **reflection-layer data model**:
  per-item purchase/sold/photos/cost-vs-comp; per-watch reflection (why bought,
  expectations vs reality, would-buy-again); a private collecting-journey
  narrative. High personal value; compounds over years.
- **AI reflection bot** — conversational layer over the watchbox + reflection
  data ("what mistakes have I made," "why am I drawn to chronographs"). Narrowly
  scoped to the user's own data. Depends on Watchbox v2 + LLM access.
- **"Collection Planner" pivot (held)** — a possible merge of Challenges +
  Watchbox v2 (wishlist → buy → into watchbox) embracing social loops. Open
  strategic question, not yet scheduled.

## Epic 7: Discovery & recommender

Serves **job #7** — and it's the project's most distinctive thinking, not a
far-horizon stub. Strategy doc:
[docs/RECOMMENDER_STRATEGY.md](docs/RECOMMENDER_STRATEGY.md). Read it before any
recommender-adjacent work. **The recommender is Lumé pillar 5 (Epic 10)** — this
epic holds the *substrate + strategy*; Epic 10 holds the *conversational surface*
that wires it to journeys.

**Three-layer model:** reference knowledge (the factual/relational base) →
**collector mentality** (the missing middle — *why* someone is paying
attention, not just what they clicked) → recommendation (where attention goes
next). Guiding principle: recommend the **edge** of what someone might like,
not the center — avoid the echo chamber. Recommendations span seven modes
(safe, adjacent, bridge, deep cut, surprise, counterpoint, restraint) and treat
*attention* as the outcome, not conversion (interest ≠ purchase intent).

This was filed as "later, once inputs are rich." That's wrong — much of the
substrate already exists:

**Exists today:** `collector_profile_analyzer` (reads hearts / hidden / lists /
reactions / saved-searches against the strategy framework → arc states,
psychology read, recommendation modes, blind spots — proven on real data); the
12-source editorial corpus (the collector-mentality training material); the
behavioral signal stream (hearts, hides, reactions, lists, saved searches).

**Buildable now — the collector-mentality layer (NOW/NEXT):**
- **AI collector-insight surface (a NOW priority)** — surface the analyzer's
  output in the app: "you missed this," "what you've been gravitating to,"
  "thoughts on your collection," "what next." Mostly rendering what's already
  computable. Admin/household first.
- **Lists + reactions as semantic signals** feeding the insight surface (list
  titles and groupings are intent signals, not just storage).
- **A structured collector-psychology principle library** the analyzer reads.
- **Collector-arc inference** shown back as a probabilistic profile (not a
  static persona), evolving over time.
- **Explainability** on every surfaced insight — never "because you liked X."

**Gated later (real new infra):**
- Embeddings (pgvector, per-listing on first sight) → "more like this," the
  **"For [name]"** household recommender (recommend for someone else from
  *their* reactions), and discover-mode's serendipity stream.
- Per-listing variant tagging + price-impact model (the connoisseur layer —
  Epic 0 / strategy doc).
- The full reference graph (nodes/edges with weighted relationships).
- Discover mode — single-card swipe weaving high-precision + serendipity streams.
- Multi-signal taste capture beyond binary (Love / Watch / keep-but-don't-
  recommend / not-for-me / never) — starts with Strength-of-save (Epic 3).
- **Editorial corpus** as recommender input — enrichment indexing (Epic 0 layer
  2), per-model "editorial coverage," listing-card "explore paths."

## Epic 8: Site analytics (admin-only)

Two halves. Source stats (supply) + user stats (demand). Both shipped at v1 with
the AdminTab dashboard (per-source quality, auction-house quality, user limits,
velocity, freshness). Remaining extensions are gated on Epic 0 model/reference
data:

- **List-usage mining** — how users use their lists, in **both senses** (a "watch list"
  of references / learning vs a "watchlist" of buying candidates); a demand-side signal
  that also feeds Epic 7's lists-as-semantic-signals + the AI that engages with lists. The
  composable dossier (Epic 9) makes each list a far richer signal than a flat heart.
  (Mark, 2026-05-27.)
- **Sales by watch type per dealer** (brand × decade × type) — which dealers
  reliably surface a vertical; feeds dealer recommendations.
- **Cross-source live inventory** for any model/reference.
- **Listing-quality + taste-relative pricing signals.**
- **Auction lot prediction** — "Phillips Geneva has 3 lots that match your
  interests" (cross-references saved-set embeddings with the lot scrape).
- **Public "what's hot this week" strip** — gated behind enough volume to
  anonymise meaningfully. Defer until traffic warrants.

Out of scope for v1: filter-usage telemetry, time-on-listing, scroll depth,
search-query analytics.

## Epic 9: IA / UX redesign

Cross-cutting navigation + surfacing redesign so users can tell why they'd visit
each tab and where each function lives (root complaint: tabs organized by data
type + history, not by user job). Full thinking + plan + wireframes + AI prompts:
**[docs/IA_REDESIGN.md](docs/IA_REDESIGN.md)** — the build brief. Absorbs the
design threads that were logged as bugs (BUGS Epic A: B-06, B-08, B-14) plus the
chrome-unification + card-design-system memories.

**The spine (2026-06-03: now FOUR tabs — Watches · Saved · Articles · Reference
Guides; Collecting dissolved into its two contents, Tools → account menu).
Tempo stays the design rationale, never a label:**
- **Listings (fast)** — encounter the market: one dense grid, cut by
  new/price/brand/house.
- **Watchlists (medium)** — make meaning: the "living dossier" keystone (lists
  mixing articles + a live saved search + listings + comps + shortlist + reference
  + notes); Watchbox = the elevated anchor list. Mostly no-buy taste-saving, not a
  shopping cart.
- **Collecting (slow)** — grow: explore-watches + develop-as-a-collector, with an
  AI spine (grounded RAG · journey coach · missed-it). A reference drill-down
  (Brand › Model line › Reference) fills the missing spine above the 5512/5513 leaf.

**Dispatch layer** on every tab (purpose + area cards + CTA, one shared component)
is the clarity mechanism — not a nicety. **Planning = one experience, two doors**
(Watchbox + Collecting). **Screening** stops being a tab — a mode on long catalogs
+ shared lists.

**Field evidence (2026-06-06):** Mark watched a real target-age/competency user
fail exactly the way the dispatch layer predicts — couldn't distinguish sub-tabs
from filter pills (tapped pills when told "click the subtab"), didn't know the
second nav level *existed*, and was afraid to explore ("not wanting to be seen as
getting it wrong"). The same-day cold usability audit
([docs/audits/2026-06-06-usability/](docs/audits/2026-06-06-usability/), grade C+)
confirmed it on the live site and consolidated the discoverability findings here
rather than scattering them: **U-01** sub-tabs read as *disabled* grey text while
filter pills look like the buttons (navigation must out-shout filters — SubTabBar
restyle + consider outcome labels "For sale · Auctions · Sold"); **U-04** mobile
filter entry is an unlabeled icon (the excellent filter sheet is behind an
invisible door); **U-05** no purpose statement on the landing (pairs with B-56);
**U-06/U-09** copy sweep (HAMMER → "Sold for", CURRENT → "Current bid", search
placeholder leads with "reference", source names that parse as verbs); **U-11**
signed-out Saved shows a "0" + sort pills over the empty state. Defects went to
BUGS (B-63 Escape-to-close); the in-app reader / outbound-cue findings upgraded
B-51. **This is the case for pulling Phase 2's dispatch layer forward.** The audit
is repeatable (`walk.py`) for a before/after once it ships.

**Build sequence** — capability before the dispatch layer that advertises it:
- ✅ **Phase 0** — Listings/Auctions restructure (calendar modal + Bonhams) — shipped #612–621.
- ▶ **Phase 1** — Watchlists living dossier (the keystone): **1a spec done**
  ([docs/WATCHLISTS_DOSSIER_SPEC.md](docs/WATCHLISTS_DOSSIER_SPEC.md)) · 1b container UI ·
  1c Watchbox anchor · 1d notes.
- ▶ **Reference structure** (pulled forward 2026-05-27) — Brand › Model line › Reference
  tree + breadcrumbs above the 5512/5513 leaf; underpins the dossier's reference-guide
  section. Scope: [docs/REFERENCE_STRUCTURE_PLAN.md](docs/REFERENCE_STRUCTURE_PLAN.md)
  (authored-only leaves + 2 coming-soon stubs + a subscribe-to-unlock smoke test).
- **Phase 2** — dispatch layers + de-junk Collecting + tools shelf.
- **Phase 3** — two-door planning + journey coach. The **RAG Q&A bot** and the
  **missed-it / discovery bot** are each their own dedicated session.

**Auction catalogue = full-page surface (2026-06-12, Mark) — SHIPPED #879.** When you open an
auction catalogue (e.g. Phillips "New York Watch Auction: XIV"), promote it to a
**full-page view matching the auction calendar's** — a green bar pinned at the top
carrying the **auction title**, with a **persistent white × top-right** that stays
put as you scroll the lots; tapping × returns to the **auction calendar**. Today
the catalogue opens *inside* the normal tab chrome (masthead + Watches/Saved tabs
+ For-sale/Auctions/Sold sub-tabs + search) with only a small "← Exit auction"
text link. The calendar already has this full-page green-bar treatment, so this is
the same shared surface echoed (cf. the Lumé top-right-× full-page pattern) — one
component, not a per-view variant ([[project_chrome_unification]], cross-surface
consistency). Pairs with the dispatch-layer work; design + build after the current
scrape-health fixes.

**Saved-tab restructure + landing auction surfacing (2026-06-15, Mark) — DESIGN PLAN NEEDED.**
The "Saved ▸ ♡ Saved" sub-tab echoes its parent; the sub-tabs are really *types of
saved things*. Restructure:
- **Sub-tabs → ♡ Watches · Auctions · Lists · Searches** (rename ♡ Saved → **♡ Watches**;
  add **Auctions** in the 2nd slot). Splits time-sensitive auction items out of ♡ Watches
  into their own view. (Overrides the standing "always ♡ Saved, never relabel" rule —
  Mark's call. NB "Watches" now appears as both a top tab and a Saved sub-tab; the heart +
  "Saved" parent disambiguate.)
- **Auctions sub-tab surfaces CLOSING-SOON** for saved auction lots — the in-app home of the
  Lumé catch-up journeys #7 (hearted lots closing soon) / #8 (taste-fit lots ending <7d).
- **Fold in saved auction CATALOGS** somehow alongside saved lots — *design plan needed*
  (reconcile saved-lots vs saved-whole-catalogs; one view or two groupings?).
- **Landing/Home reshuffle:** move the **"ending soon" strip to the 2nd row** (off the top
  row); and pull **"auctions closing soon" out of a strip into a TOP-OF-SCREEN BANNER** —
  *design plan needed* (banner placement/persistence/dismiss; ties to the closing-soon
  surfacing above + the [[watchlists_pulse]] line). Epic 9 IA + Epic 2 auctions; separate
  build from the in-flight Lumé-tab work.

## Epic 10: Lumé — the AI spine

The AI concierge of OUR corpus (grounded, cite-or-don't), not a general watch
oracle. **All AI work lives here as ONE list** — recommender included (it's
pillar 5; Epic 7 holds the recommender *substrate/strategy*, this epic the
*conversational surface*). 2026-06-03 (Mark): the separate build doc
`docs/LUME_ROADMAP.md` is **retired and folded in below** — splitting the AI
direction out is what made this roadmap go stale. Companions that remain:
[LUME_UX_PRINCIPLES.md](docs/LUME_UX_PRINCIPLES.md) (the design bible) ·
[LUME_TONE_GUIDANCE.md](docs/LUME_TONE_GUIDANCE.md) (tone + behaviour + recommendation rules) ·
[RECOMMENDER_STRATEGY.md](docs/RECOMMENDER_STRATEGY.md) (Epic 7 detail) ·
[LUME_CONFIG_REQUESTS.md](docs/LUME_CONFIG_REQUESTS.md) (prompt-tune intake) ·
[REFERENCE_INTELLIGENCE.md](docs/REFERENCE_INTELLIGENCE.md) (the corpus).

**North star:** get a collector into the rabbit hole they want, and help them
fully understand a reference (articles · guides · real examples). Lumé is a
vintage-watch collecting **GUIDE**, not a shopping assistant — listings are
examples, never the centre. It *augments* the collector — a companion, never
an oracle that decides.

**State (2026-06-03):** v1 + Phase 2 + memory + web-search gap-sensor live; an
eval harness (#728) gates prompt/tool PRs and already catches real grounding
bugs. The honest diagnosis: where ChatGPT "reads better," it's an unconstrained
free-recall essay — the exact trust-killer we refuse. Lumé's gaps are
**plumbing, not intelligence**: it doesn't reliably retrieve our own guides
(retrieval hierarchy: guide → notes → auctions → articles → listings → web;
`groundingSource()` is the test hook). No transcript persistence yet — reload =
clean slate; only usage counts persist, so abuse-testing pollutes nothing until
pillar 4 ships (then incognito + reset are hard requirements; use a second
Google account for cold-start testing).

**State (2026-06-09):** the **"What You Missed"** surface shipped end-to-end
(#861–#868) — voice rewrite (LUME_TONE_GUIDANCE), the saved-state-aware
`find_missed` tool (live-missed + sold "got away" + hearted-got-away, weighted
by sale speed), and the in-app journey (links → shared surface, Back, links
resolve by URL not hash). A conversation+judge probe (`tools/lume_probe.py`,
#865) runs multi-turn scenarios through the real models and grades them against
the tone rubric — **this is the tone-reliability gate that the home Lumé surface
is blocked on.** **Next builds:** (B) an **in-app reference card for SOLD
got-away items** (their links still leak to the dealer; not in the live feed);
(C) **progression chips** ("show more / push further / widen to a month") +
reliable actions-block emission. Then the home Lumé surface once the probe shows
tone holds.

**Active thread (2026-06-09, Mark) — Lumé as a full-page catch-up surface.** Mark's
own daily-use journeys, to become launchable entry points on a **full-page Lumé tab**
(landing-page surface, not just the corner bubble): you kick off a journey, it links
you through, then it opens into free conversation (deep on a reference / any question),
always closing with follow-up chips to the *other* journeys, and **every link on the
share surface** (add-to-list or dealer link) — *including articles* (needs the in-app
article surface, **B-51**, still unbuilt). Three builds, sequenced so each verifies live:
1. **Catch-up journeys (building now).** A FAMILY Lumé chains, never dead-ending at one:
   ① live-missed (7d, taste, unhearted) · ② the-ones-that-got-away (sold, **speed first** —
   same-day/1-day closes the user never saw) · ③ widen either to 30d · ④ hearted-that-sold
   (reflective) · ⑤ **latest listed** (newest stock, not taste-filtered) · *(later, needs
   new tools)* ⑥ new articles in taste · ⑦ hearted auction lots **closing soon** · ⑧ taste-fit
   auction lots **ending <7d**, unhearted. ①–⑤ ship as prompt orchestration on the existing
   `find_missed` + `show_listings`; ⑥ needs a recency+taste article tool; ⑥–⑧ are the net-new
   retrieval (auction-aware taste-matching + `date_end` logic).
2. **Full-page Lumé surface** — a tab/subtab hosting the conversation + a dispatch of journey
   launchers as its cold-open. New surface = its own plan (topTabs / shells / routing /
   ChatBubbleHost → full-page variant).
3. **Varied cold opens** — different openers for new · signed-out · how-long-away (not the same
   engagement each time), plus a surprising new-user journey running all the way to "want to see
   something on the **edge** of your recommendations?" (ties pillar 5 / RECOMMENDER_STRATEGY edge modes).

**Six capability pillars** (KNOWS · DOES · KNOWS-YOU · TAKES-YOU · NUDGES):
1. **Knowledge — references & watches.** Built: ref index + 7 model-line deep-dives + lexicon P1. Next: attribute-level knowledge (**B-45**), more synthesis nodes, fact-vs-opinion tagging per claim.
2. **Knowledge — collector mentality.** Lives in the editorial corpus (Screwdown Crown +) — the work is *classify*, not ingest. Powers a *coaching mode only* — never bleeds into how a watch is described (intrinsic-voice firewall).
3. **Action — deep-linking.** Built: 6 in-app actions. Next: map the full surface Lumé can drive; every offered button must be real (**B-47** see-the-screen context · **B-51** keep links in-app).
4. **Personalization — profile/memory (THE SUBSTRATE).** A fluid, evolving taste profile + Settings view/edit/reset + per-chat incognito toggle. Pillars 2/5/6 only get good once this exists.
5. **Discovery — recommender + rabbit holes.** Wire Lumé to the Epic 7 recommender and design the *journeys*. Honors taste→condition→price + the trust stance (transparent/AI-mapped, label-matches-filter, invite correction).
6. **Proactive — the nudge layer.** "You've been looking at a lot of X — want a list / this guide?" — **prompt, never force**; needs pillar 4 signals. Ties to the watchlists pulse.

**Charter (the trust floor — prompt-level, in `public/lume_system_prompt.txt`):**
hard facts come only from the corpus — never confabulate, and NEVER tell a user
their real listing is wrong on the strength of an unverified belief (**B-46**);
don't write a check the search can't cash — be honest about a limit but still
coach, never dead-end; differentiate opinion from fact and say which is which;
scope = watches, porous at the edges (relevance test, hard-refuse the genuinely
unrelated); friendly/adult/user-led, swearing fine, hard floor against hateful
content regardless of goading; epistemic humility as a feature.

**The Lumé list (one list, rough order — graduated B-45/46/47/51 live here):**
1. **Product-behavior phase — retrieval hierarchy first.** Guide-first
   retrieval (guides must outrank listings), reframe-as-GUIDE posture, the
   E2643 learn/evaluate/explore eval cases. The eval already flagged the
   failures (5513 free-recall, fabricated user history); this closes them.
2. **Grounding hardening (B-46).** Corpus-only facts; defer to the user's
   validated reality; humble-decline over confident wrong.
3. **Profile / memory store (pillar 4 — the substrate).** Persist transcripts +
   fluid taste profile; Settings view/edit/reset + incognito; fixes the
   20-message truncation ("gets weird in a long chat") by summarise-and-persist;
   folds in slang/currency normalization (lexicon P2, locale-inferred budgets).
4. **Attribute search (B-45).** Case material / dial / markers facets — the
   headline capability gap; same substrate the recommender needs.
5. **Screen-context (B-47).** Pass active tab/filters/visible listing into the
   chat so "the one on my screen" just works (app→Lumé, inverse of actions).
6. **In-app links (B-51).** Listings through the share/open surface; build the
   matching in-app ARTICLE surface (read + save, never bounce to source).
7. **Lumé UX pass (own session).** Entry-aware opener (P-27 — no cold-open
   spiel when seeded by a share); context-correct action labels (P-28 —
   "save this *article*", not "listing"); follow-up chips, design-gallery
   recs, visible verify.
8. **Shared-link provenance as a signal (P-31).** A chat opened from a link
   someone SENT you gets a different frame + a distinct engagement tag in the
   profile (shared-to-me ≠ sought-out) for the recommender.
9. **Proactive nudges (pillar 6)** — needs 3.
10. **Recommender wiring (pillar 5)** — needs 3 + 4.
11. **Collector-psychology coaching (pillar 2)** — classify the corpus; coaching
    mode only.
12. **App-literacy / onboarding composer.** Lumé teaches the app and composes a
    one-tap starter dossier (create_list + add_to_list + save_note + read_more).
13. **Per-user response-depth tiers** (user_limits knobs: max_output, tool
    rounds, model tier) — depth ≠ the daily cap.
14. **Opinion-vs-fact tagging** in the synthesis screening (taxonomy TBD).
15. **Web-search gap-log → authoring loop.** The sensor is live; build the
    demand-ranked guide backlog it feeds — and it's the capability worth gating
    for free/subscriber tiers.

## Explicitly NOT on the roadmap

- Refactoring all scrapers into a shared driver (per-file structure is
  debuggable; opt-in helpers only).
- Mobile native app (PWA is enough).
- Public market analytics like Watchcharts (they do it better — use it).
- Original editorial content (curating + synthesizing others' is enough).
- **In-app messaging / reactions-as-chat / replies / sender-identity exposure /
  share notifications** — the user's own messenger handles all of that.
- Generic public social features (comments, ratings, profiles).
- Auto-redirecting shared listing links to the dealer or a separate landing.

## Parked — strategy needed first

- **Featured selling section (Mark's own watches).** Strategic questions first:
  hobbyist vs dealer line; conflict of interest with curatorial features; dealer-
  relationship implications; tax/legal; UI separation for trust.
- **Creator / professional account tier.** Content creators (shareable bylined
  lists), sourcing consultants (private per-client lists + commentary), dealers
  (surface their own listings — biggest lift). Gating mechanism, curator-trust
  boundary, payments path all open. Revisit with the Featured-selling session.

## Fun ideas, parked

Watchlist export (PDF/CSV) · random-watch button · standalone reference browser
(likely merges with Epic 5) · year-in-review (once a year of data exists).

## Quarterly roadmap review

First Sunday of each quarter: re-read end-to-end, mark what shipped (move to
SHIPPED.md), update the priority order, surface anything parked too long for a
ship-or-drop call. Catches roadmap rot before it becomes confusion.
