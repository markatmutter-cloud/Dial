---
description: Run a six-lens expert UI/UX review panel on one surface, then synthesise a build sequence
---

Run an expert review panel on a surface of the app: `/ui-review <surface>`
(e.g. `home`, `listings`, `a reference page`, `editorial`). Default is `home`.

The point is to bring **outside standards in**, on evidence, and end with a
ranked build sequence rather than a pile of opinions. It is re-runnable, so
run it again after a redesign ships to check the change actually landed.

## 1. Capture the evidence (do this yourself, first)

Do not let the reviewers each go look at the site. They will each see
something different and you will not be able to compare their findings.
Build **one** evidence pack in the scratchpad and give every reviewer the
same file.

Open the live site with the browser tools (`preview_start` on
`https://the-watch-list.app`) and capture:

- **Structure:** every block top to bottom with its y-offset and height, plus
  total page height, at desktop 1280x720. Note exactly what fits in the first
  viewport.
- **Geometry:** tile sizes, image sizes, `scrollWidth` vs `clientWidth` for
  every horizontal strip (how many screens of hidden content), gaps, section
  margins. Pull these from the DOM with `javascript_tool`, do not eyeball them.
- **Type inventory:** every heading's computed `fontSize` / `fontWeight` /
  `color` / `letterSpacing` / `textTransform`. The count of distinct type
  roles is usually the finding.
- **Colour tokens:** read the CSS custom properties off `:root`.
- **Mobile:** repeat at 375x812 (`resize_window` preset `mobile`).
- **Dark mode:** repeat with `colorScheme: dark`. Assets that vanish or drop
  contrast in dark mode are a recurring defect here.
- **Constraints:** restate the hard rules (no new typefaces, inline styles, no
  router, iOS PWA, chrome-guard, whatever the surface's own rules are).
- **Mark's verbatim critique**, and what the surface currently fails to reveal
  about the rest of the product.

Reset the viewport (`preset: desktop`, `colorScheme: light`) when done.

## 2. Run the panel

One `Workflow` call. Six lenses in parallel with a shared schema, then one
synthesis agent. Each lens gets: the evidence pack path, the component source,
`DESIGN_SYSTEM.md`, `BRAND.md`, and permission to use WebSearch / WebFetch on
the best-in-class references named in its own brief.

The six lenses (keep them, they are chosen so they do not overlap):

1. **Editorial art director** — Hodinkee, Fratello, Monocle, NYT front page,
   Kinfolk, The Gentlewoman. Hierarchy, scale contrast, type roles, rules and
   whitespace, irregular vertical rhythm.
2. **First impression / product comprehension** — Sotheby's, Christie's,
   1stDibs, Chrono24, Airbnb. What a new visitor understands in five seconds,
   and how a site explains itself without prose.
3. **Interaction + mobile (iOS PWA)** — Netflix, Spotify, Apple News,
   Instagram Explore. Scroll primitives, affordances, thumb reach, tap
   targets, 375px vs 1440px.
4. **Brand and visual identity** — Hodinkee, A Collected Man, Phillips,
   Analog/Shift. Masthead economics, asset value, colour behaviour, identity
   carried by content rather than a logo block.
5. **Design system / front-end architecture** — reads the actual component.
   What belongs in new shared components vs surface-only code, what to extend
   rather than duplicate, what will make the build painful.
6. **Skeptic / red team** — argues against the redesign. Which parts would
   damage daily use, where boredom with a daily tool is being mistaken for a
   design defect, the cheapest changes that get most of the impression, and
   the specific failure modes to watch.

Every finding must carry: severity 1-3, the problem grounded in the measured
evidence, a **buildable** change with numbers, a named reference and what
that site specifically does, and an effort estimate. Cap each lens at six
findings: fewer and sharper beats a long list.

Tell every lens what is already fixed or already decided, so nobody spends a
finding on it.

## 3. Synthesise, then report

The synthesis agent decides rather than summarises. It must produce: a verdict
in plain English, the single highest-leverage change and why it beats the
alternatives, a ranked build sequence of 4-6 independently shippable steps
each with a definition of done, the reviewer disagreements with a call on
each, an explicit not-doing list, and any finding that is really a bug.

Then, in the chat: give Mark the verdict and the sequence in plain English, no
ticket IDs. Route the output the usual way, bugs to `BUGS.md`, design threads
to `ROADMAP.md` under their epic, and note the run date so the next panel can
compare.
