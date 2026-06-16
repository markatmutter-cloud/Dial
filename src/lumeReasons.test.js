/** @jest-environment node */
import { reasonFor, timeOnMarket } from "./lumeReasons";

describe("reasonFor (grounded chips)", () => {
  test("maps each source to its chip", () => {
    expect(reasonFor({}, "saved_search")).toBe("Saved-search match");
    expect(reasonFor({}, "auction")).toBe("Auction closing soon");
    expect(reasonFor({}, "attention")).toBe("In your taste");
    expect(reasonFor({}, "latest")).toBe("Just listed");
  });
  test("comp refines on sale speed", () => {
    expect(reasonFor({ firstSeen: "2026-06-15", soldAt: "2026-06-16" }, "comp")).toBe("Moved fast");
    expect(reasonFor({ firstSeen: "2026-05-01", soldAt: "2026-06-16" }, "comp")).toBe("Sold comp");
    expect(reasonFor({}, "comp")).toBe("Sold comp");
  });
  test("unknown source is empty (no chip)", () => {
    expect(reasonFor({}, "mystery")).toBe("");
    expect(reasonFor({}, "")).toBe("");
  });
});

describe("timeOnMarket", () => {
  test("sold same day / N days", () => {
    expect(timeOnMarket({ sold: true, firstSeen: "2026-06-16", soldAt: "2026-06-16" })).toBe("Sold same day");
    expect(timeOnMarket({ sold: true, firstSeen: "2026-06-14", soldAt: "2026-06-16" })).toBe("Sold in 2 days");
  });
  test("live returns a 'Live/Listed' phrase", () => {
    expect(timeOnMarket({ sold: false, firstSeen: "2026-06-01" })).toMatch(/Live|Listed/);
  });
});
