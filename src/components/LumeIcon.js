import React from "react";

// Lumé mark — an inverted triangle (watch-hand / lume-pip) in aged-tritium
// PATINA (cream → biscuit → caramel — Mark's palette) with a soft pale-mint lume
// glow behind, on a transparent ground so the host supplies the colour behind.
// ~1:1.5 (width:height), sized at 80%. Vintage, not the "brand-new shiny" white.
export function LumeIcon({ size = 26, glow = "#C9FFD6", style }) {
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
        <linearGradient id="lumePatina" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ECDCB0" />   {/* cream highlight (top) */}
          <stop offset="55%" stopColor="#D6BC88" />  {/* biscuit (mid) */}
          <stop offset="100%" stopColor="#BF9E63" /> {/* caramel (point) */}
        </linearGradient>
        <filter id="lumeGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      {/* lume halo — two passes so the glow actually reads */}
      <polygon points={pts} fill={glow} opacity="0.9" filter="url(#lumeGlow)" />
      <polygon points={pts} fill={glow} opacity="0.7" filter="url(#lumeGlow)" />
      {/* crisp vintage-patina mark */}
      <polygon points={pts} fill="url(#lumePatina)" />
    </svg>
  );
}
