import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import MagazineChrome from "./MagazineChrome";

// Direct coverage for the shared chrome. It is the piece two surfaces will
// wear, so a break here breaks both, and shell tests render mock content and
// never execute it.

const noop = () => {};
const tabs = [
  { key: "listings", label: "Watches", active: true, onSelect: noop },
  { key: "guides", label: "Reference Guides", mobileLabel: "Guides", active: false, onSelect: noop },
];

function props(over = {}) {
  return {
    isMobile: false, tabs, authJSX: <span data-testid="auth" />,
    onSavedClick: noop, showSaved: false,
    onSearchSubmit: noop, onSearchLiveQuery: noop, searchCounts: null,
    recentSearches: [], addRecentSearch: noop,
    ...over,
  };
}

describe("MagazineChrome", () => {
  it("renders one search, the tabs and the passed account control", () => {
    const { container } = render(<MagazineChrome {...props()} />);
    expect(container.querySelectorAll(".mag-search").length).toBe(1);
    expect(screen.getByRole("button", { name: "Watches" })).toBeInTheDocument();
    expect(screen.getByTestId("auth")).toBeInTheDocument();
  });

  it("never builds its own account control", () => {
    // Every duplicate-control bug on this page came from the chrome inventing
    // one instead of rendering the app's.
    render(<MagazineChrome {...props({ authJSX: null })} />);
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
    expect(screen.queryByRole("button", { name: "About" })).toBeNull();
  });

  it("uses short tab labels on mobile and long ones on desktop", () => {
    const { rerender } = render(<MagazineChrome {...props()} />);
    expect(screen.getByRole("button", { name: "Reference Guides" })).toBeInTheDocument();
    rerender(<MagazineChrome {...props({ isMobile: true })} />);
    expect(screen.getByRole("button", { name: "Guides" })).toBeInTheDocument();
  });

  it("shows the saved heart only when asked, and carries no count badge", () => {
    // The badge was dropped 2026-09-08 (Mark): the saved count belongs on the
    // destination, not on the way in, and it unbalanced the masthead row.
    const { rerender, container } = render(<MagazineChrome {...props()} />);
    expect(screen.queryByLabelText("Saved watches")).toBeNull();
    rerender(<MagazineChrome {...props({ showSaved: true })} />);
    const heart = within(container).getByLabelText("Saved watches");
    expect(heart).toBeInTheDocument();
    expect(heart.textContent).toBe("");
    expect(container.querySelector(".mag-badge")).toBeNull();
  });

  it("compacts the mobile chrome on scroll", () => {
    const { container } = render(<MagazineChrome {...props({ isMobile: true })} />);
    expect(container.querySelector(".mag-mhead").className).not.toContain("is-compact");
    Object.defineProperty(window, "scrollY", { value: 400, configurable: true });
    fireEvent.scroll(window);
    expect(container.querySelector(".mag-mhead").className).toContain("is-compact");
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });

  it("submits a search through the handler it is given", () => {
    const calls = [];
    render(<MagazineChrome {...props({ onSearchSubmit: (q, t) => calls.push([q, t]) })} />);
    const input = screen.getByLabelText("Search watches");
    fireEvent.change(input, { target: { value: "explorer" } });
    fireEvent.submit(input.closest("form"));
    expect(calls).toEqual([["explorer", "all"]]);
  });
});
