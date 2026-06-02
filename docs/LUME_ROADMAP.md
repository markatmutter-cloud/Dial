# Lumé — build & detail doc (the AI spine; ROADMAP Epic 10)

**This is the build / detail doc for [ROADMAP.md](../ROADMAP.md) Epic 10 (Lumé).**
Updated 2026-06-02 — Lumé is **no longer a separate roadmap**: its *direction +
priority* now live in the one ROADMAP (as Epic 10), so the NOW/NEXT for AI sits
beside everything else. This doc keeps the *depth* — the six pillars, behavioral
charter, resume brief, and build sequence (same pattern as `IA_REDESIGN.md` →
Epic 9). The recommender stays a pillar of Lumé (pillar 5), with
[docs/RECOMMENDER_STRATEGY.md](RECOMMENDER_STRATEGY.md) its strategy detail.

Companion docs: **[LUME_UX_PRINCIPLES.md](LUME_UX_PRINCIPLES.md)** (the design bible
— 15 principles from the Stanford UX-for-AI course) · **RECOMMENDER_STRATEGY.md**
(Epic 7 detail) · **REFERENCE_INTELLIGENCE.md** (the knowledge corpus). Memories:
[[project_lume_roadmap]], [[project_ai_profile_memory]], [[project_attribute_search_gap]],
[[project_lume_uiux_session]], [[feedback_recommender_taxonomy]], [[feedback_recommender_trust]].

---

## State of Lumé — resume brief (2026-06-01)

*Read this first when picking Lumé back up (it was parked to work on the Lists tab UI).*

**What we've built (and how it fits the tool).** Lumé is the AI spine of The Watch List —
a *grounded* concierge of OUR corpus, not a general watch oracle. It now: answers from
the curated reference index + deep-dive syntheses (`get_reference`), the 13k-article
editorial corpus (`search_articles`), live/sold/auction listings, and the user's own
saved data; takes in-app actions (show/open/read/add/save); remembers an evolving taste
profile (`ai_user_profile`); and — new this session — reaches the open **web** when our
corpus is thin (corpus-first, cited), logging every such reach to **`lume_knowledge_gaps`**
as a demand signal for what to author next. The moat is the **verified reference guides**
(Submariner, JLC E2643) + grounding — NOT the base model's knowledge.

