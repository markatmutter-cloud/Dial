# Session handoff — 2026-07-30

**One-line:** A short spec-only session from mobile. Diagnosed the Saved ›
Watches filter gap and wrote a build-ready spec for Mark's Saved-restructure
idea. **No code shipped.** Mark is continuing the same work on Claude Code
desktop — this handoff hands it over.

## What happened
- **Diagnosed the filter gap** (Mark's report: can't filter saved watches by
  brand/seller/price). Root cause confirmed in code: Saved › Watches is
  `HeartedView`, mounted with `activeFiltersStripJSX` — the *applied-filters
  strip* (`App.js:4282`), which shows/clears filters already set but is **not**
  the facet bar (brand/source/price/new) the main Watches grid renders. The
  facet bar is bound to the listings surface, not the saved surface. So the fix
  is to move saved watches **onto** the Watches surface, not bolt a bar onto
  `HeartedView` (root fix vs band-aid).
- **Wrote `docs/SAVED_RESTRUCTURE_SPEC.md`** — full spec for the restructure:
  new **Watches › Saved** sub-tab (`live·auctions·sold·saved`) inheriting the
  facet bar; repurpose the Saved top tab to the composed-lists home; saved
  searches → search bar; article/guide saves → their own tabs; top-right heart
  → Watches › Saved. Staged into 5 shippable sub-phases (S1 = the filter fix).
  Framed as a sub-phase of **IA_REDESIGN.md Phase 1** (it sharpens the
  dissolve-the-save-tangle keystone, doesn't fork it).

## ⚠️ Where it lives — NOT on main
The spec is on branch **`claude/local-watchlist-access-q3o1ez`**, open as **draft
PR #913** (https://github.com/markatmutter-cloud/watchlist/pull/913). `main` does
NOT have `docs/SAVED_RESTRUCTURE_SPEC.md`. The desktop session should check out
that branch / read the PR to pick up the spec.

## BLOCKED ON MARK — 4 open questions (in the spec's §8)
1. **Repurposed-tab label:** "Shared" (my rec — reversing the 2026-06-03
   Lists→Saved rename risks re-colliding with the Lists sub-tab) · "Lists" ·
   keep "Saved" as the pure lists home.
2. **Auction sub-tab:** "watches available to sell at auction" = the existing
   buy-at-auction sub-tab, right? No new sell-side surface implied?
3. **Saved searches in the search bar:** dropdown on the input vs. a panel — and
   where does add/edit/delete management live once the Searches sub-tab is gone?
4. **Hearted reference guides:** articles → Articles tab; where do saved *Guides*
   (the third `HeartedView` type) go — a "hearted only" toggle on the Guides
   tab, mirroring articles?

## Next step (desktop session)
Get Mark's 4 answers, then build S1→S5 from the spec in order. S1 (Watches ›
Saved sub-tab inheriting the facet bar) is the standalone fix for the reported
gap and can ship first. Landmines in the spec's §5 — chiefly the frozen storage
keys and the hearted-visibility snapshot (`App.js:634–651`) that must follow the
grid when hearts move under `listings`.

## Clean state
Nothing stranded except the intentional draft PR #913 (the spec, awaiting Mark's
decisions). No code changes. `main` untouched by the spec work.
