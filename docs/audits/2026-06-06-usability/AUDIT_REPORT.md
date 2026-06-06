# Cold usability audit — first-time target user · 2026-06-06

**Grade: C+ for first-time legibility** (the experienced-user app underneath is
solid — navigation is safe end-to-end, chrome is consistent, search works —
but two of the nine first-visit jobs fail outright for the target persona,
including the one that triggered this audit).

**Method.** Scripted Playwright walkthrough of the LIVE site
(`the-watch-list.app`), signed-out, two viewports (iPhone 390×844 primary,
desktop 1440×900), driven by [walk.py](walk.py); 40 steps, every decision
point screenshotted into [screens/](screens/) (manifest:
[manifest.json](manifest.json)). Three independent heuristic evaluators then
scored the task battery against the persona, with code-path verification for
behavioral questions. Severity scale: **SEV-1 blocks the job · SEV-2 strong
friction / likely abandonment · SEV-3 papercut.**

**Trigger.** Mark observed a real target-age/competency user: she could not
find the Sold view, tapped filter pills twice when told to "click the
subtab", didn't know a second navigation level existed, and was afraid to
explore — "not wanting to be seen as getting it wrong, so they stayed
looking at one thing."

**Persona.** First-time visitor, target age/competency. Curious about
watches, not a collector-forum native. Doesn't know the words sub-tab /
pill / saved search / reference. Risk-averse navigator: won't click unless
she can predict the outcome and trust she can get back. Vocabulary: "sold
items", "my watches", "articles" — not "comps" / "refs" / "lots".

## Repro

```
python3 -m venv /tmp/wl-audit-venv
/tmp/wl-audit-venv/bin/pip install playwright==1.52.0
/tmp/wl-audit-venv/bin/python -m playwright install chromium
/tmp/wl-audit-venv/bin/python docs/audits/2026-06-06-usability/walk.py
```

Re-run after the dispatch layer ships for a before/after on the same script.

## Per-task verdicts

| # | Task | Verdict | Evidence |
|---|---|---|---|
| T1 | Orientation: land cold, "what is this / what can I do?" | **Struggled** | [m/01](screens/mobile/01-landing.jpg) [d/01](screens/desktop/01-landing.jpg) |
| T2 | Find what watches **sold for** | **FAIL** (field-confirmed) | [m/03](screens/mobile/03-watches-tab.jpg) [m/04](screens/mobile/04-sold-subtab.jpg) |
| T3 | Filter to a brand under a price (mobile) | **Fail at the door, pass behind it** | [m/06](screens/mobile/06-listings-subtab.jpg) [m/07](screens/mobile/07-brand-filter-open.jpg) |
| T4 | Find upcoming auctions | **Struggled** | [m/05](screens/mobile/05-auctions-subtab.jpg) |
| T5 | Save a watch + find it again (signed out) | **Pass** | [d/09](screens/desktop/09-heart-signedout.jpg) [m/11](screens/mobile/11-saved-signedout.jpg) |
| T6 | Find an article **to read** | **FAIL** (no in-app reading) | [m/12](screens/mobile/12-articles-tab.jpg) = [m/13](screens/mobile/13-article-open.jpg) |
| T7 | Find a reference guide | **Pass with friction** (code-first titling) | [m/14](screens/mobile/14-guides-tab.jpg) [m/15](screens/mobile/15-guide-open.jpg) |
| T8 | Search for a specific watch | **Pass with friction** (placeholder jargon) | [d/08](screens/desktop/08-search-submariner.jpg) |
| T9 | Get back from 3 levels deep | **Pass** (in-app; re-armed by outbound card links) | [m/16-1..3](screens/mobile/16-back-1.jpg), manifest depth-urls |

## Findings (normalized severity, ranked)

### SEV-1 — blocks the job

