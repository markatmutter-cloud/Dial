# Watchlist — Session Handoff (2026-05-24, bug-workflow + card-system session)

For working conventions, see [CLAUDE.md](CLAUDE.md). For roadmap, see
[ROADMAP.md](ROADMAP.md). Durable rules graduate to CLAUDE.md; direction to
ROADMAP; ship events to SHIPPED. This is the in-flight snapshot.

> Later session of 2026-05-24. Earlier today: scrape-reliability + doc-system
> reset + listings-split (archived as
> `archive/SESSION_HANDOFF_2026-05-24-*.md`). This session = the bug-backlog
> workflow, a big UI/chrome bug-fix batch, and the unified card design system.

## TL;DR

Three threads, all shipped:
1. **Bug-backlog workflow** — `BUGS.md` is now the durable home for issues Mark
   spots while using the app, with `Bug:` / `Plan:` prefixes; `/start` surfaces
   open bugs. (#543) Plus a CLAUDE.md **cross-surface consistency** rule (#553).
2. **UI/chrome bug batch (B-01…B-13)** — sticky main tabs, olive+sticky Home
   band, the long-recurring desktop "divider gap" killed at the root, Search-all
   returning articles, editorial filter no longer squashed, screening + catalog
   polish. All in SHIPPED (2026-05-24 entries).
3. **Unified card design system, S1–S4** — `CardShell` + `CardStrip`. Every
   priced card, all strips, the article strip, and Collections article grids now
   render through one shared primitive. **18 PRs merged this session.**

## ⭐ NEXT FOCUS — the design-uplift pass

Mark explicitly wants this ("now that they work, make them sing"). It's also
where the **editorial card** gets resolved. The pass covers:
- **Editorial card standardization** — the magazine `ArticleCard` is the one
  *deliberate* card-system exception (floats on page, 16/10, **serif** title).
  Decide **serif-vs-sans** + whether it converges to the standard card. The one
  real remaining dup is its 2nd portal-menu impl (extract a shared CardMenu if
  not converging). See [[project-card-design-system]].
- **Mark's 5-version taxonomy** wired as `CardShell` `context` modes —
  editorial / standard grid / standard + small horizontal slide / full-page
  width — plus the **compact ↔ breathing-space (brand impact)** dial. Tokens →
  DESIGN_SYSTEM.md.
- **BRAND.md review (B-14)** — voice + visual brand expression; pairs with the
  breathing/brand dial.

## Carried-forward queue (all in BUGS.md / memory)

| Item | Notes |
|---|---|
| **Design-uplift pass** | See NEXT FOCUS. The headline next item. |
| **B-06 — post-screening flow** | Plan-mode, **HIGH** — Mark unhappy with it (results / rescreen / share / who-liked-what). |
| **B-08 — unify Watchlists tab** | Plan-mode — one sectioned screen (cards mobile / width desktop), absorb Watchbox. |
| **Chrome unification** | Now **low priority** — its symptoms (B-01/B-03/B-11) were all fixed with contained fixes. Pure architecture for later. [[project-chrome-unification]] |
| **listings split Phase 2** | From the earlier session — drop the duplicated listings.json once PWA bundles cycled. |
| Carried | Mobile Sale filter chip (parity) · reference-page pilot (Epic 0; Mark has `docs/ref_5512_5513_inventory.md` started). |

## Notes worth keeping

- **Card system shape:** `CardShell` = image + L1/L2/L3 text slots + action
  stack + the single portal menu; consumers compute slots + pass `renderCard`.
  `CardStrip` = the shared horizontal scroll+tile. `Card.js` keeps ALL its
  price/FX/auction logic and just fills CardShell's slots. `articleAsListing`
  is now exported from `EditorialView`.
- **Previews work via the direct branch URL** (`watchlist-git-<branch>-…
  .vercel.app`) — hand Mark that link; the Vercel UI errors for him. This
  unblocked the eyeball loop for the whole card-system migration.
- **Big mechanical edits** (the 639-line Card.js fold): a 370-line exact-match
  Edit is too fragile — use a Python **line-range** replacement instead. And do
  NOT `.encode().decode("unicode_escape")` on literal-UTF-8 strings (it mangles
  ·/→/↓). Both bit me; both recoverable.
- Two feedback memories landed this session: **don't push wrapping**
  ([[feedback-dont-push-wrapping]]) and **take on heavy lifts**
  ([[feedback-take-on-heavy-lifts]]). Mark drove the card-system architecture —
  a maturity moment logged in LEARNING.md.

## Bottom line

Clean. All 18 PRs **merged**; **no open PRs, no stranded branches**. Working
tree clean except an untracked `docs/ref_5512_5513_inventory.md` (Mark's
reference-page work — left alone). Card system S1–S4 live; editorial + the
design pass are the next session's headline.
