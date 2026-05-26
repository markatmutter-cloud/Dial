# Watchlist Audit — Plain-English Companion
**For:** a non-technical reader · **Pairs with:** `AUDIT_REPORT.md` (the technical version)

This explains each significant finding as: **What · Why · Consequence · Options · How to adjust your docs/rules/patterns.** No fix is described as a one-off — the goal is to change the *rule* so the problem can't quietly return.

---

## First, the one idea that ties everything together: rules come in three strengths

When the audit says "adjust your documents, rules, and patterns," it really means: **decide how strongly each rule should be enforced.** There are three levels:

1. **A note** — a line in CLAUDE.md or a code comment: *"Remember to do X."* Weakest. It only works if the next session (you, or the AI) reads it and remembers. Both forget.
2. **A pattern** — a reusable piece of structure that makes the right way the *easy, default* way (e.g. one shared helper everyone calls instead of each file doing its own thing). Medium. You still have to choose to use it.
3. **A guardrail** — an automated check (a test, or a step in the build) that **fails loudly and stops everything** if the rule is broken. Strongest. It can't be forgotten, because the machine refuses to continue.

**Rule of thumb: the more expensive the mistake, the stronger the rule should be.** A Critical risk deserves a guardrail, not a note. Most of this audit boils down to one move — *take the rules that matter most and promote them from notes to guardrails.* You already do this in places; the findings show where to do more of it.

Each item below is tagged with the level its fix should live at.

---

## CRITICAL 1 — The app can silently mark hundreds of in-stock watches as "Sold"

- **What:** When a dealer's website briefly hiccups and returns *nothing* — but in a way that looks "successful" — the system treats it as *"this dealer sold everything"* and silently marks all their watches Sold.
- **Why it happens:** The scraper saves whatever it received, even an empty result, over yesterday's good data. The next step compares "yesterday's list vs today's (empty) list," sees everything missing, and concludes it all sold. Only **1 of your ~41 sources** has a safety check against this.
- **Consequence:** Hundreds of available watches wrongly flip to "Sold" — and your Sold archive is *permanent*, so the bad data sticks around. Worse: because every step is set to "keep going if something errors," the run still finishes **green** and you're **never warned.** This is the real-world face of "dies under its own weight."
- **Options:**
  - **(a, recommended)** Add the empty/"suspiciously small" abort check — which one source already has — to *every* scraper.
  - **(b)** Add that same check once, centrally, in the merge step (fewest changes, catches all).
  - **(c)** Require a watch to be missing *twice* before marking it Sold (most forgiving; delays real sold-detection by one cycle).
- **How to adjust docs/rules/patterns → GUARDRAIL.** This is Critical, so a note isn't enough. Make the "don't save empty/tiny results" check a shared pattern every scraper uses, and add a test that *fails the build* if any scraper could write an empty file. Promote the existing one-site trick in CLAUDE.md from "Watch Club's workaround" to "**every** scraper must do this."

---

## CRITICAL 2 — The app gets heavier every single day

- **What:** Every time someone opens the app it downloads about **22MB of data — roughly 19MB of which the first screen doesn't even use.** And the data only ever grows; nothing trims it.
- **Why it happens:** All the data files load up-front "just in case," instead of only when you open the tab that needs them. And the Sold/archive data is kept forever (your deliberate choice) with no cap.
- **Consequence:** Slow, stuttery first load on phones — the worst possible first impression for a new visitor — and it gets *automatically worse* every month. Your project is already ~270MB; the README still says "~2MB" when it's really 4MB+ and climbing. This is a cliff you're walking toward slowly.
- **Options:**
  - **(a, recommended)** Load only what the first screen needs; fetch the rest the moment someone opens that tab.
  - **(b)** Cap or tier the archive — recent items load fast, older ones behind a "load more."
  - **(c)** Move the giant article-text files out of the app's main data and fetch them on demand.
- **How to adjust docs/rules/patterns → GUARDRAIL + PATTERN.** Add a "size budget" check that *fails the build* if a data file crosses a limit — so bloat can never sneak up on you again. Add a CLAUDE.md rule: *"the first load fetches only the default view's data; everything else loads lazily."* You already invented the right pattern (the lazy "desc" sidecar) — make it the default for all heavy data.

---

## HIGH — You're building on shifting sand (dependencies aren't pinned)

- **What:** Your app relies on outside code libraries, but doesn't *lock* which exact versions it uses. Each build grabs the newest matching version available that day.
- **Why it happens:** The "lockfiles" (the files that say "use exactly these versions") aren't saved into the project.
- **Consequence:** A build that works today can break tomorrow **with zero changes from you**, because an outside library quietly updated. It's also a security exposure — a tampered update would run with your secret keys. And it's painful to debug, because "nothing changed" on your side.
- **Options:**
  - **(a, recommended)** Save the lockfiles and tell the build to use them exactly. One-time, small.
  - **(b)** Turn on automatic update alerts so version bumps are deliberate and reviewed, not silent.
- **How to adjust docs/rules/patterns → GUARDRAIL.** Commit the lockfiles, switch the build to "exact versions only," and add a check that fails if a lockfile is missing. CLAUDE.md rule: *"dependencies are pinned; never install 'latest' on the fly in a workflow."* **This is the cheapest fix in the whole audit and removes a whole category of invisible breakage.**

