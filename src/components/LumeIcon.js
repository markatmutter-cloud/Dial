import React from "react";

// Lumé mark — a glowing lume PIP: a bright pale-mint dot with a soft radial
// lume glow fading to transparent, on a transparent ground so the host supplies
// the colour behind (the launcher's olive circle). Reads as a lume plot glowing
// in the dark — the literal "Lumé". Replaces the earlier patina triangle.
export function LumeIcon({ size = 26, pip = "#EAFFEF", glow = "#C9FFD6", style }) {
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
        <radialGradient id="lumePipGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={pip} stopOpacity="1" />
          <stop offset="20%" stopColor={glow} stopOpacity="0.95" />
          <stop offset="52%" stopColor={glow} stopOpacity="0.28" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* soft mint lume glow, fading to transparent */}
      <circle cx="50" cy="50" r="50" fill="url(#lumePipGlow)" />
      {/* bright pip core */}
      <circle cx="50" cy="50" r="14" fill={pip} />
    </svg>
  );
}
