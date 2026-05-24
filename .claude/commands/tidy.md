---
description: Repo & code hygiene — branches, PRs, orphaned code
---

Sweep the repo for accumulated cruft and report a short list. Delete nothing
without confirming — Mark decides what to finish / delete / merge.

1. **Branches** — `git branch --merged main` (safe to delete) vs
   `--no-merged main` (decide: finish or abandon). Flag stranded commits that
   never reached a PR.
2. **PRs** — `gh pr list --state open` incl. drafts. Flag stale, superseded,
   or duplicate-of-shipped PRs, and merged-but-undeleted branches.
3. **Orphaned code** — files / components with zero imports or call sites (the
   SharedTab / ListManagePanel class), unused exports, "kept in case a future
   surface wants it" comments, scrapers not wired into any workflow.
4. **Working tree** — anything uncommitted; `main` clean + in sync with origin.
5. **Issues** — open `scrape-failure` issues that should have auto-closed.

This targets the recurring orphaned-branch / stranded-commit pattern. Run it
every few sessions, or whenever the branch list feels messy.
