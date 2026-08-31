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

  // Dark mode used to `return null` here (interim 2026-05-22): the frames
  // carried an opaque pure-white plate around the arc, which read as a hard
  // white block on the dark page. That was real, and it left the landing page
  // with no brand image at all in dark mode for three months (B-91).
  //
  // Fixed at the source 2026-08-30 rather than in CSS: the 30 frames already
  // had an alpha channel, just with #ffffff filled in behind the artwork, so
  // the plate was flood-filled out from the border at a strict 248 threshold
  // (the plate is pure #ffffff; the moon's lit limb is textured grey well
  // below that, so the fill cannot leak into the art). Composited over white
  // the frames are unchanged to within 7/255 on a single anti-aliased edge,
  // so light mode is untouched. The moon now renders in both themes; `dark`
  // only lifts the art a touch so the navy arc separates from a near-black
  // page instead of sinking into it.

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
          // The arc is a deep navy. On a near-black page it reads as a hole
          // rather than a shape, so lift it slightly. Light mode untouched.
          filter: dark ? "brightness(1.12)" : "none",
        }}
      />
    </span>
  );
}
