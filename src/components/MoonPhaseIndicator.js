import React, { useState, useEffect } from "react";
import { moonPhaseImageUrl, moonPhaseName } from "../utils/moonPhase";

// Moon-phase decoration (2026-05-21). Sits beside the Home-page
// "WATCHLIST" wordmark — the combined block reads as a single
// centered brand block with the current lunar phase as a quiet
// decoration on the right. Mark spec: no click, no modal, no
// date label. Just the moon for today.
//
// Refreshes the source every minute via a useEffect timer — cheap,
// only mounted on Home, advances naturally if the user leaves the
// tab open across a phase boundary.

export function MoonPhaseIndicator({ size = 48 }) {
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
      alt={phaseLabel}
      title={phaseLabel}
      style={{
        width: size, height: size,
        display: "block",
        flexShrink: 0,
      }}
    />
  );
}
