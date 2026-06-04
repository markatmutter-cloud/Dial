# Watchlist — Session Handoff (2026-05-28, UI-polish + pill design-system marathon)

Conventions: [CLAUDE.md](CLAUDE.md). Direction: [ROADMAP.md](ROADMAP.md).
History: [SHIPPED.md](SHIPPED.md). Backlog: [BUGS.md](BUGS.md). Prior handoff
(2026-05-28, performance / load-speed marathon) superseded — recoverable via git.

## TL;DR
A long live session driven by Mark testing the site and firing tweaks. **13 PRs
(#655–#667), all merged, CI green, working tree clean, no open PRs.** Two streams:
(1) a proper **pill/button design-system migration to olive** (audit → spec →
phased PRs), and (2) a run of **landing + auction-surface chrome** polish.

## What shipped (all merged — detail in SHIPPED.md)
- **Top tabs renamed** (#655): Listings→**Watches**, Watchlists→**Lists** (labels only).
- **Non-watch catalogs removed** (#656): Sotheby's "Noble & Private Collections" +
  Bonhams "Espionage" — catalog-level exclusion in scrape + calendar; existing purged.
- **Auction filter pill + catalog card** (#657/#663): "Calendar" launcher as a filter
  pill; single-sale = olive catalog-context card (house·loc·date → name → count) +
  "← Exit Auction"; mobile dead-end fixed; sale filter gates by status on Sold;
  redundant "Closing this…" divider suppressed in single-catalog view.
- **Pill/button library → olive** (#658–#662): one shared `SELECTED_FILL`; new
  `--brand-olive-ink` token + `clearAllPill`/`dismissChip`; single "Clear all" in the
  chips strip; CTAs + sign-in/producedPill swept blue→olive. DESIGN_SYSTEM updated.
- **Home masthead + account menu** (#664–#667): account pill → bare "M"; settings
  popout decluttered; Articles strip fade moved into shared CardStrip; moonphase
  top-bar overlay + top spacing; **home icon** on the wordmark home-button.

## Mental model — so it's not relitigated
- **One chrome accent = brand olive.** Blue `--brand` is now links / text-accents
  ONLY. Every "selected/on" toggle spreads `SELECTED_FILL` (olive tint + ink +
  0.5px hairline). New toggles → `pillBase`/`innerToggleButton`/`iconButton`; new
  clears → `clearAllPill`; removable filter chips → `dismissChip`. **Reach-for
  rules are in DESIGN_SYSTEM.md** — don't hand-roll a selected look or a clear.
- **One "Clear all"**, in the active-filters chips strip (right-aligned). The
  filter-bar copies + per-dimension picker "Clear"s were removed — don't re-add.
- **Auction launcher = "Calendar"** (Mark chose this over "Auctions"); a single sale
  = the olive catalog card + "Exit Auction"; on **Sold**, the sale filter applies
  only for **closed** sales (live-sale-on-Sold = 0 lots was the bug). `effectiveSaleUrls`.
- **Home top bar (About / M) is an absolute overlay** on Home so the moonphase isn't
  clipped; hero has ~24px desktop top padding.

## ⭐ PARKED DECISIONS — need Mark (each a small, ready PR once decided)
1. **"Collecting" → "Explore"?** Mark floated renaming the Collecting tab. My
   advice: keep **Collecting** or go **Explore** — NOT "Reference(s)" (collides
   with watch reference numbers; that collision is why it became Collecting).
   Label-only change like #655 when decided.
2. **"Lists" collision.** The `watchlist` TAB and the `collections` sub-section are
   both labelled "Lists" now. Rename one if it reads ambiguous in-app.
3. **Home-icon colour on white surfaces.** The house outline is currently white-only
   (inherits the olive bar). If it ever sits on a neutral surface, decide olive vs white.

## Carried forward (still open from the perf session)
- **Re-run PageSpeed mobile** for the after-baseline (was 35 before the perf epic).
- **Lazy-load the ReferencesTab subtree** (EditorialView/SizeCompare/ChallengeFlow/
  ChallengesView, ~3k lines) — the biggest remaining bundle chunk. **B-34's follow-up.**

## Open backlog (BUGS.md — unchanged this session except B-29)
- **B-29 resolved** this session (#657/#663). Still open, notable: **B-26**
  (share item leaks into brand-filtered grid), **B-31** (search Auctions strip
  alignment), **B-16/18/19/20/22/27** (platform health), **B-23/24/25** (residential
  scrape — Bonhams/TW LaunchAgent install still pending with Mark), **B-28** (editorial
  vintage filter). Epic-A IA redesign phase tracker still the headline plan.

## Loose ends
- **No open PRs.** Working tree clean; today's 13 feature branches merged + local
  copies deleted.
- One non-session local branch exists in a separate **git worktree**:
  `rm-phillips-known-auctions` (not this session's — leave it / flag for `/tidy`).

## Bottom line
The site's pill/button language is now coherent (one olive accent, one selected
state, one clear-all, everything on the shared library + documented), and the
landing + auction chrome got a solid polish pass. Clean state; three small naming/
colour decisions parked for Mark, and B-34's ReferencesTab split is the next
perf lever.

---

## ADDENDUM — typography / serif-sans design language (2026-05-28, later)
Ran a font audit, then turned the one-paragraph serif/sans rule into a real type
system. **Both PRs merged, CI green.**

- **#668 — font tokens (cleanup).** Audit found a clean sans base (75% inherits the
  body stack) but an under-formalized serif layer: the two premium surfaces rendered
  in *different* faces (Iowan vs Hoefler), the serif stack was re-declared in 4 files,
  two `SANS_STACK` consts held different values. Consolidated into
  `FONT_SANS`/`FONT_SERIF`/`FONT_SERIF_DISPLAY` in `styles.js`; **editorial serif
  unified on Hoefler Text** (Mark's call; the one visible change — Iowan→Hoefler on
  ReferencePage/Watchlist headers). CardShell portal stack → `PORTAL_SANS` (kept
  distinct — it must hard-set a face for the iOS Times-serif portal fallback).
- **#669 — editorial type ramp.** `editorialDisplay`/`Heading`/`Title`/`Prose`
  factories bundle the whole reading recipe (face + leading + tracking). Existing
  editorial surfaces (ArticleCard, ReferencePage) now consume them (zero visual
  change); extended to the **one** on-principle surface — the ReferenceBrowse
  coming-soon teaser (a preview *of* a serif node). DESIGN_SYSTEM rewritten with the
  full system + guardrail.

### Key decision (so it's not relitigated)
**Serif = read, sans = act — and serif must NOT leak onto chrome.** Deliberately did
NOT serif the search hero (it's an editable input = scan-and-act), empty states, or
list/section names — even though they were on the original candidate list. Serif
reads premium *because* it's rationed. "Land the editorial feel more widely" on
functional surfaces is a **layout** job (spacing / eyebrows / hairlines / measure),
in sans — flagged as design-led follow-ups, not done here.

### ⭐ NEXT PICKUP (typography thread)
- **Eyebrow promotion** — the uppercase-tracked eyebrow is still re-rolled ~10 sites;
  DESIGN_SYSTEM's pending `<Eyebrow>`/`eyebrowText` candidate. One clean follow-up PR.
- **Editorial *layout* register on one functional surface** — pick a surface, apply
  the recipe in sans (not serif) as a focused PR. This is how the produced feel
  spreads without cheapening the serif. Mark to art-direct which surface.
- (Unchanged from above: B-34 ReferencesTab split is still the next perf lever.)
