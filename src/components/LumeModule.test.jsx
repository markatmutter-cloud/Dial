import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LumeModule from "./LumeModule";

// Direct coverage for the curated shelf (eyebrow/heading/dek/CTA + CardStrip).
describe("LumeModule", () => {
  const items = [{ id: "a" }, { id: "b" }];
  const renderCard = (it) => <div data-testid="card">{it.id}</div>;

  test("renders editorial framing + cards + CTA", () => {
    const onCta = jest.fn();
    render(<LumeModule eyebrow="USEFUL COMPS" heading="What moved, and how fast" dek="Recent sold examples."
      items={items} count={42} renderCard={renderCard} ctaLabel="See comps" onCta={onCta} />);
    expect(screen.getByText("USEFUL COMPS")).toBeInTheDocument();
    expect(screen.getByText("What moved, and how fast")).toBeInTheDocument();
    expect(screen.getAllByTestId("card")).toHaveLength(2);
    expect(screen.getByText("42 total")).toBeInTheDocument(); // count demoted to meta
    fireEvent.click(screen.getByText("See comps"));
    expect(onCta).toHaveBeenCalled();
  });

  test("renders nothing with no items", () => {
    const { container } = render(<LumeModule heading="Empty" items={[]} renderCard={renderCard} />);
    expect(container.firstChild).toBeNull();
  });
});
