# Working with this repo

Read this file at the start of every session. It's working conventions —
not what the project is (README), not what's next (ROADMAP), not what
shipped (SHIPPED).

## The doc set

| Doc | Owns | Read when |
|---|---|---|
| **CLAUDE.md** | Working conventions / rules | Every session start |
| **README.md** | What it is + architecture + data model + stack + folder layout | Onboarding; architecture questions |
| **ROADMAP.md** | Direction: north star, jobs, epics 0–10 (incl. **Lumé/AI = Epic 10**), feature-threads, NOW/NEXT/LATER, explicitly-NOT | Every session start (NOW/NEXT) + scoping |
| **SHIPPED.md** | The changelog (two-line entries by epic) | "When/what shipped?" |
| **BUGS.md** | Defect + tech-debt backlog (enriched, ID'd); feature-threads route to ROADMAP | Every session start; on any `Bug:` |
| **docs/audits/** | Cold audit reports (dated) + routing index | After an audit; tracking findings |
| **DESIGN_SYSTEM.md** | Color + style tokens, components, reach-for rules | Any UI work |
| **BRAND.md** | Voice | Before copy / visual choices |
| **docs/REFERENCE_INTELLIGENCE.md** | Epic 0/5 reference-intelligence strategy + index stats | Reference index / corpus work |
| **docs/RECOMMENDER_STRATEGY.md** | Epic 7 strategy | Recommender-adjacent work |
| **personal/LEARNING.md** | Mark's builder-growth log | Updated at close; never folded here |
| **SESSION_HANDOFF_\<date\>.md** | In-flight snapshot, one active | Session start; archived, never graduated |

## Session protocol

Driven by the `/start` + `/wrap` slash commands (`.claude/commands/`), which
carry the operational steps. The essentials:

**Start:** Read this file + the active handoff. Skim ROADMAP only when
scoping new direction. Recall memories. State back the one work item and
the branch you'll create — branch before editing, never edit `main`.

**Close:**
- Write/replace the handoff; archive the prior. **Handoffs are not copied
  into CLAUDE.md.**
- One fact, one home: **SHIPPED** (ship events, 2 lines) · **ROADMAP**
  (direction changes) · **README** (architecture changes) ·
  **DESIGN_SYSTEM** (token/component changes) · **docs/audits/** (audit
  reports; findings → BUGS.md) · **CLAUDE.md** (durable rule only, within
  budget; strip PR/date tags).
- Update **personal/LEARNING.md** (capability snapshot / concept log / growth edges).
- **Land the close on `main`, no PR.** The close is doc-only (SHIPPED /
  handoff / etc.) — no CI, no review. Commit it **straight to `main` and push**;
  never park it on a side branch "to merge later" (that's how SHIPPED silently
  falls behind what shipped — see the 2026-05-28 strand). Branch-before-editing
  is a *code* rule; it doesn't apply to a doc-only close.
- **Clean-close rule.** A partial ship *closes* its backlog item and opens **one**
  crisply-scoped follow-up — never a vague "phase 2 open" tail (they pile up as
  cryptic IDs Mark can't parse). Group BUGS by epic, not as a flat list.
- **CLAUDE.md budget: ~4,000 words, ceiling 6,000.** Adding a rule means
  cutting or compressing an equal amount.

## Working with Mark

- **Non-coding but technical, ships often.** Doesn't write code, but makes the
  technical calls — delegates the implementation, owns the decision. Plain
  English always. Flag risks, don't overexplain. **Terse: answer, don't
  recap — no summary tables or status walls unless he asks.**
- **California (PT).** All times PT unless noted.
- **Coach actively.** The project's purpose is Mark's growth as a builder,
  not just the product. Name teachable moments *in the moment* — e.g. when
  he stacks a new request mid-build, propose finishing the current item
  first (prevents orphaned branches/PRs). Record growth at close in
  personal/LEARNING.md.
- **Be his live scribe.** Mark loses review thoughts unless caught as he
  has them; a notes-doc-for-later doesn't work. When he thinks out loud —
  even in fragments — capture it immediately into the right home.
- **Message prefixes (only three).** `FB:` = **hold** — he's reviewing /
  thinking out loud; don't react, repivot, or build until he says go (a burst
  often spans several messages — ack minimally, let it all land). `QQ:` =
  answer now, then resume what you were doing. `Plan:` = he wants your
  **feedback + approach, not a build** — discuss/plan, don't implement. **No
  prefix = act now.** He stacks observations while testing — queue them, stay
  on the agreed list, don't pivot per message.
- **Never deflect a defect.** "Live with it" is only for stacked *feature*
  requests, never a bug. Log by kind: broken/wrong/regressed → **BUGS.md**
  (break-now → fix immediately, else enriched entry + ID); missing capability /
  feature / design thread → **ROADMAP.md** under its epic. Echo where it landed.
- **Branch discipline.** `git checkout -b <name>` BEFORE editing. If it
  slips, recover via revert + branch. Every logical change → its own
  branch/PR; don't push follow-up commits onto an already-open PR.
- **Verify before claiming done.** Vercel rebuilds ~60s after a JS push —
  confirm the new bundle is serving before reporting "shipped." Never claim
  shipped until CI is green.
- **iOS PWA at `the-watch-list.app`.** Works-on-desktop-not-mobile is often
  a hoisting/TDZ ReferenceError (browsers report it differently). Safe areas
  + service-worker-stale-bundles matter.

## Architecture (one paragraph — full detail in README)

Python scrapers (GitHub Actions, 3×/day) write per-source CSVs; `merge.py`
enriches into `public/listings.json` + `state.json` (cross-run memory via
stable URL-hash IDs). Frontend is React (CRA, inline styles): `App.js`
orchestrates state + builds JSX, delegating render to `MobileShell` /
`DesktopShell` via one `shellProps` bag. Per-user data (watchlist, hidden,
saved searches, collections) is in Supabase with RLS. See README for the
diagram, data model, and folder layout.

## Supabase

- **Direct MCP access** on this project (`abrqfxqmhzycphhbzklm`). Apply
  migrations, run SQL, check advisors via MCP — don't ask Mark to
  copy-paste. **For destructive changes (DROP, data-touching migrations,
  anything irreversible): show the SQL and ask first.**
- **Ship the migration before the JS that uses it.** Migrations are not
  auto-applied on merge. JS referencing a not-yet-created column/RPC breaks
  with "Could not find the 'X' column." Ship JS as a strict superset of the
  old schema, or ship + verify the migration first.
- **`public`-schema ACL gotcha.** New functions get direct EXECUTE grants to
  `anon` / `authenticated` / `service_role`. `revoke … from public` is now a
  no-op. To block anon: `grant execute … to authenticated; revoke execute …
  from anon;` then verify with `has_function_privilege('anon', …)`. The
  schema-wide `alter default privileges` path is permanently blocked on
  Supabase — don't retry it.
- **RLS-rejection fallback.** If a direct INSERT under `authenticated` is
  rejected regardless of policy, route it through a `security definer` RPC
  that sets `user_id := auth.uid()` internally (pattern: `create_challenge_v2`).
  Don't re-run the policy diagnostic — it's been done exhaustively.
- **RLS policy role scope:** don't add `to authenticated` unless every other
  policy on the table already does — mismatched role scopes silently reject.
  Default to no role clause.

## Scraper conventions

- **Per-source files are the rule** (one breaking site = one file to debug).
  Shared helpers in `scraper_lib.py` are **opt-in only** for genuinely
  identical boilerplate (e.g. `fetch_json_with_retry`). Never a config-driven
  driver for "all Shopify dealers" — per-dealer quirks justify per-dealer files.
- **Every workflow scrape step needs `continue-on-error: true`** so one
  failing source can't kill the batch. Wrap external `fetch` in a timeout.
- **Pinned deps — never bare `pip install <pkg>`.** Scrape/CI steps install
  via `pip install -r requirements*.txt` (base `requirements.txt`; `-auctions`
  adds curl-cffi; `-ai` adds anthropic). A bare install pulls latest-on-the-day
  into a job holding secret keys — don't reintroduce it.
- **Resilience:** retry transient 5xx (`scraper_lib.fetch_json_with_retry`);
  if a catalog returns a suspiciously truncated count (<50% of prior AND <25
  absolute), skip the CSV write so `merge.py` keeps prior state. Scrape
  failures auto-open a GitHub Issue via `notify-scrape-failure.yml` — fix the
  flap, don't silence the alert. `python3 health.py` is the read-only status check.
- **Verify display currency from the storefront, not the TLD** (`.com` ≠ USD;
  HK shops serve `.com`/HKD). Grep the storefront for `data-currency` before
  setting `merge.py` SOURCES. A wrong mapping goes silently 8× off.
- **Fetch the locale users actually browse** (state changes lag per-locale);
  write that same URL to the CSV. **Don't classify content by URL slug alone**
  — only skip when the rendered page genuinely lacks title/price.
- **Image-proxy = THREE-place lockstep** when adding a hot-link-protected
  host: `utils.js` `PROXIED_IMG_HOSTS` + `api/img.js` (`ALLOWED_HOSTS` +
  referer) + `api/share.js` `PROXIED_IMG_HOSTS` (OG bots). Miss one and share
  cards break. In `imgSrc()`: Phillips/Monaco use their own CDN size-rewrites;
  every other dealer image routes through **wsrv.nl** resize (~720px WebP).
  Direct-serve exceptions (skip wsrv): Bonhams + Christie's (both block wsrv's
  datacenter fetcher — direct fetch is 200, wsrv times out) + Tropical Watch
  `d29…cloudfront` (240px source — resize only adds grain). Sotheby's brightspot
  is hash-signed — don't retry URL rewrites.- **`is_excluded_title`** filters only pocket watches / clocks / loose dials;
  keep all other accessories. Strip `o'clock` before the `\bclock\b` regex
  (it dropped real lots). Apply the same predicate in any new auction scraper.
- **Phillips: never fetch lot detail from CI** (WAF 403s after ~7 requests).
  Parse the auction-page Turbo-Stream payload via `_phillips_extract_lots`
  (keep the bounds-check on the `{_K: V}` resolver — `-N` sentinels). `sold_price`
  comes from the rendered "Sold For" panel, not JSON-LD (that's the low estimate).- **Comprehensive auction houses (5):** Antiquorum (use `live.antiquorum.swiss`
  + live-URL fallback when the catalog lags), Christie's, Monaco Legend
  (server-rendered Livewire), Sotheby's (`apolloCache` lotCards, not
  algoliaJson alone), Phillips. **Bonhams runs from a residential host, not CI**
  — its lot pages 403 datacenter IPs (Cloudflare), so `enumerate_bonhams` is
  dormant in CI; the laptop `launchd` agent (`bonhams_lots_scraper.py`) scrapes
  it into a SEPARATE `public/bonhams_lots.json` (frontend folds it by URL key;
  CI's `auction_lots.json` would otherwise clobber it). Calendar still scrapes
  in CI. Setup/operate: `scripts/RESIDENTIAL_SCRAPE_SETUP.md`. Don't try to
  un-block Bonhams in CI — the residential host is the answer.
  Mechanics per house live as comments in `auction_lots_scraper.py`.
- **Archive pipeline:** append to `data/manual_archive_sales.json`, run
  `manual_archive_scraper.py`, commit `public/manual_archive_lots.json`
  (separate file so the daily sweep can't clobber it). Supports Phillips /
  Christie's / Antiquorum / Sotheby's.

## Reference index + editorial corpus

- **Reference index** (`docs/watch_references.md`) grows via research-chat
  patches: rename to `watch_references_patch_NN.md`, merge, re-run
  `reference_index_match.py` (regenerates the gap report), commit, PR. Every
  patch entry MUST carry a `**Sources**: [Name](url) · …` bullet (≥2–3) — the
  public per-reference page renders these as linkbacks. Stats live in
  REFERENCE_INTELLIGENCE, not here. Skip Piaget/Movado per Mark.
- **The matcher runs in every scrape path** (`merge.py` + all auction
  enumerators + editorial scrapers); it fills `reference_id` / `model` /
  `model_line` only when empty.
- **Editorial scrapers must use `editorial_corpus_io`** (`load_existing` /
  `write_split`) — never `json.load`/`dump` on corpus files. It splits the
  per-source JSON (meta, eager) from `*_bodies.json` (prose, lazy). Adding a
  source: scraper + one `SOURCES` line in `EditorialView.js` + a workflow step.
- **Dual-track sources** (Hairspring Finds, Hodinkee Shop) also project into
  Listings > Sold via App.js memos — mirror `hodinkeeShopItems` for any new
  priced editorial source.

## Frontend conventions

- **App.js hook ordering.** Never add `useState`/`useMemo`/`useCallback`
  *after* the `if (loading)` / `if (loadError)` early returns — it triggers
  React #310 (white screen). New hooks go in a self-contained component
  App.js mounts unconditionally, or above every early return. A `useEffect`
  must not reference state declared later in the function (TDZ).- **Page chrome = the standard library** (see DESIGN_SYSTEM "Page chrome"):
  titles via `PageHeader`, bars via `StandardFilterBar`/`StandardSearchInput`,
  governed numbers from `CHROME` in styles.js (raw px in chrome code is a
  smell), counts in the bar's right slot / PageHeader `count` (never under a
  title), failed images end at the favicon placeholder. `chrome-guard.test.js`
  fails the build on drift — fix the surface, not the test.
- **Shells move in lockstep.** Any `shellProps` field used in one of
  `MobileShell` / `DesktopShell` must exist in both *and* in
  `mockShellProps.js`. A name destructured in one and missing in the other is
  a ReferenceError the moment that branch renders.
- **Navigation = `pushState`; cleanup = `replaceState`.** Tab / sub-tab /
  drill-in changes push (so browser-back walks backwards); URL-sync cleanup
  replaces. Stay on query params — no `react-router`. `?col=` is owned by
  CollectionsTab only.
- **Portals + theme.** Card ⋯ menu, overlays, toasts render via
  `createPortal` to `document.body`. They inherit theme only because CSS vars
  are mirrored to `:root` and `font-family` lives on `body` — keep both, or
  portals regress (no background / iOS Times serif).- **Confirm dialogs:** `await confirm({...})` from `./ConfirmModal`. Never
  `window.confirm` (breaks dark mode).
- **Articles flow through the listing tables**, distinguished by
  `listing_snapshot.kind = 'article'` — use `articleAsListing()`. Don't fork
  storage.
- **Brand aliases move in lockstep:** `merge.py` `BRAND_ALIASES` (backend) +
  `utils.js` `BRAND_ALIASES` (frontend). `FORCE_OTHER_BRANDS` /
  `SUPPRESS_AT_SOLD_BRANDS` are intentionally frontend-only.
- **No `eslint-disable` for unconfigured CRA rules** (e.g.
  `react-hooks/exhaustive-deps`) — it fails the build under `CI=true`.
- **Cross-surface consistency = shared abstraction, not per-surface patches.**
  When a tab/surface looks or behaves differently from its siblings (Editorial's
  chrome vs other tabs; a sticky/divider gap that recurs), treat it as a *smell
  pointing at a missing shared component or single source of truth* — fix the
  root so every surface inherits correct behavior. Resist local band-aids; they
  re-drift (the date-divider gap took 4 attempts because the chrome isn't one
  component). Mark flags this often — divergence is the bug, not the styling. The
  planned per-tab **dispatch layer** (purpose + area cards + CTA) must be ONE shared
  component, not per-tab variants (see [docs/IA_REDESIGN.md](docs/IA_REDESIGN.md)).
- Visual tokens, components, and reach-for rules: **see DESIGN_SYSTEM.md**.

## Internal-vs-UI naming (deliberate — don't "fix" casually)

UI labels diverge from internals on purpose — don't "fix" casually.
- **Top tabs: Watches · Saved · Articles · Reference Guides ("Guides" on
  mobile).** Labels live ONLY in `src/topTabs.js` (both shells + Home masthead
  consume it). Internal keys stay `listings` · `watchlist` · `references` and
  `?tab=…` URLs are unchanged; Articles/Reference Guides are two top pills over
  the same internal `references` container (sub `editorial` / `references`).
  Tools (Size compare · Challenges — placement provisional) live in the
  account menu; Links parked.
- **DB `collections` ↔ UI "Lists"** (the Saved sub-tab) — `collections` is the
  umbrella for Lists, Wishlist, Owned, Sold, Challenges, shared inbox. Keep it.
- **Internal `watchlist` (tab "Saved", `?tab=saved`)** — hook `useWatchlist`,
  table `watchlist_items`; sub-tabs ♡ Saved · Lists · Searches.
- **Never label anything "Hearted"** — the word is "♡ Saved" (internal
  `hearted` keys stay).

A full internal rename is a parked, low-priority sweep. **Never bump these
storage keys** (resets user data): `LEGACY_WATCHLIST_KEY`, `LEGACY_HIDDEN_KEY`,
`dial_watch_anon_id`, `dial_collections_sub_tab`, `dial_listings_sub_tab`,
`dial_watch_top_tab`.

## Backend display fields

`merge.py` emits computed display fields so the frontend doesn't re-derive
them — prefer the field, keep an inline fallback for old snapshots. Current:
**`lastMeaningfulPrice`** (last non-zero `priceHistory` entry, for items now
at price-0). Add new ones the same way.

## Tests

Two suites, CI on every push + PR:
- **pytest** (`tests/test_merge_state.py`) — `merge.update_state` transitions.
  Add a test for any new field `merge.py` emits or any change to enrichment /
  disappearance logic.
- **jest** — render-without-crash for shells, tab bodies (CollectionsTab /
  WatchlistTab), and App (`.test.jsx` files). Adding a `shellProps` field →
  mirror it in `mockShellProps.js`. Adding a prop to a tab/App → update its
  `buildProps`. **Adding a `useX` supabase hook that App calls → add it to
  `App.test.jsx`'s `jest.mock("./supabase")`** or the App render test throws
  "useX is not a function" (the Vercel build stays green — only jest catches it).
  **Shell tests render MOCK grids — Card/CardShell/leaf components never execute
  in them.** Editing a render path you can't run locally → give that component a
  direct render test (pattern: `CardShell.test.jsx`); a Vercel build compiles but
  never executes, so a ReferenceError ships green without one.

## Things to never do

Cross-file / process rules (single-site rules live as comments in their files):
- **Don't claim "shipped" before CI is green**, or before confirming the
  Vercel bundle serves (JS changes).
- **Don't push follow-up commits to an already-open PR** — squash-merge can
  orphan them. New change → new branch.
- **Vercel Blob caches thumbnails, never full-res** (`cache_watchlist_images.mjs`
  resizes via wsrv; hearted/tracked items only). Blob **transfer/egress** is the
  capped meter — full-res paused us once; storage (~1 GB free) is cheap.
- **Don't widen the `+Track` URL validator past eBay** (auction houses come in
  via the comprehensive scrape).
- **Don't reintroduce retired surfaces** without a decision: Listings
  tri-state pill + blend sort, the EndingSoon strip, the Status segment, the
  colored identity band, the top-level Share tab, the `_isTrackedLot` heart guard.
- **Don't rebuild the retired reaction/screening/auction-catalog systems**
  (removed 2026-05-26, table dropped): the `collection_item_reactions` substrate
  (emoji reactions, To-review/Loved/Liked/Passed buckets, per-card 👍/❌ rating,
  "My reactions" row), the Collecting **Screening sub-tab** (`ScreeningView`), the
  auction **auto-list workflow** (Review / Add-to-list / `getOrCreateAuctionList`),
  and the Listings **Sale filter pill** (the calendar modal is the sale-picker).
  The swipe screener is binary heart/skip; screening launches from a shared
  list's "Screen" button. Collaborative who-hearted-what is a deliberate later
  re-add, not a regression to undo.
- **Don't introduce a new enum value** for a text column without auditing every
  CHECK constraint on the table first (`pg_constraint`).
- **Don't reintroduce in-app messaging / reactions-as-chat / sender-identity /
  share notifications** — the user's own messenger handles that.

## Single-site gotcha index

These rules now live as comments at the sites they govern (read them there).

Rules that live as comments in the file they govern: `Card.js` (JSX-comment
placement), `public/index.html` (font-family on body), `App.js` c-block
(`:root` theme vars), `auction_lots_scraper.py` (Phillips resolver
bounds-check), gridStyle definition (bg ≠ `var(--border)`), `addManualItem` /
schema (`manual_*` requires `is_manual`).
