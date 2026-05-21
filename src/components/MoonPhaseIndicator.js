import React, { useState, useEffect } from "react";
import { moonPhaseImageUrl, moonPhaseName } from "../utils/moonPhase";

// Moon-phase decoration (2026-05-21 v2). Eyebrow above the Home
// WATCHLIST wordmark — its own row, full uncropped square, no
// alignment math against the wordmark baseline. Mark spec after
// iterating on inline placement: cleaner to give it breathing
// room than to wrestle with translateY nudges for each Figma
// re-export.
//
// Refresh tick every 60s so the moon advances naturally if the
// tab stays open across a phase boundary.

export function MoonPhaseIndicator({ size = 56 }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const phaseUrl = moonPhaseImageUrl(now);
  const phaseLabel = moonPhaseName(now);

  return (
    <img
      src={phaseUrl}
      alt=""
      title={phaseLabel}
      aria-label={phaseLabel}
      role="img"
      style={{
        width: size,
        height: size,
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}
