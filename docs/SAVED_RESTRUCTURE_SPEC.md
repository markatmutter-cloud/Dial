# Saved restructure — spec

**Status:** Spec / design (no code touched). Written 2026-07-30 at Mark's
request ("spec the whole restructure first, before any code, so we build it in
one coherent pass"). Sub-phase of **IA_REDESIGN.md Phase 1** — it sharpens the
"dissolve the save-tangle" keystone rather than fighting it (see §7). Build
happens in a later session against this doc.

---

## 1. The trigger — a real filter gap

In **Saved › Watches** you can see every hearted watch but can't cut them by
**brand / seller / price** the way the main Watches grid lets you. Confirmed in
code, and it's narrower than "no filters at all":

- The surface is **`HeartedView`** (`src/components/HeartedView.js`), the landing
  of the Saved tab's internal `hearted` sub-tab.
- App.js mounts it with **`activeFiltersStripJSX`** (`App.js:4282`) — the
  *applied-filters strip* (`ActiveFiltersStrip`): it shows and clears filters
  that are **already set**, but it is **not** the facet bar that *sets*
  brand / source / price / new.
- The facet filter bar is bound to the **listings (Watches) surface**, not the
  Saved surface. So Saved gets a strip with nothing to populate it.
- `HeartedView` adds only its own **type toggle** (Watches · Articles · Guides,
  `HeartedView.js:47–56`).

**Conclusion:** the fix isn't "bolt a filter bar onto `HeartedView`." It's that
saved watches should live **on the Watches surface** and inherit the *same*
facet bar + grid. That is exactly Mark's proposed restructure, and it aligns
with CLAUDE.md's rule — *divergence is the bug; fix the root, don't band-aid the
surface.*

---

## 2. Target IA

**Watches tab** (internal `listings`) — sub-tabs become:

| Sub-tab | Internal value | Holds |
|---|---|---|
| Available | `live` | dealer listings (today's default) |
| Auction | `auctions` | live/upcoming auction lots |
| Sold | `sold` | sold listings + auction results |
| **Saved** *(new)* | `saved` | every hearted **watch**, across the three above, using the **same facet bar + grid + layout** |

**Saved top tab** (internal `watchlist`) → **repurposed** to the composed-lists
home. Recommended label **"Shared"** (see §6 — avoids re-colliding with the
"Lists" sub-tab). What it holds after the move: Lists · Wishlist · Owned · Sold ·
Challenges · shared-with-me inbox. The raw `hearted` and `searches` sub-tabs
leave.

**Saved searches** → move into the **search bar** area (`StandardSearchInput`),
not a standalone sub-tab.

**Saved articles** → no separate Saved view; the **heart in the Articles tab**
persists them, with a "show hearted only" toggle on that tab.

**Top-right heart** (`SavedHeartLink`) → navigates to **Watches › Saved** (today
it opens the Saved tab's `hearted` sub).

---

## 3. Per-surface changes (with code anchors)

**A. Watches › Saved sub-tab — the core fix.**
- Add `"saved"` to `LISTINGS_SUB_VALUES` (`App.js:463`). Additive — safe;
  `dial_listings_sub_tab` is **never bumped**, stale `?sub=` values already
  coerce to `live` (`App.js:476, 746`).
- New sub-tab pill in `listingsSubTabsJSX` — **mirror in `mockShellProps.js`**
  (shells move in lockstep).
- Content: the hearted-watch set fed through the **existing `allFiltered`**
  filter dispatch so it reuses brand/source/price/new + sort for free. Prefer
  reusing `listingsGridJSX` (`App.js:3984`) over a second grid path.
- Reuse the hearted-watch selector `HeartedView` feeds today (`items` =
  hearted, `kind!=='article'`). Watches-only here (articles/guides handled
  elsewhere — see open Q4).

**B. Top-right heart retarget.** `SavedHeartLink` `onGo` (`SavedHeartLink.js:8`)
— point at `?tab=listings&sub=saved` instead of the Saved tab. `pushState` (nav,
not cleanup).

**C. Saved searches → search bar.** Today surfaced as `savedSearches={userSearches}`
(`App.js:5104`) inside the `watchlist` tab's `searches` sub, managed via
`AddSearchModal` / `FavSearchModal`. Relocate the **list + run** affordance onto
`StandardSearchInput`; keep **management** (add/edit/remove — `startAddSearch`,
`commitSearch`, `removeSearch`) reachable from there. Own mini-design — see Q3.

**D. Articles heart toggle.** Hearted articles surface today via `HeartedView`'s
Articles type *and* flow through listing tables (`articleAsListing`). After the
move, the **Articles tab** owns them: heart persists + a "hearted only" filter.
Drop the Articles type from the saved surface.

**E. Repurpose the Saved top tab.** Label in **`src/topTabs.js`** only (one
source of truth; internal key stays `watchlist`). Remove the now-empty `hearted`
and `searches` entries from `SUB_VALUES` (`App.js:391`). **Do this LAST**, after
A–D have moved its contents out, so the tab is never half-empty mid-ship.

---

## 4. Staging (each ships independently, app stays coherent)

- **S1 — Watches › Saved sub-tab** (§3A). The direct fix for the filter gap.
  The old Saved › Watches view stays temporarily redundant — acceptable, or hide
  its Watches type in the same PR.
- **S2 — Retarget the top-right heart** (§3B).
- **S3 — Saved searches → search bar** (§3C).
- **S4 — Articles heart toggle**; drop Saved › Articles (§3D).
- **S5 — Rename/repurpose the Saved top tab** (§3E). Last.

Each = its own branch/PR (Mark merges fast; no follow-up commits onto an open
PR).

---

## 5. Migration landmines (from IA_REDESIGN.md)

- **React #310** — no hooks after the `loading`/`loadError` early returns. New
  surfaces go in self-contained components App.js mounts unconditionally.
- **Shells in lockstep** — any `shellProps` field in `MobileShell` **and**
  `DesktopShell` **and** `mockShellProps.js`.
- **Nav = pushState, cleanup = replaceState**; query params only, no router;
  keep legacy `?tab=`/`?sub=` redirects.
- **Never bump frozen storage keys:** `dial_watch_top_tab`,
  `dial_listings_sub_tab`, `dial_collections_sub_tab`, `LEGACY_WATCHLIST_KEY`,
  `LEGACY_HIDDEN_KEY`, `dial_watch_anon_id`.
- **Hearted-visibility snapshot** — the un-hearted-stays-visible-until-sub-tab-
  change logic currently keys off `watchTopTab` (`App.js:634–651`). Moving the
  hearted grid under `listings` means that capture must **follow the grid** (key
  off the new `listings/saved` surface) or the Saved sub-tab loses the "un-heart
  without the card vanishing" behaviour. Verify at build.
- **Tests** — new `shellProps` field → `mockShellProps.js`; the shell tests
  render mock grids, so give the Saved-under-Watches path a direct render test
  if it introduces a new leaf.

---

## 6. Naming decision — reversing a recent rename

The Saved top tab was **renamed Lists → "Saved" on 2026-06-03** specifically to
kill a **Lists/Lists collision** (a "Lists" top tab over a "Lists" sub-tab) —
see the comment at `topTabs.js:16–18`. Swinging the label back to **"Lists"**
risks reintroducing it. Once hearts + searches move out, what remains really is
composed lists + wishlist/owned/sold/challenges/shared —

**Recommendation: "Shared"** (or keep it a neutral collections home), not
"Lists." Mark's call — see Q1.

---

## 7. Relationship to the locked Phase 1 (dossier) plan

This **sharpens** the keystone, doesn't fork it. IA_REDESIGN.md's Phase 1 wants
hearts / searches / articles to **stop being scattered destinations** and become
*ingredients composed inside a list*. Moving raw hearts onto the Watches surface
and saved-searches into the search bar does exactly that cleanup — leaving the
repurposed tab free to be the **composed-lists / dossier home**. The one framing
change to confirm with Mark: the **"Saved umbrella" dissolves** (the June-3
rationale that hearts+lists+searches are "all things you saved" no longer drives
the top tab).

---

## 8. Open questions for Mark

1. **Repurposed-tab label:** "Shared" (rec) · "Lists" · keep "Saved" as the pure
   lists home?
2. **Auction sub-tab:** "watches available to sell at auction" = the existing
   **Auction** (buy-at-auction) sub-tab, right? Confirming there's no new
   *sell-side* surface implied.
3. **Saved searches in the search bar:** a dropdown on the search input, or a
   dedicated saved-searches panel? And where does **management** (rename/delete/
   add) live once the `searches` sub-tab is gone?
4. **Hearted reference guides:** the plan covers articles (→ Articles tab) but
   not hearted **Guides** (today the third type in `HeartedView`). Do they get a
   "hearted only" toggle on the Reference Guides tab, mirroring articles? Or stay
   somewhere in the repurposed tab?
