import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LumeLead from "./LumeLead";

// Direct coverage (blind-edit rule): the shell tests don't execute LumeLead, and
// it renders CardShell + the reason chip + CTAs — a ReferenceError would ship green.
jest.mock("./ActionBus", () => ({ resolveItemByUrl: jest.fn(() => null) }));

const lead = {
  eyebrow: "START HERE",
  headline: "A few watches from your saved searches moved quickly.",
  dek: "Useful for calibrating what disappears fast.",
  searchLabel: "Jackie DateJust",
  reasonSource: "saved_search",
  items: [{ id: "1", url: "https://x/1", brand: "Rolex", model: "DateJust", img: "https://x/1.jpg", sold: true, firstSeen: "2026-06-15", soldAt: "2026-06-16", priceUSD: 9000 }],
  primaryCta: "Review what moved",
  secondaryCta: "Ask Lumé why these matter",
};

describe("LumeLead", () => {
  test("renders eyebrow, headline, the saved-search basis, a reason chip, and CTAs", () => {
    const onPrimary = jest.fn();
    render(<LumeLead lead={lead} onPrimary={onPrimary} onSecondary={() => {}} onOpenItem={() => {}} />);
    expect(screen.getByText("START HERE")).toBeInTheDocument();
    expect(screen.getByText(/saved searches moved quickly/)).toBeInTheDocument();
    expect(screen.getByText(/Jackie DateJust/)).toBeInTheDocument();          // basis shown
    expect(screen.getByText("Saved-search match")).toBeInTheDocument();        // reason chip
    fireEvent.click(screen.getByText("Review what moved"));
    expect(onPrimary).toHaveBeenCalled();
  });

  test("cold-start lead (no items) still renders headline + secondary CTA", () => {
    const cold = { eyebrow: "START HERE", headline: "Let's find your lane.", dek: "Heart a few watches.", items: [], primaryCta: null, secondaryCta: "Tell Lumé what you like" };
    render(<LumeLead lead={cold} onPrimary={() => {}} onSecondary={() => {}} />);
    expect(screen.getByText("Let's find your lane.")).toBeInTheDocument();
    expect(screen.getByText("Tell Lumé what you like")).toBeInTheDocument();
  });

  test("renders nothing without a lead", () => {
    const { container } = render(<LumeLead lead={null} />);
    expect(container.firstChild).toBeNull();
  });
});
