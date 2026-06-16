// lumeReasons — the grounded "why is this here" chip for a surfaced card. Mark
// wants every card to say why Lumé put it there, but ONLY reasons we can prove
// from data (saved-search match, moved fast, auction closing soon, in your
// taste, sold comp, just listed). The judgment ones (edge pick, condition
// lesson, rabbit hole) need the AI layer and are deferred — faking them is the
// unearned personalization we're removing.
//
// `source` is which shelf/lead surfaced the card; a couple of reasons refine on
// the item itself (a fast-sold comp reads "Moved fast", a slow one "Sold comp").

const DAY = 86400000;

function soldDays(it) {
  if (!it || !it.firstSeen || !it.soldAt) return null;
  return Math.max(0, Math.round((Date.parse(it.soldAt) - Date.parse(it.firstSeen)) / DAY));
}

export function reasonFor(item = {}, source = "") {
  switch (source) {
    case "saved_search": return "Saved-search match";
    case "auction": return "Auction closing soon";
    case "attention": return "In your taste";
    case "latest": return "Just listed";
    case "comp": {
      const d = soldDays(item);
      return d != null && d <= 2 ? "Moved fast" : "Sold comp";
    }
    default: return "";
  }
}

// A short, human "time on market" line for a card's meta row (the lead evidence
// cards show this so personalization is backed by visible facts).
export function timeOnMarket(item = {}) {
  if (item.sold) {
    const d = soldDays(item);
    if (d === 0) return "Sold same day";
    if (d != null) return `Sold in ${d} day${d !== 1 ? "s" : ""}`;
    return "Sold";
  }
  const t = item.firstSeen ? Date.parse(item.firstSeen) : NaN;
  if (Number.isFinite(t)) {
    const days = Math.max(0, Math.round((Date.now() - t) / DAY));
    if (days <= 0) return "Listed today";
    if (days === 1) return "Listed yesterday";
    return `Live ${days} days`;
  }
  return "";
}
