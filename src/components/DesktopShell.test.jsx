import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { DesktopShell } from "./DesktopShell";
import { buildMockShellProps } from "./__fixtures__/mockShellProps";

// Symmetric smoke tests for the desktop render path. Same logic as
// MobileShell.test — render-without-crash is the highest-value
// assertion until we have specific behavior worth pinning.

describe("DesktopShell", () => {
  test("renders without crashing on a default empty session", () => {
    // jsdom defaults window.innerWidth to 1024 — below the wordmark
    // collision guard's 1280px threshold (the centered mark collapses
    // to its ⌂ icon at laptop widths so it can't overlap the tabs).
    // Render wide so the full wordmark is the thing under test.
    window.innerWidth = 1440;
    render(<DesktopShell {...buildMockShellProps()} />);
    // The "Watchlist" home-link button anchors the top bar.
    const watchlistButtons = screen.getAllByText("Watchlist");
    expect(watchlistButtons.length).toBeGreaterThanOrEqual(1);
  });

  test("collapses the wordmark to the home icon below 1280px (collision guard)", () => {
    window.innerWidth = 1100;
    render(<DesktopShell {...buildMockShellProps()} />);
    // Wordmark text gone; the home button itself survives at every width.
    expect(screen.queryByText("Watchlist")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Home").length).toBeGreaterThanOrEqual(1);
  });

  test("renders the four main tabs (Watches / Articles / Reference Guides / Lists)", () => {
    render(<DesktopShell {...buildMockShellProps()} />);
    // 2026-07-30: the "Saved" tab became "Lists" and moved LAST, after
    // Reference Guides — everything saved now lives on its own content tab,
    // so what's left here is lists. Desktop shows the full "Reference Guides"
    // label (mobile shows "Guides"). Labels come from src/topTabs.js.
    expect(screen.getAllByText("Watches").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Lists").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Articles").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Reference Guides")).toBeInTheDocument();
    // Retired labels stay retired.
    expect(screen.queryByText("Collecting")).not.toBeInTheDocument();
    expect(screen.queryByText("Collections")).not.toBeInTheDocument();
    expect(screen.queryByText("Learn")).not.toBeInTheDocument();
    expect(screen.queryByText("Share")).not.toBeInTheDocument();
  });

  test("renders the filter row on Listings tab", () => {
    render(<DesktopShell {...buildMockShellProps({ tab: "listings" })} />);
    // Filter row's Source pill is a stable anchor — it's always present
    // on the Listings tab regardless of state.
    expect(screen.getByRole("button", { name: /^Source/ })).toBeInTheDocument();
  });

  test("hides the filter row on the Lists landing (nothing filterable there)", () => {
    // 2026-07-30: the Lists tab has one surface. Only a drilled-in list is a
    // filterable grid; the landing (lists + searches + shared sections) isn't.
    render(<DesktopShell {...buildMockShellProps({
      tab: "watchlist",
      watchTopTab: "lists",
    })} />);
    expect(screen.queryByRole("button", { name: /^Source/ })).not.toBeInTheDocument();
  });

  // Watches > ♡ Saved (2026-07-30 IA move). The whole point of the sub-tab is
  // that the standard filter bar applies to the saved set, so these pin the
  // two things that would quietly undo it: the bar disappearing, and the
  // ♥ Saved-only pill surviving into a view where it can only be a no-op.
  test("Saved sub-tab: filter bar renders, ♥ Saved-only pill does not", () => {
    window.innerWidth = 1440;
    render(<DesktopShell {...buildMockShellProps({
      tab: "listings",
      listingsSubTab: "saved",
      watchlist: { abc: { id: "abc" } },
    })} />);
    expect(screen.getByRole("button", { name: /^Source/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Brand/ })).toBeInTheDocument();
    expect(screen.queryByTitle("Show only saved")).not.toBeInTheDocument();
  });

  test("Saved sub-tab with nothing saved: filter bar suppressed (U-11)", () => {
    // No filter can change an empty list — the empty state owns the screen.
    window.innerWidth = 1440;
    render(<DesktopShell {...buildMockShellProps({
      tab: "listings",
      listingsSubTab: "saved",
      watchlist: {},
    })} />);
    expect(screen.queryByRole("button", { name: /^Source/ })).not.toBeInTheDocument();
  });

  test("renders the listings tab content on the Listings tab", () => {
    render(<DesktopShell {...buildMockShellProps({ tab: "listings" })} />);
    expect(screen.getByTestId("listings-tab-content")).toBeInTheDocument();
  });

  test("auction-catalog full-page takeover: green bar replaces the top nav, filter stays", () => {
    // Mark 2026-06-13: drilling into a sale promotes the catalogue to a
    // full-page surface — the shell suppresses the top nav bar + sub-tabs and
    // renders the App-built green bar (catalogBarJSX) + action row; the filter
    // row + grid stay.
    window.innerWidth = 1440;
    render(<DesktopShell {...buildMockShellProps({
      tab: "listings",
      listingsSubTab: "auctions",
      catalogFullPage: true,
      catalogBarJSX: <div data-testid="catalog-bar">The New York Auction: XIV</div>,
      catalogActionRowJSX: <div data-testid="catalog-actions" />,
    })} />);
    expect(screen.getByTestId("catalog-bar")).toBeInTheDocument();
    expect(screen.getByTestId("catalog-actions")).toBeInTheDocument();
    // Top nav suppressed: main tabs + wordmark gone.
    expect(screen.queryByText("Reference Guides")).not.toBeInTheDocument();
    expect(screen.queryByText("Watchlist")).not.toBeInTheDocument();
    // Filter row stays (catalogue is still a filterable grid).
    expect(screen.getByRole("button", { name: /^Source/ })).toBeInTheDocument();
    // The lot grid still renders.
    expect(screen.getByTestId("listings-tab-content")).toBeInTheDocument();
  });

  test("renders the watchlist tab content on Watchlist tab", () => {
    render(<DesktopShell {...buildMockShellProps({ tab: "watchlist" })} />);
    expect(screen.getByTestId("watchlist-tab")).toBeInTheDocument();
  });

  test("renders the collections-style content on Saved > my-collection sub-tab", () => {
    // Bundle 2A.2 (2026-05-07): Collections collapsed into Saved.
    // The dispatch in App.js maps watchTopTab=my-collection (and the
    // other collections-style subs) to the CollectionsTab content,
    // surfaced via the `watchlistTabJSX` prop slot. The mock fixture
    // sets `watchlistTabJSX` to the dispatched value; testing the
    // dispatch itself requires App.js, so here we just confirm the
    // content area renders the expected mock testid.
    render(<DesktopShell {...buildMockShellProps({
      tab: "watchlist",
      watchTopTab: "my-collection",
      // Simulate App.js's dispatch by passing collections content
      // through watchlistTabJSX (the prop name shells render).
      watchlistTabJSX: <div data-testid="collections-tab" />,
    })} />);
    expect(screen.getByTestId("collections-tab")).toBeInTheDocument();
  });

  // Saved-search recall (2026-07-30): the search box offers your saved
  // searches when it's focused and empty. Save (the heart inside the box) and
  // recall now sit on the same control.
  test("Saved-search recall: panel opens on focus of an empty search", () => {
    window.innerWidth = 1440;
    render(<DesktopShell {...buildMockShellProps({
      tab: "listings",
      savedSearches: [{ id: "s1", label: "Explorer under 8k", query: "explorer" }],
    })} />);
    expect(screen.queryByRole("listbox", { name: "Saved searches" })).not.toBeInTheDocument();
    fireEvent.focus(screen.getByLabelText("Search"));
    expect(screen.getByRole("listbox", { name: "Saved searches" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Explorer under 8k/ })).toBeInTheDocument();
  });

  test("Saved-search recall: stays shut once the user has typed", () => {
    // The panel is a recall affordance for an EMPTY box, not an autocomplete —
    // it must never cover results while you're typing a query.
    window.innerWidth = 1440;
    render(<DesktopShell {...buildMockShellProps({
      tab: "listings",
      search: "submariner",
      savedSearches: [{ id: "s1", label: "Explorer under 8k", query: "explorer" }],
    })} />);
    fireEvent.focus(screen.getByLabelText("Search"));
    expect(screen.queryByRole("listbox", { name: "Saved searches" })).not.toBeInTheDocument();
  });

  test("Saved-search recall: choosing one runs it", () => {
    window.innerWidth = 1440;
    const runs = [];
    render(<DesktopShell {...buildMockShellProps({
      tab: "listings",
      savedSearches: [{ id: "s1", label: "Explorer under 8k", query: "explorer" }],
      runSearch: (s) => runs.push(s.id),
    })} />);
    fireEvent.focus(screen.getByLabelText("Search"));
    // mouseDown, not click: the handler deliberately fires before blur.
    fireEvent.mouseDown(screen.getByRole("option", { name: /Explorer under 8k/ }));
    expect(runs).toEqual(["s1"]);
  });

  test("Saved-search recall: not offered on a non-Watches filterable surface", () => {
    // A saved search applies a query + price band and lands you on Watches >
    // For sale, so offering it from a drilled-in list would promise the wrong
    // destination. The drill-in is the right probe here: it's the one non-
    // Watches surface that still renders the shell filter bar, so the search
    // input exists and only the gating decides.
    window.innerWidth = 1440;
    render(<DesktopShell {...buildMockShellProps({
      tab: "watchlist",
      watchTopTab: "lists",
      colDrillInId: "col-1",
      savedSearches: [{ id: "s1", label: "Explorer under 8k", query: "explorer" }],
    })} />);
    fireEvent.focus(screen.getByLabelText("Search"));
    expect(screen.queryByRole("listbox", { name: "Saved searches" })).not.toBeInTheDocument();
  });
});
