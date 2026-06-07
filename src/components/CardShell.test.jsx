import React from "react";
import { render, screen } from "@testing-library/react";
import CardShell from "./CardShell";

// Smoke tests for the shared card frame. Added 2026-06-06 after a prod
// ReferenceError ("Can't find variable: aspect") shipped inside the
// CardImage sub-component: the shells' render tests use MOCK grids
// (mockShellProps), so nothing in CI actually rendered a real CardShell
// with an image — the one component every card surface depends on had
// zero direct render coverage. These do the minimum: render with an
// image and without one (placeholder path), both aspects.

describe("CardShell", () => {
  test("renders with an image (square)", () => {
    render(
      <CardShell
        image={{ src: "https://example.com/x.jpg", alt: "x" }}
        href="https://example.com"
        level1={<div>Title</div>}
      />
    );
    expect(screen.getByAltText("x")).toBeInTheDocument();
  });

  test("renders with an image (editorial aspect)", () => {
    render(
      <CardShell
        image={{ src: "https://example.com/y.jpg", alt: "y" }}
        aspect="editorial"
        href="https://example.com"
        level1={<div>Title</div>}
      />
    );
    expect(screen.getByAltText("y")).toBeInTheDocument();
  });

  test("renders the placeholder when there is no image", () => {
    render(<CardShell image={null} href="https://example.com" level1={<div>Title</div>} />);
    expect(screen.getByText(/image not available/i)).toBeInTheDocument();
  });
});
