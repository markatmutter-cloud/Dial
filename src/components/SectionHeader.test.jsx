import React from "react";
import { render, screen } from "@testing-library/react";
import SectionHeader from "./SectionHeader";

// Direct render coverage (blind-edit rule): SectionHeader is a leaf that the
// shell render tests never execute, and it is now the ONLY section header on
// Home and in SearchResultsView, so a ReferenceError here would ship green.

describe("SectionHeader", () => {
  it("renders heading, eyebrow, count and descriptor", () => {
    render(
      <SectionHeader
        eyebrow="Dealer listings"
        heading="Recently added"
        count={1234}
        descriptor="The newest arrivals across every dealer we follow."
        isMobile={false}
      />
    );
    expect(screen.getByRole("heading", { name: "Recently added" })).toBeInTheDocument();
    expect(screen.getByText("Dealer listings")).toBeInTheDocument();
    expect(screen.getByText("The newest arrivals across every dealer we follow.")).toBeInTheDocument();
    // Counts are localised so a five-figure pool reads as 12,431 not 12431.
    expect(screen.getByText("1,234")).toBeInTheDocument();
  });

  it("omits the optional slots when they are not supplied", () => {
    render(<SectionHeader heading="Articles" isMobile={false} />);
    expect(screen.getByRole("heading", { name: "Articles" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders a count of 0 but not an absent count", () => {
    const { rerender } = render(<SectionHeader heading="Sold" count={0} isMobile={false} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    rerender(<SectionHeader heading="Sold" isMobile={false} />);
    expect(screen.queryByText("0")).toBeNull();
  });

  it("fires onViewAll", () => {
    let fired = 0;
    render(<SectionHeader heading="Recently sold" onViewAll={() => { fired += 1; }} isMobile={false} />);
    screen.getByRole("button").click();
    expect(fired).toBe(1);
  });
});
