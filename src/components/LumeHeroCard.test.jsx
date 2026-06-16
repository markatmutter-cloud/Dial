import React from "react";
import { render, screen } from "@testing-library/react";
import LumeHeroCard from "./LumeHeroCard";

// LumeHeroCard isn't exercised by the LumeTab render test (the hero is null
// when the test passes empty data), so give it direct coverage — a build that
// compiles but never executes this would ship a ReferenceError green.
describe("LumeHeroCard", () => {
  test("renders the lead journey line + CTA + a content peek", () => {
    const journey = {
      key: "auctions_soon", label: "Auctions ending soon",
      line: "2 lots about to go under the hammer.",
      thumbItems: [{ id: "a", img: "https://example.com/a.jpg" }, { id: "b" }],
    };
    render(<LumeHeroCard journey={journey} onSelect={() => {}} />);
    expect(screen.getByText("2 lots about to go under the hammer.")).toBeInTheDocument();
    expect(screen.getByText(/Take a look/)).toBeInTheDocument();
    expect(screen.getByText("Auctions ending soon")).toBeInTheDocument();
  });

  test("renders nothing without a journey", () => {
    const { container } = render(<LumeHeroCard journey={null} />);
    expect(container.firstChild).toBeNull();
  });
});
