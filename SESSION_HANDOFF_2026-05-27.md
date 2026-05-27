# Watchlist — Session Handoff (2026-05-27, IA redesign plan graduated)

Conventions: [CLAUDE.md](CLAUDE.md). Direction: [ROADMAP.md](ROADMAP.md).
History: [SHIPPED.md](SHIPPED.md). Backlog: [BUGS.md](BUGS.md). **IA build brief:
[docs/IA_REDESIGN.md](docs/IA_REDESIGN.md).** Prior handoff (screening collapse +
auction redesign) archived to
`archive/SESSION_HANDOFF_2026-05-27-screening-auction.md`.

## TL;DR — the IA/UX redesign plan is now filed + official
A plan-mode thinking session designed the site's IA/UX redesign, but a terminal
crash lost the plan-mode buffer before it could be filed. Mark re-pasted the plan
+ transcript; this session **graduated it into the doc system** (Deliverable 3 of
the plan). Branch `ia-redesign-plan-graduation` (docs-only, off `main`) — **no app
code touched**.

## What landed this session (all docs)
- **`docs/IA_REDESIGN.md`** — the canonical plan, saved verbatim (three-speeds
  model, dossier keystone, Watchbox/planning resolution, dispatch layer, reference
  drill-down, wireframes, AI prompts, phases, migration landmines). This is the
  build brief for the next sessions.
- **BUGS.md** — flat `B-NN` list restructured into **Epic A (IA/UX: B-06, B-08,
  B-14) · Epic B (Platform Health: B-16, B-18, B-19, B-20, B-22, B-27) · Epic C
  (Auctions & Scraping: B-23, B-24, B-25) · One-off (B-26)**, + the **clean-close
  rule** at the top.
- **ROADMAP.md** — added **Epic 9: IA / UX redesign** + a priority-intro paragraph
  anchoring it to the doc.
- **CLAUDE.md** — added the **clean-close rule** (Close protocol) + a
  dispatch-layer clause on the existing cross-surface-consistency rule. (2438 →
  still well under budget.)
- **Memory** — 4 new files: `project_ia_redesign`, `project_watchlists_dossier_keystone`,
  `project_watchbox_planning`, `feedback_tempo_not_label` (+ MEMORY.md index).

## The model (one screen)
Organize the 3 tabs by **tempo, not data type** (tempo = rationale, never a UI
label — tabs stay nouns):
- **Listings (fast)** — encounter the market: one dense grid, cut by new/price/brand/house.
- **Watchlists (medium)** — the "living dossier" keystone (lists mixing ref guide +
  live saved search + listings + comps + shortlist + articles + notes); Watchbox =
  elevated anchor list. Learning tool, not a shopping cart.
- **Collecting (slow)** — explore-watches + develop-as-a-collector, AI spine (RAG ·
  coach · missed-it); Brand › Model › Reference drill-down above the 5512/5513 leaf.
- **Dispatch layer** (one shared component) on every tab = the clarity mechanism.
  **Planning** = one experience, two doors. **Screening** = a mode, not a tab.

## ⭐ NEXT PICKUP — Phase 1: Watchlists living dossier (the keystone)
Phase 0 (Listings/auctions restructure + Bonhams) shipped #612–621. The next build
is **Phase 1**, the only genuinely-new capability:
- **1a — spec + data model** (start here): the dossier = ordered typed sections
  (reference guide · live saved search · live listings · sold comps · shortlist ·
  articles · notes). Map each to existing storage (`watchlist_items`,
  `collection_items`, `saved_searches`, editorial) + the ONE new type (free-text
  notes → new column/table). Decide the live-saved-search re-run mechanism.
- **1b** dossier container UI · **1c** Watchbox anchor · **1d** notes.
Sequencing principle: build the capability before the dispatch layer that advertises
it. See docs/IA_REDESIGN.md for wireframes + the full phase plan.

## Knock-off-before-the-build (from the plan's priority)
Cheap correctness/hygiene wins, independent + low-risk: **B-18** FX drift · **B-26**
grid leak · **B-20** scraper rename. Defer **B-22** code-split (don't optimize App.js
you're about to rewrite) + **B-16** JS lockfile (needs a Node env) to after.

## Open state
- This branch is **docs-only, not yet pushed/merged.** Per the plan, push/merge is
  the last Deliverable-3 step — confirm with Mark before pushing.
- Auction cover-image scraping for the remaining 5 houses is still open (Christie's
  shipped #619; merge.py plumbing done) — see ROADMAP NEXT #6.
- Other carried threads unchanged: B-25 launchd install, Heritage API, Phillips essays.

## Bottom line
The IA/UX redesign is no longer trapped in a lost plan-mode buffer — it's a
canonical doc, a ROADMAP epic, an organized backlog, and memory. Next real work:
Phase 1a (the Watchlists dossier data model). Push the docs branch when Mark's ready.