**U-01 · Sub-tabs are indistinguishable from filter pills, and inactive
sub-tabs read as *disabled*.** The only path to Sold/Auctions is the
`Listings · Auctions · Sold` row, but inactive items are faint grey text —
grey universally signals "not available" — while the `Date ↓` filter pill
directly below is a filled, bordered chip that *looks* like the button. The
filter pill is visually louder than the navigation. This is the exact field
failure: told "click the subtab," the user tapped the pills, because the
pills look like the buttons. Compounding it, nothing on the landing or top
nav previews that a second level exists at all. The one discoverable route
to sold data is the landing's "Recently sold" strip — the right pattern,
but below the fold. Evidence: [m/03](screens/mobile/03-watches-tab.jpg),
[m/06](screens/mobile/06-listings-subtab.jpg),
[d/03](screens/desktop/03-watches-tab.jpg) (desktop: sub-tabs top-left are
*smaller and quieter* than the Source/Brand/Model pill row below).
**Route:** ROADMAP Epic 9 — the dispatch layer is the designed fix
(communicates the level exists); a `SubTabBar` restyle (navigation must
out-shout filters; inactive ≠ disabled) is the supporting fix.

**U-02 · "Read an article" is impossible inside the app, and the tap reads
as broken.** Article cards are plain `target="_blank"` links to the source
publication (`EditorialView.js:885–896`; header comment at `:48` says
"Cards are READ-ONLY links out"). In the walkthrough the click produced no
visible change ([m/12](screens/mobile/12-articles-tab.jpg) and
[m/13](screens/mobile/13-article-open.jpg) are identical) — a novice reads
that as a dead click. When the tab does open, she's on Hodinkee/Fratello
with no app chrome and no way back into context. The article *body prose is
already loaded* by the app (`*_bodies.json`, `EditorialView.js:334`) — the
content exists; only the in-app reading surface is missing. **Route:**
already tracked as **B-51** (Epic 10 list item 6) — this audit upgrades it
with field evidence; the in-app article reader is its core deliverable.

### SEV-2 — strong friction

**U-03 · Listing cards silently fling the user to an external dealer site
in a new tab.** The whole card body is one outbound `<a target="_blank">`
(`Card.js:223–228` → `CardShell.js:136–149`). The card *looks* like an
in-app object (in-app ♡ and ⋯ controls), so the outcome is unpredictable —
and because it's a new tab, the otherwise-excellent back-safety guarantee
(U-09/T9) doesn't apply. The single most-tapped element does the one thing
this persona most fears: silent jump off-site with no way back. No outbound
cue (↗ / "View at {dealer}") exists. **Route:** B-51 (same in-app-surface
thread); the cheap interim fix is an explicit outbound affordance on cards.

**U-04 · Mobile filter entry is an unlabeled icon.** Brand/price filtering
on mobile lives solely behind the small lines-icon right of the search box —
no "Filter" label, no Brand pill (desktop shows them inline). The persona
scans for words, not icons; she will never open it. Painful because the
sheet behind the icon is *excellent* (clear Filter title, SOURCE/BRAND/
MODEL/PRICE RANGE sections, real brand chips, "Show 3942 watches" action —
[m/07](screens/mobile/07-brand-filter-open.jpg)). **Route:** Epic 9.

