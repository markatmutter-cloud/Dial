---
description: End-of-session closeout — handoff + disciplined doc updates
---

Run the session closeout. The goal is to leave clean state and NOT re-bloat
the docs.

1. **Handoff** — write or replace today's `SESSION_HANDOFF_<date>.md` (add an
   addendum if one already exists for today). Archive any superseded handoff.
   **Handoffs are not copied into CLAUDE.md.**
2. **Docs — one fact, one home.** Only touch a doc if its *kind* of content
   actually changed this session:
   - **SHIPPED.md** ← a two-line entry per thing that shipped
   - **ROADMAP.md** ← only if direction / priorities changed
   - **README.md** ← only if architecture / data model changed
   - **DESIGN_SYSTEM.md** ← only if a token / component changed
   - **CLAUDE.md** ← only a durable *rule* (not history, not description),
     within its ~4k-word budget (6k ceiling); prune or compress before adding;
     strip PR/date tags. A single-site rule goes as a code comment, not here.
   Never duplicate a fact across docs.
3. **`personal/LEARNING.md`** — what Mark did well, what tripped him, one
   concept to push next. (Capture in the moment; don't defer. It's gitignored —
   private to Mark, not part of the shared repo.)
4. **Report** which docs you changed and why, in one short list, so the
   discipline is visible.
5. **Land the close — straight to `main`, no PR.** The close pass is
   *doc-only* (SHIPPED / ROADMAP / README / DESIGN_SYSTEM / CLAUDE / handoff):
   no CI to pass, nothing to review, it's the project's own changelog. Commit
   it **directly to `main` and push** — do NOT park it on a side branch or
   wait to be asked, that's how closes strand (the SHIPPED log silently falls
   behind what actually shipped — see the 2026-05-28 strand). The
   branch-before-editing rule is for *code*; it does not apply to a doc-only
   close. If the close somehow touched code, that part goes through its own
   PR — but the docs still land on main.
6. **Confirm clean.** Working tree clean, `main` in sync with origin, no branch
   stranded — flag any open PR left behind so it doesn't become an orphan.
