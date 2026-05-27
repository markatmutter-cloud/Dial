# Watchlists Living Dossier — Phase 1a spec + data model

**Status:** Spec locked 2026-05-27 (design only, no UI). Phase 1 of the IA redesign
([docs/IA_REDESIGN.md](IA_REDESIGN.md)) — the keystone, the only genuinely-new
capability. This doc is the build brief for 1b–1d.

## The model
A **dossier = a normal custom list (`collections.type = 'free-form'`) that renders
typed sections.** No new collection type — every free-form list gains the ability;
sections with no content simply don't render. (Avoids touching the
`collections_type_check` CHECK constraint — see "What is NOT changing".)

Sections split into two groups:

| Section | Stored or derived | Where it comes from |
|---|---|---|
| **Reference guide** | derived | the reference node page for the list's matched reference |
| **Live listings** | derived | current `listings_live` filtered to the matched reference |
| **Sold comps** | derived | sold archive + auction lots for the matched reference (range + count) |
| **Shortlist** | stored | `collection_items` flagged `is_pick = true` (reuse the existing challenge flag) |
| **Articles** | stored | `collection_items` with `listing_snapshot.kind = 'article'` (already works via `articleAsListing()`) |
| **Hearted listings** | stored | `collection_items` (existing) |
| **Notes** | stored | NEW: single free-text field per list |

The derived sections are generated **live each time the list opens** — point a list at
a reference and "live listings / sold comps / reference guide" fill themselves from data
we already have; reopen tomorrow and they've refreshed.

## The anchor = the list's TITLE (Mark's decision)
No separate reference picker. The list **title** is the anchor: run the existing
reference matcher against `collections.name` to derive a `reference_id`.
- Match (e.g. "Submariner 5513", "Tudor Sub") → the derived sections populate for that
  reference / model line.
- No match (e.g. "Gifts for J") → derived sections stay hidden; the list is just its
  stored items + notes. Graceful, no mode switch.
- Recomputed on **rename**; the user can clear/override the match later (post-MVP).

**Open implementation question (1b):** the matcher is Python today (`merge.py` +
`reference_index_match.py`, fills `reference_id`/`model`/`model_line`). The dossier needs
title→`reference_id` resolution on the client. Options: (a) a small JS lookup against a
published reference index JSON; (b) a `security definer` RPC wrapping the match; (c)
resolve server-side and cache. Decide in 1b. Until then, the cached `reference_id` can be
set by any path that already runs the matcher.

## New storage — additive only, no CHECK change
On `public.collections` (both nullable):
- **`reference_id`** (text, nullable) — cached match from the title; drives the derived
  sections. Null = unanchored list (derived sections hidden).
- **`notes`** (text, nullable) — the single free-text notes field.

Reused, no migration:
- **Shortlist** → existing `collection_items.is_pick` (+ optional `reasoning`).
- **Articles / listings** → existing `collection_items` + `listing_snapshot`.
- **Derived sections** → no storage; computed from `reference_id` against existing feeds
  (`listings_live.json`, sold archive, `auction_lots.json`).

Migration sketch (apply before the JS that reads it — CLAUDE.md):
```sql
alter table public.collections
  add column if not exists reference_id text,
  add column if not exists notes text;
```
RLS: inherited — both columns live on `collections`, already owner-gated; no new policy.

## Live-saved-search mechanism (resolved)
"Live" = **re-run on open.** The title-derived `reference_id` filters the current feeds
each time the list is opened. **"N new since last visit"** is deferred — it needs a
per-list seen-watermark (`last_opened_at`), a later add, not MVP.

## What is NOT changing (deliberate)
- **No new `collections.type` value.** A dossier is an emergent capability of a free-form
  list, not a type. This sidesteps the `collections_type_check` audit (values today:
  free-form · shared-inbox · challenge · watchbox · owned · sold · wishlist · auction).
- `collection_items` shape unchanged (the `listing_id IS NOT NULL OR is_manual` constraint
  still holds — every stored item is listing-backed or an article snapshot).
- Hearts (`watchlist_items`), saved searches (`saved_searches`) unchanged.

## Section order (1b)
Fixed canonical order, render only non-empty sections: reference guide → live listings →
sold comps → shortlist → articles → hearted listings → notes. No generic ordering table
in MVP.

## Build steps after this spec
- **1b** — dossier container UI: render the typed sections (compose the *existing* types
  first — listings + articles + shortlist + the derived live/sold sections); resolve the
  title→reference matching path. Ship without notes.
- **1c** — Watchbox as the elevated anchor list ([[project_watchbox_planning]]).
- **1d** — notes (the `notes` column wired to an editor).
