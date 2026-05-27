# IA / UX / UI Redesign — thinking + plan

**Status:** Canonical plan doc. Born as a plan-mode *thinking* session (no code
touched); **filed to the repo 2026-05-27** after a terminal crash lost the
plan-mode buffer (Mark re-pasted it). Phase 0 (auction restructure + Bonhams)
has **shipped**; `main` is current. Build of Phases 1–3 happens in new sessions,
**starting at Phase 1a**. ROADMAP anchors its IA epic to this doc; the build
handoff brief = this whole doc.

## Context — why
Mark's feeling, echoed by other users: **it's not clear why you'd go to each tab
or where a function lives.** Root cause: top-level tabs are organized by **data
type + historical accretion, not by user job** — so the same concept appears in
2–3 places and whole jobs are buried. A user literally watched Mark use the tabs
and couldn't tell what they were for.

---

# THE MODEL (what we landed on)

## The spine: the app runs at THREE SPEEDS — and the tabs already *are* the speeds
Organize by **what you're doing and how fast**, not by data type. (This resolves
the "speeds-as-tabs vs speeds-as-lens" fork: the noun tabs already express the
speeds — never label tabs Fast/Medium/Slow; tempo is the rationale, nouns are the
labels.)

| Tab | Speed | Job | Holds |
|---|---|---|---|
| **Listings** | FAST | encounter the market | one dense grid (listings + auctions + sold), cut by new / price / brand / house; a **dispatch layer** so sub-views aren't missed; screening only for long catalogs |
| **Watchlists** | MEDIUM | make meaning | "living dossier" lists mixing articles + saved search + listings + comps + shortlist + reference + notes; **Watchbox = elevated anchor list**; share out/in; mostly **no-buy** taste-saving |
| **Collecting** | SLOW | grow | (a) learn about *watches* (refs + recommender), (b) develop as a *collector* (discipline / identity); AI-fed; reads your lists |

**Home** = dispatcher + fast-lane "what's new / what you missed."
**Real-world precedent:** brokerage apps (Watchlist → Portfolio → Research) are
~1:1 with this; reading apps + Spotify follow the same save-then-deepen arc.

## ⭐ KEYSTONE — Watchlists = a living dossier ("Evernote for watches", but more)
The most important idea. Watchlists should be **the core feature that earned the
site's name.** Today Mark keeps one messy Evernote note per reference; the vision:
a list becomes a **rich, heterogeneous dossier**. One *Submariner 5513* list holds:
articles (e.g. Scott Carpenter at SeaLab) · a **live saved search** · hearted
listings · auction + sold comps · current live listings · a shortlist of great
examples · a reference guide · eventually **free-text notes**.

**Why it's the keystone:** it **dissolves the save-tangle** — hearts, searches,
articles, comps, reference guide, shortlist stop being scattered destinations and
become **ingredients composed inside a list.** The list is the unit of meaning.
*Caveat on the analogy:* the lists are **live + shareable** (Evernote is passive +
solo), and Evernote's baggage is "messy drawer" = the thing we're escaping — build
toward **Notion-meets-a-market-feed**, don't lean on "Evernote" in UI copy.

## Watchbox + Planning (resolved)
- **Watchbox = noun (inventory: owned + wishlist + sold).** An inventory is a list
  → its **home is Watchlists**, as the **elevated anchor list**. Collecting *reads*
  it for reflection. One data home, no duplication.
- **Planning = collection strategy (what to add / sell / gaps / fit).** Distinct
  from *candidate* planning (a Tudor-Sub dossier list — already covered).
  **Decision: one planning experience, two doors** — "Plan my collection" from the
  Watchbox, "your journey" from Collecting. It's the bridge between medium + slow.

## Collecting = TWO jobs (one tab, two clear sections)
1. **Explore watches** (outward) — finding new references is a dopamine hit;
   recommender ("have you seen this / off your path but interesting"); taste +
   knowledge.
2. **Develop as a collector** (inward) — discipline, not chasing hype, the social
   side, who-am-I; **not tied to any brand/ref.** (Reinforces: reference pages stay
   *about the watch*; collector-self content is its own surface.)

**Missing spine — reference drill-down:** today there's a single 5512/5513 **leaf**
page, no tree to reach it. Build **Brand › Model line › Reference** (Rolex ›
Submariner › 5512 · Omega › Seamaster › 165.024) with **breadcrumbs** at every
level + a reference *dispatch/landing* ("what's a reference, start by brand/search").

