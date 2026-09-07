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
    homeSearchSubmit: noop, goToSavedHearts: noop, watchlist: {},
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

  it("hides the saved and account controls when signed out", () => {
    render(<MagazineHome {...props()} />);
    expect(screen.queryByLabelText("Saved watches")).toBeNull();
  });

  it("shows the saved count and the account initial when signed in", () => {
    render(<MagazineHome {...props({
      user: { email: "mark@mutter.co.uk" },
      watchlist: { one: {}, two: {} },
    })} />);
    expect(screen.getByLabelText("Saved watches")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("M")).toBeInTheDocument();
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

  it("renders nothing for a section with no data rather than an empty heading", () => {
    render(<MagazineHome {...props({ homeRecentArticles: [], homeAuctionSales: [] })} />);
    expect(screen.queryByRole("heading", { name: "Recent Articles" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Auction Calendar" })).toBeNull();
    expect(screen.getByRole("heading", { name: "New Listings This Week" })).toBeInTheDocument();
  });
});
