import React from "react";
import { render, screen } from "@testing-library/react";
import HomeAuctionModule from "./HomeAuctionModule";

// Direct render coverage (blind-edit rule): Home's shell tests render mock
// grids, so this never executes there.

const inHours = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();

const lots = [
  { id: "l1", title: "Jaeger-LeCoultre AMVOX1 R-Alarm", source: "Bonhams", url: "https://x/1",
    auction_end: inHours(17), current_bid: 3400, currency: "USD", current_bid_usd: 3400 },
  { id: "l2", title: "Franck Muller Liberty", source: "Bonhams", url: "https://x/2",
    auction_end: inHours(20), current_bid: 3780, currency: "USD", current_bid_usd: 3780 },
];

const sales = [
  { id: "s1", house: "Christie's", title: "Rare Watches", location: "Geneva", url: "https://c/1",
    dateStart: "2026-09-02", dateEnd: "2026-09-02", status: "upcoming", hasCatalog: true },
];

describe("HomeAuctionModule", () => {
  it("renders the closing lots with a bid and a countdown", () => {
    render(<HomeAuctionModule sales={sales} lots={lots} isMobile={false} primaryCurrency="USD" />);
    expect(screen.getByText("Jaeger-LeCoultre AMVOX1 R-Alarm")).toBeInTheDocument();
    // fmtLotPrice renders native-currency amounts as "USD 3,400", the same
    // string Card.js puts under "CURRENT BID". Kept identical on purpose.
    expect(screen.getByText("USD 3,400")).toBeInTheDocument();
    // Regex, not "17h left": fmtCountdown floors the remainder, and the few
    // ms between building the fixture and rendering it drop 17h to 16h.
    expect(screen.getByText(/^1[67]h left$/)).toBeInTheDocument();
  });

  it("renders the upcoming sale with its date", () => {
    render(<HomeAuctionModule sales={sales} lots={lots} isMobile={false} />);
    expect(screen.getByText("Rare Watches")).toBeInTheDocument();
    expect(screen.getByText("Geneva")).toBeInTheDocument();
    // The house NAME is the point of this row: a visitor recognises it.
    expect(screen.getByText("Christie's")).toBeInTheDocument();
  });

  it("renders nothing at all when no lot is closing", () => {
    const { container } = render(<HomeAuctionModule sales={sales} lots={[]} isMobile={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("drops lots that have already ended and ones beyond the horizon", () => {
    const stale = [
      { id: "old", title: "Ended lot", source: "Phillips", url: "https://x/3", auction_end: inHours(-4) },
      { id: "far", title: "Far future lot", source: "Phillips", url: "https://x/4", auction_end: inHours(24 * 60) },
    ];
    const { container } = render(<HomeAuctionModule sales={sales} lots={stale} isMobile={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("says 'No bids' rather than an empty cell on a lot with no bid yet", () => {
    const nobid = [{ id: "n1", title: "Fresh lot", source: "Sotheby's", url: "https://x/5", auction_end: inHours(6) }];
    render(<HomeAuctionModule sales={[]} lots={nobid} isMobile={false} />);
    expect(screen.getByText("No bids")).toBeInTheDocument();
  });
});