## The dispatch layer = the clarity mechanism (every tab)
Half the redesign is **communicating clarity, not just landing the user.** What
*didn't* work (don't repeat): collapsible how-tos + instruction popups (clutter).
What works → go further: **empty-state descriptors + a CTA.** Each tab opens on a
**dispatch/overview layer** — purpose line + area cards (name · what-it's-for · live
count · "Browse →") that drill into where the sub-tabs appear, plus a CTA (*"Start a
list about a reference — pull in articles, comps, examples…"*). Build as **ONE
shared component** (cross-surface consistency), not per-tab band-aids.

## The AI spine (what Mark is most excited about)
This is also a **builder / personal-development project** — the dual passion is the
momentum engine. Turn **like/share/view signals** into help. Three roles:
1. **Grounded RAG Q&A** — answer from corpus excerpts only; cite every claim; "not
   covered" rather than guess; surface differing collector perspectives; voice =
   about the watch, not the collector's taste/status.
2. **Collecting-journey coach** — where-next / what-to-weigh / not-chasing-hype /
   the social side; context = Watchbox + lists + reactions; helpful, curious,
   **never judgmental**; never says what to buy; asks > tells.
3. **Missed-it / discovery** — from signals + lists, surface unseen-but-valuable
   items (new listing · off-path reference · gift fit); one line of "why this";
   transparent it's AI; invites correction.
Maps to the speeds: missed-it → FAST, RAG → explore-watches, coach → become-a-
collector. ⇒ the slow surface has an AI spine, not static pages.

---

# DELIVERABLE 1 — Backlog: epics + priorities

Restructure the flat `B-NN` list into **3 epics + theme tags**, so `/start` is
legible and the IA work reads as one thing (Mark's decision: *epic rollup + theme
tags*). **Applied — see BUGS.md (Epics A/B/C) + DELIVERABLE 3.**

**Epic A — IA / UX Redesign** (this plan). Absorbs the design-threads that were
masquerading as bugs (they're scope, not defects): **B-06** post-screening flow ·
**B-08** unify Watchlists tab · **B-14** BRAND voice · chrome-unification ·
card-design-system. → leave BUGS Open, become this epic's checklist.

**Epic B — Platform Health** (audit remediation): **B-16** JS lockfile · **B-18**
FX drift · **B-19** RLS un-versioned · **B-20** scraper rename · **B-22**
code-split phase 2 · **B-27** inert-code visibility scan.

**Epic C — Auctions & Scraping** (the OTHER session's domain): **B-23** Browse
AI/TW · **B-24** Bonhams · **B-25** residential host · + the in-flight **auction
Calendar+Listings merge**.

**One-off:** **B-26** shared item leaks into the brand-filtered grid (correctness,
small).

**Clean-close rule** (also adopted as a CLAUDE.md rule): a partial ship **closes**
the item and opens **one** crisply-scoped follow-up — no vague "phase 2 open" tails.

### Priority — what to knock off BEFORE the redesign build
1. **Land the in-flight auction restructure + Bonhams** (Epic C, other session).
   *Sequencing, not optional* — they rewrite the same App.js zones the redesign
   will; stabilize the base first. **(DONE — Phase 0 shipped #612–#621.)**
2. **Cheap correctness/hygiene wins** (independent, low-risk, reduce noise):
   **B-18** FX drift · **B-26** grid leak · **B-20** scraper rename.
3. **Nice-to-have before:** **B-19** RLS (security provability; no active leak).
4. **DEFER to AFTER the redesign:** **B-22** code-split (don't optimize App.js
   you're about to rewrite) · **B-16** JS lockfile (needs a Node env).

---

# DELIVERABLE 2 — Redesign build phases + handoff

Sequencing principle (Mark): **build the capability before the dispatch layer that
advertises it** — the dispatch layer is *communication of capability*, premature
before the capability exists. Each phase ships independently and leaves the app
coherent.

### ✅ Phase 0 — Listings/Auctions restructure — SHIPPED (#612–#621)
Auction Calendar+Listings merge landed. `LISTINGS_SUB_VALUES` = **live · auctions ·
sold** (Calendar is no longer a sub-tab — calendar-first: auto-opens a calendar
modal on first Auctions visit + lives on the filter row). "Archive" → **Closed**;
auction cover images added; **Bonhams folded in**. The FAST surface is largely in
place.

### ▶ Phase 1 — Watchlists = the living dossier (THE BIG BUILD — START HERE)
The keystone. Shippable steps:
- **1a — Spec + data model (design, little/no UI).** Define the dossier = a list
  of ordered, **typed sections**: reference guide · saved search (live) · live
  listings · sold comps · shortlist · articles · notes. Map each to existing
  storage (`watchlist_items`, `collection_items`, `saved_searches`, editorial) +
  the ONE new type (**free-text notes** → new column/table). Decide the live-
  saved-search mechanism (re-run on open).
- **1b — Dossier container UI.** List-detail view renders heterogeneous section
  blocks (sketch below). Compose the *existing* content types first (articles +
  listings + hearts + a saved search + comps). Ship without notes.
- **1c — Watchbox as elevated anchor list.** Surface owned/wishlist/sold as the
  pinned anchor in Watchlists (out of the avatar menu).
- **1d — Notes.** Free-text notes per list (the genuinely new storage).

### Phase 2 — Dispatch layers + de-junk Collecting
Shared dispatch/overview component on **every** tab (purpose + area cards + CTA);
**de-junk Collecting** into its two sections (explore-watches / your-journey);
retire **Screening-as-tab** → a mode on long catalogs + shared lists; **tools
shelf** for Size/Links.

### Phase 3 — AI spine + planning + reference drill-down
RAG (grounded Q&A) · journey coach · missed-it/discovery; the two-door **planning**
experience; the **Brand › Model › Reference** drill-down with breadcrumbs (the
missing spine — 5512/5513 is the existing leaf).

**The next session starts at Phase 1a.** Handoff brief = this whole doc (design
sketches + AI prompts + IA map + migration landmines).

## Design sketches (first-pass wireframes — STRUCTURE, not visuals)
Real visuals come off DESIGN_SYSTEM.md at build. Mobile-first.
- **Dispatch layer:** purpose line + area cards (name · what · live count ·
  "Browse →") → drill into sub-tabs. One shared component.
- **Listings (drilled in):** breadcrumb + visible sub-tabs + facet cuts
  [New][Brand][Price][House] + dense grid.
- **Watchlists dispatch:** purpose + **★ My Watchbox** pinned (counts · View ·
  Plan) + dossier rows (📂 name · count) + Shared-with-me + **[+ Start a list]** CTA
  with hint.
- **Dossier list (keystone):** breadcrumb + [Screen][Share][⋯]; stacked blocks —
  ▸ Reference guide · ▸ Saved search (live, N new) · ▸ Live listings · ▸ Sold comps
  (range) · ▸ Shortlist (★) · ▸ Articles · ▸ Notes.
- **Watchbox = hub:** Owned│Wishlist│Sold + [View] [Reflect → coach] [Plan → room].
- **Collecting dispatch:** purpose + **EXPLORE WATCHES** (browse refs by brand ·
  ask-the-corpus chat · recommended · editorial) + **YOUR JOURNEY** (coach · on-
  collecting articles · plan) + **Tools** shelf.
- **Reference drill-down:** References home (teach + brand tiles + popular + search)
  → Brand (model lines) → Model line (story + reference nodes) → Reference leaf
  (existing 5512/5513 page). Breadcrumbs throughout.

## AI prompts (starter shape)
See "The AI spine" above for the three role briefs (RAG / coach / missed-it).

---

# DELIVERABLE 3 — ON EXIT PLAN MODE (action list)

This is the graduation/filing checklist. Executed 2026-05-27 on branch
`ia-redesign-plan-graduation` (docs-only, off `main`), after the crash:
1. **Re-sync this plan** — Phase 0 marked shipped (#612–#621), auction assessment
   marked historical, status updated. ✅
2. **Apply the backlog restructure** (Epics A/B/C + theme tags + clean-close rule)
   to **BUGS.md + ROADMAP**, on a **docs-only branch off `main`**. ✅
3. **Graduate the plan:** write/replace SESSION_HANDOFF; add the **IA Redesign
   epic** to ROADMAP anchored to this doc; candidate durable CLAUDE.md rules
   (clean-close · dispatch-layer-as-shared-component) within budget. ✅
4. **Persist key direction to memory:** the three-speeds spine · the Evernote-/
   dossier keystone · Watchbox noun/verb + planning two-doors · tempo-as-rationale-
   not-label. ✅
5. **Then** push/merge.

---

# REFERENCE — for the build sessions

## Auction-tab assessment (Phase 0 — SHIPPED #612–#621; kept for orientation)
This was the in-flight merge; it has landed. Retained as a map of the auction code
for later phases. The merge touched, in `src/App.js`:
- **Sub-tab pills** `listingsSubTabsJSX` (~3714–3749) — merge/remove the Calendar
  pill into Auctions; **mirror in `mockShellProps.js`** (shells in lockstep).
- **Filter dispatch** `allFiltered` (~2327–2438; the `listingsSubTab==="auctions"`
  branch ~2341) — auctions may become an umbrella covering both views.
- **Content swap** `listingsTabContentJSX` (~3601) — today `calendar ? calendar :
  grid`; becomes a combined surface.
- **Sub-tab values** `LISTINGS_SUB_VALUES` (~449) + URL-sync (~652–704) + popstate
  (~710–746) — coerce stale `?sub=calendar`; **never bump `dial_listings_sub_tab`.**
- **Auction projection** `auctionLotItems` (~1564–1729) merges manual + **bonhams**
  + tracked + auction_lots + loupethis (rightmost wins). `AuctionCalendar`
  (`src/components/AuctionCalendar.js`) consumes `auctions` + `lotCountsByAuctionUrl`
  + `handleOpenSale`.
- **Collision w/ Bonhams:** Bonhams is already merged into `auctionLotItems` +
  fetched + in the SW `JSON_DATA_FILES`. The restructure mainly hits
  pills/dispatch/content JSX — disjoint from Bonhams' data wiring → low conflict IF
  it lands in one session. **Safe order: Bonhams first (done), restructure on top.**
  Never run two App.js editors on the shared tree at once.
- **Risks:** hooks above the `loading`/`loadError` early returns (React #310);
  shells in lockstep + `mockShellProps.js`; pushState/replaceState for sub-tab nav.

## Current IA map (what we're redesigning)
Top tabs (App.js): Home · Listings · Watchlists(`?tab=saved`) ·
Collecting(`?tab=learn`, internal `references`) · Watchbox(avatar-menu-only) ·
Admin. Sub-tabs: **Listings** (`dial_listings_sub_tab`): Live·Auctions·Sold·
Calendar · **Watchlists** (`dial_watch_top_tab`): Lists·Searches (+ hidden legacy
keys) · **Collecting** (`dial_references_sub_tab`): Editorial·References·Screening·
Challenges·Size·Links. "My stuff" = 5+ concepts over 3 storage models
(watchlist_items hearts; collections custom/wishlist/owned/sold; saved_searches),
mounted 2–3 places each. Screening (ListReviewMode), Search-all (SearchResultsView),
share/challenge/list receivers = overlay surfaces, not tabs.

## Migration landmines
- **React #310:** no hooks after early returns; new surfaces in self-contained
  components App.js mounts unconditionally.
- **Shells in lockstep:** any `shellProps` field in MobileShell + DesktopShell +
  `mockShellProps.js`.
- **Nav = pushState, cleanup = replaceState**; query params only, no router; keep
  legacy `?tab=`/`?sub=` redirects (URL_TAB_TO_INTERNAL).
- **Never bump frozen storage keys:** `dial_watch_top_tab`, `dial_listings_sub_tab`,
  `dial_references_sub_tab`, `dial_collections_sub_tab`, `LEGACY_WATCHLIST_KEY`,
  `LEGACY_HIDDEN_KEY`, `dial_watch_anon_id`.
- **Cross-surface consistency = shared abstraction**; fix the root, resist band-aids.

## Related logged threads / memories
B-08 (unify Watchlists), B-06 (post-screening), B-14 (BRAND voice),
chrome-unification, card-design-system, collecting-intelligence direction,
RECOMMENDER_STRATEGY (slow-speed taste), reference-page-design (the node graph),
reference_synthesis_outputs + anthropic_api_config (RAG corpus),
feedback_reaction_context_lives_in_lists, feedback_reference_voice_intrinsic.
