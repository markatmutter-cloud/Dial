# Session handoff — 2026-06-03

Supersedes SESSION_HANDOFF_2026-06-02.md (archived). **The polish session**:
Mark walked the live build + user feedback and fed a 33-item queue (P-1…P-33);
plus a live verification round after the merges. 12 PRs merged (#782–#793),
**9 PRs open at close (#794–#802 — merge these first next session)**, plus two
doc-only consolidations straight to main.

## ⚠️ Open PRs at close — all green, Mark merges
- **#794** Home avatar disc: heart-matched white ring (2px, heart's white)
- **#795** PageHeader one-row header (actions/count inline with title — the
  "narrow Saved look" everywhere)
- **#796** Title-height ledger (EditorialView stray 4px; mobile body padding
  flat 12 — body no longer decides title height per tab)
- **#797** CHROME metrics token sheet (styles.js) + clearAllPill/pillBase/
  StandardSearchInput wired; **follow-up due**: wire PageHeader/EditorialView/
  ReferenceBrowse/MobileShell px → CHROME (no-visual-change refactor, was held
  to avoid cross-PR conflicts)
- **#798** Sign out → under the signed-in identity (quiet underlined link)
- **#799** Articles: year roll-up retired → flat newest-first grid
- **#800** About auto-open retired (manual About stays everywhere)
- **#801** CardStrip: ::-webkit-scrollbar hide (the grey track under home strips)
- **#802** Reference-guide images: 11 empty `img:""` data fields filled from
  cited pages' og:image + RefImg wsrv→raw retry with favicon terminal
- ⚠️ #795/#796/#797 touch overlapping chrome — if a later merge conflicts,
  rebase the branch (done once already for #792, pattern works).

## What shipped (merged, 2026-06-03 — see SHIPPED for the log)
- **IA: 4 top tabs** Watches · Saved · Articles · Reference Guides ("Guides"
  mobile); Saved subs ♡ Saved · Lists · Searches; Collecting dissolved; Tools →
  account menu (Challenges placement provisional — Mark to revisit; menu is
  signed-in-only so signed-out users currently have no Size-compare path).
- **Standard chrome library**: PageHeader (one-inset, count slots) +
  StandardFilterBar (centered fixed search slot, reserved right count) +
  StandardSearchInput; chrome-guard CI test enforces.
- **Share per-type pass**: list/guide/article OG cards + receive surfaces;
  `get_public_list` migration (snapshot) applied + verified live.
- **Lumé re-seed fix** (#785) — the API-cost loop.
- **Doc consolidations on main**: Lumé → ONE list in ROADMAP Epic 10
  (docs/LUME_ROADMAP.md deleted); P-27/28/31 routed there.

## Open threads / next sessions
1. **ROADMAP NOW/NEXT/LATER rewrite — Mark-led, still parked** (carried from
   2026-06-02; he explicitly kept it for next session).
2. **Playwright screenshot-diff job in CI** — the pixel-level guard; would have
   auto-caught most of today's finds. CI has node; medium lift. (ROADMAP Epic 0.)
3. **CHROME wiring follow-up** (see #797 above) + **favicon-fallback sweep**:
   the failed-image rule (favicon placeholder, B-38/DESIGN_SYSTEM) is now law —
   ListReceiver tiles + DossierBlocks thumbs still hand-roll; ShareReceiver's
   "Open on X" copy is the one deliberate richer fallback.
4. **P-33 (only un-built P-item)** — Saved type-filter row treatment; Mark to
   pick: fold type pills into the filter row vs compact segmented control.
5. **Pills "cut off" mystery** — at-rest on Mark's Mac; DOM inspection showed
   healthy geometry (62×27 pill, no clipping) and a clean full-page render.
   Best theory: 0.5px inset outlines aliasing at zoom/display scaling. Awaiting
   Mark's ⌘0 zoom check; if it persists at 100%, bump interactive-pill outline
   0.5→1px at the token (keep 0.5 hairline dividers).
6. **Lumé session backlog** = ROADMAP Epic 10's list (P-27 entry-aware opener ·
   P-28 context-correct labels · P-31 share-provenance signal at #7/#8).
7. **B-56 About/Nexus** now owns the cold-landing welcome (auto-open gone).

## Locked decisions (also in CLAUDE.md / memories)
- **Never label "Hearted"** — "♡ Saved" everywhere (memory: no-hearted-label).
- **Counts**: bar surfaces → bar's reserved right slot; bar-less headers →
  PageHeader `count` (right); never under the title.
- **One-row header**: actions/⋯/count inline with the title (narrow band).
- **Sub-tabs stay at the page inset** (Mark asked about aligning under the
  active main tab — recommended against, accepted).
- **One inset · one search recipe · CHROME token sheet** — chrome numbers live
  once in styles.js CHROME; raw px in chrome code is a smell.

## Gotchas reinforced
- **Sequential PRs off fresh main** beat stacked branches; rebase-on-conflict
  worked (#792). Branch-switches mid-session make the harness re-show files —
  expected noise.
- **"Image missing" ≠ "image failing"**: the guide blanks were `img: ""` in
  node data; check the data before building retry machinery (built both —
  retry was still right for the genuinely blocked hosts).
- **wsrv-blocked host list keeps growing** (WatchProSite, A Collected Man,
  Phillips guide images) — RefImg's wsrv→raw ladder is the per-image answer.
- **Reply calibration (Mark, twice)**: narrate continuously while working;
  every line must carry content; reply to every message BEFORE returning to
  tools (memory: feedback_terse_replies).
