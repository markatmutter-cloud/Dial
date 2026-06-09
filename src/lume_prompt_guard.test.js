/** @jest-environment node */
/**
 * Lumé system-prompt guard — runs in NORMAL CI (no API key, no model call),
 * unlike the live behavioural eval (lume_eval.test.js, LUME_EVAL=1).
 *
 * The live eval is the real tone gate, but it only runs in the dedicated
 * lume-eval workflow. This cheap structural test makes sure the load-bearing
 * voice + grounding rules can't be silently deleted from the externalised
 * prompt (public/lume_system_prompt.txt) by an ordinary edit — the prompt is
 * the only thing standing between Lumé and the "Great data / core hunting
 * grounds / your considering list" tone Mark flagged.
 */
import * as fs from "fs";
import * as path from "path";

const PROMPT = fs.readFileSync(
  path.join(__dirname, "..", "public", "lume_system_prompt.txt"),
  "utf8",
);

describe("Lumé system prompt — voice + grounding invariants", () => {
  const mustContain = [
    ["plain-words / no 'pieces'", /Do NOT call watches "pieces"/i],
    ["open with substance", /OPEN WITH SUBSTANCE/i],
    ["bans chatty filler", /core hunting grounds/i],
    ["no price ladder", /NO PRICE LADDER/i],
    ["bans status language", /starter watch/i],
    ["never invent a user construct", /NEVER invent a user construct/i],
    ["names the considering-list trap", /considering list/i],
    ["concrete watch reasons", /CONCRETE WATCH REASONS/i],
    ["recommendation distance", /RECOMMENDATION DISTANCE/i],
    ["don't pad / graceful floor", /DON'T PAD/i],
    ["missed-this-week workflow excludes saved", /WHAT DID I MISS/i],
    ["link every watch inline", /LINK EVERY WATCH YOU NAME/i],
    ["no self-contradiction on re-search", /isn't in our system/i],
    ["em-dash ban", /NEVER use em-dashes/i],
    ["grounding non-negotiable", /GROUNDING \(non-negotiable\)/i],
    ["search stays filterable", /KEEP THE QUERY FILTERABLE/i],
  ];

  for (const [label, re] of mustContain) {
    test(`keeps the rule: ${label}`, () => {
      expect(PROMPT).toMatch(re);
    });
  }

  test("does not reintroduce the banned hierarchy word 'entry-level' as guidance-for-use", () => {
    // The prompt may NAME "entry-level" only inside its ban list; it must never
    // instruct Lumé to use such framing. Cheap proxy: the word only appears
    // adjacent to a negation/ban marker.
    const idx = PROMPT.toLowerCase().indexOf("entry-level");
    if (idx !== -1) {
      const around = PROMPT.slice(Math.max(0, idx - 60), idx).toLowerCase();
      expect(around).toMatch(/never|no |not |ban|avoid|status language/);
    }
  });
});
