import { lumeColdOpen, recordVisit, recordJourney, readUsage, rankJourneys } from "./lumeColdOpen";

// The cold open must EXIST for newcomers, EVOLVE for the familiar, and
// DISAPPEAR for veterans (Mark, 2026-06-16) — driven by local usage signals.

describe("lumeColdOpen stages", () => {
  test("newcomer (first visits) gets a hero opener with a sub", () => {
    const c = lumeColdOpen({ visits: 1 }, { heartedCount: 0 });
    expect(c.prominence).toBe("hero");
    expect(c.line).toBeTruthy();
    expect(c.sub).toBeTruthy();
  });

  test("familiar (a few visits) gets a single evolving line, no sub", () => {
    const c = lumeColdOpen({ visits: 5 }, { heartedCount: 3 });
    expect(c.prominence).toBe("line");
    expect(c.sub).toBe("");
  });

  test("the line advances with visit count (not static)", () => {
    const a = lumeColdOpen({ visits: 3 }, {}).line;
    const b = lumeColdOpen({ visits: 4 }, {}).line;
    expect(a).not.toBe(b);
  });

  test("veteran (many visits or many hearts) gets no opener", () => {
    expect(lumeColdOpen({ visits: 20 }, {}).prominence).toBe("hidden");
    expect(lumeColdOpen({ visits: 2 }, { heartedCount: 25 }).prominence).toBe("hidden");
  });

  test("returning after a gap is greeted (non-veteran)", () => {
    const c = lumeColdOpen({ visits: 6, daysAway: 12 }, {});
    expect(c.prominence).toBe("line");
    expect(c.line.toLowerCase()).toMatch(/while you were away|missed|been a little while/);
  });

  test("an auction closing soon earns a line, even for a veteran", () => {
    const c = lumeColdOpen({ visits: 30 }, { auctionsSoon: true });
    expect(c.prominence).toBe("line");
    expect(c.line.toLowerCase()).toMatch(/hammer/);
  });

  test("no em-dashes in any opener copy", () => {
    for (let v = 0; v < 20; v++) {
      const c = lumeColdOpen({ visits: v, daysAway: v % 2 ? 10 : 0 }, { heartedCount: v });
      expect(`${c.line} ${c.sub}`).not.toContain("—");
    }
  });
});

describe("rankJourneys (context-aware ordering)", () => {
  test("an auction closing soon leads with what's under the hammer", () => {
    const r = rankJourneys({}, { auctionsSoonCount: 3 });
    expect(r.order[0]).toBe("auctions_soon");
    expect(r.context).toBe("auction");
  });
  test("back after a week+ leads with the catch-up journeys", () => {
    const r = rankJourneys({ daysAway: 9 }, {});
    expect(r.order.slice(0, 3)).toEqual(["missed_live", "got_away", "saved_sold"]);
    expect(r.context).toBe("catchup");
  });
  test("back within a day leads with fresh stock to browse", () => {
    const r = rankJourneys({ daysAway: 0 }, { visitsLast24h: 1 });
    expect(r.order[0]).toBe("latest");
    expect(r.context).toBe("browse");
  });
  test("several same-day returns read as hunting (search context)", () => {
    const r = rankJourneys({ daysAway: 0 }, { visitsLast24h: 3 });
    expect(r.context).toBe("search");
  });
  test("order always covers all six journeys exactly once", () => {
    for (const sig of [{ auctionsSoonCount: 2 }, { visitsLast24h: 5 }, {}]) {
      const r = rankJourneys({ daysAway: 0 }, sig);
      expect(new Set(r.order).size).toBe(6);
    }
  });
});

describe("usage recording (localStorage)", () => {
  beforeEach(() => { try { localStorage.clear(); } catch {} });

  test("recordVisit increments visits and stamps lastVisit", () => {
    const u1 = recordVisit(Date.parse("2026-06-01T00:00:00Z"));
    expect(u1.visits).toBe(1);
    const u2 = recordVisit(Date.parse("2026-06-10T00:00:00Z"));
    expect(u2.visits).toBe(2);
    expect(u2.daysAway).toBe(9);
  });

  test("a remount within the same session does not double-count", () => {
    const base = Date.parse("2026-06-01T00:00:00Z");
    recordVisit(base);
    const again = recordVisit(base + 5 * 60 * 1000); // 5 min later
    expect(again.visits).toBe(1);
  });

  test("recordJourney tallies per-journey taps", () => {
    recordJourney("latest");
    recordJourney("latest");
    recordJourney("got_away");
    const u = readUsage();
    expect(u.journeys.latest).toBe(2);
    expect(u.journeys.got_away).toBe(1);
  });
});
