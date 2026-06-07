# Reference-page redesign brief (Mark, 2026-06-06 review burst)

Consolidated from Mark's live review of the E859 guide + endorsed external
feedback. One shared-component build (ReferencePage.js), all guides inherit.
Node schema stays back-compatible; new optional fields noted.

## The shift in one line

From encyclopedia modules to a collector-led editorial essay:
**narrow column for reading, wide strips for browsing.**

## Section order (FINAL — Mark 2026-06-07)

1. **Hero** — image, title, definer. Definer = spec shorthand only
   ("Automatic alarm diver · 42mm EPSA compressor case · calibre 825/K825 ·
   internal bezel · 16-hole resonance caseback · c. 1,714 production
   examples"). Production years move to the body; brand-relaunch tails move
   to Modern legacy.
2. **The reference** — ONE clean overview block, 2–3 short paragraphs.
   Single centered readable column (~760–880px max-width). NO drop cap.
   No two-column intro split (white-space imbalance). The "what am I
   looking at" section.
3. **What the shorthand misses** — the renamed/relocated Debated section.
   Prose-led editorial blocks, not Q&A: interpretive heading + one
   paragraph + muted "Source position:" line. Hand-authored node field with
   synthesis conflicts as fallback. Keep tensions that teach (brand framing
   vs scholarship, production counts, dial generations, market signatures,
   rarity ≠ desirability); demote 41-vs-42mm to a spec note.
4. **Reference stories** — RENAMED from "Stories", moved INTO the core body
   (Mark 2026-06-07: breaks up dense reference material, makes the guide
   editorial). Story cards, 2–3 lines + one source link each. For E859:
   the American brief (Lowe) · the caseback that makes the watch · before
   the icon (1965) · the 1967 bridge · the comeback (2008 → 2018). The
   stories EXPLAIN the reference; they are not bonus trivia.
5. **What to notice** — replaces "Reading the marks". Short narrative
   paragraph + horizontal image-card strip (name + image + 1–2 lines,
   click-through). Service-tell details live here as education, not warning.
6. **Key configurations** — replaces "Variants worth seeing". Compact
   strip: one image + two lines per card.
7. **Read it first** — moved BELOW stories + what-to-notice (understand the
   watch first, then the research trail). Featured ~4 sources with the rest
   collapsed behind "more sources"; auction lots live in examples/source
   notes, not the read-first list.
8. **Look at real examples** — one-sentence intro, then the
   listings/auction/sold segments. Grey-box checklist REMOVED (page rule).
9. **Explore next** — connection buckets, why-line = the bridge.
10. **Modern legacy** (optional, line-spanning guides) — relaunch/successor
    history (E859 → 2008 Tribute → 2018 collection → Mariner).
11. **Scope & sourcing** — keep at bottom, tighten.

Rhythm: what is it → the nuanced version → why collectors care → how to see
the details → what versions exist → what to read → real examples → where next.

## Page rules (apply to every guide)

- **Teach the reader how to see the watch.** Buying-risk checklists never
  render on the reference page; that material belongs in listing analysis,
  collapsed buyer notes (future), or Lumé interactions. The howToLook node
  field stays in data (future listing-context use) but does not render.
- **No em-dashes in rendered copy** (LLM tell; credibility). Colons, commas,
  periods, parens. En-dash for numeric ranges.
- One warm/poetic line per page maximum; otherwise evidential
  (see memory feedback_reference_voice_intrinsic addendum).
- Typography does less: no drop caps, no two-column reading layouts.
- Nav target: Overview · Evidence · Sources · Details · Configurations ·
  Examples · Stories · Explore (Evidence = What the shorthand misses; may
  fold into Overview's nav entry).

## Schema additions (optional, back-compatible)

- `shorthand`: [{ heading, body, sourcePosition }] — hand-authored
  "What the shorthand misses" blocks. Render above synthesis conflicts;
  synthesis conflicts render only when no hand-authored block covers them.
- `modernLegacy`: string — the late-page brand-continuation paragraph.

## Status

- [ ] ReferencePage layout rebuild (single column, strips, section order)
- [ ] Section renames + nav
- [ ] howToLook de-rendered everywhere
- [ ] E859 node: shorthand blocks authored (draft exists in review thread),
      definer trimmed, modern history moved to modernLegacy
- [ ] Other guides: shorthand authored or synthesis-fallback verified
