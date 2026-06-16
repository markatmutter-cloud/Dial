import React from "react";

// LumeJourneyGrid — the prompt cards on the Lumé landing (the mockup): an
// icon tile + title + one-line subtitle, in a responsive grid. Tapping a card
// hands its `key` up to the canvas, which morphs into that journey's panel.
//
// JOURNEYS is the single source of truth for the Phase-1 journeys; the canvas
// imports it to map key -> data + voice. All six are backed by data already in
// app memory (no /api/chat round-trip).

const Icon = ({ d, paths }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {paths ? paths : <path d={d} />}
  </svg>
);

const ICONS = {
  latest: <Icon paths={<><path d="M12 3v3" /><path d="M12 18v3" /><path d="M3 12h3" /><path d="M18 12h3" /><path d="M12 8l1.6 2.4L16 12l-2.4 1.6L12 16l-1.6-2.4L8 12l2.4-1.6z" /></>} />,
  missed: <Icon paths={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="2.5" /></>} />,
  got_away: <Icon paths={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>} />,
  saved_sold: <Icon d="M12 20s-7-4.4-7-9.3A3.7 3.7 0 0 1 12 7a3.7 3.7 0 0 1 7 3.7C19 15.6 12 20 12 20z" />,
  auctions_soon: <Icon paths={<><path d="M14 4l6 6" /><path d="M3 21h8" /><path d="M5 13l6-6 4 4-6 6z" /><path d="M11 7l4 4" /></>} />,
  articles: <Icon paths={<><path d="M4 5h12a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2z" /><path d="M8 9h6" /><path d="M8 13h6" /></>} />,
};

export const JOURNEYS = [
  { key: "latest", icon: "latest", label: "Just listed", sub: "The newest watches in" },
  { key: "missed_live", icon: "missed", label: "What I might have missed", sub: "In your taste, not yet saved" },
  { key: "got_away", icon: "got_away", label: "The ones that got away", sub: "Sold before you saved them" },
  { key: "saved_sold", icon: "saved_sold", label: "What I followed that sold", sub: "Your hearts that have sold" },
  { key: "auctions_soon", icon: "auctions_soon", label: "Auctions ending soon", sub: "Lots closing in days" },
  { key: "articles", icon: "articles", label: "Worth reading", sub: "Fresh from the journals" },
];

// The hero's warm one-line, contextual to live counts (Mark: "conversation
// around each"). Used by LumeHeroCard for the lead journey.
export function journeyLine(key, n) {
  switch (key) {
    case "auctions_soon": return n ? `${n} lot${n > 1 ? "s" : ""} about to go under the hammer.` : "Auctions are quiet right now.";
    case "latest": return n ? `${n} just landed. Freshest first.` : "Nothing brand new this minute.";
    case "missed_live": return n ? `${n} in your taste you haven't seen yet.` : "You're caught up on your taste.";
    case "got_away": return n ? `${n} sold before you could save ${n > 1 ? "them" : "it"}.` : "Nothing slipped away lately.";
    case "saved_sold": return n ? `${n} of your saved watches ${n > 1 ? "have" : "has"} sold.` : "None of your saved have sold.";
    case "articles": return n ? `${n} fresh read${n > 1 ? "s" : ""} from the journals.` : "No new reading right now.";
    default: return "";
  }
}

// The small-card live subtitle (count-aware). Falls back to the static `sub`
// when a journey has nothing right now.
export function journeySub(key, n) {
  if (!n) return null;
  switch (key) {
    case "auctions_soon": return `${n} closing soon`;
    case "latest": return `${n} just listed`;
    case "missed_live": return `${n} in your taste`;
    case "got_away": return `${n} this week`;
    case "saved_sold": return `${n} sold`;
    case "articles": return `${n} new`;
    default: return null;
  }
}

export default function LumeJourneyGrid({ journeys = JOURNEYS, onSelect, isMobile }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(240px, 1fr))",
      gap: 12,
    }}>
      {journeys.map((j) => {
        const live = journeySub(j.key, j.count);
        return (
          <button key={j.key} onClick={() => onSelect && onSelect(j.key)} style={{
            display: "flex", alignItems: "flex-start", gap: 12, textAlign: "left",
            border: "0.5px solid var(--border)", background: "var(--surface)", color: "var(--text1)",
            borderRadius: 14, padding: "16px 16px", cursor: "pointer", fontFamily: "inherit",
          }}>
            <span style={{
              flexShrink: 0, width: 34, height: 34, borderRadius: 9,
              background: "var(--brand-olive-tint, rgba(125,134,94,0.14))", color: "var(--brand-olive)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {ICONS[j.icon] || ICONS.latest}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.25 }}>{j.label}</span>
              <span style={{ fontSize: 13, color: live ? "var(--brand-olive)" : "var(--text2)", lineHeight: 1.3, fontWeight: live ? 600 : 400 }}>
                {live || j.sub}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
