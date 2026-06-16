// lumeColdOpen — the EVOLVING cold open for the Lumé canvas.
//
// Mark's brief (2026-06-16): the single static "what's your watch problem?"
// greeting goes stale fast. The opener should EXIST for newcomers, EVOLVE as
// the user gets familiar, then RECEDE and finally DISAPPEAR for veterans who
// just want the journeys + input. Driven by cheap LOCAL usage signals (visit
// count, hearts, days-away) — no backend. The durable, LLM-personalised opener
// rides on the Supabase Lumé profile/memory store later (Epic 10).
//
// Copy rule: NO em-dashes in any user-facing string (BRAND voice). Plain
// punctuation only.

const USAGE_KEY = "lume_canvas_usage_v1";

function _read() {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    const u = raw ? JSON.parse(raw) : null;
    if (u && typeof u === "object") return u;
  } catch {}
  return { visits: 0, lastVisit: null, journeys: {} };
}

function _write(u) {
  try { localStorage.setItem(USAGE_KEY, JSON.stringify(u)); } catch {}
}

export function readUsage() {
  return _read();
}

function _visitsWithin(times, nowMs, windowMs) {
  return (times || []).filter((t) => Number.isFinite(t) && nowMs - t < windowMs).length;
}

// Call once per canvas mount. Returns the usage record AS OF this visit, with
// `visits` incremented, `daysAway` since the prior visit, and `visitsLast24h`
// (the frequency signal that tells a hunting power-user from a bored daily
// browser). Persists lastVisit + a rolling window of recent visit times. Guards
// against double-count within a short window (a remount inside ~30 min is the
// same visit).
export function recordVisit(nowMs = Date.now()) {
  const u = _read();
  const prev = u.lastVisit ? Date.parse(u.lastVisit) : null;
  const daysAway = prev && Number.isFinite(prev) ? Math.floor((nowMs - prev) / 86400000) : null;
  const sameSession = prev && Number.isFinite(prev) && (nowMs - prev) < 30 * 60 * 1000;
  const visits = (Number(u.visits) || 0) + (sameSession ? 0 : 1);
  let recent = Array.isArray(u.recentVisits) ? u.recentVisits.slice() : [];
  if (!sameSession) recent.push(nowMs);
  recent = recent.filter((t) => Number.isFinite(t)).slice(-8);
  const next = { ...u, visits, lastVisit: new Date(nowMs).toISOString(), recentVisits: recent };
  _write(next);
  return { ...next, daysAway, visitsLast24h: _visitsWithin(recent, nowMs, 86400000) };
}

// Lightweight "how they use Lumé" note: bump a per-journey tap counter. The
// foundation for the durable usage profile (and for ranking the journey cards
// by what this user actually reaches for, later).
export function recordJourney(key) {
  if (!key) return;
  const u = _read();
  const journeys = { ...(u.journeys || {}) };
  journeys[key] = (Number(journeys[key]) || 0) + 1;
  _write({ ...u, journeys });
}

// Rotating picks per stage — indexed by visit count so the line ADVANCES each
// visit (feels like progression, not random noise).
const HERO = [
  { line: "Hi, I'm Lumé.", sub: "Your watch guide. Ask me anything, or start with one of these." },
  { line: "Good to see you again.", sub: "Pick a thread below, or just ask. I'm learning what you like." },
];
const REGULAR = [
  "What are you after today?",
  "Where do you want to go today?",
  "What's caught your eye lately?",
  "Pick up where you left off.",
];
const GAP = [
  "Welcome back. Here's what moved while you were away.",
  "Been a little while. Want to see what you missed?",
];
const AUCTION = [
  "An auction's closing soon. Want to see what's under the hammer?",
  "Lots are about to go under the hammer. Take a look?",
];