**Where we got to.** A real **eval harness** (Phase 1, PR #728): auto-gates prompt/tool
PRs, an LLM-judge scores replies against the charter rubric, a grounding answer-key catches
factual errors, N-sampling de-flakes, and a retrieval-source helper is ready to assert the
hierarchy. It **already caught real bugs** (see below).

**How it fits the ChatGPT-conversation model (Mark, 2026-06-01).** Lumé is a vintage-watch
**collecting GUIDE**, not a shopping assistant — it helps users learn references, develop
taste, follow rabbit holes, and decide what's worth watching, *whether or not they buy*.
Listings are examples, never the centre. The honest diagnosis: where ChatGPT "reads better"
today, it's because it writes an *unconstrained essay from free-recall* — exactly what we
DON'T want (free-recall is the trust-killer). Lumé's gaps are **plumbing, not intelligence**:
it doesn't reliably retrieve our own guide, so it leads with a listing or free-recalls. Fix
retrieval and Lumé is fluent AND grounded AND in-app actionable — which beats the essay.

**The behavioral target (what "good" looks like).**
- *Sees the right material:* for a learning prompt, grounds in the **reference guide first**
  (retrieval hierarchy: guide → notes → auctions → articles → listings → web; listings must
  NOT outrank guides). `groundingSource()` is the test hook for this.
- *Responds as a guide:* leads with the watch + collector context + the "why it matters"
  thesis; offers reading/comparing/rabbit-holes over a buying funnel; ends with a real next
  step. Never exposes machinery (corpus/library/indexing) or **fabricates user history**.
- *Stays accurate:* every hard fact from a tool; if unknown, humble ("I don't have enough
  depth on that yet") — never confident free-recall.

**Open findings the eval flagged (deferred to the product-behavior phase →
[[project_lume_product_behavior_phase]]):** "tell me about X" → ungrounded free-recall
(5513 fabricated "2024 Rolex figures"); E2643 LeCoultre-signature stated as temporal not
US-market; Tudor-snowflake free-recall; fabricated user history. **Next-fix priority = the
retrieval hierarchy.** Full eval strategy + budget: `~/.claude/plans/radiant-exploring-pillow.md`.

---

## North star

Lumé gets a collector **into the rabbit hole they want to go down**, and helps them
**fully understand a reference** (articles, reference guides, real examples). It
*augments* the collector — a knowledgeable companion, never an oracle that decides.

---

## The six capability pillars

```
        KNOWS                    DOES          KNOWS-YOU      TAKES-YOU      NUDGES
 ┌──────────────────┐      ┌────────────┐    ┌──────────┐   ┌──────────┐  ┌─────────┐
 │ 1. ref/watch     │      │ 3. deep-   │    │ 4. profile│   │ 5. rec'r │  │ 6. pro- │
 │ 2. collector     │─────▶│   linking  │◀───│  /memory  │──▶│ rabbit   │  │ active  │
 │    psychology    │      │ (actions)  │    │ (substrate)│   │  holes   │  │ layer   │
 └──────────────────┘      └────────────┘    └──────────┘   └──────────┘  └─────────┘
```

### 1. Knowledge — references & watches *(what Lumé knows about the object)*
- **Built:** reference index, 7 model-line deep-dives + dial "marks," lexicon Phase 1.
- **Next:** attribute-level knowledge (B-45), more synthesis nodes (fan-out), lexicon P2.
- **Open: opinion vs fact.** The corpus carries both. Lumé must be able to say *this is
  a fact* vs *this is collector opinion/consensus/contested*. Direction: tag claims in
  the synthesis stage (we already split `consensus` / `conflicts` / `marks` / `stories`
  — add a fact|opinion|contested label per claim in the next synthesis "screening").

### 2. Knowledge — collector mentality & psychology *(how to be a better collector)*
- **New corpus**, from Mark's collector-mentality guidance docs *(location TBC — Mark to point)*.
- **Voice firewall (non-negotiable):** collector psychology/typology powers a **coaching
  mode only**; it must never bleed into how Lumé describes a *watch* (that stays intrinsic
  — [[feedback_reference_voice_intrinsic]]).

### 3. Action — deep-linking into the site *(what Lumé can do / take you to)*
- **Built:** 6 actions (show_listings, open_watch, read_more, add_to_list, create_list, save_note).
- **Next:** map the full surface Lumé can drive — auctions calendar, reference pages, saved
  searches, screening mode, share, settings. Every offered button must be **real** (no Clippy
  dead-ends, UX principle #6).

### 4. Personalization — profile / memory *(who Lumé knows)* — THE SUBSTRATE
- Persist transcripts + a **fluid** per-user taste profile that evolves (budget 15k→20k,
  "went off Speedmaster"). Pillars 2/5/6 only get good once this exists.
- **Hard requirements from day one:** Settings → *view / edit / reset my memory*; a per-chat
  **"don't remember this" (incognito/test) toggle**; in-chat consent. (See Testing, below.)

### 5. Discovery — recommender + rabbit holes *(where Lumé takes you)*
- Wire Lumé to the recommender (Epic 7) and design the *journeys*. Subsumes
  RECOMMENDER_STRATEGY.md. Honors taste→condition→price and the trust stance
  (transparent/AI-mapped, label-matches-filter, "Similar→Edge case", invite correction).
- *Principles:* design-gallery the uncertain (#7), progressive disclosure by intent (#14).

### 6. Proactive — the nudge layer *(Lumé reaches out)*
- Pattern-spotting prompts: *"You've been looking at a lot of X — want a list / this guide?"*,
  *"You might have missed this,"* *"Not quite on-topic, but want a rec based on what I've seen?"*
- **Rule: prompt, never force.** Needs usage signals (pillar 4) + relevance. Ties to the
  watchlists pulse idea ([[watchlists_pulse]]).

---

## Behavioral charter — how Lumé behaves (Mark's design stances, 2026-05-30)

These extend [LUME_UX_PRINCIPLES.md](LUME_UX_PRINCIPLES.md) with Lumé-specific rules.
Most are **prompt-level** (live in `public/lume_system_prompt.txt`).

1. **Accuracy is the whole ride.** One wrong spec — "300m on a Speedmaster" — kills user
   trust instantly. **Hard facts come only from the corpus**; if unknown, omit or say so.
2. **Don't write a check the search can't cash.** Models aren't all attribute-tagged, so
   Lumé must NOT pretend it can filter "silver dial, no numerals." Instead: search the broad
   thing (**Datejust**), be honest the user narrows from there *for now*, **and still add
   value — coach what to look for** ("a silver dial with patina would be a classy step").
   Honesty about the limit *plus* expert guidance, never a dead-end.
3. **Differentiate opinion from fact** (see pillar 1) — and say which is which.
4. **Scope = watches, porous at the edges.** Not a topic blocklist — a **relevance test**:
   "does this thread back to watches?" Allow watch-adjacent (chefs who collect, watches in
   film, design lineage); **hard-refuse the genuinely unrelated** — no medical advice, no
   kids'-schooling advice, no omelet recipes.
5. **Tone: friendly, adult, user-led.** Mirror the user's register; **swearing is fine**.
   BUT a **hard floor regardless of goading** — Lumé will not be tested/baited into hateful
   content (antisemitism, racism, etc.). Match warmth, never match cruelty.
6. **Humble / forgiveness.** "I know a lot about X, but this one I'm not going to guess —
   hope that's ok" beats a confident wrong answer. Epistemic humility as a feature (the
   counterintuitive "low-competence metaphor" finding, principle #2).
7. **Proactive but never forced** (pillar 6).

---

## Suggested sequence (see chat for rationale)

1. **Behavioral prompt-tune** *(cheap, now)* — bake the charter into `lume_system_prompt.txt`.
   Biggest trust-per-effort; no schema/DB work.
2. **Profile / memory store** *(the substrate)* — persistence + reset + incognito test-mode +
   Settings view/edit. Unlocks 5 & 6.
3. **Attribute search (B-45)** — turns search-honesty into real capability.
4. **Proactive nudges** — needs usage signals + profile.
5. **Recommender** — needs profile + facets; planned here.
6. **Collector-psychology coaching corpus** — needs the guidance docs.
7. **Bot UI/UX pass** — its own session (follow-up chips, design-gallery recs, visible verify).

---

## Testing & accounts (Mark's question, 2026-05-30)

- **Today there is NO persistence** — the profile/memory store isn't built. A chat lives only
  in the bubble's memory + the messages sent; **reload = clean slate**. Only *usage counts*
  persist (`ai_chat_usage`), not content or taste. So **edge-case/abuse testing pollutes
  nothing right now** — hammer it, refresh between scenarios.
- **When pillar 4 ships:** the **incognito toggle + profile reset are hard requirements**, so
  Mark can stress-test inappropriate responses without writing to his real profile.
- **Test account:** a second Google account is worth having — cleanest way to test the
  **new-user cold-start** (fresh profile, the rapport hero) and to isolate abuse testing once
  persistence lands. Each account has its own daily cap (Mark's real = 10000; a fresh one gets
  the default 50 — can be bumped on request).

---

## Open questions
- Where do the **collector-mentality guidance docs** live? (pillar 2 blocker) — RESOLVED: they're in the editorial corpus (Screwdown Crown + others); pillar-2 work is classify, not ingest.
- **Opinion vs fact** tagging — bake into the synthesis screening; what taxonomy?
- Proactive nudges — surfaced *in* the bubble, or as app-level pulses too?

## Backlog additions (2026-05-31, from real use)
- **App-literacy / onboarding coaching (pillar 6 × pillar 3).** Lumé should teach *how to use the app* and proactively *compose* — e.g. "want me to set up a list with these notes, a few saved items, and this Snowflake-Submariner article?" Bundles create_list + add_to_list + save_note + read_more into a one-tap starter **dossier**. Onboarding + the dossier keystone, driven by Lumé.
- **Keep Lumé's links IN-APP (B-51).** Listing links are inconsistent — some hit the /share surface, some go straight to the external dealer. Article links go straight to the source, so there's **no way to save them or see them in-app**. Need a consistent in-app surface for BOTH: route listings through the (being-improved) share/open surface, and build the **same in-app surface for ARTICLES** (read + save into a list, never bounce to the raw source). Pairs with B-37.
- **Per-user response-depth tiers.** Depth is fixed (max_output 1024, MAX_TOOL_ROUNDS 6, Haiku-default/Opus-on-hard). Make these **per-user knobs** (via user_limits, like chat_cap) so owner / paid tier get deeper answers and free stays lean. Depth ≠ the daily message cap.
- **Conversation memory / length.** Server truncates to the last MAX_HISTORY_MSGS=20 messages (~10 exchanges); beyond that early context silently drops (where "gets weird in a long chat" comes from). Fix path = the profile/memory store (pillar 4): summarise/persist rather than hard-truncate.
