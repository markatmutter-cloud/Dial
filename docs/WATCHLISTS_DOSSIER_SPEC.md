# Watchlists Living Dossier — Phase 1a spec + data model

**Status:** Spec locked 2026-05-27 (design only, no UI). **Revised same day** after
Mark's correction: a dossier is **user-composed from free-order blocks** — the app does
**NOT** read the title or recommend/derive any content. Phase 1 of the IA redesign
([docs/IA_REDESIGN.md](IA_REDESIGN.md)) — the keystone, the only genuinely-new capability.
This doc is the build brief for 1b–1c.

## The model
A **dossier = a custom list (`collections.type = 'free-form'`) the user composes from
ordered blocks** (Notion-style). The user explicitly **adds and configures** each
component and arranges them in any order. The app does nothing automatic — no
title-matching, no recommendations, no auto-fill.

The **title is just a name** ("dive watches", "Submariner", "Tudor Submariner", "Rolex
5512" — anything). It carries no behaviour.

### Block kinds (each = a component the user adds)
| Block | What it shows | Backed by (storage) |
|---|---|---|
| **saved_search** | a live horizontal preview of the latest results for an attached favourite search, expandable to grid; re-runs on open | a `saved_searches` row (existing) |
| **saved_items** | the live/sold listings saved to this list — horizontal, expandable to grid | `collection_items` (existing) |
| **articles** | saved articles | `collection_items` where `listing_snapshot.kind = 'article'` (existing) |
| **reference_guide** | a card linking to a reference node page | a reference node id (the `referencePages` registry / the reference tree being built) |
| **note** | free text the user types | the block row itself (`note_text`) |

Example (Mark's): a list titled **"dive watches"** holds a **saved_search** block for
*submariner, seamaster, fifty fathoms* (live preview of latest hits) + a **saved_items**
block of the watches added to the list (horizontal, expandable to grid).

### Block order — sensible default, user-reorderable
New blocks get a **default starting order**, and the user can **reorder** them freely
(the `position` column). Order is first-class because different lists want different tops:
a *shortlist-to-buy* list wants **listings on top**; a *learn-about-a-reference* list
wants **articles + sold comps on top** for price context — same blocks, different order.
MVP = one default order + drag-to-reorder; per-intent default presets could come later.

## New storage — ONE new table; nothing existing changes
The only new storage is the **composition layer**: which blocks a list has, in what
order, and what each points at.

```sql
create table public.collection_blocks (
  id              uuid primary key default gen_random_uuid(),
  collection_id   uuid not null references public.collections(id) on delete cascade,
  position        integer not null,                 -- free arrangement within the list
  kind            text not null check (kind in
                    ('saved_search','saved_items','articles','reference_guide','note')),
  saved_search_id uuid references public.saved_searches(id) on delete cascade, -- kind=saved_search
  reference_id    text,                              -- kind=reference_guide (node id)
  note_text       text,                              -- kind=note
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index on public.collection_blocks (collection_id, position);
```
- **`collections`, `collection_items`, `saved_searches` — UNCHANGED.** No `reference_id`
  or `notes` column on `collections` (the earlier title-anchor idea is dropped: notes are
  blocks, reference guides are blocks).
- **No new `collections.type` value** — a dossier is an emergent capability of a
  `free-form` list, so the `collections_type_check` constraint is untouched.
- **RLS:** mirror the existing `collection_items` policies exactly (owner + accepted
  collaborators CRUD via the parent collection's ownership). Per CLAUDE.md, match the
  role scoping of the sibling policies — don't add `to authenticated` unless they do.

## Live-search mechanism (resolved)
A `saved_search` block is **live = re-run on open**: it runs the attached search against
the current feeds each time the list opens and shows the latest N as a horizontal
preview (expandable to grid), reusing the Listings-tab filter (`runSearch`).
**"N new since last visit"** is deferred — needs a per-block/-list seen-watermark.

## Why this shape
- "Add whatever component (configured) as needed, in any order" → a **polymorphic blocks
  table with `position`** is the natural fit.
- It **reuses every existing store** (items, searches, reference nodes) and only adds the
  ordering/composition layer on top → low risk, no touch to existing tables or CHECK
  constraints.

## Relationship to the AI layer (Phase 3 — engages, never auto-composes)
Composition is **manual** — the user builds the list; the app never auto-fills blocks.
**Separately**, the Phase 3 AI layer **reads the list as a signal** to *offer* (never
insert): e.g. "looks like you're building icons of 1960s dive watches — want other
suggestions?", "did you see this listing?", "had you thought about this reference?",
"want to learn more about the 5512?". The user decides whether to add. So a dossier is
both a composition tool **and** a rich context source for the coach / missed-it / RAG
bots (Epic 7's "lists as semantic signals"). This resolves the tension with "the app
doesn't recommend the content": it doesn't *compose* the list — it *suggests around*
what you've composed.

## Open implementation questions (for 1b)
- **saved_items / articles blocks:** MVP = one each per list, rendering all the list's
  listing/article items. Multiple filtered item-blocks → later.
- **reference_guide `reference_id`:** points at a reference node id; ties into the
  Brand › Model line › Reference tree being built (see IA_REDESIGN "Reference structure").
- **Reorder UX:** drag handles vs up/down — a 1b UI call.

## Build steps after this spec
- **1b — dossier container UI:** render a list's blocks in `position` order; add / remove /
  reorder blocks; the `saved_search` live preview; the `saved_items` + `articles` grids;
  the `note` editor; the `reference_guide` card. (Notes ship here as a block kind — the old
  separate "1d notes" step folds in.)
- **1c — Watchbox as the elevated anchor list** ([[project_watchbox_planning]]).
