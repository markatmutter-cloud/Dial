import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MagazineHome from "./MagazineHome";

// Direct render coverage (blind-edit rule): the shells' tests render mock
// grids, so nothing here executes in them. This is the whole parallel landing
// page, so a ReferenceError would otherwise ship green.

const noop = () => {};
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const listings = [
  { id: "a", brand: "Rolex", ref: "Submariner Ref 14060 Unpolished", source: "Wind Vintage",
    url: "https://x/1", img: "https://img/1.jpg", price: 10900, priceUSD: 10900, currency: "USD",
    reference_id: "14060", model_line: "Submariner" },
  { id: "b", brand: "Patek Philippe", ref: "Calatrava", source: "Analog Shift",
    url: "https://x/2", img: "https://img/2.jpg", price: 22950, priceUSD: 22950, currency: "USD" },
];
const articles = [
  { title: "The Case For Keeping Your Rolex On The Bracelet", url: "https://f/1",
    image: "https://img/a1.jpg", excerpt: "A few weeks ago...", source: "fratello", published_at: "2026-08-26" },
];
const sales = [
  { id: "s1", house: "Christie's", title: "Rare Watches", location: "Geneva", url: "https://c/1",
    status: "upcoming", dateStart: inDays(4), dateEnd: inDays(4) },
  { id: "s2", house: "Bonhams", title: "Long past sale", url: "https://c/2",
    status: "upcoming", dateEnd: inDays(-30) },
];

function props(over = {}) {
  return {
    homeRecentAdded: listings, homeRecentArticles: articles, homeEndingNext: [],
    homeAuctionSales: sales, homeSectionCounts: { live: 4135 },
    goToRecentAdded: noop, goToArticles: noop, homeOpenCalendar: noop, homeOpenSale: null,
    onClickListing: noop, primaryCurrency: "USD", isMobile: false, user: null,
    homeMastheadTabs: [{ key: "listings", label: "Watches", active: true, onSelect: noop }],
    homeSearchSubmit: noop, homeSearchLiveQuery: noop, homeSearchCounts: null,
    homeRecentSearches: [], homeAddRecentSearch: noop, homeAuctionHeroes: {},
    toggleHide: null, isAdmin: false, openAbout: noop, signInWithGoogle: noop,
    watchlist: {}, homeJumpToDealer: noop,
    ...over,
  };
}

