import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MagazineWatches from "./MagazineWatches";

// Direct coverage for the parallel Watches page (?view=watches). The shell
// tests render MOCK grids and never execute this file, and a Vercel build
// compiles without executing it either — so without this test a ReferenceError
// in the page would ship green (CLAUDE.md, "Tests").
//
// The assertions are the feature-parity checklist: this page is a restyle of
// the Watches chrome, so every control has to be wired to the same App.js
// handler the shells pass, not to a lookalike of its own.

const noop = () => {};
const tabs = [
  { key: "listings", label: "Watches", active: true, onSelect: noop },
  { key: "references", label: "Articles", active: false, onSelect: noop },
];

function props(over = {}) {
  return {
    isMobile: false,
    baseStyle: {},
    tabs,
    authJSX: <span data-testid="auth" />,
    user: { id: "u1" },
    onHome: noop,
    goToSaved: noop,
    listingsSubTab: "live",
    setListingsSubTab: noop,
    setPage: noop,
    setDrawerOpen: noop,
    search: "",
    setSearch: noop,
    openFavPrompt: noop,
    currentIsSaved: false,
    sort: "date",
    setSort: noop,
    minPriceText: "",
    setMinPriceText: noop,
    maxPriceText: "",
    setMaxPriceText: noop,
    filterHearted: false,
    setFilterHearted: noop,
    hasFilters: false,
    resetFilters: noop,
    displayedCount: 1234,
    activeFilterPop: null,
    setActiveFilterPop: noop,
    filterSources: [],
    filterBrands: [],
    filterModels: [],
    toggleSource: noop,
    toggleBrand: noop,
    toggleModel: noop,
    visibleSources: ["Analog Shift", "Phillips"],
    visibleBrands: ["Rolex", "Omega"],
    visibleModels: ["Submariner"],
    DEALER_SOURCES: ["Analog Shift"],
    AUCTION_SOURCES: ["Phillips"],
    MODELS: ["Submariner"],
    SOURCES_SHOW: 8,
    BRANDS_SHOW: 8,
    MODELS_SHOW: 8,
    effectiveSourcesCount: 2,
    effectiveBrandsCount: 2,
    effectiveModelsCount: 1,
    sourcesExpanded: false,
    setSourcesExpanded: noop,
    brandsExpanded: false,
    setBrandsExpanded: noop,
    modelsExpanded: false,
    setModelsExpanded: noop,
    onOpenCalendar: noop,
    gridJSX: <div data-testid="grid" />,
    overlaysJSX: <div data-testid="overlays" />,
    aboutModalOpen: false,
    setAboutModalOpen: noop,
    signInPromptOpen: false,
    setSignInPromptOpen: noop,
    signInWithGoogle: noop,
    primaryCurrency: "USD",
    ...over,
  };
}

describe("MagazineWatches", () => {
  it("renders the chrome, the sub-tabs, the count and the real grid", () => {
    render(<MagazineWatches {...props()} />);
    expect(screen.getByTestId("auth")).toBeInTheDocument();
    expect(screen.getByTestId("grid")).toBeInTheDocument();
    expect(screen.getByTestId("overlays")).toBeInTheDocument();
    for (const label of ["For sale", "Auctions", "Sold", "♡ Saved"]) {
      expect(screen.getByRole("tab", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByText("1,234 watches")).toBeInTheDocument();
  });

  it("routes a sub-tab tap through App's setter and resets paging", () => {
    const setListingsSubTab = jest.fn();
    const setPage = jest.fn();
    render(<MagazineWatches {...props({ setListingsSubTab, setPage })} />);
    fireEvent.click(screen.getByRole("tab", { name: "Sold" }));
    expect(setListingsSubTab).toHaveBeenCalledWith("sold");
    expect(setPage).toHaveBeenCalledWith(1);
  });

  it("types straight into the tab's search state", () => {
    const setSearch = jest.fn();
    render(<MagazineWatches {...props({ setSearch })} />);
    fireEvent.change(screen.getByLabelText("Search watches"), { target: { value: "daytona" } });
    expect(setSearch).toHaveBeenCalledWith("daytona");
  });

  it("keeps the home affordance back to the landing page", () => {
    const onHome = jest.fn();
    render(<MagazineWatches {...props({ onHome })} />);
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(onHome).toHaveBeenCalled();
  });

  it("opens the source panel with the sub-tab-aware chip split", () => {
    const setActiveFilterPop = jest.fn();
    render(<MagazineWatches {...props({ setActiveFilterPop })} />);
    fireEvent.click(screen.getByRole("button", { name: /^Source/ }));
    expect(setActiveFilterPop).toHaveBeenCalled();

    // On "For sale" the auction houses are not offered — they'd only ever
    // empty the grid, same rule the shells apply.
    render(<MagazineWatches {...props({ activeFilterPop: "source" })} />);
    expect(screen.getByRole("button", { name: "Analog Shift" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Phillips" })).toBeNull();
  });

  it("offers the auction calendar only on the Auctions slice", () => {
    const { unmount } = render(<MagazineWatches {...props()} />);
    expect(screen.queryByRole("button", { name: "Auction calendar" })).toBeNull();
    unmount();
    render(<MagazineWatches {...props({ listingsSubTab: "auctions" })} />);
    expect(screen.getByRole("button", { name: "Auction calendar" })).toBeInTheDocument();
  });

  it("hides Saved-only where it could only be a no-op", () => {
    const { unmount } = render(<MagazineWatches {...props({ listingsSubTab: "saved" })} />);
    expect(screen.queryByRole("button", { name: "♡ Saved" })).toBeNull();
    unmount();
    // Signed out there is nothing saved to filter by either.
    render(<MagazineWatches {...props({ user: null })} />);
    expect(screen.queryByRole("button", { name: "♡ Saved" })).toBeNull();
  });

  it("cycles the sort pills the way the shells do", () => {
    const setSort = jest.fn();
    const { unmount } = render(<MagazineWatches {...props({ sort: "date", setSort })} />);
    fireEvent.click(screen.getByRole("button", { name: "Date ↓" }));
    expect(setSort).toHaveBeenCalledWith("date-asc");
    unmount();
    const setSort2 = jest.fn();
    render(<MagazineWatches {...props({ sort: "price-desc", setSort: setSort2 })} />);
    fireEvent.click(screen.getByRole("button", { name: "Price ↓" }));
    expect(setSort2).toHaveBeenCalledWith("price-asc");
  });

  it("shows Clear all only when something is filtering", () => {
    const resetFilters = jest.fn();
    const { unmount } = render(<MagazineWatches {...props()} />);
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
    unmount();
    render(<MagazineWatches {...props({ hasFilters: true, resetFilters })} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(resetFilters).toHaveBeenCalled();
  });
});
