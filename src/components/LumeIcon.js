import React from "react";

// Lumé mark — a simple inverted triangle (watch-hand / lume-pip), white on a
// transparent ground so the host supplies the colour behind it. Mark's call
// (2026-05-29): white triangle on brand-olive in a circle — the earlier
// tan-lume / green-glow tile was dropped, and the triangle sits with comfortable
// padding (~25% smaller than the old mark) inside its container.
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
      <polygon points="18,30 82,30 50,78" fill={color} />
    </svg>
  );
}
