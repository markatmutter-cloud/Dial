import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { EditorialView } from "./EditorialView";

// Direct render coverage for the Articles surface. It had none: the shell
// tests render a MOCK tab body, so nothing here ever executed in jest and a
// ReferenceError would have compiled clean and shipped (CLAUDE.md blind-edit
// rule). Added alongside the 2026-07-30 change that turned the ♥ Saved filter
// pill into a sub-tab.
//
// The corpus fetch is stubbed: the real one hits network URLs that don't
// resolve in jsdom, and the chrome under test renders regardless of it.
//
// A PLAIN function, not jest.fn(): CRA sets `resetMocks: true`, which clears
// every jest.fn implementation before each test, so a jest.fn stub returns
// undefined by the time the component calls it — and `undefined.catch(...)`
// throws inside the load effect.
jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  fetchJsonCached: () => Promise.resolve({}),
}));

const buildProps = (overrides = {}) => ({
  isMobile: false,
  watchlist: {},
  handleWish: () => {},
  search: "",
  setSearch: () => {},
  ...overrides,
});

describe("EditorialView", () => {
  test("renders the Articles surface with Saved as a sub-tab, not a filter pill", () => {
    render(<EditorialView {...buildProps()} />);
    expect(screen.getByText("Articles")).toBeInTheDocument();
    // Saved is a sub-tab (role="tab") sitting above the filter bar. As a pill
    // it was visually identical to Source / Brand, which is why it went
    // unfound for months.
    expect(screen.getByRole("tab", { name: /Saved/ })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^All$/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Saved/ })).not.toBeInTheDocument();
    // The real filter pills stay where they were.
    expect(screen.getByRole("button", { name: /^Source/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Brand/ })).toBeInTheDocument();
  });

  test("selecting the Saved sub-tab does not raise the filter Clear all pill", () => {
    // A sub-tab is a place you are, not a filter you applied — so it must not
    // present itself as something to clear.
    render(<EditorialView {...buildProps()} />);
    fireEvent.click(screen.getByRole("tab", { name: /Saved/ }));
    expect(screen.getByRole("tab", { name: /Saved/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText(/Clear all/)).not.toBeInTheDocument();
  });
});
