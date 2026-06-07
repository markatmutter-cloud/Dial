import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { HomeTab } from "./HomeTab";

// Direct render coverage for HomeTab (blind-edit rule): the shells'
// render tests use MOCK grids, so nothing in CI executed this
// component before. Added with the 2026-06-07 guides-callout rework
// (ManageCallout → GuidesCallout; goToChallenges/homeCounts removed).

const noop = () => {};

function baseProps(overrides = {}) {
  return {
    homeRecentAdded: [], homeRecentSold: [], homeEndingNext: [],
    homeRecentlyHearted: [], goToSavedHearts: noop,
    homeRecentArticles: [], goToArticles: noop,
    homeDealerSources: [], homeJumpToDealer: noop,
    goToRecentAdded: noop, goToRecentSold: noop, goToEndingNext: noop,
    homeSearchSubmit: noop,
    goToSavedLists: noop, goToMyWatches: noop,
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
    expect(screen.getByText("Reference Guides", { selector: "div" })).toBeInTheDocument();
    expect(screen.getByText(/Browse the guides/)).toBeInTheDocument();
  });

  test("guides CTA fires the masthead guides entry's onSelect", () => {
    const onSelect = jest.fn();
    render(<HomeTab {...baseProps({
      homeMastheadTabs: [
        { key: "guides", label: "Reference Guides", mobileLabel: "Guides", icon: "references", active: false, onSelect },
      ],
    })} />);
    fireEvent.click(screen.getByText(/Browse the guides/));
    expect(onSelect).toHaveBeenCalled();
  });

  test("secondary pills are Watchbox and Lists (no Challenges)", () => {
    const goToMyWatches = jest.fn();
    const goToSavedLists = jest.fn();
    render(<HomeTab {...baseProps({ goToMyWatches, goToSavedLists })} />);
    fireEvent.click(screen.getByText("Watchbox"));
    fireEvent.click(screen.getByText("Lists"));
    expect(goToMyWatches).toHaveBeenCalled();
    expect(goToSavedLists).toHaveBeenCalled();
    expect(screen.queryByText("Challenges")).toBeNull();
  });
});