describe("MagazineHome", () => {
  it("renders the three sections with real content", () => {
    render(<MagazineHome {...props()} />);
    expect(screen.getByRole("heading", { name: "Recent Articles" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "New Listings This Week" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Auction Calendar" })).toBeInTheDocument();
    expect(screen.getAllByText("Wind Vintage").length).toBeGreaterThan(0);
  });

  it("features the listing it can say the most about, not the newest", () => {
    // The Rolex carries a reference and a model line; the Patek carries
    // neither, so it loses even though it is more expensive.
    render(<MagazineHome {...props()} />);
    expect(screen.getByText("Ref. 14060 · Submariner")).toBeInTheDocument();
  });

  it("drops sales whose date has passed", () => {
    render(<MagazineHome {...props()} />);
    expect(screen.getByText("Rare Watches")).toBeInTheDocument();
    expect(screen.queryByText("Long past sale")).toBeNull();
  });

  it("renders no second saved or account control", () => {
    // The app's own persistent Home overlay already carries both; a duplicate
    // set in this masthead was the doubling Mark spotted on the live page.
    render(<MagazineHome {...props({ user: { email: "mark@mutter.co.uk" } })} />);
    expect(screen.queryByLabelText("Saved watches")).toBeNull();
  });

  it("renders exactly one search", () => {
    // Two of them (masthead and bar) was the doubling on the live page.
    render(<MagazineHome {...props()} />);
    expect(screen.getAllByLabelText("Search watches").length).toBe(1);
  });

  it("renders the tabs once, in the persistent bar", () => {
    // The masthead used to carry its own nav row, so the tabs appeared twice
    // within eight pixels of each other on the live page.
    render(<MagazineHome {...props()} />);
    expect(screen.getAllByRole("button", { name: "Watches" }).length).toBe(1);
  });

  it("previews what each destination holds as you type", () => {
    const seen = [];
    render(<MagazineHome {...props({
      homeSearchLiveQuery: (q) => seen.push(q),
      homeSearchCounts: { all: 90, live: 40, auctions: 30, sold: 20 },
    })} />);
    fireEvent.change(screen.getByLabelText("Search watches"), { target: { value: "submariner" } });
    expect(seen).toContain("submariner");
    expect(screen.getByText("For sale")).toBeInTheDocument();
    expect(screen.getByText("40")).toBeInTheDocument();
  });

  it("offers an admin hide on articles AND listings, and only to admins", () => {
    const { rerender } = render(<MagazineHome {...props()} />);
    expect(screen.queryAllByTitle("Hide from Home").length).toBe(0);
    const hidden = [];
    rerender(<MagazineHome {...props({ isAdmin: true, toggleHide: (i) => hidden.push(i) })} />);
    const buttons = screen.queryAllByTitle("Hide from Home");
    // one per article (hero + tiles) and one per watch (feature + tiles)
    expect(buttons.length).toBeGreaterThan(2);
    buttons[buttons.length - 1].click();
    expect(hidden.length).toBe(1);
  });

  it("ranks the dealer shortcuts by what the user has actually hearted", () => {
    const jumped = [];
    render(<MagazineHome {...props({
      homeJumpToDealer: (n) => jumped.push(n),
      watchlist: {
        a: { source: "Phillips", url: "https://www.phillips.com/x" },
        b: { source: "Phillips", url: "https://www.phillips.com/y" },
        c: { source: "Phillips", url: "https://www.phillips.com/z" },
        d: { source: "Wind Vintage", url: "https://www.windvintage.com/x" },
        e: { source: "Wind Vintage", url: "https://www.windvintage.com/y" },
        f: { source: "Somlo", url: "https://somlolondon.com/x" },
      },
    })} />);
    const chips = screen.getAllByTitle(/saved from/);
    expect(chips[0].textContent).toContain("Phillips");
    expect(chips[1].textContent).toContain("Wind Vintage");
    chips[0].click();
    expect(jumped).toEqual(["Phillips"]);
  });

  it("falls back to who is listing when there are no hearts", () => {
    render(<MagazineHome {...props()} />);
    expect(screen.getAllByTitle(/saved from/).length).toBeGreaterThan(0);
  });

  it("gives article cards a preview, not just a headline", () => {
    render(<MagazineHome {...props()} />);
    expect(screen.getAllByText(/A few weeks ago/).length).toBeGreaterThan(0);
  });

  it("submits the search through the existing Home handler", () => {
    const calls = [];
    render(<MagazineHome {...props({ homeSearchSubmit: (q, target) => calls.push([q, target]) })} />);
    const input = screen.getByLabelText("Search watches");
    // fireEvent.change, not a raw input event: React tracks the value with its
    // own setter and ignores a value assigned directly.
    fireEvent.change(input, { target: { value: "submariner" } });
    fireEvent.submit(input.closest("form"));
    expect(calls.length).toBe(1);
    expect(calls[0][0]).toBe("submariner");
  });

  it("clamps the cover headline so it can't climb out of its scrim", () => {
    // Real failure on live data: a four-line Fratello title rose off the dark
    // band and sat unreadable on a bright dial.
    render(<MagazineHome {...props()} />);
    const style = document.querySelector(".mag style") || document.querySelector("style");
    expect(style.textContent).toContain("-webkit-line-clamp: 3");
  });

  it("renders nothing for a section with no data rather than an empty heading", () => {
    render(<MagazineHome {...props({ homeRecentArticles: [], homeAuctionSales: [] })} />);
    expect(screen.queryByRole("heading", { name: "Recent Articles" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Auction Calendar" })).toBeNull();
    expect(screen.getByRole("heading", { name: "New Listings This Week" })).toBeInTheDocument();
  });
});