**U-05 · No purpose statement anywhere.** Masthead is the single word
WATCHLIST; she must reverse-engineer the site from content strips. Also:
the brand name collides with "watchlist" the feature for this persona.
One line under the masthead ("Track watches for sale, at auction, and
sold — across N dealers and auction houses") answers T1 in five seconds.
**Route:** Epic 9 (pairs with the B-56 About/Nexus + brand review).

**U-06 · Sold/auction money labels speak auctioneer.** "HAMMER £635" is the
literal answer to "what did it sell for" wearing a word the persona doesn't
own; "CURRENT USD 1,100" omits "bid"; the dealer name "LOUPE THIS" reads as
an instruction (verb-shaped, and she doesn't know what a loupe is) where
every other source label (WIND VINTAGE, PASCAL KARP) reads fine. Evidence:
[m/02](screens/mobile/02-landing-scrolled.jpg),
[m/04](screens/mobile/04-sold-subtab.jpg),
[m/05](screens/mobile/05-auctions-subtab.jpg). **Route:** Epic 9 copy
sweep — "Sold for £635" / "Current bid USD 1,100"; style source labels so
names can't parse as verbs (e.g. "at Loupe This").

**U-07 · Reference guides title by code, not name.** Guide cards and the
page hero lead with "E2643" in display type; the human-legible
"Jaeger-LeCoultre — Shark / Vogue Chronograph" is the smaller kicker. To a
novice the code is a license plate; she scans for a brand and finds it
demoted. The guide page itself is otherwise the app's best in-app learning
surface (breadcrumb, prose overview, Save guide). Evidence:
[m/14](screens/mobile/14-guides-tab.jpg),
[m/15](screens/mobile/15-guide-open.jpg). **Route:** Epic 5 reference-page
template — flip the title hierarchy.

**U-08 · Escape doesn't close the sign-in modal or the mobile filter
sheet.** The driver (and any keyboard user) had to find the × / "Keep
browsing" button; `CardShell.js:109` wires Escape for the ⋯ menu, so the
pattern exists but isn't applied to these two overlays. For a cautious
user who just hit an unexpected gate, a dead Escape key is a moment of
"I'm stuck." **Route:** BUGS **B-63** (defect — expected behavior, pattern
already in codebase).

### SEV-3 — papercuts

**U-09 · Search placeholder leads with jargon.** "Search reference or
brand…" — "reference" is the one word she doesn't know, first, on the
first control she sees; it implies a code is required when free text works
fine (Submariner search returns strong results —
[d/08](screens/desktop/08-search-submariner.jpg)). One-word reorder in
`MobileShell.js:313`, `DesktopShell.js:143`, `HomeTab.js:277`,
`SearchResultsView.js:390`. **Route:** Epic 9 copy sweep.

**U-10 · "Listings" sub-tab is a near-synonym of the "Watches" tab above
it.** Adds no meaning for a novice; outcome words ("For sale · Auctions ·
Sold") would make the row read as a meaningful three-way choice and
reinforce the U-01 fix. **Route:** Epic 9 (with the SubTabBar restyle).

**U-11 · Signed-out Saved shows a "0" count + Date/Price sort pills above
the empty state.** Sort controls for a list with nothing in it; the "0"
reads as a scorecard on a screen whose job is to invite
([m/11](screens/mobile/11-saved-signedout.jpg)). Suppress when empty.
**Route:** Epic 9.

## What's genuinely working — don't break it

- **The sign-in ask is a model of low pressure** ([d/09](screens/desktop/09-heart-signedout.jpg)):
  "free, keep browsing without an account" up front, concrete why-sign-in
  bullets, a "what it doesn't do" trust block, and two escape routes.
- **Back-safety is real**: browser-back retraced guide → Guides → Saved →
  Listings perfectly, no blank states, both viewports (manifest T9). The
  pushState discipline pays off — the "fear of going too deep" is
  unjustified *in-app* (it's re-armed only by outbound card links, U-03).
- **Cross-tab chrome consistency**: every tab = search + pills + count;
  learn once, transfers everywhere. The standard-library work shows.
- **The mobile filter sheet** (behind the hidden door) and **the reference
  guide page** are the two best novice surfaces in the app.
- **The landing's "Recently sold" / "Ending next at auction" strips** are
  the right discovery pattern — they just need more prominence vs the fold.

## Recommendation priority

1. **Dispatch layer (Epic 9, pull forward)** — fixes U-01's root ("the
   level doesn't exist for her") and U-05; the audit's headline.
2. **SubTabBar restyle + outcome labels** — U-01 supporting fix + U-10;
   one shared component, every surface inherits.
3. **B-51 in-app article reader + outbound cues on cards** — U-02, U-03.
4. **Copy sweep** (HAMMER / CURRENT / placeholder order / source-label
   styling / "Filter" label on the mobile icon) — U-04, U-06, U-09; a
   half-day of one-liners.
5. **B-63 Escape-to-close** — U-08.
6. **Guide title flip** (Epic 5 template) — U-07.
7. **Saved empty-state cleanup** — U-11.
