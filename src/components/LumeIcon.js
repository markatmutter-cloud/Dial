import React from "react";

// Lumé mark — a simple inverted triangle (watch-hand / lume-pip), white with a
// soft lume glow, on a transparent ground so the host supplies the colour
// behind it. Mark's call: white triangle on a brand-olive circle, proportion
// ~1:1.5 (width:height) — a deep triangle echoing a vintage Rolex hour-hand pip
// — sized at 80% (Mark, demo) with a pale-mint lume halo behind it.
export function LumeIcon({ size = 26, color = "#fff", glow = "#C9FFD6", style }) {
  // 1:1.5 triangle, scaled to 80% about the icon centre (50,50).
  const pts = "29,19 71,19 50,81";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Lumé"
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="lumeGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      {/* lume halo — two passes so the glow actually reads (Mark) */}
      <polygon points={pts} fill={glow} opacity="0.9" filter="url(#lumeGlow)" />
      <polygon points={pts} fill={glow} opacity="0.7" filter="url(#lumeGlow)" />
      {/* crisp mark */}
      <polygon points={pts} fill={color} />
    </svg>
  );
}
