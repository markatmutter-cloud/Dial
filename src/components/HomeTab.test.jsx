import React from "react";
import { render, screen } from "@testing-library/react";
import { HomeTab } from "./HomeTab";

// Direct render coverage for HomeTab (blind-edit rule): the shells'
// render tests use MOCK grids, so nothing in CI executed this
// component before. Added with the 2026-06-07 Home rework that
// removed the bottom bleed band (ManageCallout/GuidesCallout) and the
// goToChallenges / goToSavedLists / goToMyWatches / homeCounts props.

const noop = () => {};

function baseProps(overrides = {}) {
  return {
    homeRecentAdded: [], homeRecentSold: [], homeEndingNext: [],
    homeRecentArticles: [], goToArticles: noop,
    homeDealerSources: [], homeJumpToDealer: noop,
    goToRecentAdded: noop, goToRecentSold: noop, goToEndingNext: noop,
    homeSearchSubmit: noop,
    openAbout: noop, signInWithGoogle: noop,
    isMobile: false,
    watchlist: [], hidden: [], handleWish: noop, toggleHide: noop,
    primaryCurrency: "USD",
    onShare: noop, onView: noop, onClickListing: noop,
    openCollectionPicker: noop, isAdmin: false,
    user: null, compact: false,
    homeSectionCounts: { live: 1234, sold: 567, endingNext: 89 },
    homeAuctionSales: [], homeOpenSale: noop, homeOpenCalendar: noop,
    dark: false,
    homeMastheadTabs: [
      { key: "listings", label: "Watches", mobileLabel: "Watches", icon: "listings", active: false, onSelect: noop },
      { key: "guides", label: "Reference Guides", mobileLabel: "Guides", icon: "references", active: false, onSelect: noop },
    ],
    homeMastheadAuthJSX: null,
    homeRecentSearches: [],
    homeAddRecentSearch: noop,
    homeRemoveRecentSearch: noop,
    homeSearchCounts: null,
    homeSearchLiveQuery: noop,
    ...overrides,
  };
}

describe("HomeTab", () => {
  test("renders with empty data", () => {
    render(<HomeTab {...baseProps()} />);
    // Masthead tab from the shared model renders.
    expect(screen.getByText("Reference Guides")).toBeInTheDocument();
  });

  test("the finishing-soon Home section is gone (both strips removed 2026-06-18)", () => {
    render(<HomeTab {...baseProps({ user: { id: "u1" } })} />);
    expect(screen.queryByText("Finishing soon")).toBeNull();
    expect(screen.queryByText("Auctions you're following")).toBeNull();
  });

  test("the bottom bleed band is gone", () => {
    render(<HomeTab {...baseProps()} />);
    expect(screen.queryByText(/Browse the guides/)).toBeNull();
    expect(screen.queryByText(/Open Watchbox/)).toBeNull();
    expect(screen.queryByText("Challenges")).toBeNull();
  });
});
