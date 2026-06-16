import React from "react";
import LumeJourneyGrid from "./LumeJourneyGrid";
import LumeHeroCard from "./LumeHeroCard";

// LumeHome — the warm landing: a personal greeting that NAMES what's notable
// now (the "conversation"), a promoted HERO journey with a content peek, then
// the rest of the journeys as a tighter grid with live count subtitles. The
// free-text composer is rendered by the canvas below this.
export default function LumeHome({ greeting, hero, journeys = [], onSelect, isMobile }) {
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

      {hero && <LumeHeroCard journey={hero} onSelect={onSelect} isMobile={isMobile} />}

      {journeys.length > 0 && (
        <LumeJourneyGrid journeys={journeys} onSelect={onSelect} isMobile={isMobile} />
      )}
    </div>
  );
}
