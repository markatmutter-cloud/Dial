# Reference Structure — Brand › Model line › Reference (build scope)

**Status:** Scope for Mark's OK (2026-05-27), then build. Pulled forward from Phase 3
([docs/IA_REDESIGN.md](IA_REDESIGN.md)). This is the navigable spine above the single
5512/5513 leaf page; it also gives the dossier's reference-guide block something to link
to. Lives in **Collecting** (`?tab=learn`) under the **References** sub-tab.

## Decisions (locked with Mark 2026-05-27)
- **Only authored pages are clickable destinations.** Today: Rolex › Submariner ›
  5512/5513.
- **Two "coming soon" stub nodes** so the tree is real structure, not one article:
  - Omega › Seamaster 300 › **165.024**  *(Mark wrote "156.024"; reading as a typo for the Seamaster 300's 165.024 — confirm.)*
  - Omega › Railmaster › **CK2914**
- **"Subscribe to unlock"** teaser on the coming-soon pages = a **demand smoke test**
  (records interest; light, not a paywall build).
- The browse tree is built from the **curated node registry**, NOT the full
  `watch_references.md` index (that stays the matcher's job + future expansion).

## Data
- Add a **`status`** field to each reference node: `'live' | 'coming_soon'`.
- Add **two stub node files** under `src/data/referencePages/` — minimal fields only
  (`id`, `brand`, `modelLine`, `refs`, `group`, `hero`/teaser, `status: 'coming_soon'`);
  no synthesis/corpus needed. Register them in `index.js`.
- A small **`buildReferenceTree()`** over `REFERENCE_NODES`: group `brand → modelLine →
  node(s)`. (≈ Rolex › {Submariner › [5512/5513 live]}; Omega › {Seamaster 300 › [165.024
  soon], Railmaster › [CK2914 soon]}.)

## Screens (mobile-first)
1. **References landing / dispatch** — one-line purpose ("what's a reference — start by
   brand") + brand tiles (Rolex, Omega). Consistent with the IA dispatch-layer principle
   (becomes the shared dispatch component later).
2. **Brand page** — that brand's model lines.
3. **Model-line page** — references as node cards: `live` → opens the leaf;
   `coming_soon` → teaser + subscribe-to-unlock.
4. **Reference leaf** — existing `ReferencePage` for live nodes; a "coming soon" teaser
   screen for stubs.
- **Breadcrumbs** at every level (Collecting / References / Rolex / Submariner / 5512) —
  a small new shared `Breadcrumb` component (reusable by the dossier later).

## Routing
- Query params off the References sub-tab:
  `?tab=learn&sub=references&brand=<slug>&model=<slug>&ref=<nodeId>` — the level is
  inferred from which params are present.
- pushState on drill-in, replaceState on cleanup; **query params only, no router**.
- **Never bump `dial_references_sub_tab`**; coerce stale params; keep the legacy
  `?tab=references` redirect.
- **Behaviour change:** default (no params) now lands on the **References landing**, not
  straight on the 5512/5513 leaf as today.

## Smoke test — subscribe-to-unlock
Coming-soon leaf shows a teaser + a "Subscribe to unlock" CTA that **records interest**
(a Supabase row / waitlist email — mechanism decided at build). A demand signal, kept
admin-light. (Connects to job #8 commercial signals.)

## Reuse + migration landmines
- **Reuse:** `ReferencePage` (leaf), `Card`/`CardShell` (node + model-line cards), the
  App.js sub-tab state + URL-sync pattern.
- **New shared:** `Breadcrumb` component.
- **Landmines (CLAUDE.md):** no hooks after the `loading`/`loadError` early returns
  (React #310); if `shellProps` is touched, mirror in both shells + `mockShellProps.js`;
  pushState/replaceState discipline; no `eslint-disable` (CI=true).

## Build steps
1. Tree data: `status` field + 2 stub nodes + `buildReferenceTree()`.
2. `Breadcrumb` component.
3. References landing (brand tiles).
4. Brand + model-line browse screens (node cards).
5. Wire routing + breadcrumbs; default → landing.
6. Coming-soon teaser + subscribe-to-unlock smoke test.

Each step ships behind the existing References sub-tab; the 5512/5513 leaf stays reachable
throughout.

## Out of scope (now)
- Full `watch_references.md` index browse (hundreds of refs) — later, once more pages are
  authored.
- Thin auto-nodes for un-authored refs (Mark chose authored-only).
- Model-line editorial "story" pages beyond a node's existing fields.
