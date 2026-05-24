---
description: Run the maintenance / health pass (hygiene only, no new features)
---

Run a maintenance pass and report a short status list. Don't fix anything
non-trivial without asking first. Maintenance sessions are hygiene-only — no
new features (per ROADMAP's maintenance rhythm).

1. **Health** — run `python3 health.py`: workflow failures, `verify_sources`
   alerts, flapping sources, data freshness.
2. **Does it work** — spot-check that recently-touched user-facing features
   still work (drive the live site / use the verify flow). Flag anything broken
   or hard to find. This is the standing answer to "no idea if it all works."
3. **Drift** — skim CLAUDE.md / README / ROADMAP for claims that no longer
   match the code (tab structure, counts, file names). Flag, don't auto-fix.
4. **Housekeeping** — available dependency updates + open `scrape-failure`
   issues. (Branches / PRs / orphaned code live in `/tidy`.)
5. **Roadmap** — surface the open audit / refactor items from ROADMAP's
   Foundations track and anything parked too long for a ship-or-drop call.

Report findings; let Mark pick what to act on.
