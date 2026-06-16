import React from "react";
import { LumeIcon } from "./LumeIcon";
import LumeJourneyGrid, { JOURNEYS } from "./LumeJourneyGrid";
import { NAME } from "./LumeConversation";

// LumeHome — the landing surface of the canvas: the EVOLVING cold open (hero /
// one line / hidden, per the user's experience stage) above the journey grid.
// The free-text composer is rendered by the canvas below this, always present.
export default function LumeHome({ coldOpen, journeys = JOURNEYS, onSelect, isMobile }) {
  const { line = "", sub = "", prominence = "line" } = coldOpen || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: prominence === "hero" ? 18 : 14 }}>
      {prominence === "hero" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LumeIcon size={26} />
            <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em" }}>
              {line || `Hi, I'm ${NAME}.`}
            </span>
          </div>
          {sub && <div style={{ fontSize: 15, lineHeight: 1.5, color: "var(--text2)" }}>{sub}</div>}
        </div>
      )}

      {prominence === "line" && (
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--text1)" }}>
          {line || "What are you after today?"}
        </div>
      )}

      {/* prominence === "hidden": veterans get no opener, straight to the cards. */}

      <LumeJourneyGrid journeys={journeys} onSelect={onSelect} isMobile={isMobile} />
    </div>
  );
}
