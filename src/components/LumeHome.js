import React from "react";
import LumeJourneyGrid from "./LumeJourneyGrid";
import LumeHeroCard from "./LumeHeroCard";

// LumeHome — the warm landing: a personal, perceptive greeting (the
// "conversation"), the top journeys promoted to HERO cards with a content peek,
// then the rest as a tighter grid with live count subtitles. The free-text
// composer is rendered by the canvas below this.
export default function LumeHome({ greeting, heroes = [], journeys = [], onSelect, isMobile }) {
  const { hello = "", notable = "" } = greeting || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {hello && (
          <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.2 }}>
            {hello}
          </div>
        )}
        {notable && (
          <div style={{ fontSize: isMobile ? 14 : 15, lineHeight: 1.5, color: "var(--text2)" }}>{notable}</div>
        )}
      </div>

      {heroes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {heroes.map((h) => (
            <LumeHeroCard key={h.key} journey={h} onSelect={onSelect} isMobile={isMobile} />
          ))}
        </div>
      )}

      {journeys.length > 0 && (
        <LumeJourneyGrid journeys={journeys} onSelect={onSelect} isMobile={isMobile} />
      )}
    </div>
  );
}
