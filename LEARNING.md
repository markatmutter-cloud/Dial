# Watchlist — Mark's builder learning log

The purpose of this project is as much Mark's development as a builder as
it is the product itself. This doc tracks where he's at, what he's
learned, and what to work on next. Claude updates it at every session
close.

Unlike the other docs, this one has **no word budget** — its value is the
accumulation over time. It is never folded into CLAUDE.md.

How it's maintained:
- **Capability snapshot** — overwritten each session (current state).
- **Concept log** — append-only, dated. Don't edit past entries.
- **Growth edges** — overwritten as edges clear and new ones appear.

---

## Capability snapshot — 2026-05-24

**Can drive unaided:**
- Product + IA decisions — what belongs where, when a surface is doing too
  many jobs, when to retire a feature rather than add to it.
- Clear specs and feedback; spotting when a UX or data result is "off"
  without reading the code.
- Running the full stack *through Claude* — GitHub Actions, Vercel,
  Supabase — and reasoning about how the pieces connect.
- Strategic framing — the jobs-to-be-done chain, the reference-intelligence
  thesis, what makes the product defensible vs Chrono24 / Watchcharts.
- **New this session:** diagnosing a *systemic* problem by its root cause.
  Mark spotted that the docs bloated because the *maintenance loop* was
  append-biased — not just "this doc is too long." That's a real step up.

**Still leaning on Claude / not yet independent:**
- Reading and writing code directly; verifying claims against the code
  (Mark has started *asking* Claude to verify — the right reflex).
- Git mechanics — branching before editing still slips under momentum.
- SQL / RLS, scraper internals.

**Working style (observed):**
- Ships fast, iterates by feel, adjusts priorities mid-session.
- Stacks feedback in bursts while testing (observations, not redirects).
- Strong product taste; comfortable reverting and trying again.
- Captures review thoughts only *in the moment* — deferring to a notes
  doc loses them. Works best thinking out loud with Claude scribing live.

## Concept log

- **2026-05-23 — Append-biased instructions grow forever.** An instruction
  that only says "add / update" — with no prune step, no budget, no
  "one fact, one home" rule — will bloat any system it maintains, every
  cycle. Fix the *loop*, not the output. (Mark diagnosed this himself.)
- **2026-05-23 — Code is the final authority over docs.** Docs, handoffs,
  and cached numbers drift. When they disagree with reality, the code wins.
  Reconcile in order: code → recent handoffs → stable docs.
- **2026-05-24 — "Commit" = a labelled snapshot in git history.** It records
  the current changes with a message so you can find or undo them later.
  Uncommitted changes live only on the local machine, not on GitHub.
  (Reviewed uncommitted docs for the first time today.)
- **2026-05-24 — I retain thoughts only if caught in the moment.** Deferred
  capture (a notes doc "for later") loses them. The fix: think out loud and
  let Claude scribe live into the right place — not more self-discipline.

## Growth edges (work on next)

1. **Finish one work item before starting the next.** The biggest source
   of orphaned branches / PRs / issues. When a new idea lands mid-build:
   capture it, finish the current thing, then pick it up. (Claude is now
   mandated to flag this in the moment.)
2. **Branch before editing — make it reflexive.** The recovery pattern is
   known; the habit isn't automatic yet.
3. **Keep asking Claude to verify against ground truth.** Already started;
   keep it a default, especially for anything structural.
4. **One-fact-one-home thinking.** Found it for docs this session — the
   same discipline applies to code (don't state a rule twice) and to
   product (one surface, one job).
