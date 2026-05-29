import React from "react";

// Lumé mark — a simple inverted triangle (watch-hand / lume-pip), white on a
// transparent ground so the host supplies the colour behind it. Mark's call:
// white triangle on a brand-olive circle. Proportion ~1:1.5 (width:height) — a
// deep triangle echoing a vintage Rolex hour-hand pip — sized to fill most of
// the circle (the largest 1:1.5 triangle that stays inside the inscribed circle).
export function LumeIcon({ size = 26, color = "#fff", style }) {
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
      <polygon points="24,11 76,11 50,89" fill={color} />
    </svg>
  );
}
