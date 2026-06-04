# Session handoff — 2026-06-02

Supersedes SESSION_HANDOFF_2026-06-01.md (archived). **The Lists / Collecting /
Auctions / Share / Saved redesign — the "after living with it" pass**, plus its
follow-ups. ~22 PRs merged (#729–#771). Lumé stayed parked. Plan file with the
multi-phase detail: `~/.claude/plans/abstract-juggling-thacker.md`.

## ⏭ Next session — About / "Nexus" page redesign (B-56, scoped + deferred)
Mark scoped it but **deliberately deferred** (not auto-next; on the backlog to
resurface). Full spec in **BUGS.md B-56** + memory [[project_about_page_sections]]:
3-voice restructure (enthusiast · dealer-creator · about-the-project) + a
**Lumé-led button-driven guided "how to use the site"** (RAG, not free-text) +
a **brand/voice review (folds in B-14)** + copy review (Mark's voice) + a
modal-vs-page decision + the "About vs Nexus" naming call. Copy-heavy → needs
Mark's eye; the guided-Lumé build overlaps the Lumé thread (separate sessions).

## What shipped this session (#729–#771, all merged)
The earlier part of the run (#729–#759 — sub-tabbed Lists landing on Saved,
typed bookmark sections, reference-guide saving, bigger cards, sectioned Lists,
unified `SharedReceiveFrame`, bleed-bar PageHeader, red-heart shortcut) is logged
in SHIPPED. The **continued run**:
- **Shared-list surface, two-mode** (#760/#761): recipient reskinned onto
  `SharedReceiveFrame` (cover-card preview, no read-only grid) with two clearly-
  labelled outcomes; sender share sheet relabelled **Send a copy** / **Collaborate**
  (the link's invite-token presence is the mode).
- **Collapsing header pattern** (title scrolls away, filter bar pins) — shipped on
  the **auction catalog** (#762), the **Saved** tab (#764), and the **Reference
  guides + Articles** sub-tabs (#771). One pattern across four surfaces.
- **Auction catalog Share** (#765): emits an **in-app link** → a new
  `CatalogReceiver` (unified frame), not the dead-end auction-house URL; added a
  "→ Auction house" link by the header.
- **Auctions copy** (#766): desktop "Auction Calendar" label; "sales" → "auctions"
  consistency.
- **Add-to-list modal** (#767): Done in a sticky header (no scrolling to commit).
- **B-55** (#768): leaving a catalog for Watches/Listings resets the sale filter
  (no more empty "Nothing matches").
- **Standard-library cards** (#769): one shared `cardGridStyle` → article =
  reference-guide = list cards (same size).
- **Saved grouping DROPPED** (#770): the Brand/Source group pills (briefly added
  in #763) were redundant with the Source/Brand filters — removed (−186 lines).
  Saved is a flat newest-first grid.

## Mark's locked direction this session (the through-line)
- **Consistency via a STANDARD LIBRARY for headers and cards** — shared components/
  tokens, not per-surface variants. This drove the shared `cardGridStyle`, the one
  collapsing-header pattern, and the PageHeader reuse. (See [[project_chrome_unification]],
  [[project_card_design_system]].)
- **Simple filter pattern preferred** (visible chips + one search box, NOT click-to-
  expand pills) for low-facet surfaces — memory [[feedback_simple_filter_pattern]].
  Dense pill-bar stays only where facet count is high (Watches/Saved/Auctions).
- **Living-with-it iteration is valid** — he asked for Saved grouping, lived with
  it, found it redundant, had it removed. Honour that (not flip-flopping).

## Scraping correction (confirmed 2026-06-02)
B-23/B-24/B-25 were stale "install pending" — actually **DONE**: Tropical Watch
runs a direct (Browse-AI-free) scraper in the daily batch; **Bonhams** runs from
Mark's **laptop LaunchAgent** (`bonhams_lots.json` commits ~3×/day). BUGS updated.

## Open threads (when Mark asks "what's open")
- **About/Nexus** — B-56 (scoped, the next big one).
- **Lumé** (separate sessions): B-39, B-40, B-45, B-46, B-47, B-51, B-52.
- **Scraping + data** (Mark's own session): B-28 (editorial freshness), B-54
  (Explorer 14270 mislabel).
- **Plumbing** (own session): B-16 (JS lockfile), B-20 (scraper filename), B-22
  (code-split phase 2), B-34 (load-speed follow-up), B-44 (synth-workflow CI gate).
- **Parked threads:** B-06 (screening collab visibility), B-14 (now folded into B-56).
- Highest B-number = **B-56**; next new = B-57.

## Gotchas reinforced
- **CI=true fails on any unused var/import** — it's the guard that makes deletions
  safe (an orphaned import can't survive green CI). What it DOESN'T catch (dead
  files, dormant-wired code, stale comments) → the `/tidy` sweep.
- **Edge-bleed sticky** (collapsing headers): the negative side margins must equal
  the scroll-pane's padding (−20 desktop / −16 mobile here) or the pinned bar's
  background won't span — verify on the preview.
- **Squash-merge leaves stale LOCAL branches** (47 piled up) — they look unmerged
  to git though their content shipped. Safe to prune; awaiting Mark's ok.
- Pre-existing untracked files (`The Watch List — what Mark built.md`,
  `docs/WATCH_LEXICON.md`) are not ours — leave them.

---

# Addendum — scraping / data session (#772–#775, all merged)

A second session the same day, off clean `main`. Four independent branches, each
its own PR, all green + merged.

- **Pascal Karp dealer source (#772).** Brussels Shopify shop; clone of
  `falco_scraper.py` → `pascalkarp_scraper.py` + one `merge.py` SOURCES line (EUR)
  + a `scrape-listings.yml` step. Brand emitted as "Other" on purpose — merge.py's
  `load_csv` re-derives from the title (its `detect_brand` orders Tag Heuer before
  Heuer + has accent aliases), so a naive scraper guess can't override it. 74 live
  listings.
- **B-54 Explorer 14270 (#773) — deeper than reported.** TWO bugs: (1) the
  `Explorer / Explorer II` model line stored refs under `**Refs (Explorer)**`, a
  label `parse_index` ignores (only honours literal `**Refs**:`, and *overwrites*
  on a 2nd) → the whole Explorer set was orphaned (`refs: []`); 14270 only matched
  via a workaround entry under Submariner. (2) `match_against_index` was
  brand-blind → a leading year colliding with another brand's ref (1991→Cartier
  Panthère) won the first-token match, then merge's cross-pollination guard nulled
  it. Fix: merge Explorer refs onto one `**Refs**:` line + remove from Submariner +
  brand-aware token selection (optional `brand` arg; editorial callers unchanged).
  `model_line` isn't persisted in state.json, so the next scrape re-tags all 29
  affected rows. Regression test `tests/test_reference_match.py`. **Spun off B-57**
  (same-brand ref-collision sweep — Patek 5236P, Cartier WJTA0001, IWC IW5004, …;
  do NOT auto-edit, esp. Heuer Camaro/Carrera per Mark's standing note).
- **Editorial corpus twice weekly (B-28, #774).** Cron `0 16 * * 0` → `0,3`.
  **Deliberate cadence mismatch recorded** (Mark's call): the LLM topic-tagger
  (`index-corpus-topics.yml`, Haiku) stays Sunday-only, so Wednesday's articles
  get `themes` the following Sunday. Documented in both workflow headers.
- **Chrono24 per-reference, residential (#775).** Feasibility proven live:
  curl-cffi Chrome impersonation gets 200 where plain curl/`requests` get 403
  (CI can't — datacenter IPs blocked, like Bonhams). Data via JSON-LD
  `AggregateOffer` (not HTML); `&dosearch=true` is required or the page is an empty
  JS landing. `chrono24_lots_scraper.py` is **narrow on purpose** (REFERENCES list,
  seeded with JLC E2643) → own `public/chrono24_lots.json` → folded into
  `mainFeedItems` (shows in Listings) + the references array (E2643 guide filters
  it). **Laptop-manual for now** (no launchd yet); ops notes in
  `scripts/RESIDENTIAL_SCRAPE_SETUP.md`.

## Gotchas reinforced (this addendum)
- **merge.py TRUSTS a scraper's known-brand value over its own title detection**
  (`load_csv`). A new dealer scraper should emit "Other" unless it has *structured*
  brand data better than the title — otherwise a naive substring guess overrides
  merge's priority-ordered detection.
- **The reference matcher's first-token-wins was the real "mislabel" engine.**
  Years/short tokens that are another brand's ref shadow the real ref; the
  brand-aware fix is the general cure (B-57 is the remaining same-brand residue).
- **Chrono24 = Bonhams pattern, but JSON-LD not HTML.** curl-cffi + `&dosearch=true`
  + parse the `AggregateOffer`. Residential only; `priceCurrency` is authoritative.
- **No node/npm on this machine** (B-16) — can't run jest/CRA build locally; rely
  on CI + Vercel. The B-21 service-worker drift guard caught the missing
  `chrono24_lots.json` registration (fixed pre-merge).

---

# Addendum 2 — Plumbing safe-tier (#776–#778, all merged)

Third session same day, off clean `main`. Plan-mode first; scoped the 5 Epic-B
plumbing bugs into **safe** (workflows/scrapers/package.json, can't touch the
front sessions) vs **risky** (B-22/B-34 — App.js code-split, collide with the
Lumé UI session + need preview verify). Shipped the safe three; deferred the two.
Plan: `~/.claude/plans/this-is-a-separate-velvety-cocoa.md`.

- **B-20 scraper rename (#776).** `auctionlots_scraper.py` → `tracked_lots_scraper.py`.
  A name-grep masked a 2nd importer (`auction_lots_scraper.py:55 from … import`) —
  the `python -c "import …"` smoke check is what caught it. **Lesson: verify a
  rename by importing, not just grepping** (a substring `-v` filter hid the file
  that imports it).
- **B-44 synth-workflow CI gate (#777).** Hybrid: run pytest+jest in-workflow on
  the generated files (the gate) **and** open a PR not push-to-main (checkpoint).
  **The reason both are needed = the GITHUB_TOKEN gotcha:** a PR opened with the
  default `GITHUB_TOKEN` does NOT trigger `tests.yml` (GitHub suppresses
  workflow-triggered `pull_request` events to stop recursion), so a PR alone runs
  no CI. The in-workflow test run is the real gate — avoids needing a PAT secret.
- **B-16 JS-lockfile generator (#778), rollout HELD.** Shipped the dormant
  `generate-lockfile.yml` only. **Did NOT commit the lockfile** because that
  auto-switches *Vercel* to `npm ci` — which would break any in-flight branch
  that adds a JS dep. Held the dispatch until the front sessions merge.

## ⚠️ Carry-forward action (B-16, when the front sessions have merged)
On a quiet `main`: **dispatch `Generate JS lockfile`** → merge the lockfile PR →
flip `tests.yml` jest job `npm install`→`npm ci` + add `cache: 'npm'`. Full
procedure is in the workflow header comment. Until then the lockfile is absent
and CI stays on `npm install` (unchanged).

## Plumbing thread now (supersedes the "Open threads → Plumbing" line above)
B-16/B-20/B-44 **done**. **Remaining: B-22** (code-split phase 2) **+ B-34**
(lazy-load ReferencesTab subtree) — App.js, preview-verification-gated, collide
with the Lumé UI session. Their own session **after** the front sessions merge.

---

# Addendum 3 — B-57 + two break-fixes + branch prune (#779–#781, all merged)

Continuation of the scraping/data session.

- **B-57 same-brand ref collisions (#779).** Closed out via **web-search adjudication**
  — for each genuinely-different-family collision, searched the brand's official
  site + press to settle the true model, then removed the wrong-family entry.
  Fixed 7 (Patek 5236P→Perpetual Calendar, IWC IW5004→Big Pilot, Lange 216.026→
  Saxonia [index typo] + 233.026→1815, Heuer 73463→Skipper, UG 22409→Compax, Rolex
  69173/69178→Lady Datejust). Left **deliberate annotated cross-refs** (Patek 5004
  "also in chronograph section", Lange 403.x "see Datograph", Rolex 16264/17013/17014
  — all still Datejusts) and parser-fragment tokens. **Open for Mark to google:**
  Cartier `WJTA0001` (my search says Tank Américaine; index annotates "Crash Tigrée")
  + Breitling `765`. (Method works — search turns watch-knowledge calls into rubber-stamps.)
- **Sotheby's "Fine Jewelry" L26050 (#780).** A jewels sale (~225 lots) hit the grid.
  Title blocklist drops the lots; but the CALENDAR cross-lists it in the watches
  category with a misleading **"Fine Watches"** title + a `/fine-jewelry-l26050` URL,
  so added `EXCLUDE_CATALOG_URL_SLUGS` (jewel*) + pass the URL at the calendar call
  sites (lockstep auction_lots_scraper ↔ merge.py). Pruned the committed data.
- **Christie's images (#781).** All Christie's lots showed "IMAGE NOT AVAILABLE" —
  **wsrv.nl's datacenter fetcher now times out on christies.com** (same block as
  Bonhams) though direct fetch is 200. One-liner: christies.com → `imgSrc()`
  direct-serve exceptions. **Watch for the next house to do this** — the wsrv
  direct-serve exception list (Bonhams, Tropical Watch, now Christie's) is the place.
- **Branch prune (Mark's ask):** deleted all merged local branches + **55 merged
  remote branches** (the stale squash-merged pile). Kept `origin/lume-mentality-data`
  (no merged PR — active WIP). Only `main` + that branch remain.

## Gotchas reinforced (Addendum 3)
- **A misleading sale TITLE needs a URL-slug fallback.** Sotheby's cross-lists
  jewels in the watches category titled "Fine Watches" — title blocklists alone
  can't catch it; the URL slug is the reliable signal.
- **wsrv blocks spread.** When a whole source's images break but a direct fetch is
  200, it's wsrv being blocked by that origin — add the host to `imgSrc()`'s
  direct-serve list (next to bonhams.com). Don't chase URL-encoding ghosts.

---

# Addendum 4 — doc-system reshape: BUGS hygiene + Lumé→ROADMAP merge (doc-only)

A plan-then-execute session. Plan: `~/.claude/plans/this-is-a-separate-velvety-cocoa.md`
(it started as the plumbing plan, then grew the doc work). **No code — docs + process only.**

**1. BUGS hygiene.** The Open section had ~17 entries marked RESOLVED still sitting in
Open (the file's own note said they'd be "pruned at next close" — this was it). Moved them
to a consolidated **"Closed out 2026-06-02"** block in Resolved + pruned the redundant Open
copies of already-resolved Lumé items. **Open dropped ~33 → 15** genuine items, so `/start`
stops resurfacing shipped work.

**2. Lumé is no longer a separate roadmap (Mark's call) — merged into ROADMAP as Epic 10.**
The diagnosis: splitting AI direction into `docs/LUME_ROADMAP.md` is *why the main ROADMAP
went stale* (last real edit 2026-05-27) — the biggest thread was invisible on the priority
list. Fix: **ROADMAP gains Epic 10 (Lumé)** — north star + 6 pillars + charter + state;
`docs/LUME_ROADMAP.md` **demoted to the build/detail doc** (same pattern as Epic 9 →
IA_REDESIGN.md). Epic 7 now cross-links the recommender as Lumé pillar 5.

**3. Bugs assigned to epics + `Bug:` now routes by KIND.** Added an **Epic assignment table**
at the top of BUGS.md mapping every open item → ROADMAP epic + kind. New rule (CLAUDE.md +
BUGS header + [[message-prefixes]] memory): **defects/tech-debt → BUGS, capability/feature/
design threads → ROADMAP under their epic.** `/start` now reads ROADMAP NOW/NEXT as a
standing input (start.md updated), not just when scoping.

**⚠️ Supersedes the stale "Open threads" list at lines 59–67** — the BUGS **Epic assignment
table** is now the source of truth for what's open + where it goes.

## ⏭ Next session (Mark-led) — the NOW/NEXT/LATER rewrite
The merge is done; what's left is the **priority reset**: rewrite ROADMAP's NOW/NEXT/LATER
(the block is from 2026-05-27, pre-redesign/Lumé) and **physically graduate** the flagged
feature-threads into their epic bodies (**B-45/46/47/51 → Epic 10**, **B-56 → Epic 9**;
retire shipped design threads B-06/B-08). The Epic assignment table is the worklist.

## ⚠️ Gotcha that bit us — shared checkout + concurrent sessions
Multiple agent sessions ran in the **same working dir** (`~/Documents/watchlist`) today.
Another session **switched the dir's branch** (`main` → `exclude-sothebys-fine-jewelry`)
mid-edit, so this session's doc commit landed on *that* branch — then its **PR #780
squash-merged my docs onto main bundled inside the Sotheby's fix** (content correct on main;
commit label misleading). Recovery was non-destructive (a cherry-pick came up empty,
confirming the squash already carried it); the guardrail correctly **blocked force-pushing
the other session's branch**. **Lesson: give parallel sessions their own git worktrees, or
don't run concurrent build sessions in one checkout** — they switch each other's branch out
from under each other.
