import React from "react";
import { render, screen } from "@testing-library/react";
import { ReferenceBrowse } from "./ReferenceBrowse";

// Render-without-crash smoke tests for the reference browse surface.
// Self-contained nav reads window.location; jsdom's clean URL lands on the
// guides landing. 2026-06-03 chrome pass: the spelled-out brand row became a
// Brand pill + chip panel (StandardFilterBar), so brands are asserted via the
// pill + the card kickers ("Rolex · Submariner") instead of standalone tiles.
describe("ReferenceBrowse", () => {
  test("renders the guides landing with the standard filter bar + cards", () => {
    render(<ReferenceBrowse items={[]} />);
    expect(screen.getByText("Reference guides")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Brand/ })).toBeInTheDocument();
    // 2026-07-30: ♥ Saved stopped being a filter pill and became a sub-tab
    // (role="tab"), matching Watches and Articles. Asserting the ROLE is the
    // point of the test — as a `button` it was indistinguishable from the
    // filter pills beside it, which is exactly why nobody found it.
    expect(screen.getByRole("tab", { name: /Saved/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^All$/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Saved/ })).not.toBeInTheDocument();
    // Guide cards carry "BRAND · MODEL LINE" kickers from the node registry.
    expect(screen.getAllByText(/Rolex/).length).toBeGreaterThanOrEqual(1);
  });
});