// Returns { line, sub, prominence } where prominence is:
//   "hero"   — newcomer: full warm opener
//   "line"   — familiar: one evolving line, no sub
//   "hidden" — veteran: no opener, just journeys + input
export function lumeColdOpen(usage = {}, signals = {}) {
  const visits = Number(usage.visits) || 0;
  const heartedCount = Number(signals.heartedCount) || 0;
  const daysAway = Number(usage.daysAway ?? signals.daysAway) || 0;
  const auctionsSoon = !!signals.auctionsSoon;

  const veteran = visits >= 15 || heartedCount >= 20;
  const regular = visits >= 7;
  const finding = visits >= 3;
  const newcomer = visits <= 2 && !veteran;

  // Newcomer keeps the warm intro (an auction nudge means little before they've
  // built any taste), unless they're somehow returning after a long gap.
  if (newcomer && daysAway < 7) {
    const h = HERO[visits % HERO.length];
    return { line: h.line, sub: h.sub, prominence: "hero" };
  }
  // An auction actually closing soon is actionable for everyone, veteran
  // included — it earns a line even when the opener would otherwise recede.
  if (auctionsSoon) {
    return { line: AUCTION[visits % AUCTION.length], sub: "", prominence: "line" };
  }
  // Returning after a real gap: greet with the catch-up nudge.
  if (daysAway >= 7 && visits > 0) {
    return { line: GAP[visits % GAP.length], sub: "", prominence: "line" };
  }
  // Veteran: the opener disappears, straight to the journeys + input.
  if (veteran) return { line: "", sub: "", prominence: "hidden" };
  // Regular / finding-their-feet: one evolving line, no sub.
  return { line: REGULAR[visits % REGULAR.length], sub: "", prominence: "line" };
}

// buildGreeting — a warm, PERCEPTIVE opener (Mark, 2026-06-16: "warmer", "more
// towards the creepy it-knew-that-so-well feeling"). Two registers:
//   gap return (away 2+ days) -> casual "Hey Mark, it's been a few days." then
//     an offer/hook (his own example voice).
//   same session -> a time-of-day address + the perceptive `hook` (a named,
//     behaviour-aware line built by the canvas from real data, e.g. "That Rolex
//     Sea-Dweller you'd have liked sold in a day").
// The specificity (real model names + behaviour) is what reads as intelligent;
// generic counts kill it. No em-dashes (BRAND voice).
export function buildGreeting({ firstName = "", hour = 12, daysAway = 0, hook = "" } = {}) {
  const name = (firstName || "").trim();
  const nameComma = name ? `, ${name}` : "";
  const away = Number(daysAway) || 0;

  if (away >= 2) {
    const gap = away < 7 ? "a few days" : away < 14 ? "a week or so" : "a while";
    return {
      hello: `Hey${nameComma}, it's been ${gap}.`,
      notable: hook || "Want to see what you've missed and what's changed?",
    };
  }
  const period = hour < 5 ? "Still up" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return {
    hello: `${period}${nameComma}.`,
    notable: hook || "Let's find something worth your time.",
  };
}

// rankJourneys — the most likely thing a user wants changes with context
// (Mark, 2026-06-16). Reorders the journey cards so the lead matches intent:
//   auction closing soon  -> what's under the hammer
//   back after a week+    -> catch up on what you missed
//   back within a day     -> stimulation: just-listed / articles / new catalogs
//   back several times/day -> hunting something specific (search-leaning)
// Returns { order: [journeyKey…], context }. Pure; the canvas supplies the
// live signals (auction proximity from the lot feed, frequency from usage).
export function rankJourneys(usage = {}, signals = {}) {
  const daysAway = Number(usage.daysAway ?? signals.daysAway) || 0;
  const visitsLast24h = Number(signals.visitsLast24h ?? usage.visitsLast24h) || 0;
  const auctionsSoon = (Number(signals.auctionsSoonCount) || 0) > 0;

  const CATCHUP = ["missed_live", "got_away", "saved_sold"];
  const BROWSE = ["latest", "articles", "auctions_soon"];

  if (auctionsSoon) {
    return { order: ["auctions_soon", "latest", "articles", ...CATCHUP], context: "auction" };
  }
  if (daysAway >= 7) {
    return { order: [...CATCHUP, "latest", "articles", "auctions_soon"], context: "catchup" };
  }
  if (visitsLast24h >= 2) {
    // Frequent same-day returns read as hunting — keep fresh stock up top but
    // the always-present search bar is the real lead (handled by the canvas).
    return { order: ["latest", "auctions_soon", "articles", ...CATCHUP], context: "search" };
  }
  // Back within a day, browsing for stimulation: lead with what's new to learn.
  return { order: [...BROWSE, ...CATCHUP], context: "browse" };
}
