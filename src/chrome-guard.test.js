// Chrome-consistency guard (Mark, 2026-06-03 polish session).
//
// The session's diagnosis: chrome consistency kept regressing because the
// rules lived in docs and heads — every surface could hand-roll its own
// header/filter-bar and drift apart one edit at a time (the date-divider gap
// took 4 attempts for the same reason). This test is the ENFORCEMENT layer of
// the escalation ladder (docs → code comment → a test that fails the build,
// per CLAUDE.md "Product QA"): the standard-library contract points below
// CANNOT silently drift, because drifting fails CI.
//
// Same source-scan pattern as service-worker.test.js (the B-21 drift guard).
// When one of these fails, fix the SURFACE to use the shared component/token —
// only change the assertion here if Mark has explicitly changed the rule.

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname);
const COMPONENTS = path.join(__dirname, "components");

const componentFiles = fs.readdirSync(COMPONENTS)
  .filter((f) => f.endsWith(".js") && !f.endsWith(".test.js"));
const srcRootFiles = fs.readdirSync(SRC)
  .filter((f) => f.endsWith(".js") && !f.endsWith(".test.js"));

const readComponent = (f) => fs.readFileSync(path.join(COMPONENTS, f), "utf8");
const readSrc = (f) => fs.readFileSync(path.join(SRC, f), "utf8");

describe("standard-library chrome contract", () => {
  test("FilterRow stays retired — StandardFilterBar is the ONE filter bar", () => {
    // FilterRow was the pre-2026-06-03 primitive; surfaces drifted because it
    // only standardized the outer flex, not the layout (pills/search/count
    // slots). It was deleted in the chrome pass — don't reintroduce it.
    expect(fs.existsSync(path.join(COMPONENTS, "FilterRow.js"))).toBe(false);
    const offenders = componentFiles.filter((f) =>
      /from ["']\.\/FilterRow["']/.test(readComponent(f)));
    expect(offenders).toEqual([]);
  });

  test("PageHeader keeps the one-inset rule (no horizontal self-padding)", () => {
    // P-5/P-6: the container provides the surface inset; the header carrying
    // its own would double-stack (titles at 40px while pills sit at 20) —
    // the exact misalignment class Mark kept reporting.
    const src = readComponent("PageHeader.js");
    expect(src).toContain('padding: isMobile ? "10px 0 13px" : "14px 0 16px"');
  });

  test("top-tab labels live ONLY in topTabs.js (no inline tab arrays)", () => {
    // The labels used to be duplicated inline in DesktopShell + MobileShell +
    // HomeTab — three render sites was exactly how labels drifted. Both the
    // old 3-tab array shape and any new hand-rolled copy must not reappear.
    const offenders = [...componentFiles.map((f) => ["components/" + f, readComponent(f)]),
                       ...srcRootFiles.filter((f) => f !== "topTabs.js").map((f) => [f, readSrc(f)])]
      .filter(([, src]) => /\[\s*\[\s*["']listings["']\s*,\s*["']Watches["']/.test(src))
      .map(([name]) => name);
    expect(offenders).toEqual([]);
  });

  test('no UI label says "Hearted" — the word is "Saved" (+ heart icon)', () => {
    // Mark's standing naming rule (2026-06-03): internal names (heartedOnly,
    // HeartedView, watchHearted…) are fine; user-facing labels are not.
    const uiHearted = /♥ Hearted|♡ Hearted|>Hearted</;
    const offenders = [...componentFiles.map((f) => ["components/" + f, readComponent(f)]),
                       ...srcRootFiles.map((f) => [f, readSrc(f)])]
      .filter(([, src]) => uiHearted.test(src))
      .map(([name]) => name);
    expect(offenders).toEqual([]);
  });

  test("shells render top tabs from the shared topTabs model", () => {
    for (const shell of ["DesktopShell.js", "MobileShell.js"]) {
      const src = readComponent(shell);
      expect(src).toContain("topTabs");
    }
    // HomeTab's masthead consumes the same model via homeMastheadTabs.
    expect(readComponent("HomeTab.js")).toContain("homeMastheadTabs");
  });
});
