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

export function MoonPhaseIndicator({ size = 56, dark = false }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Hide in dark mode (interim 2026-05-22): the source PNGs ship
  // with opaque white backgrounds that read as a hard white block
  // against the dark page bg (Mark report 2026-05-22). Re-enable
  // once the PNGs are re-exported with transparent alpha.
  if (dark) return null;

  const phaseUrl = moonPhaseImageUrl(now);
  const phaseLabel = moonPhaseName(now);

  // The source PNGs are 600×600 with the arc + moon occupying roughly
  // y=18%..50% of the image height — the top 18% and bottom 50% are
  // transparent padding. Earlier v2 clipped to top half, which still
  // left ~18% of dead pixels ABOVE the arc, reading as a chunk of
  // empty space between the URL bar and the eyebrow (Mark report
  // 2026-05-21). Tighter crop: container height ≈ 32% of size, image
  // shifted up by 18% of size via negative margin so the arc lands at
  // the visible top edge. Halves the eyebrow's vertical footprint and
  // removes the dead-space jitter without re-exporting any PNGs.
  const containerH = Math.round(size * 0.32);
  const topClip    = Math.round(size * 0.18);
  return (
    <span
      title={phaseLabel}
      aria-label={phaseLabel}
      role="img"
      style={{
        display: "inline-block",
        width: size,
        height: containerH,
        overflow: "hidden",
        flexShrink: 0,
        lineHeight: 0,
      }}>
      <img
        src={phaseUrl}
        alt=""
        aria-hidden="true"
        style={{
          width: size,
          height: size,
          display: "block",
          marginTop: -topClip,
        }}
      />
    </span>
  );
}
