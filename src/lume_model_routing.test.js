/** @jest-environment node */
/**
 * chooseModel routing + the temporary LUME_FORCE_SMART_MODEL diagnostic switch
 * (Mark 2026-06-16). Imports from api/lume_reference (the SDK-free half) so it
 * runs in normal CI without loading the Anthropic SDK / chat.js.
 */
import { chooseModel, MODEL_FAST, MODEL_SMART } from "../api/lume_reference";

const ORIG = process.env.LUME_FORCE_SMART_MODEL;
afterEach(() => {
  if (ORIG === undefined) delete process.env.LUME_FORCE_SMART_MODEL;
  else process.env.LUME_FORCE_SMART_MODEL = ORIG;
});

describe("chooseModel — default routing (switch unset)", () => {
  beforeEach(() => { delete process.env.LUME_FORCE_SMART_MODEL; });

  test("short grounded question routes to the fast model", () => {
    expect(chooseModel("does the 5513 have a date window")).toBe(MODEL_FAST);
    expect(chooseModel("hi")).toBe(MODEL_FAST);
  });

  test("compare / why / recommend intents route to the smart model", () => {
    expect(chooseModel("compare the 5512 vs 5513")).toBe(MODEL_SMART);
    expect(chooseModel("why is this one twice the price")).toBe(MODEL_SMART);
    expect(chooseModel("which one should I buy")).toBe(MODEL_SMART);
  });

  test("a very long prompt routes to the smart model", () => {
    expect(chooseModel("a ".repeat(220))).toBe(MODEL_SMART); // > 400 chars
  });
});

describe("LUME_FORCE_SMART_MODEL diagnostic switch", () => {
  test("when 'true', forces the smart model for ANY input", () => {
    process.env.LUME_FORCE_SMART_MODEL = "true";
    expect(chooseModel("hi")).toBe(MODEL_SMART);
    expect(chooseModel("does the 5513 have a date window")).toBe(MODEL_SMART);
  });

  test("default behaviour is unchanged when unset", () => {
    delete process.env.LUME_FORCE_SMART_MODEL;
    expect(chooseModel("hi")).toBe(MODEL_FAST);
  });

  test("only the exact string 'true' enables it (not other truthy values)", () => {
    process.env.LUME_FORCE_SMART_MODEL = "1";
    expect(chooseModel("hi")).toBe(MODEL_FAST);
  });
});
