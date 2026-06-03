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
    expect(screen.getByRole("button", { name: /Saved/ })).toBeInTheDocument();
    // Guide cards carry "BRAND · MODEL LINE" kickers from the node registry.
    expect(screen.getAllByText(/Rolex/).length).toBeGreaterThanOrEqual(1);
  });
});
