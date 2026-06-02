# Session handoff — 2026-06-02

Supersedes SESSION_HANDOFF_2026-06-01.md (archived). **The Lists / Collecting /
Auctions / Share / Saved redesign — the "after living with it" pass**, plus its
follow-ups. ~22 PRs merged (#729–#771). Lumé stayed parked. Plan file with the
multi-phase detail: `~/.claude/plans/abstract-juggling-thacker.md`.

## ⏭ Next session — About / "Nexus" page redesign (B-56, scoped + deferred)
Mark scoped it but **deliberately deferred** (not auto-next; on the backlog to
resurface). Full spec in **BUGS.md B-56** + memory [[project_about_page_sections]]:
3-voice restructure (enthusiast · dealer-creator · about-the-project) + a
**Lumé-led button-driven guided "how to use the site"** (RAG, not free-text) +
a **brand/voice review (folds in B-14)** + copy review (Mark's voice) + a
modal-vs-page decision + the "About vs Nexus" naming call. Copy-heavy → needs
Mark's eye; the guided-Lumé build overlaps the Lumé thread (separate sessions).

## What shipped this session (#729–#771, all merged)
The earlier part of the run (#729–#759 — sub-tabbed Lists landing on Saved,
typed bookmark sections, reference-guide saving, bigger cards, sectioned Lists,
unified `SharedReceiveFrame`, bleed-bar PageHeader, red-heart shortcut) is logged
in SHIPPED. The **continued run**:
- **Shared-list surface, two-mode** (#760/#761): recipient reskinned onto
  `SharedReceiveFrame` (cover-card preview, no read-only grid) with two clearly-
  labelled outcomes; sender share sheet relabelled **Send a copy** / **Collaborate**
  (the link's invite-token presence is the mode).
- **Collapsing header pattern** (title scrolls away, filter bar pins) — shipped on
  the **auction catalog** (#762), the **Saved** tab (#764), and the **Reference
  guides + Articles** sub-tabs (#771). One pattern across four surfaces.
- **Auction catalog Share** (#765): emits an **in-app link** → a new
  `CatalogReceiver` (unified frame), not the dead-end auction-house URL; added a
  "→ Auction house" link by the header.
- **Auctions copy** (#766): desktop "Auction Calendar" label; "sales" → "auctions"
  consistency.
- **Add-to-list modal** (#767): Done in a sticky header (no scrolling to commit).
- **B-55** (#768): leaving a catalog for Watches/Listings resets the sale filter
  (no more empty "Nothing matches").
- **Standard-library cards** (#769): one shared `cardGridStyle` → article =
  reference-guide = list cards (same size).
- **Saved grouping DROPPED** (#770): the Brand/Source group pills (briefly added
  in #763) were redundant with the Source/Brand filters — removed (−186 lines).
  Saved is a flat newest-first grid.

## Mark's locked direction this session (the through-line)
- **Consistency via a STANDARD LIBRARY for headers and cards** — shared components/
  tokens, not per-surface variants. This drove the shared `cardGridStyle`, the one
  collapsing-header pattern, and the PageHeader reuse. (See [[project_chrome_unification]],
  [[project_card_design_system]].)
- **Simple filter pattern preferred** (visible chips + one search box, NOT click-to-
  expand pills) for low-facet surfaces — memory [[feedback_simple_filter_pattern]].
  Dense pill-bar stays only where facet count is high (Watches/Saved/Auctions).
- **Living-with-it iteration is valid** — he asked for Saved grouping, lived with
  it, found it redundant, had it removed. Honour that (not flip-flopping).

## Scraping correction (confirmed 2026-06-02)
B-23/B-24/B-25 were stale "install pending" — actually **DONE**: Tropical Watch
runs a direct (Browse-AI-free) scraper in the daily batch; **Bonhams** runs from
Mark's **laptop LaunchAgent** (`bonhams_lots.json` commits ~3×/day). BUGS updated.

## Open threads (when Mark asks "what's open")
- **About/Nexus** — B-56 (scoped, the next big one).
- **Lumé** (separate sessions): B-39, B-40, B-45, B-46, B-47, B-51, B-52.
- **Scraping + data** (Mark's own session): B-28 (editorial freshness), B-54
  (Explorer 14270 mislabel).
- **Plumbing** (own session): B-16 (JS lockfile), B-20 (scraper filename), B-22
  (code-split phase 2), B-34 (load-speed follow-up), B-44 (synth-workflow CI gate).
- **Parked threads:** B-06 (screening collab visibility), B-14 (now folded into B-56).
- Highest B-number = **B-56**; next new = B-57.

## Gotchas reinforced
- **CI=true fails on any unused var/import** — it's the guard that makes deletions
  safe (an orphaned import can't survive green CI). What it DOESN'T catch (dead
  files, dormant-wired code, stale comments) → the `/tidy` sweep.
- **Edge-bleed sticky** (collapsing headers): the negative side margins must equal
  the scroll-pane's padding (−20 desktop / −16 mobile here) or the pinned bar's
  background won't span — verify on the preview.
- **Squash-merge leaves stale LOCAL branches** (47 piled up) — they look unmerged
  to git though their content shipped. Safe to prune; awaiting Mark's ok.
- Pre-existing untracked files (`The Watch List — what Mark built.md`,
  `docs/WATCH_LEXICON.md`) are not ours — leave them.
