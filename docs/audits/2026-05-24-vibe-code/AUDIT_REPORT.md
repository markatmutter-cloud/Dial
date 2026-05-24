# Watchlist — Vibe-Code Audit Report
**Date:** 2026-05-24 · **Method:** cold, read-only, 6 parallel domain auditors · **Repo:** `/Users/markmutter/Documents/watchlist`

Detail files in this folder: `findings-architecture.md` · `findings-correctness.md` · `findings-security.md` · `findings-data.md` · `findings-frontend.md` · `findings-maintainability.md`

---

## 1. Overall grade: **B−** — and the friends' thesis is wrong about *this* project

**The thesis under test:** "anything vibe-coded fails eventually — no review, no continuity, no discipline, dies under its own weight."

**The verdict:** This is **not** vibe-coded garbage, and it is meaningfully more disciplined than the stereotype the thesis describes. Six independent auditors, looking cold, converged on the same picture: a genuinely well-governed core (rock-solid Supabase access control, A-grade docs that actually match the code, sound architecture instincts, a well-tested state machine) carrying **3–4 specific, fixable cliffs** in the places where governance hasn't kept pace.

The honest nuance your friends are half-right about: the *ungoverned* areas accrue exactly the risk they predict. There is **one CRITICAL silent-data-corruption path**, an **unbounded-growth trajectory**, **two 4,000-line monoliths with render-only tests**, and **zero dependency pinning**. None of these has killed the project — but each is a load you can't currently see, and that invisibility is the real danger. The differentiator between "vibe-coded garbage" and "this" is *governance*, and this project has more of it than most funded teams. The work now is closing the 3–4 gaps before they compound.

**Totals across all domains:** CRITICAL 3 · HIGH 19 · MEDIUM 25 · LOW 19 (66 findings).

| Domain | Grade | C | H | M | L |
|---|:--:|:--:|:--:|:--:|:--:|
| Architecture & structure | **B** | 0 | 2 | 3 | 3 |
| Correctness & tests | **C−** | 0 | 5 | 4 | 3 |
| Security | **B** | 0 | 1 | 3 | 4 |
| Data & pipeline | **C+** | 1 | 4 | 4 | 3 |
| Frontend & performance | **C+** | 2 | 4 | 5 | 4 |
| Maintainability & continuity | **B−** | 0 | 3 | 6 | 2 |

The two C+ domains (data, frontend) and C− (tests) are where the weight is. Security and architecture grade B not because they're perfect but because the *design* is sound and the issues are gaps, not rot.

---

## 2. Top 5 risks (blast-radius × likelihood)

1. **Silent "everything sold" corruption on an empty/truncated scrape** *(Data C1 — the only CRITICAL).* A site that returns HTTP 200 with an empty or partial payload makes the scraper "succeed"; the workflow moves the empty CSV over the good one; `merge.py`'s disappearance logic flips **every** previously-live item from that dealer to SOLD — on the **first** miss, no debounce. Only 1 of 41 sources (watchclub) has the low-count abort guard. Because every step is `continue-on-error`, the run goes green and the failure-notifier never fires. **The corruption ships silently and pollutes the permanent sold archive.** High blast, recurring likelihood.

