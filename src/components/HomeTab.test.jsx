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
    homeFinishingSoon: [], goToFinishingSoon: noop,
    homeFinishingSoonSales: [], onOpenSale: noop,
    homeRecentlyHearted: [], goToSavedHearts: noop,
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
    feedScreenerItemsCount: 0, openFeedScreener: noop,
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

  test("no 'Finishing soon' strip when there are no followed lots closing soon", () => {
    render(<HomeTab {...baseProps({ homeFinishingSoon: [] })} />);
    expect(screen.queryByText("Finishing soon")).toBeNull();
  });

  test("renders the 'Finishing soon' strip when a followed lot is closing soon", () => {
    const lot = {
      id: "lot-1", title: "Rolex Submariner 5513", brand: "Rolex",
      price: 12000, currency: "USD", source: "Sotheby's", house: "Sotheby's",
      url: "https://example.com/lot-1", image: "https://example.com/i.jpg",
      auction_end: "2026-06-16T14:00:00Z", sold: false,
    };
    render(<HomeTab {...baseProps({ user: { id: "u1" }, homeFinishingSoon: [lot] })} />);
    expect(screen.getByText("Finishing soon")).toBeInTheDocument();
  });

  test("renders the followed-auctions tiles when you follow a catalog", () => {
    const sale = {
      url: "https://example.com/auction/1", house: "Sotheby's",
      title: "Important Watches", dateStart: "2026-06-15", dateEnd: "2026-06-15",
      image: "", _heroImg: "", _lotCount: 210,
    };
    render(<HomeTab {...baseProps({ user: { id: "u1" }, homeFinishingSoonSales: [sale] })} />);
    expect(screen.getByText("Auctions you're following")).toBeInTheDocument();
    expect(screen.getByText("Important Watches")).toBeInTheDocument();
  });

  test("the bottom bleed band is gone", () => {
    render(<HomeTab {...baseProps()} />);
    expect(screen.queryByText(/Browse the guides/)).toBeNull();
    expect(screen.queryByText(/Open Watchbox/)).toBeNull();
    expect(screen.queryByText("Challenges")).toBeNull();
  });
});