---

## HIGH — Two giant files do most of the work, and the tests only check "it didn't instantly crash"

- **What:** Two files (one ~4,600 lines, one ~3,300) hold most of the app's logic. The automated tests mostly check *"the page doesn't blow up on load"* — not *"the page does the right thing."*
- **Why it happens:** The app grew feature-by-feature into these hubs; tests were added as crash-tripwires rather than behaviour checks.
- **Consequence:** Every change risks unexpected side-effects, and nothing automatically catches a wrong price, a broken filter, or a failed save — you only find out by using the app, or when a user does. This is the *textbook* "dies under its own weight": not a dramatic crash, but changes that get slower and riskier over time. It's also why you've had repeat "white screen" bugs.
- **Options:**
  - **(a)** Slowly carve pieces out of the big files into smaller ones — one small extraction per session, low risk.
  - **(b)** Add behaviour tests to the riskiest logic first (money, filters, saving).
  - **(c, bigger)** Adopt type-checking, which catches a whole family of "typo"-style bugs automatically.
- **How to adjust docs/rules/patterns → PATTERN + GUARDRAIL.** CLAUDE.md rule: *"new logic goes into a small file/hook — never grow the two big files."* (Trend them down, not up.) And turn on the automatic "hook-ordering" check so the white-screen bug class *fails the build* instead of relying on a comment you have to remember.

---

## HIGH/MEDIUM — Currency math is written in two places that can silently disagree

- **What:** The exchange rates used to convert prices are written in *two separate places* that must always match — but nothing stops them drifting apart.
- **Why it happens:** The backend and the frontend each keep their own private copy.
- **Consequence:** Update one and forget the other, and prices silently go wrong (you've had an "8× off" currency bug before). Wrong prices also feed your "biggest price drops," so it can *invent fake deals.*
- **Options:**
  - **(a)** One single source of truth for rates.
  - **(b)** A small test that fails if the two copies disagree.
  - **(c, bigger)** Fetch live rates instead of hardcoding them.
- **How to adjust docs/rules/patterns → GUARDRAIL.** You already *document* several "these two must stay in sync" rules (brand names, the image proxy). The lesson here: a "keep in sync" note is weak — add a test that *checks* they're in sync. Make your locksteps **verified**, not just written down.

---

## HIGH — The locks on user data work, but aren't written down where you can check them

- **What:** Your security — who can see whose private data — is genuinely solid. But for **5 of the most sensitive tables**, the protective settings live *only* in the live database, not in your project files. So you can't *prove* they're switched on just by reading the code.
- **Why it happens:** Those tables predate your habit of recording every change as a file.
- **Consequence:** Today it's fine. But if that protection ever got switched off — by a future change, or a stray click in the database dashboard — there'd be no record to compare against and no alarm. And that one setting is the entire difference between "private" and "anyone can read everyone's saved watches."
- **Options:**
  - **(a, recommended)** Export the current settings into your project files so they're version-controlled and reviewable like everything else.
  - **(b)** Add a check that confirms the protection is on.
- **How to adjust docs/rules/patterns → NOTE → PATTERN.** You already have the rule *"ship the database change before the code that uses it."* Extend it: *"every table's security state lives in a committed file."* Then your security is reviewable, not invisible.

---

## MEDIUM — Two files named almost identically (easy to edit the wrong one)

- **What:** Two files, `auction_lots_scraper.py` and `auctionlots_scraper.py` (one underscore apart), do *different* jobs.
- **Why it happens:** They grew separately and were never renamed.
- **Consequence:** Low severity, but a genuine trap — you or the AI can easily open and edit the *wrong* one, wasting time and risking subtle bugs. All three of the auditors that touched this flagged it independently.
- **Options:** Rename one to something obviously different (e.g. `tracked_lots_scraper.py`).
- **How to adjust docs/rules/patterns → PATTERN.** A naming convention: *"no two files may have near-identical names."* Cheap, and it removes a recurring "edited the wrong file" mistake — exactly the kind of continuity error your friends warned about.

---

## What this means for how you work (the takeaway)

The single biggest upgrade isn't any one fix on this list — it's a habit:

> **Take the rules that matter most and move them from "notes you must remember" to "guardrails the machine enforces."**

You already do this well in spots (every workflow step is set to survive errors; the reference-matcher runs everywhere automatically). The whole audit points the same direction: *where forgetting is expensive, install a check that fails loudly.*

Three guardrails alone would prevent most of what was found:
1. **"No empty data file"** check (kills the Critical sold-corruption bug).
2. **"Data size budget"** check (kills the slow-bloat cliff).
3. **"Dependencies pinned"** check (kills silent breakage and a security hole).

Plus switching on the automatic hook-ordering check (kills the white-screen bug class).

And keep this in proportion: **your documentation is a real strength** — better than most professional teams. The only thing to internalise is that a written note is the *weakest* kind of rule. Keep the notes; promote the expensive ones to tests and build-checks.

Nothing in this audit says "start over." It says: *you've built something real and mostly well-run — now fit a few seatbelts so it can't quietly hurt you.*
