/**
 * Lumé grounding answer-key — verified (question → fact) fixtures the eval uses
 * to catch FACTUAL errors (the #1 trust-killer), not just behavioural ones.
 *
 * Every `fact` is drawn from a VERIFIED reference guide we authored
 * (src/data/referencePages/*.js + docs/reference_research/*) — the moat IS the
 * answer key. The eval asks Lumé each `question`, then a focused judge checks the
 * reply doesn't CONTRADICT the fact (silence is fine; a wrong claim fails).
 *
 * Grow this as guides are authored. Keep facts narrow + uncontroversial so a
 * contradiction is unambiguous. PURE data — no SDK.
 */

export const ANSWER_KEY = [
  // ── JLC / LeCoultre Shark Deep Sea / Vogue (E2643) ──
  {
    id: "e2643-movement",
    question: "What movement powers the Jaeger-LeCoultre E2643 Shark chronograph?",
    fact: "The E2643 uses a Valjoux-based manual chronograph movement — cited as Valjoux 72, later cal. 726, or JLC's designation Cal. 13 VZH. It is NOT an in-house JLC chronograph movement.",
  },
  {
    id: "e2643-names",
    question: "Is the JLC E2643 called the Shark or the Vogue?",
    fact: "The E2643 is one reference with two market names: 'Shark Deep Sea' in the US market and 'Vogue Chronograph' in Europe.",
  },
  {
    id: "e2643-signature",
    question: "If a E2643 dial is signed 'LeCoultre' rather than 'Jaeger-LeCoultre', what does that suggest?",
    fact: "A LeCoultre-signed dial generally indicates a US-market example; Jaeger-LeCoultre signatures are associated with European-market examples. It's a strong clue, not a complete authentication rule.",
  },
  {
    id: "e2643-bezels",
    question: "What's the defining feature of the JLC E2643 Shark?",
    fact: "Its defining feature is a system of interchangeable bezels — typically a 60-minute/diving bezel, a telemeter bezel, and a world-time/24-hour bezel.",
  },
  {
    id: "e2643-dial",
    question: "What dial does the E2643 usually have?",
    fact: "Most E2643 examples have a reverse-panda dial (black with light sub-dials); all-black-dial examples exist and are rarer.",
  },

  // ── Rolex Submariner 5512 / 5513 ──
  {
    id: "sub-5512-chronometer",
    question: "Is the Rolex Submariner 5513 a chronometer?",
    fact: "The 5513 is NOT a chronometer (two-line dial); the 5512 is the chronometer-rated reference (four-line dial). That four-line vs two-line text is the quick tell between them.",
  },
  {
    id: "sub-nodate",
    question: "Does the Rolex Submariner 5513 have a date window?",
    fact: "The 5512 and 5513 are no-date Submariners — no date window and no cyclops. The date Submariner of that era is the 1680.",
  },
  {
    id: "sub-crystal",
    question: "Does a vintage Submariner 5513 have a sapphire crystal?",
    fact: "The 5512/5513 are acrylic-crystal-era Submariners with crown guards; they use an acrylic (plexi) crystal, not sapphire.",
  },
];
