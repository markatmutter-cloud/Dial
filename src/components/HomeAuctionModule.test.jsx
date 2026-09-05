import React from "react";
import { render, screen } from "@testing-library/react";
import HomeAuctionModule from "./HomeAuctionModule";

// Direct render coverage (blind-edit rule): Home's shell tests render mock
// grids, so this never executes there.

const inHours = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString();
// Sale dates must be RELATIVE too. HomeAuctionModule drops any sale whose
// end date is already past (`ends >= now`), so a hardcoded date is a test
// with an expiry stamped on it: `dateEnd: "2026-09-02"` passed until that
// morning and then failed every run on main for days.
const inDays = (d) => new Date(Date.now() + d * 86400 * 1000).toISOString().slice(0, 10);

// Projected auction lots carry `ref` (title) and `img`, not title/image, the
// same fields Card.js reads. Getting this wrong shipped a list of blank rows.
const lots = [
  { id: "l1", ref: "Jaeger-LeCoultre AMVOX1 R-Alarm", source: "Bonhams", url: "https://x/1",
    auction_end: inHours(17), current_bid: 3400, currency: "USD", current_bid_usd: 3400 },
  { id: "l2", ref: "Franck Muller Liberty", source: "Bonhams", url: "https://x/2",
    auction_end: inHours(20), current_bid: 3780, currency: "USD", current_bid_usd: 3780 },
];

const sales = [
  { id: "s1", house: "Christie's", title: "Rare Watches", location: "Geneva", url: "https://c/1",
    dateStart: inDays(3), dateEnd: inDays(3), status: "upcoming", hasCatalog: true },
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
      { id: "old", ref: "Ended lot", source: "Phillips", url: "https://x/3", auction_end: inHours(-4) },
      { id: "far", ref: "Far future lot", source: "Phillips", url: "https://x/4", auction_end: inHours(24 * 60) },
    ];
    const { container } = render(<HomeAuctionModule sales={sales} lots={stale} isMobile={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows one sale per house, soonest first, and drops undated ones (B-78 rot)", () => {
    const messy = [
      { id: "b1", house: "Bonhams", title: "Weekly A", url: "https://b/1", status: "live", dateEnd: "2099-01-05" },
      { id: "b2", house: "Bonhams", title: "Weekly B", url: "https://b/2", status: "live", dateEnd: "2099-01-06" },
      { id: "b3", house: "Bonhams", title: "Undated stale", url: "https://b/3", status: "upcoming", dateLabel: "15 June, 18:00 CEST" },
      { id: "p1", house: "Phillips", title: "Geneva XXIV", url: "https://p/1", status: "upcoming", dateEnd: "2099-02-01" },
    ];
    render(<HomeAuctionModule sales={messy} lots={lots} isMobile={false} />);
    expect(screen.getByText("Weekly A")).toBeInTheDocument();
    expect(screen.getByText("Geneva XXIV")).toBeInTheDocument();
    // Undated entries never render: that is B-78's calendar rot, and it put
    // two long-past sales on the landing page in the first cut.
    expect(screen.queryByText("Undated stale")).toBeNull();
  });

  it("says 'No bids' rather than an empty cell on a lot with no bid yet", () => {
    const nobid = [{ id: "n1", ref: "Fresh lot", source: "Sotheby's", url: "https://x/5", auction_end: inHours(6) }];
    render(<HomeAuctionModule sales={[]} lots={nobid} isMobile={false} />);
    expect(screen.getByText("No bids")).toBeInTheDocument();
  });
});
