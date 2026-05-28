# Watchlist — Session Handoff (2026-05-27, Phase 1 / B-08 build + polish marathon)

Conventions: [CLAUDE.md](CLAUDE.md). Direction: [ROADMAP.md](ROADMAP.md).
History: [SHIPPED.md](SHIPPED.md). Backlog: [BUGS.md](BUGS.md). IA brief:
[docs/IA_REDESIGN.md](docs/IA_REDESIGN.md); dossier spec:
[docs/WATCHLISTS_DOSSIER_SPEC.md](docs/WATCHLISTS_DOSSIER_SPEC.md). Prior
(IA-build-marathon) handoff superseded — recoverable via git (commit 86b072c).

## TL;DR — Phase 1 keystone shipped + a long live-polish iteration
Built **B-08 — the unified Watchlists tab** (the *real* Phase 1: Lists + Searches
collapsed into one rich single-scroll landing), then iterated hard on look-and-feel
with Mark live-testing. **7 PRs merged (#638–#644), all in `main`, CI green, no open PRs.**

## What shipped (all merged to main)
- **#638 — B-08 unified Watchlists landing.** One scroll, no sub-tabs: Watchbox
  anchor · unified Saved (All/Watches/Articles/Sold/Auctions filter) · cover-image
  list cards · Saved searches section · Shared. Pills retired; legacy `?sub=` coerced
  to the landing; `useSearches` already in App (no #310 risk). `WatchlistTab` kept as a
  (now-unused) rollback hatch.
- **#639–#644 — landing polish:** magazine look-and-feel · article-style list cards
  (borderless, 16/10 cover, kicker, serif title) · favicon image fallback (**B-38**) ·
  Watchbox demoted to a **slim link** with hearted/Saved leading · bigger tiles ·
  distinct in-list header (tinted banner + breadcrumb + count) · **drill-in back-nav
  fix** (was replaceState-not-pushState on first drill-in) · list **rename/delete**
  (⋯ on cards + in-list) · hearted **"♡ Saved" filter chip** at top of listgrid ·
  Saved band rebuilt on the **shared `CardStrip` + `Card`** (standard size, like Home).
- **Docs recovery:** the prior session's SHIPPED entries (Epic 9 / IA redesign) were
  stranded in unmerged commit 86b072c — recovered into `main`'s SHIPPED this close.

## ⭐ NEXT PICKUP — remaining Watchlists work (Mark's priority order)
**List mgmt:** 1) **share-modal refresh** (→ brand green, easier flow — Mark flagged it
dated/blue) · 2) **empty-list onboarding** (+Listings/+Articles block kinds · title-seeded
`+` suggestions) · 3) **note save-state** affordance (clear "saved" signal on dossier notes).
**Other Watchlists/dossier:** Watchbox **page echoes the landing** (slow-speed surface) ·
**promote-a-hero cover** (user picks a list's cover — needs one small additive `collections`
migration) · **exciting signed-out state + deletable 5512/13 starter** · **B-37: heart from
article + reference pages** (the dossier's input side; explored, branch not built).
**Parked (later):** conversational **concierge AI** (Mark's DB4/RailMaster pulse → Phase 3,
voice in memory [[watchlists-pulse]]) · **dossier collaboration** (attribution/edit — Mark:
fine for now) · better saved-search UI · revolving recently-hearted hero.

## Bigger picture (ROADMAP/BUGS, untouched today)
Phase 2 (dispatch layers · de-junk Collecting · tools shelf) · Phase 3 (AI spine: RAG /
coach / missed-it · two-door planning · recommender) · reference-browse polish · Epic B
platform-health (B-16/18/19/20/22/27/34) · Epic C auctions (B-23/24/25/28) · one-offs
(B-26 grid leak · B-29 Sold→Auctions · B-31 strip alignment).

## Process notes / loose ends
- **Branch discipline (lesson):** I orphaned pass-3 by pushing follow-ups onto an
  already-merged PR branch (recovered as #641 via re-branch off `main` + cherry-pick).
  Rule reinforced: **branch fresh off `main` per pass; never push onto a branch whose PR
  may already be merged.** Mark merges fast — sequence: build → push ready → he merges → re-branch.
- **`FB:` prefix (new, in memory):** Mark's design-review burst marker = **hold, don't
  react/repivot until he says go**; stronger than `FYI`. Saved to [[feedback_message_prefixes]].
- **Serif vs sans rule:** serif = editorial *reading* (articles, reference pages); sans =
  functional/UI (Listings, Watchlists, filters). Recorded in DESIGN_SYSTEM.
- **Stranded local branches to delete** (all merged or dead): `watchlists-navfeel` (#642),
  `lists-rename-delete` (#643), `saved-band-cardstrip` (#644), `session-close-2026-05-27-ia-build`
  (holds the recovered-from 86b072c), `session-close-2026-05-27`, `session-handoff-next`.
  Pre-existing non-session: `bk-bonhams-curlcffi-*`, `fix-screening-auction-copy-b02`.

## Bottom line
Phase 1's keystone (the unified, polished Watchlists tab) is live and CI-green. Visual
polish is the recurring gap — best done with Mark live (the tab is auth-gated, so he
merges-to-see; the preview loop is slow). Next: the list-mgmt trio, then the dossier
input side (B-37) and the AI spine.
