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

**⭐ IA Redesign — phase status (the BIG plan; full detail [docs/IA_REDESIGN.md](docs/IA_REDESIGN.md)).
Kept here, above the small B-xx items, so the headline work never gets lost in the noise:**
- ✅ **Phase 0** — Listings/Auctions restructure (calendar modal + Bonhams) — shipped.
- 🟢 **Phase 1 — Watchlists "living dossier"** (the keystone) — unified single-scroll tab
  SHIPPED + polished (**B-08**, #638–#644): Watchbox anchor · unified Saved (type filter) ·
  article-style cover cards on the shared CardStrip · Saved searches · rename/delete (cards +
  in-list) · back-nav fix · favicon image fallback. Composable blocks shipped #628.
  **Remaining (crisp follow-ups):** share-modal refresh · empty-list onboarding (+Listings/
  +Articles blocks · title-seeded `+`) · note save-state · promote-hero cover (1 migration) ·
  signed-out 5512/13 starter · **B-37** (heart from articles/refs) · Watchbox-page echoes the landing.
- 🟡 **Reference browsing** (Brand › Model line › Reference, pulled forward) — structure
  SHIPPED (#627). **Needs visual polish.**
- 🔴 **Phase 2** — dispatch layers on every tab + de-junk Collecting + tools shelf — NOT
  built (only the References landing exists as a mini-dispatch).
- 🔴 **AI spine — RAG Q&A chatbot · journey coach · "missed-it"/discovery** — the
  exciting builds; each its own session. *Not a B-xx item — don't let it get buried.*
- 🔴 **Recommender** (Epic 7) + **two-door planning** — future.
*Visual polish is the recurring gap (structures built, pixels rough) — best done with Mark
in-app since Claude can't run the app here.*

### B-06 — Post-screening flow is underspecified (design thread → plan-mode)
- **Reported:** 2026-05-24 · **Type:** Design/product question · **Status:** Largely RESOLVED by the screening collapse 2026-05-26 (PRs #598–602). The original four questions are answered or obsoleted by the new binary model:
  1. *Done screening?* → light `CompletionView` ("Saved N of M"); results = your watchlist.
  2. *Where are results?* → the **Saved/watchlist** (the swipe hearts there; there's no separate per-list result set anymore).
  3. *Rescreen / reset / share?* → rescreen = tap **Screen** again; reset is obsolete (no reactions to clear); share = the normal list Share. Unsave-while-screening shipped (#602, Undo reverses a save).
  4. *Who likes what on a shared list?* → **deliberately deferred** — collaborative reactions were removed in the collapse; "who-hearted-what" is a planned LATER re-add (memory [[feedback_reaction_context_lives_in_lists]]).
- **What remains (the only open slice):** collaborative per-person visibility on shared lists when the team re-adds it. Not a current defect — a future feature. Connects to [[feedback-screening-mode-surfaces]] and [[project_auction_tab_redesign]] (Phase 3 heart-an-auction / Phase 4 integrated tab).

### B-08 — Unify the Watchlists tab into one sectioned screen (design thread → plan-mode)
- **Reported:** 2026-05-24 · **Type:** Design/product thread, **not** a defect · **Surface:** Watchlists tab (UI "Watchlists"/"Saved") · **Status:** ✅ **SHIPPED #638–#644** — unified single-scroll tab (Watchbox anchor · unified Saved w/ type filter · article-style cover cards · Saved searches · rename/delete · shared CardStrip) + live polish. Remaining crisp follow-ups tracked in the **phase tracker above** (share-modal · empty-list onboarding · note save-state · promote-hero cover · signed-out starter · B-37 · Watchbox-page).
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

### B-37 — Can't heart / add-to-list from article or reference pages (dossier input side)
- **Reported:** 2026-05-27 (Mark's wife, real user test + Mark) · **Type:** Feature gap / save-tangle · **Severity:** 2 · **Surface:** article page (`EditorialView`/article detail) + `ReferencePage` · **Status:** Open — **immediate fast-follow PR after B-08** (Mark wants it). Today only listings can be hearted; articles and reference guides have no heart / "add to list" affordance from where you encounter them. But the dossier (Phase 1) is meant to hold articles + reference guides + watches, so you must be able to **save them at the point of reading**. Add a heart / add-to-list control on the article detail + reference node pages, routing through the existing collection-picker (`openCollectionPicker`) + the `listing_snapshot.kind = 'article'` / reference-node patterns. Different files from B-08 → its own branch.

### B-39 — AI concierge bubble: UI polish defects (first real test)
- **Reported:** 2026-05-29 (Mark, first live test of the Epic 9 concierge) · **Type:** Usability/polish · **Severity:** 2 · **Surface:** `src/components/ChatBubbleHost.js` · **Status:** Open — quick batch. Several defects from the first session:
  1. **Input text invisible** — composer text renders same colour as its background (Mark: "there if I highlight it"). Fix the input `color`/contrast.
  2. **No visible close** — the header `×` isn't showing (white-on-olive contrast or clipped header); add a clearly visible close.
  3. **No title / name** — header reads empty; the bot needs a NAME (Mark's call) shown in the header.
  4. **No thinking indicator** — Mark didn't know it was working during the (multi-second) reply; the `thinking…` text is too subtle. Add a clear animated typing/thinking indicator.
  5. **Markdown renders raw** — replies use `**bold**` / lists; the bubble prints literal `**`. Render at least bold + line breaks.
  6. **Links not clickable** — citations come back as URLs in plain text; auto-linkify / render markdown links as anchors (open in new tab).

### B-40 — AI concierge voice: accuracy over commentary; never dead-end
- **Reported:** 2026-05-29 (Mark) · **Type:** Model/prompt tuning · **Severity:** 2 · **Surface:** `SYSTEM_PROMPT` in `api/chat.js` · **Status:** Open — quick prompt edit. Two principles from the first test:
  1. **Err correct over colourful.** The reply called the CK2914 Railmaster "'40s-ish" (it's ~late-50s/60s) and wrote "anesthetic" for "aesthetic". The flourish came from free-recall, not a tool. Tighten: anchor dates/specs to `get_reference`/tool output; if unsure, omit the detail rather than embellish. (Note the tension: Mark *loved* the inbuilt 7016/9411 knowledge — keep the knowledgeable framing, but pin hard facts to the corpus.)
  2. **Never dead-end.** Saying "no 7021/7016 in stock" and stopping leaves the user nowhere. Always offer a constructive pivot — e.g. "but I can show you every Tudor Submariner we *do* have." (Pairs with the action-tools build below — the pivot should become a real action.)

### B-41 — AI concierge: composer should auto-expand as you type
- **Reported:** 2026-05-29 (Mark) · **Type:** Polish · **Severity:** 3 · **Surface:** `ChatBubbleHost.js` composer · **Status:** **Fixed (this PR).** Swapped the single-line `<input>` for an auto-growing `<textarea>` (grows with content to ~5 lines / 120px then scrolls; resize effect on `draft`); Enter sends, Shift+Enter inserts a newline; form `align-items:flex-end` + fixed-height Send so the button stays bottom-aligned as it grows.

### B-42 — Lumé usage feedback batch (2026-05-29)
- **Reported:** 2026-05-29 (Mark, real use) · **Type:** Polish + one functional bug · **Severity:** 2 · **Surface:** `ChatBubbleHost.js`, `LumeIcon.js`, `App.js` (show_listings), `api/chat.js` (cold open). · **Status:** Partly fixed.
  1. **Cold open friendlier + descriptive** — client GREETING rewritten to say what Lumé can do (listings/auctions, reference guides/articles, save to lists). **Fixed (this PR).** Server-side cold-open tone tweak (SYSTEM_PROMPT) — *deferred* (api/chat.js, conflicts with open #690/#691).
  2. **Header title = name + descriptor** — header now reads "Lumé · Watch chat". **Fixed (this PR).**
  3. **⚠️ Reference search bug — FIXED (this PR).** Asked Lumé for a reference; `show_listings` put refs in the exact refs *filter* (ANDs → 0 results, or fell back to brand-only showing all Rolex). Now: brand → filter; the (first) ref / model / query → the SEARCH box as a single substring term (drops the brittle `setFilterRefs`/`setFilterModels`). Also added `statusMode:"auctions"` → auctions sub-tab so Lumé can offer live / sold / auction examples. **PR2 side — SHIPPED #702:** SYSTEM_PROMPT now tells Lumé to put a single ref in search + offer sold + auction examples.
  4. **Hide bubble after an action** — so the filtered grid / opened watch / created note is visible behind; reopen via the launcher. **Fixed (this PR)** — `runAction` minimises (`setOpen(false)`) on success; conversation persists; stays open on failure.
  5. **Triangle proportion** — deeper, ~1:1.5 (w:h, Rolex-1675-hand feel), fills more of the circle, width retained as far as 1:1.5 allows inside the inscribed circle. **Fixed (this PR)** — polygon `24,11 76,11 50,89`; launcher icon 26→44.
- **Status: RESOLVED** — ref-search fix + cold-open + the server-side prompt guidance all shipped (#699/#702). Flat-patina icon shipped #701.

### B-45 — Lumé can't search by watch *attributes* (case material, dial colour, dial config)
- **Reported:** 2026-05-30 (Mark, real use) · **Type:** Capability gap (Epic 7 recommender / Epic 0 reference-intelligence) · **Severity:** 2 · **Surface:** `api/chat.js` `search_listings` + the data in `public/listings_*.json` · **Status:** Open — bigger build, plan-mode. **Detail:** ask Lumé for "a Datejust in stainless steel, silver dial, no numerals" and it can't deliver — `search_listings` only filters brand / model / ref / price / free-text title substring. The structured attributes a collector actually shops by (case material, dial colour, dial markers (numerals vs baton vs none), bezel, complication, size) aren't extracted or indexed, so they're only hit by luck if the words happen to appear in the title. **This is the headline limitation Lumé exposes** and it's the same substrate the recommender (taste→condition→price, [[feedback_recommender_taxonomy]]) needs. **Hypothesis / direction:** an attribute-extraction pass (LLM enrichment in `merge.py`, like the reference matcher) tagging each listing with normalised facets → a faceted `search_listings`; OR a semantic/embedding search over listing text. Lexicon Phase 2 (slang→canonical) is a partial input. Decide approach in plan-mode; likely the biggest single uplift to Lumé's usefulness.

### B-46 — Lumé asserts ungrounded reference "facts" + contradicts the user's real listing
- **Reported:** 2026-05-31 (Mark, real use — Tudor snowflake chat) · **Type:** Grounding/accuracy failure (the trust-killer) · **Severity:** 1 (kills trust — Mark: "one weird statement … kills the ride") · **Surface:** `api/chat.js` SYSTEM_PROMPT + `get_reference` coverage · **Status:** Open. **Detail:** asked the 9411/0 vs 7021 difference, Lumé free-recalled a whole spec breakdown (movements, MN-engraving years, $30k figures) and asserted **the 9411/0 is the *no-date* reference** — WRONG (it has a date window; Mark validated independently). Worse: when Mark said his on-screen 9411/0 *has* a date window and shared the real share-URL (which Lumé correctly resolved to "Belmont Watches 9411/0, $9,250"), Lumé **still insisted the listing was probably mislabeled/a red flag** — its ungrounded belief overrode the real, reputable listing in front of it. Two failures: (1) stated reference facts NOT from a tool (violates accuracy-over-colour, [[B-40]]); (2) told the user their validated reality was fake instead of deferring. **Fix:** the behavioral-charter prompt-tune (corpus-only facts; if get_reference lacks it, say so — never confabulate; NEVER tell a user their real listing is wrong on the strength of an unverified belief — defer to the evidence + flag uncertainty humbly). Also a KNOWLEDGE GAP: Tudor snowflake refs (7021/9401/9411) aren't well covered in the reference index/synthesis — candidate node for the fan-out.

### B-47 — Lumé can't see what's on the user's screen (active filters / current listing)
- **Reported:** 2026-05-31 (Mark, real use) · **Type:** Capability gap · **Severity:** 2 · **Surface:** `api/chat.js` tools + the client (no screen-context passed) · **Status:** Open — design/plan. **Detail:** Mark was viewing a filtered listing and said "it's the one on screen at the moment filtered"; Lumé can't access the current view — it only searches inventory itself, so it asked for a URL. It got there once Mark shared the share-link, but the friction is real: Lumé has no awareness of the user's **active filters, current results, or the listing/page they're looking at**. **Direction:** pass a lightweight "current context" (active tab/filters, visible/opened listing id or share-id) from the client into the chat request so Lumé can reason about "this one" / "these results." Ties to pillar 3 (deep-linking) — the inverse direction (app→Lumé context, not just Lumé→app actions).

### B-49 — Lumé blind to the article corpus + defaulted to listings + thrashed on impossible filters
- **Reported:** 2026-05-31 (Mark, real use — Enicar Superjet; then a quickset-Datejust/silver-dial ask that dead-ended with "I hit my limit working that one out") · **Type:** Capability + behaviour · **Severity:** 1 · **Surface:** `api/chat.js` tools + `lume_system_prompt.txt` · **Status:** Fixed PR#709. **Detail:** three linked failures from real use: (1) Lumé said Enicar is "not in our index … hasn't been saved enough to trigger indexing" — it had **no tool to search the editorial corpus** (Enicar appears 600+ times) and leaked plumbing-talk; (2) it **defaulted to listings** when asked to *talk about* a watch; (3) on an attribute query it CAN'T satisfy (stainless / silver dial / quickset) it **looped search_listings until it exhausted MAX_TOOL_ROUNDS** and returned the curt fallback. **Fix (PR#709):** new `search_articles` tool (10 essay sources, snippet + source URL) + prompt: knowledge-first routing, humble no-plumbing-talk, a **capabilities/limits section** (search filters = brand/model/ref/price/text only; can't filter dial colour/material/markers — so coach, don't thrash) and "answer after 1-2 tool calls." Pairs with B-46/B-40/B-45. **Follow-up (not in #709):** loop-exhaustion should force a final no-tools answer instead of the curt fallback.

### B-48 — No "Clear filters" affordance on the shared filter bar (Epic A / IA-UX)
- **Reported:** 2026-05-31 (Mark, screenshot: Lists ▸ Saved with `Source · 1` = Belmont Watches active, narrowing to 4) · **Type:** Usability / cross-surface consistency · **Severity:** 2 · **Surface:** the shared listings filter bar (Source / Brand / Model / search / price / date + source chips) used across **Watches** and **Lists** · **Status:** Open. **Detail:** when filters are active there's no clear/reset-all control — the only signal is the subtle `Source · 1` pill, and no one-tap way to clear. **Mark's framing (the real point):** a filterable surface should ALWAYS expose a "Clear filters" feature — make it a **shared mechanism** (one component / single source of truth, "a standard library") so every filter surface inherits it, not a per-surface patch. **Fix:** add a "Clear all" control to the shared filter bar that appears whenever any filter/sort deviates from default and resets brand/model/source/search/price/date — wired once in the shared chrome so Watches + Lists both get it (cross-surface consistency = shared abstraction, per CLAUDE.md).

### ⓑ Epic B — Platform Health
*Audit remediation + reliability. Low-risk, noise-reducing; mostly independent of
the redesign.*

### B-52 — "Share with Lumé" from a listing's ⋯ menu (app → chat bridge)
- **Reported:** 2026-05-31 (Mark) · **Type:** Feature · **Severity:** 2 · **Surface:** Card ⋯ menu + ChatBubbleHost · **Status:** Open — plan. **Detail:** while browsing filtered listings, the user should be able to tap a card's **⋯ → "Share with Lumé"** to pull THAT listing into the chat — either dropping it into the current conversation or kicking off a new one ("talk to Lumé about this watch"). It's the inverse of Lumé→app actions: an **app→Lumé context bridge** (pairs with B-47 — Lumé can't see what's on screen; this is the deliberate "send it this one"). Mechanics: pass the listing's id/share-id into the chat request as seed context; open the bubble with a primed opener. Applies to listings now; extend to articles/lots later.

### B-53 — Lumé: fabricated counts, "we have N" stock framing, shops on taste statements
- **Reported:** 2026-05-31 (Mark, real use — "I like gold watches") · **Type:** Accuracy + voice + routing · **Severity:** 2 · **Surface:** `lume_system_prompt.txt` · **Status:** Fixed PR#713 (prompt). **Detail:** said "we have 45" gold watches when (a) we own NONE — they're aggregated dealer listings, and (b) the search it ran actually returned **775** (it stated a count it never grounded). It also searched a bare "gold" (matched yellow/rose/white — imprecise) and jumped straight to listings instead of engaging the taste. **Fix (PR#713):** prompt now — taste statements are a conversation not a search (engage + ask which gold); state only the EXACT tool-returned count, never guess; say "there are N listed" not "we have N" (not our stock); flag broad terms ("gold" = all tones, "silver dial" unfilterable). Added a gold eval scenario. Underlying attribute-imprecision is B-45.

### B-51 — Lumé's links should stay IN-APP (listings inconsistent; articles bounce to source)
- **Reported:** 2026-05-31 (Mark, real use) · **Type:** UX / capability · **Severity:** 2 · **Surface:** Lumé actions (`read_more`, `show_listings`/`open_watch`) + the share surface + a not-yet-existing in-app article view · **Status:** Open — plan. **Detail:** the links Lumé hands back are inconsistent and leak the user OUT of the app: (1) **listings** — some open the in-app `/share` surface (good; being improved), but some go straight to the **external dealer site**; (2) **articles** — `read_more` sends the user to the **raw source publication**, so there's no way to save the article or see it in a watchlist context. **Want:** one consistent in-app surface for BOTH — route listings through the (improving) share/open surface, and build the **same kind of in-app surface for ARTICLES** (read it in-app + heart/add-to-list, never bounce to the source). Pairs with B-37 (save from article/reference pages) and the share-surface refresh. Tracked in LUME_ROADMAP backlog.

### B-50 — Stale service-worker cache served an ancient build (old masthead)
- **Reported:** 2026-05-31 (Mark — clicked a Lumé link, chat closed as designed, landed on a ~PR300-era build with old masthead/layout, browsable offline) · **Type:** PWA / caching reliability · **Severity:** 2 · **Surface:** `public/service-worker.js` · **Status:** Fixed PR#712. **Detail:** `CACHE_VERSION` was the static string `"watchlist-v3"` across many deploys. `activate` only deletes caches that DON'T match the current version, so the `watchlist-v3-static` cache (holding an ancient index.html + that era's hashed bundles) was never purged. HTML is network-first, but on a navigation-fetch hiccup it falls back to `cache.match("/")` → that ancient cached page → old build, fully browsable from cache. **NOT multiple deployments** — one Vercel build; purely a client-side stale-cache artifact. **Fix (PR#712):** bump CACHE_VERSION v3→v4 → activate purges the old cache on next load. **Follow-up (not in #712):** tie CACHE_VERSION to the build (inject a build id at deploy) so caches auto-purge every deploy instead of relying on a manual bump — the recurrence-proof fix.

### B-44 — synthesise-saved-nodes workflow commits to main with NO CI gate
- **Reported:** 2026-05-30 (bit us live) · **Type:** CI / process reliability · **Severity:** 2 · **Surface:** `.github/workflows/synthesise-saved-nodes.yml` (Commit + push outputs step) · **Status:** Open — small fix. **Detail:** the saved-node fan-out commits `reference_synthesis_*.json` etc. **straight to main without running tests**. On 2026-05-30 the new `reference_synthesis_rolex-datejust.json` invalidated two tests (jest `getReference` "Datejust → empty synthesis"; pytest `test_derive_nodes` "datejust in nodes") and **turned main red with no warning** — only surfaced when the next PR (#704) failed CI. The tests were since decoupled from live fan-out files (#704), but the underlying hole remains: a bot can push to main unguarded. **Hypothesis / fix:** either (a) have the workflow open a **PR** instead of pushing to main (CI runs before merge), or (b) run `pytest` + `jest` in the workflow before the commit step and fail the run if red. (a) is cleaner and matches branch discipline.

### B-16 — Dependencies unpinned (no lockfiles, JS + Python)
- **Reported:** 2026-05-24 · **Source:** `audit:2026-05-24` · **Severity:** 2 (reliability + supply-chain) · **Surface:** build / CI / workflows · **Status:** Partly fixed — **Python pinned #578**; **JS lockfile DEFERRED 2026-05-29 (Mark)** — confirmed `npm`/`node` are absent on the machine (all builds are cloud), so a lockfile can't be generated locally and installing a toolchain isn't worth it for non-urgent hardening. When tackled: commit `package-lock.json` (cloud-generate via a one-shot Action, or local npm), switch `tests.yml` + `scrape-auctions*.yml` to `npm ci`, enable setup-node npm cache; Vercel auto-uses `npm ci` once the lockfile is committed.
- **Detail:** No `package-lock.json`; workflows `pip install` latest unpinned. A build that works today can break tomorrow with no code change, and it's a supply-chain exposure (updates run with the scrapers' secret keys). Cheapest high-leverage fix in the audit.
- **Done (#578):** pinned `requirements.txt` / `requirements-auctions.txt` / `requirements-ai.txt`; all 11 runtime workflow steps now `pip install -r`.
- **Remaining:** commit `package-lock.json` + switch CI/Vercel to `npm ci` (needs Node); optionally Dependabot for deliberate bumps. Detail: `findings-maintainability.md` (HIGH-1), `findings-security.md` (MED-2/3).

### B-18 — Currency FX tables duplicated, can silently drift · Fixed #675
- **Reported:** 2026-05-24 · **Status:** RESOLVED 2026-05-28 (#675) — FX parity guard added (parallel session). A CI-enforced test now asserts that `merge.py`'s FX table matches `utils.js`'s `FX_RATES_USD_PER`; fails if they drift. No longer a silent mis-price risk.

### B-19 — 5 user-data tables' RLS state not version-controlled · Fixed #677
- **Reported:** 2026-05-24 · **Source:** `audit:2026-05-24` · **Severity:** 2 (security provability) · **Status:** RESOLVED 2026-05-29 (#677, **applied to prod + verified**). Committed an idempotent `enable row level security` for the four dashboard-created tables (`watchlist_items`/`hidden_listings`/`saved_searches`/`tracked_lots`) in `supabase/schema/2026-05-28_rls_provability.sql`, so RLS-on is now provable + restorable from code (their policies already lived in `2026-05-10_rls_initplan_perf.sql`; collections/collection_items already enabled in `2026-05-01_collections.sql`; **"challenges" is a collection *kind*, no table exists**). Verified all four had RLS on in prod — no active leak. Also tightened the `listing_events` insert from `with check (true)` → `user_id is null or user_id = (select auth.uid())`: blocks forging another user's `user_id` while keeping anon analytics working (matches `useEventTelemetry`). Detail: `findings-security.md` (HIGH-1, MED-1).

### B-20 — Two near-identical auction-scraper filenames
- **Reported:** 2026-05-24 · **Source:** `audit:2026-05-24` · **Severity:** 3 (footgun) · **Surface:** auction scrapers · **Status:** Open
- **Detail:** `auction_lots_scraper.py` (catalog walker) and `auctionlots_scraper.py` (tracked-URL tracker) differ by one underscore and both run in the same workflow — easy to edit the wrong one. Flagged independently by 3 auditors.
- **Fix:** rename `auctionlots_scraper.py` → `tracked_lots_scraper.py` + update importers/workflows. Detail: `findings-architecture.md` (M1), `findings-maintainability.md` (MED-4).

### B-22 — App ships as one bundle; heavy tabs aren't code-split
- **Reported:** 2026-05-26 · **Source:** `audit:2026-05-24` (H1) · **Severity:** 2 (perf / first-load) · **Surface:** `src/App.js`, `src/index.js` · **Status:** Partly fixed — **AdminTab code-split #579**; phase 2 open. **DEFERRED 2026-05-29 (Mark):** do it when he can verify in-app — a `React.lazy` default-vs-named-export slip could white-screen a surface and there's no local Node to run the CRA build (only CI would catch it). Overlaps B-34's ReferencesTab-subtree lazy-load.
- **Detail:** No `React.lazy`/`Suspense` anywhere; `App.js` statically imports every heavy surface (AdminTab, EditorialView, SizeCompare, ChallengeFlow, the share/list/challenge receivers, all modals, SearchResultsView), so every visitor downloads + parses their code on first load even though most never open them.
- **Done (#579):** AdminTab (admin-only) `React.lazy` + `Suspense` — its chunk now loads only when an admin opens the tab.
- **Remaining (phase 2):** the receivers (mount only on inbound share/challenge/list links), `EditorialView`, `SizeCompare`, `ChallengeFlow`, modals. Confirm where each is imported (some are inside sub-components, not App.js). Detail: `docs/audits/2026-05-24-vibe-code/findings-frontend.md` (H1).

### B-27 — Inert-code visibility scan (maintenance thread)
- **Reported:** 2026-05-26 · **Type:** Maintenance/hygiene thread, not a defect · **Severity:** 3 (maintainability) · **Status:** First scan run 2026-05-28 (`/tidy`) — see results below; thread stays open as a recurring sweep.
- **Scan results (2026-05-28):** swept scrapers, components, and exports. Findings: (1) `phillips_known_auctions_scraper.py` — in no workflow, output CSV read by nothing → **removed (#654)**. (2) `windvintage_guides_scraper.py` — not in CI, but its `public/windvintage_guides.json` is a committed corpus file referenced in REFERENCE_INTELLIGENCE → **kept** (Mark's call; manual/one-off corpus, like `manual_archive_scraper.py`). (3) `ListManagePanel` — already retired; only a JSX comment remains in `CollectionsTab.js`. (4) `bonhams_lots_scraper.py` / `manual_archive_scraper.py` — intentionally not in CI (residential launchd / manual archive pipeline), not orphans. No other inert code found. (Also cleaned ~26 stranded/merged branches + 2 leftover worktrees same pass.)
- **Scan results — pass 2 (2026-05-28, frontend + workflows):** fanned out across `src/` + `.github/workflows/`. Findings: (1) `src/components/SubTabIntro.js` — retired component, **0 imports** (only a stale "Imported as <SubTabIntro/>" comment in `WatchlistTab.js` + retirement breadcrumbs elsewhere); IA Phase-2 dispatch is a *new* shared component, not this → **deleted (this PR)** + stale comment corrected. (2) `src/hooks/useLastVisit.js` — **0 references**, orphaned by the feed-screening retirement, BUT the "what landed since you last opened" computation is the planned consumer for the Home/Watchlists **pulse / new-since-visit** surface (B-32, [[watchlists_pulse]]) → **kept with a `DORMANT:` marker** (this PR), not deleted. (3) `src/components/Eyebrow.js` — 0 imports but it's **forward prep** for the handoff's typography "Eyebrow promotion" follow-up → **kept** (intentional, not inert-by-neglect). (4) `windvintage_guides_scraper.py` re-surfaced → already adjudicated keep in pass 1. (5) Workflows clean: `scrape-listings-matrix.yml` is intentionally `workflow_dispatch`-only; `notify-scrape-failure.yml` is a `workflow_run` listener. (6) **Prior-handoff note corrected:** App.js does NOT import a dead `ListReviewMode` — `CollectionsTab.js` imports it and renders it live. *Lesson reinforced: an automated dead-code finder mis-called 3 of 6 (Eyebrow/windvintage/ListReviewMode) without plan-context — always filter findings against handoff/ROADMAP/memories before acting.*
- **Why:** building B-24 surfaced that `enumerate_bonhams` was complete and wired into `ENUMERATORS` but **inert in CI** (Cloudflare 403) — code that exists, looks live, but never produces output in its current environment. Its docstring even claimed "works cleanly from CI" (true once, then false). This is a *different* axis than the 2026-05-24 vibe-code audit (which covered correctness/security/perf, not dormant-but-valid code), so it's not tracked anywhere. Mark's question (2026-05-26): "how much of this is in the codebase, just not visible?"
- **Scope of the scan:** find code that is wired in but effectively inert — enumerators/scrapers that return `[]` in their runtime, workflows built but never scheduled (e.g. `scrape-listings-matrix.yml`), flag-guarded **retired UI surfaces** (CLAUDE.md's "don't reintroduce" list), dead imports (e.g. App.js imports `ListReviewMode` but renders it 0× — noted in a prior handoff). For each: decide keep-with-marker / reactivate / delete.
- **Convention to adopt:** dormant-but-valid code carries a `DORMANT:` marker stating *why it's inert + what reactivates it* (done for `enumerate_bonhams`, #-this-PR). And: sanity-check plan docs (BUGS/ROADMAP) against actual code before writing "build X" (the B-24 framing miss). Pairs with the `/maintenance` skill.

### B-34 — Load-speed audit: measure + improve first-paint; verify Vercel downgrade impact
- **Reported:** 2026-05-27 · **Type:** Performance · **Severity:** 2 · **Surface:** first-load / Vercel hosting · **Status:** Largely fixed 2026-05-28 (#646–#651). **Done:** wsrv image resize (payload ~198→~13 MB; desktop LCP 19→6 s); below-fold home strips deferred + eager LCP + `listings_desc` idle-loaded; AuctionCalendar/Search-all code-split; Blob→thumbnails (storage ~242→~20 MB). Vercel-downgrade question answered: the cap that paused us was **Blob transfer**, not site bandwidth (6/100 GB). **One follow-up:** re-run PageSpeed mobile for the after-baseline (was 35) + lazy-load the **ReferencesTab subtree** (~3k lines, the remaining bundle chunk).
- **Detail:** Measure real load speed (first paint + time-to-interactive) and find the wins. **Check whether the recent Vercel Pro→Hobby downgrade changed anything** (edge caching / bandwidth / build limits). Known levers already on the roadmap: ~22 MB JSON on first paint (listings.json split **Phase 2** + lazy-gate non-default fetches), **code-split Phase 2** (B-22), a CI size-budget guard. Deliverable: a before/after baseline (Lighthouse / WebPageTest) + a prioritized fix list. Pairs with ROADMAP "Payload + data-growth budget".

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

### B-26 — A shared item leaks into the brand-filtered Listings grid · Fixed #674
- **Reported:** 2026-05-26 · **Status:** RESOLVED 2026-05-29 (#674 code + #679 data). Root cause was a single brand-misclassification, **not** a leak: a Wind Vintage "Richard Mille RM 002-V2" had its brand undetected (RM was on neither brand-detection list), so the matcher matched the bare "002" against Enicar's ref 002 and stamped `brand: Enicar`. Fixed by adding "Richard Mille" to `merge.py` BRANDS + `utils.js` FRONTEND_BRANDS (the cross-pollination guard then rejects the hit) + correcting the cached `lastBrand` in `state.json`. **The `/share/484b…` link was a red herring** — it's just this listing's own id (share URLs are built from the id), not another user's shared item, so there was no cross-user privacy leak. (The `state.json` fix was re-landed in #679 after a scrape-commit race clobbered the first one.)

### B-29 — Sold tab: "Calendar" button → "Auctions"; closed-auction click should open its lots
- **Reported:** 2026-05-27 · **Type:** Auction-surface UX (Epic 9 / Phase 0 follow-up) · **Severity:** 2 · **Surface:** Listings ▸ Sold filter row + the auction calendar modal "Closed" path · **Status:** RESOLVED 2026-05-28 (#657/#663). Part 2 shipped — a closed auction's sold lots now show on the Sold sub-tab (the sale filter gates by status: applies on Sold only for *closed* sales, on Auctions for live; `effectiveSaleUrls`). Part 1 OBSOLETED by Mark's call: the launcher is renamed **"Calendar"** (not "Auctions") and reads as a filter pill — the rename idea is superseded.
- **Detail (two parts):** (1) On the **Sold** sub-tab the **"Calendar"** filter-row button should read **"Auctions"** and take the user to / filter the **closed auctions** (the modal's Closed view). (2) Clicking a **closed (past) auction** should open the **closed listings for that sale** (its lots) — the same way a live sale opens its lots. Mark: "I want it to work like that." Likely the closed-sale card's onClick (`handleOpenSale`) doesn't filter the Sold grid by that sale's lots.

### B-30 — Auction calendar modal: month pills don't filter (only scroll); "ALL" + CLOSED layout
- **Reported:** 2026-05-27 · **Type:** Auction redesign defect + polish · **Severity:** 2 · **Surface:** `AuctionCalendar` modal (month nav + house filter row) · **Status:** Fixed (auction-cal-closed-left) — Mark's call: month pills stay **scroll-to** (NOT filtering), the no-op **"ALL" removed**, **"CLOSED" moved left** ahead of the months.
- **Detail:** (1) **Filtering:** tapping a month pill (MAY/JUN/…) does NOT filter to that month — all sales still render, it just **scrolls** to the month. Mark questions whether **"ALL"** should exist if months don't actually filter. Decide: make month pills *filter* (hide other months) OR keep scroll-to + drop "ALL". (2) **Layout:** the **"CLOSED"** pill sits far-right on the month row; Mark wants it on the **same line but left-aligned**, ahead of the months.

### B-31 — Search results: Auctions strip cards misaligned
- **Reported:** 2026-05-27 · **Severity:** 3 (visual) · **Surface:** `SearchResultsView` Auctions strip (`Strip`→`CardStrip`/`Card`) · **Status:** Mark reported DONE 2026-05-29 (verbal, alongside B-32/B-33) — **PR not separately confirmed; verify + close at /tidy** (likely folded into the CardStrip/#670 chrome work). Left here, not in Resolved, until the PR is identified.
- **Detail:** In the Home "search all" results, the **Auctions** strip cards don't line up with the Listings strip above (Mark screenshot 2026-05-27). Likely the auction item renders at a different card height/aspect in the shared `CardStrip` (countdown badge / image aspect / price line). Compare auction-vs-listing `Card` rendering and align the card dimensions within the strip.

### B-32 — Home: content strips (recently added · articles · sold · hearted · auctions ending soon)
- **Reported:** 2026-05-27 · **Type:** Feature (Home landing) · **Severity:** 3 · **Surface:** `HomeTab` strips + editorial corpus · **Status:** Mark reported DONE 2026-05-29 (verbal, alongside B-31/B-33) — **PR not separately confirmed; verify + close at /tidy.** Left here, not in Resolved, until the PR is identified.
- **Detail:** Mark wants the home/landing page to carry horizontal strips: **Recently added · Articles (recent) · Sold · Hearted · Auctions ending soon.** (Articles = the long-deferred editorial strip — load editorial meta lazily, sort by `published_at`.) Each a `CardStrip` deep-linking into the relevant surface. Mind first-paint weight — idle/lazy-load like the other deferred fetches.

### B-33 — Horizontal strips don't signal they scroll sideways · Fixed #670
- **Reported:** 2026-05-27 · **Status:** RESOLVED 2026-05-28 (#670). The prior custom JS thumb was removed (it drove setState every frame + eased 0.06s behind → laggy). Affordance is now the right-edge fade gradient (hides when you reach the end) + the peeking next tile — no lag, compositor-only. Also softened snap `mandatory→proximity`.

---

## Resolved

### B-36 — Hearted items scattered across Listings/Auctions/Sold · Fixed #638
- A real-user test (Mark's wife) hearted an item and couldn't find it — hearts lived in
  three separate buckets with no "everything I saved" view. B-08's unified Watchlists
  landing folds them into one **Saved** band with an All · Watches · Articles · Sold ·
  Auctions type filter (later rebuilt on the shared CardStrip, #644).

### B-38 — Watchlists image tiles showed the browser's broken-image "?" · Fixed #641/#644
- The bespoke landing tiles used bare `<img>` with no fallback, so failed/blocked photos
  rendered the raw "?". Fixed by routing tiles through the app's `imgSrc` + `/favicon-192.png`
  fallback (matching `CardShell.CardImage`); the Saved band then moved to the shared
  `CardStrip`/`Card` so it inherits that handling for free.

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