2. **No dependency pinning anywhere** *(Maint H1, Sec M2/M3).* No `package-lock.json`, no runtime `requirements.txt`; CI/Vercel/Actions install latest-matching every time. Today's green build proves nothing about tomorrow's — a transitive bump can silently break a scraper (→ risk #1) or ship a supply-chain compromise into prod with no diff. **Cheapest fix in this whole report, highest leverage.**

3. **Unbounded data growth + 22 MB eager mount fetch** *(Frontend C1/C2, Correctness F7, Maint M3).* ~22 MB JSON (~19 MB not even needed for the default view) parsed on the main thread at every app open → multi-second mobile jank now. `state.json`/sold-archive never prune; `.git` is already 270 MB; README's "1,800 listings / 2 MB" is 3× stale. A dated cliff.

4. **Two 4,000-line monoliths with render-only tests** *(Arch H1, Correctness C−, Maint H3).* `App.js` (4,627 lines, 125 hooks) and `CollectionsTab.js` (3,341) concentrate change-risk; the jest suite only asserts "renders without throwing." This is the literal "dies under its own weight" mechanism — not breakage, but ever-rising iteration friction and a recurring white-screen/TDZ bug class.

5. **Silent money corruption from drifting FX tables** *(Correctness F2/F9, Data H4)* **— tied with un-versioned RLS tables** *(Sec H1).* Two hand-maintained currency tables that must agree but can silently diverge (the "8× off" class), plus a same-URL currency switch that fabricates fake "price drops" feeding the deals sort. And: the 5 highest-sensitivity user-data tables have no committed schema, so RLS-*enabled* state can't be proven from the repo (policies are correct; the on/off toggle is invisible to version control).

---

## 3. If you do only 3 things

1. **Stop the silent sold-corruption.** Apply the watchclub-style empty/low-count abort guard to **every** scraper (or enforce it in the CSV-move step / add a debounce in `merge.py`). Kills the only CRITICAL. *(Effort: M)*
2. **Pin dependencies + commit lockfiles.** `requirements.txt` (hashed), `package-lock.json` + `npm ci`, turn on Dependabot. Converts invisible failure into a visible, reviewable one. *(Effort: S)*
3. **Stop eager-fetching ~19 MB on mount** — gate non-critical JSON behind the tab that uses it; add a CI size-budget guard for the growth cliff. Immediate mobile win + early-warning on bloat. *(Effort: M)*

---

## 4. What's genuinely good (the counter-evidence)

This is the part the thesis misses. Credit where due:

- **Supabase access control is well-engineered.** Every visible user-data policy gates on `auth.uid()`; all security-definer RPCs resolve identity server-side (never trust client `user_id`); admin paths gated by `is_admin()` server-side; **no `service_role` key in the client, no committed secrets, no XSS sink.** No cross-tenant leak found.
- **Documentation is A-grade and *true*.** 11 of 13 spot-checked CLAUDE.md/README claims hold exactly; the 3-place image-proxy and 2-place brand-alias locksteps are actually in sync; the "retired surfaces" list is accurate. Rare for any team, let alone a solo non-technical one.
- **The core state machine is well-tested.** `merge.update_state` (the cross-run memory that everything depends on) has a genuinely solid 17-test pytest suite.
- **Architecture instincts are sound.** Clean data layer (not everything funnels through App.js), hook-ordering discipline holds, no circular imports, an ErrorBoundary, the live/sold split, paged rendering, a memoized Card.
- **Observability foundation exists** (last session's `health.py`, auto-issue-on-failure, `continue-on-error` everywhere) — and TODO/FIXME debt is effectively zero.

A fresh LLM session *with the handoff* is productive in minutes. That continuity machinery is the opposite of the thesis's "no continuity."

---

## 5. Prioritized remediation roadmap

**Tier 0 — this week (cheap, high-leverage):**
- Scraper empty/low-count abort guard on all sources *(Data C1, CRITICAL)* — **M**
- Pin deps + lockfiles + `npm ci` + Dependabot *(Maint H1, Sec M2/M3)* — **S**
- Gate non-critical mount fetches behind tab visit *(Frontend C1)* — **M**
- `useCallback(handleShare)`; `useMemo` theme `c` + `gridStyle` *(Frontend H3/M1/M2)* — **S**
- Broaden service-worker JSON regex to new feed filenames *(Frontend H2)* — **S**
- Add `eslint-plugin-react-hooks` rules-of-hooks: error to CI *(Correctness F10)* — **S**
- `getSession().catch` *(Correctness F8)*; add `"jlc"` to frontend BRAND_ALIASES *(Arch M3)* — **S**
- `safeHref()` for scraped URLs + `redirect:"manual"` on img proxy *(Sec L1/L3)* — **S**
- Commit DDL + `enable row level security` migration for the 5 un-versioned tables *(Sec H1)* — **S**
- Tighten `listing_events` insert policy to `user_id = auth.uid()` *(Sec M1)* — **S**

**Tier 1 — this month:**
- Behavioral tests for the money/format layer + an FX parity test *(Correctness F1/F2)* — **S/M**
- Reference-matcher fixture tests; auction-status tests + ISO validation *(Correctness F3/F4)* — **M**
- Data-growth budget: CI size guard + a cap/tiering plan for `state.json`/sold archive *(Correctness F7, Frontend C2)* — **M**
- Rename the duplicate auction scraper *(Arch M1 / Maint M4)*; add `.nvmrc` *(Maint M2)* — **S**
- Roll `fetch_json_with_retry` to remaining catalog scrapers *(Maint M6)* — **M**
- Move 27 MB+ corpus bodies out of git to Blob/artifact *(Maint M3)* — **M**

**Tier 2 — this quarter (deliberate, larger):**
- Incrementally extract `App.js` (29 JSX consts → components) + split `CollectionsTab` *(Arch H1/M2, Maint H3)* — **L, each step S**
- Code-split / `React.lazy` the heavy rarely-hit surfaces *(Frontend H1)* — **M**
- Currency-aware item identity / redenomination tagging *(Correctness F9)* — **M**
- Incremental `// @ts-check` + JSDoc on `utils.js`/`supabase.js`/shellProps, `tsc --noEmit` in CI *(Correctness F5)* — **M**
- Plan a Vite migration with an explicit trigger *(Maint H2, Frontend L3)* — **L**
- Virtualize the feed *(Frontend H4)* — **M**

---

## 6. Bottom line

A solid, well-governed B− project with one CRITICAL to fix promptly and a handful of months-out cliffs to defuse while they're cheap. The "vibe-coded = doomed" thesis doesn't hold here — but it would, in the specific places where discipline lapsed, if those gaps were left to compound. The whole Tier 0 list is roughly a day of focused work and removes the only CRITICAL plus the highest-leverage invisible risks.
