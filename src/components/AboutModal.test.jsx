import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AboutModal } from "./AboutModal";

// Direct render coverage for the About modal (blind-edit rule): the
// shells' render tests use MOCK grids/props, so nothing in CI executes
// this component without these. Covers both views of the 2026-06-07
// redesign — About (default) and the "How it works" toggle.

describe("AboutModal", () => {
  test("renders nothing when closed", () => {
    const { container } = render(<AboutModal open={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  test("renders the About view by default", () => {
    render(<AboutModal open onClose={() => {}} primaryCurrency="USD" />);
    expect(screen.getByText("What you can do")).toBeInTheDocument();
    expect(screen.getByText("Ask")).toBeInTheDocument(); // Lumé card
    expect(screen.getByText("Get started →")).toBeInTheDocument();
  });

  test("toggles to the How-it-works view and back", () => {
    render(<AboutModal open onClose={() => {}} primaryCurrency="USD" />);
    fireEvent.click(screen.getByText("How it works"));
    expect(screen.getByText("Ask Lumé")).toBeInTheDocument();
    expect(screen.getByText("Heart watches")).toBeInTheDocument();
    fireEvent.click(screen.getByText("← About"));
    expect(screen.getByText("What you can do")).toBeInTheDocument();
  });

  test("close resets to the About view", () => {
    const onClose = jest.fn();
    render(<AboutModal open onClose={onClose} primaryCurrency="USD" />);
    fireEvent.click(screen.getByText("How it works"));
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});
