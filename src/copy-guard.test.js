// Copy-voice guard (Mark, 2026-06-07).
//
// BRAND.md bans the em-dash (—) in product copy: an LLM tell that costs
// credibility even when the sentence is right. A site-wide sweep shipped
// once (#840) and fresh copy reintroduced them within a day — rules that
// live in docs decay; rules that live in checks don't (same escalation
// ladder as chrome-guard.test.js). This scans every src file's rendered
// text for the character.
//
// Allowed (per BRAND.md): the lone "—" as a missing-value placeholder
// glyph in a data slot — a string or JSX text node that is ONLY the
// glyph (e.g. {price || "—"} or <span>—</span>). En-dashes in numeric
// ranges (1965–1970) are a different character and never flagged.
//
// When this fails: fix the COPY (period, comma, colon, semicolon, or
// parentheses), don't widen the allowance. Code comments are stripped
// before scanning and may use em-dashes freely.

const fs = require("fs");
const path = require("path");

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : walk(p);
    return /\.(js|jsx)$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
  });

const findOffenders = (file) => {
  let s = fs.readFileSync(file, "utf8");
  s = s.replace(/\/\*[\s\S]*?\*\//g, "");      // block comments
  s = s.replace(/(^|\s)\/\/[^\n]*/g, "$1");    // line comments ("://" survives)
  const out = [];
  s.split("\n").forEach((line, i) => {
    if (!line.includes("—")) return;
    // Placeholder allowances: a quoted literal, or a JSX text node,
    // consisting only of em-dash / space / middot.
    const stripped = line
      .replace(/(["'`])[\s—·]*\1/g, "")
      .replace(/>\s*—\s*</g, "><");
    if (stripped.includes("—")) {
      out.push(`${path.relative(path.join(__dirname, ".."), file)}:${i + 1}`);
    }
  });
  return out;
};

test("no em-dashes in rendered copy (BRAND.md voice rule)", () => {
  const offenders = walk(__dirname).flatMap(findOffenders);
  expect(offenders).toEqual([]);
});
