import React from "react";
import { render, screen } from "@testing-library/react";
import { Card } from "./Card";

// Smoke tests for the Card component — the dealer/lot card that wraps
// CardShell. Card holds the price/FX/auction-format logic (sold-with-
// historic-price fallback, dealer vs tracked-lot branching, primary-vs-
// native currency display); CardShell owns the frame. The shell tests
// render MOCK grids — Card's display branches never execute in them, so
// these direct renders are its road test. Same pattern as CardShell.test:
// hit each representative branch once.

const baseItem = {
  id: "x1",
  ref: "5512",
  url: "https://example.com/5512",
  source: "Wind Vintage",
  brand: "Rolex",
  model: "Submariner",
  price: 25000,
  currency: "USD",
  img: "https://example.com/img.jpg",
};

describe("Card", () => {
  test("renders a dealer item", () => {
    render(<Card item={baseItem} wished={false} onWish={() => {}} />);
    expect(screen.getByText("5512")).toBeInTheDocument();
  });

  test("renders a sold dealer item (SOLD overlay + historic-price branch)", () => {
    render(
      <Card
        item={{ ...baseItem, sold: true, lastMeaningfulPrice: 22000 }}
        wished={false}
        onWish={() => {}}
      />
    );
    expect(screen.getByText(/SOLD/)).toBeInTheDocument();
  });

  test("renders a tracked auction lot (auction-format branch)", () => {
    render(
      <Card
        item={{
          ...baseItem,
          _isTrackedLot: true,
          _isAuctionFormat: true,
          current_bid: 18000,
          current_bid_usd: 18000,
          estimate_low: 15000,
          estimate_high: 25000,
        }}
        wished={false}
        onWish={() => {}}
      />
    );
    expect(screen.getByText(/CURRENT BID/)).toBeInTheDocument();
  });

  test("renders with a non-USD listing converted to primary USD (FX branch)", () => {
    render(
      <Card
        item={{ ...baseItem, currency: "GBP", price: 20000, priceUSD: 25000 }}
        wished={false}
        onWish={() => {}}
        primaryCurrency="USD"
      />
    );
    expect(screen.getByText("5512")).toBeInTheDocument();
  });

  test("renders without an image (placeholder branch)", () => {
    render(<Card item={{ ...baseItem, img: null }} wished={false} onWish={() => {}} />);
    expect(screen.getByText("5512")).toBeInTheDocument();
  });
});
