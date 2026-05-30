import React from "react";

// Lumé mark — an inverted triangle (watch-hand / lume-pip) in flat aged-tritium
// PATINA (biscuit #D6BC88 — one colour, no edge/gradient — Mark's call) with a
// soft pale-mint lume glow behind, on a transparent ground so the host supplies
// the colour behind. ~1:1.5 (width:height), sized at 80%. Vintage, not "shiny new".
export function LumeIcon({ size = 26, color = "#D6BC88", glow = "#C9FFD6", style }) {
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
      {/* lume halo — two passes so the glow actually reads */}
      <polygon points={pts} fill={glow} opacity="0.9" filter="url(#lumeGlow)" />
      <polygon points={pts} fill={glow} opacity="0.7" filter="url(#lumeGlow)" />
      {/* flat vintage-patina mark — one colour, no edge */}
      <polygon points={pts} fill={color} />
    </svg>
  );
}
