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

  // The Figma source image is square because the wheel artwork
  // occupies the FULL square at every rotation, but only the
  // upper-half arc shows the moon-of-the-day (the lower half is
  // the back of the wheel — blank / black). Clip to the top half
  // via an overflow-hidden wrapper: container is half-height, img
  // inside renders at full square so only the top is visible.
  // Mark spec 2026-05-21: "just show the top part".
  // Vertical nudge: the moon glyph sits in the lower portion of the
  // clipped top half (Figma source has sky above the moon), so when
  // flex-center-aligned with the wordmark the moon visually hangs
  // BELOW the wordmark baseline. translateY pulls it up by ~30% of
  // its container height so the glyph centers on the wordmark
  // visually. Tune via the `nudge` prop if a Figma re-export shifts
  // the glyph position in the source.
  return (
    <span style={{
      display: "inline-block",
      width: size,
      height: size / 2,
      overflow: "hidden",
      flexShrink: 0,
      lineHeight: 0,
      transform: "translateY(-55%)",
    }}
    title={phaseLabel}
    aria-label={phaseLabel}
    role="img">
      <img
        src={phaseUrl}
        alt=""
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          display: "block",
        }}
      />
    </span>
  );
}
