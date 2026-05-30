# Lumé — UX Principles (from Stanford "UX for AI")

Design principles for Lumé, the watch-concierge chatbot (Epic 9), distilled from
Mark's Stanford *UI/UX Design for AI Products* course (Modules 1/3/4/5 + the Nexus
capstone) and mapped to Lumé. Use this when working the **bot UI/UX thread**
([[project_lume_uiux_session]]). Honors the house voice (BRAND.md: intrinsic,
lateral, no hierarchy) and the recommender-trust stance ([[feedback_recommender_trust]]).

Each principle: **the idea (source)** → **Lumé: keep / change**.

---

## A. Framing — what Lumé *is*

1. **Augment, don't replace (Intelligence Augmentation — M1).** Lumé makes the
   collector smarter and faster at *their own* hunt; it's a knowledgeable companion,
   not an oracle that decides for them.
   → *Keep:* surfacing, teaching, handing the user the controls. *Never:* auto-decide,
   auto-buy, or imply it knows better than the collector.

2. **Pick a humble metaphor (Khadpe 2020, counterintuitive — M5).** Users judge
   *low*-competence-framed AIs more positively and are far more forgiving of their
   errors than ones sold as "expert." Over-promising competence backfires.
   → *Lumé is "your watch-chat companion, still learning your taste"* — not "the expert
   concierge that knows everything." Invite correction explicitly. (Already in the
   system prompt — protect it.)

3. **Don't let the UI write a check the AI can't cash (Adar — M1/M4).** Calibrate the
   promise *below* the capability.
   → Cold-open and empty states should under-claim, then over-deliver.

## B. Control vs. automation (Module 3)

4. **Mixed-initiative: act / ask / defer by confidence (Horvitz).** High confidence →
   just do it. Medium → offer a button. Low → stay quiet or ask.
   → Lumé's **offer→do actions are accelerators**: one-tap accept, zero cost to ignore.
   The cold-start **confidence ramp** is this principle. Never auto-navigate without the tap.

5. **High control + high automation is not a tradeoff (Shneiderman).** Automate the
   tedious (search, lookup, cross-reference); leave the *choice* with the user.
   → Results land in the app's normal direct-manipulation surfaces (the grid, lists) where
   the user keeps full control — Lumé fills the search, the user picks. (Already true; keep it.)

6. **Be an accelerator, never Clippy (M3).** A suggestion that interrupts, or is wrong
   too often, gets *loathed*, not loved.
   → Bubble **hides after an action** (done — keep). Never pop up unprompted. **Every
   offered button must be real** — a dead/no-op action is a Clippy moment. (This is why the
   ref-search bug mattered so much.)

7. **Design-gallery the uncertain (M3 + mitigates overreliance M4).** When Lumé can't
   know the single right answer, show a few options instead of one confident pick.
   → For "recommend me…" / ambiguous asks, surface **several** watches or references to
   choose from — not one. Reduces both wrong-guess cost and overreliance.

## C. Trust & explainability (Module 4)

8. **Trust is brittle — one visible error tanks it (algorithm aversion).** Users forgive
   a human the same mistake but massively downgrade an AI.
   → The **cite-or-don't contract** is non-negotiable. Never approximate ("'40s-ish");
   "I don't have that" beats a confident wrong answer. *This is the single highest-leverage
   trust behaviour* — protect accuracy over colour.

9. **Fight overreliance: lower the cost of verifying, raise the stakes (Vasconcelos 2023).**
   People satisfice — they won't double-check unless it's cheap.
   → **Inline source links = one-tap verify** (cheap). **Show the real listings/lots**, so the
   user checks reality, not Lumé's word. Don't let a confident sentence stand in for the watch.

10. **Citations enable verification, not authority (M4).** Explanations can *backfire* —
    they make the AI sound more authoritative, so people question it less.
    → Cite to let the user check, keep it skimmable; don't pile on detail to look smart.

## D. Lumé as a social actor (Module 5)

11. **Media Equation — it's treated as a person, so manners + consistency matter.** Even
    faint anthropomorphism triggers social scripts.
    → Lumé's warmth is *load-bearing*, not decoration. **Consistency builds trust**: the same
    question shouldn't yield contradictory answers (capstone guardrail).

12. **Stay abstract — avoid the uncanny valley (Mori; Cortana→circle).** Weaker human-
    likeness reads better than near-human.
    → The **abstract lume-triangle mark (not a face/avatar) is correct** — keep it. No
    photoreal persona, no human name-with-a-face. Voice can be warm; the *form* stays abstract.

13. **Disclose the AI (Replicant Effect — M5).** In mixed human/AI environments, trust
    drops for *everything* unless it's clear what's what.
    → Keep the line crisp: **Lumé is clearly the AI**; the content it surfaces (real listings,
    sourced articles, dealer/auction data) is clearly *not* AI-generated. Never blur them.

## E. From the Nexus capstone (Mark's own articulation)

14. **Progressive disclosure by intent: orientation → understanding → audit.** Detect how
    deep the user wants to go; don't dump everything.
    → Answer at the right depth, then **offer "go broader / go deeper" follow-ups** rather than
    a wall. (A concrete UI affordance to build: suggested follow-up chips.)

15. **Guardrails for trust: refuse out-of-scope, state uncertainty, stay consistent.**
    → Lumé sticks to the corpus, says plainly when it doesn't know, and never "over-advises."

---

## Where Lumé already aligns vs. gaps (quick read)

**Already textbook-correct:** grounding/cite contract (8/9/10), abstract icon (12), hide-
after-action accelerator (6), confidence ramp (4), humble "still learning" framing (2),
real wired actions (6).

**Gaps worth a design pass (for the UI/UX session):**
- **Suggested follow-up chips** (14) — guide the non-expert; "broader/deeper" + lane options.
- **Design-gallery for recommendations** (7) — show a few, not one confident pick.
- **Make verification cheaper/visible** (9) — source links and real results as first-class UI,
  not buried in prose.
- **Thinking/▷ state + consistency** (11) — a clear "working" indicator; same-Q→same-A.
- **Disclosure clarity** (13) — a light, persistent "AI, still learning — correct me" affordance.
