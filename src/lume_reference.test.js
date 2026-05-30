/**
 * JS half of the node-slug parity guard + get_reference behaviour.
 *
 * Tests api/lume_reference.js (the pure, no-SDK half of api/chat.js) directly,
 * so we cover Lumé's reference grounding without importing the Anthropic /
 * Supabase SDKs. Slug cases come from the SAME fixture pytest reads
 * (tests/fixtures/node_slug_cases.json) — JS and Python can't silently drift.
 */
import fs from "fs";
import path from "path";
import {
  nodeSlug,
  nodeAliases,
  getReference,
  readPublicText,
} from "../api/lume_reference.js";

const CASES = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "tests", "fixtures", "node_slug_cases.json"),
    "utf8"
  )
).cases;

describe("node slug — parity with node_slug.py (shared fixture)", () => {
  test.each(CASES)("$brand / $model_line", (c) => {
    expect(nodeSlug(c.brand, c.model_line)).toBe(c.slug);
    expect(nodeAliases(c.brand, c.model_line)).toEqual(c.aliases);
  });
});

describe("getReference — generic synthesis by node slug", () => {
  test("a held reference (5513) resolves its synthesis + marks", () => {
    const r = getReference({ brand: "Rolex", reference: "5513" });
    expect(r.index_matches.length).toBeGreaterThan(0);
    expect(r.synthesis.length).toBeGreaterThan(0);
    const sub = r.synthesis.find((s) => s.node === "submariner");
    expect(sub).toBeTruthy();
    expect(sub.consensus.length).toBeGreaterThan(0);
    // marks (named dial variants) are the per-reference detail we now return.
    expect(sub.marks.length).toBeGreaterThan(0);
    expect(Array.isArray(sub.marks[0].sources)).toBe(true);
  });

  test("legacy bare alias still resolves (rolex-submariner file absent → submariner)", () => {
    const r = getReference({ brand: "Rolex", model_line: "Submariner" });
    expect(r.synthesis.some((s) => s.node === "submariner")).toBe(true);
  });

  test("Speedmaster resolves its node", () => {
    const r = getReference({ brand: "Omega", model_line: "Speedmaster" });
    expect(r.synthesis.some((s) => s.node === "speedmaster")).toBe(true);
  });

  test("a model line with no synthesis returns index match but empty synthesis", () => {
    const r = getReference({ brand: "Rolex", model_line: "Datejust" });
    expect(r.index_matches.length).toBeGreaterThan(0);
    expect(r.synthesis.length).toBe(0);
  });

  test("no filters → no matches (guard against dumping the whole index)", () => {
    expect(getReference({}).index_matches.length).toBe(0);
  });
});

describe("readPublicText — externalised prompt loader", () => {
  test("missing file returns null (so a bad path can't crash the endpoint)", () => {
    expect(readPublicText("definitely_missing_xyz_42.txt")).toBeNull();
  });
  test("the real Lumé prompt loads and looks like the prompt", () => {
    const txt = readPublicText("lume_system_prompt.txt");
    expect(typeof txt).toBe("string");
    expect(txt).toMatch(/Lum/);
  });
});
