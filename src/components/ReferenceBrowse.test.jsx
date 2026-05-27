import React from "react";
import { render, screen } from "@testing-library/react";
import { ReferenceBrowse } from "./ReferenceBrowse";

// Render-without-crash smoke tests for the reference browse surface
// (References landing → brand → model line → leaf / coming-soon). Self-contained
// nav reads window.location; jsdom's clean URL lands on the References landing,
// so the brand tiles from the node registry should render.
describe("ReferenceBrowse", () => {
  test("renders the References landing with brand tiles", () => {
    render(<ReferenceBrowse items={[]} />);
    expect(screen.getByText("Rolex")).toBeInTheDocument();
    expect(screen.getByText("Omega")).toBeInTheDocument();
  });
});
