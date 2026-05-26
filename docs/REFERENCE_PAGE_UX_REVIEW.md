# Reference page — UX / IA / editorial critique (for the next-session UX pass)

_Independent design critique of `src/components/ReferencePage.js` (Submariner
5512/5513), generated 2026-05-26 by a UX-review agent against DESIGN_SYSTEM.md +
BRAND.md + Mark's verbatim feedback. Drives the next UX pass. Headline verdict:
the content + synthesis architecture is sound and the hero is excellent — the
gap is **presentation and wayfinding**, not content._

## Ship-first (the three that resolve Mark's core complaint)
1. **Section-header tier** — promote the 11px eyebrow to a real serif section
   title (~28px) + small eyebrow kicker + one-line guided intro + a wide hairline
   rule above each section. (Sections currently blur together.)
2. **Sticky scroll-spy wayfinding** — desktop vertical chapter rail in the wasted
   gutter; mobile sticky chip strip (mirror the shipped B-10 sticky band).
   IntersectionObserver drives active state; click to jump.
3. **Number the journey** start → read it → see real ones → go deeper.

## P0 — breaks the experience / explicitly flagged
- **P0-1 No wayfinding / sense of place** → sticky scroll-spy rail (desktop
  gutter) + mobile chip strip; section `id`s; IntersectionObserver.
- **P0-2 Section headers too small** → add the section-title tier (serif 28 +
  kicker + intro + rule). The type ramp's middle is missing (72px hero → 11px
  eyebrow, nothing between).
- **P0-3 Learning journey invisible** → guided one-line intro per section;
  legible order. Proposed order: Hero → The Submariner → The 5512/5513 (start) →
  Guides (read) → Marks (learn to see) → Variants → Look at real examples **+
  market cards inside it** (see real ones) → Debated (go deeper) → Where next +
  books → Scope. (Move Stories DOWN — it currently interrupts the opening
  narrative before the reader has the guides.)
- **P0-4 Stories: misaligned edges, non-clickable titles, no intro** → put the
  image strip + text grid in ONE wrapper/width so edges align; make the WHOLE
  title the link (kill the orphan ↗, sub-44px tap target); add an intro line.
- **P0-5 "Debated" surfaces flat non-debates** → render BOTH sides (the synthesis
  stores them) with source per side; DROP non-debates (the tonal tool-vs-luxury
  item, the out-of-scope HEV); reframe intro confidently ("Two questions serious
  collectors still argue"); promote it visually (it's a highlight, not a footnote).
- **P0-6 Market cards belong INSIDE the grey "Look at real examples" box** → one
  unit: eyebrow → intro → checklist → segmented pills → card strip → outro. Watch
  grey-on-grey (set strip bg transparent when nested).
- **P0-7 Desktop stacks narrow centred columns** → pair model intro + story
  side-by-side; use the gutter for the scroll-spy rail; keep prose at ~720 measure
  but compose across the width.

## P1 — significant
- **P1-1 Hedging copy kills credibility** → demote the "part machine, part human,
  still learning" line to the Scope footer + tighten ("Compiled from thousands of
  listings and write-ups, reviewed by hand. Spot something off? Suggest a fix.").
  Rewrite the Debated intro to assert rigor, not indecision (no "rather than pick").
- **P1-2 Drop cap fragile/off-register** → commit to it deliberately (lead para
  only, `--text1` not olive) or drop for a clean standfirst; guard empty case.
- **P1-3 Monotonous spacing** → two-tier: larger section break (48 desktop) +
  rule before chapters vs normal item gap.
- **P1-4 Market segment** → default to first non-empty bucket; use `<EmptyState>`
  not raw text.

## P2 — polish
- A11y: orphan ↗ / "Read ↗" tap targets < 44px (iOS PWA); `--text3` used for
  readable sentences is below AA contrast → move to `--text2`; route segmented
  pills through `innerToggleButton`; guard empty `img src`.
- **`node.inItsTime` is dead content** (rich McQueen/COMEX/Bond standfirst never
  rendered) → render as a paired column / pull-quote, or remove.
- **module_candidates** render as inert pill `<span>`s that look like broken links
  → style as not-yet-links or hide until target pages exist.
- Hoist the 3 width helpers (720/1040/1080) to named constants — the P0-4
  misalignment is because they diverge.

## Keep (working)
- The **hero** (480px image, gradient scrim, 72px serif h1, kicker, definer,
  credit pill) — dead-on the Hodinkee/Monocle bar. Make the rest live up to it.
- The **`paired()` alternating two-column** pattern (guides img-right / marks
  img-left / variants img-right) — right instinct; extend it to the prose sections.
- The **content node voice + synthesis-enrichment architecture** with `inScope`
  branch-filtering — sound separation; the issue is presentation, not the data.
