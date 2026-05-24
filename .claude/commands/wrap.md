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
5. **Commit** the changes on the working branch (don't push unless asked).
   Confirm the working tree is clean and no branch got stranded — flag any open
   PR left behind so it doesn't become an orphan.
