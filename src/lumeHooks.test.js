import { buildHook, buildLead } from "./lumeHooks";

describe("buildLead — the Start-here lead with visible evidence", () => {
  const NOW = Date.parse("2026-06-16T12:00:00Z");
  test("saved-search lead exposes the label + matched items + CTAs", () => {
    const savedSearches = [{ label: "Speedmaster", query: "speedmaster" }];
    const liveItems = [{ brand: "Omega", ref: "Speedmaster", sold: true, firstSeen: "2026-06-15", soldAt: "2026-06-16", url: "u1", id: "1" }];
    const lead = buildLead({ savedSearches, liveItems, now: NOW });
    expect(lead.source).toBe("saved_search");
    expect(lead.searchLabel).toBe("Speedmaster");
    expect(lead.items.length).toBeGreaterThan(0);
    expect(lead.primaryCta).toBeTruthy();
  });
  test("falls back got-away -> missed -> cold", () => {
    expect(buildLead({ gotAway: [{ brand: "Rolex" }], now: NOW }).source).toBe("got_away");
    expect(buildLead({ missed: [{ brand: "Tudor" }], now: NOW }).source).toBe("missed_live");
    const cold = buildLead({ now: NOW });
    expect(cold.source).toBe("cold");
    expect(cold.items).toEqual([]);
  });
});

// The perceptive hooks turn real data into a named, "it-knew-that" line. Test
// the real selection logic (not a mock) per the test-the-conversation rule.
const NOW = Date.parse("2026-06-16T12:00:00Z");

describe("buildHook — saved-search activity", () => {
  test("fast sells read as 'sold almost instantly'", () => {
    const savedSearches = [{ label: "Speedmaster", query: "speedmaster" }];
    const liveItems = [
      { brand: "Omega", ref: "Speedmaster Professional", sold: true, firstSeen: "2026-06-15", soldAt: "2026-06-16", priceUSD: 6000 },
    ];
    expect(buildHook({ savedSearches, liveItems, now: NOW }))
      .toBe('A few from your "Speedmaster" search sold almost instantly.');
  });

  test("new listings quote the label (no clumsy pluralizing)", () => {
    const savedSearches = [{ label: "Jackie DateJust", query: "datejust" }];
    const liveItems = [
      { brand: "Rolex", ref: "DateJust 6917", sold: false, firstSeen: "2026-06-15", priceUSD: 9000 },
    ];
    expect(buildHook({ savedSearches, liveItems, now: NOW }))
      .toBe('1 new on your "Jackie DateJust" search.');
  });

  test("respects the saved search's price band", () => {
    const savedSearches = [{ label: "Daytona", query: "daytona", max_price: 30000 }];
    const liveItems = [
      { brand: "Rolex", ref: "Daytona 116500", sold: false, firstSeen: "2026-06-15", priceUSD: 45000 },
    ];
    // over budget -> no saved-search hook -> empty (no other signal)
    expect(buildHook({ savedSearches, liveItems, now: NOW })).toBe("");
  });
});

describe("buildHook — taste-matched catalog", () => {
  test("a house sale full of your lane", () => {
    const tasteBrands = new Set(["rolex"]);
    const auctionLotItems = [
      { brand: "Rolex", house: "Phillips", auction_end: "2026-07-01", sold: false },
      { brand: "Rolex", house: "Phillips", auction_end: "2026-07-01", sold: false },
    ];
    expect(buildHook({ auctionLotItems, tasteBrands, now: NOW }))
      .toBe("There's a Phillips sale with a few you'd probably like.");
  });
});

describe("buildHook — taste hooks", () => {
  test("got-away names the model + how fast it sold", () => {
    const gotAway = [{ brand: "Rolex", model: "Sea-Dweller", firstSeen: "2026-06-15", soldAt: "2026-06-16" }];
    expect(buildHook({ gotAway, missedCount: 3, now: NOW }))
      .toBe("That Rolex Sea-Dweller you'd have liked sold in 1 day, and a few more slipped by.");
  });

  test("missed names a fresh in-lane arrival", () => {
    const missed = [{ brand: "Cartier", model: "Tank" }];
    expect(buildHook({ missed, missedCount: 1, now: NOW }))
      .toBe("A Cartier Tank just surfaced, right in your lane.");
  });
});

describe("buildHook — priority + fallback", () => {
  test("saved-search activity outranks a taste hook", () => {
    const savedSearches = [{ label: "Speedmaster", query: "speedmaster" }];
    const liveItems = [{ brand: "Omega", ref: "Speedmaster", sold: false, firstSeen: "2026-06-15" }];
    const gotAway = [{ brand: "Rolex", model: "Sub", firstSeen: "2026-06-14", soldAt: "2026-06-16" }];
    expect(buildHook({ savedSearches, liveItems, gotAway, missedCount: 2, now: NOW }))
      .toMatch(/your ".*" search/);
  });

  test("falls back to auctions / reading, then empty", () => {
    expect(buildHook({ auctionsSoonCount: 5, now: NOW })).toMatch(/hammer/);
    expect(buildHook({ articlesCount: 3, now: NOW })).toMatch(/reading/);
    expect(buildHook({ now: NOW })).toBe("");
  });

  test("no em-dashes in any hook", () => {
    const savedSearches = [{ label: "Speedmaster", query: "speedmaster" }];
    const liveItems = [{ brand: "Omega", ref: "Speedmaster", sold: true, firstSeen: "2026-06-15", soldAt: "2026-06-16" }];
    expect(buildHook({ savedSearches, liveItems, now: NOW })).not.toContain("—");
  });
});
