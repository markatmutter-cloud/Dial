import React from "react";

// Lumé mark — an inverted lume-pip triangle: a thin cream-patina surround over
// an aged tritium tan→caramel centre, with a soft green lume glow, on the dark
// surface tile. Extracted from Mark's design (Downloads/lume_icon.svg) — the
// clean hero mark only (the labels + size-preview tiles dropped), with the
// viewBox cropped to the 220×220 tile and ids namespaced (lume*) to avoid
// collisions. The dark tile is PART of the mark ("dark bubble, both modes"),
// so render it as the launcher itself rather than inside an olive circle.
export function LumeIcon({ size = 52, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="70 60 220 220"
      role="img"
      aria-label="Lumé"
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="lumePot" cx="50%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#ECDCB0" />
          <stop offset="50%" stopColor="#D6BC88" />
          <stop offset="100%" stopColor="#BF9E63" />
        </radialGradient>
        <filter id="lumeGWide" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="15" /></filter>
        <filter id="lumeGTight" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="8" /></filter>
        <filter id="lumeGMot" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5" /></filter>
        <clipPath id="lumeClip"><polygon points="137.38,97.5 222.62,97.5 180,236.47" /></clipPath>
      </defs>
      <rect x="70" y="60" width="220" height="220" rx="48" fill="#1c1c1e" />
      <polygon points="134,95 226,95 180,245" fill="#86C193" opacity="0.48" filter="url(#lumeGWide)" />
      <polygon points="134,95 226,95 180,245" fill="#D9EAC2" opacity="0.40" filter="url(#lumeGTight)" />
      <polygon points="134,95 226,95 180,245" fill="#E6E0CC" />
      <polygon points="137.38,97.5 222.62,97.5 180,236.47" fill="url(#lumePot)" />
      <g clipPath="url(#lumeClip)">
        <ellipse cx="160" cy="122" rx="24" ry="26" fill="#F1E6C4" opacity="0.40" filter="url(#lumeGMot)" />
        <ellipse cx="199" cy="132" rx="22" ry="26" fill="#CDA968" opacity="0.36" filter="url(#lumeGMot)" />
        <ellipse cx="178" cy="204" rx="36" ry="48" fill="#BC8B4A" opacity="0.34" filter="url(#lumeGMot)" />
        <circle cx="201" cy="166" r="12" fill="#9A7A4A" opacity="0.32" filter="url(#lumeGMot)" />
        <circle cx="163" cy="166" r="10" fill="#F0E4C2" opacity="0.32" filter="url(#lumeGMot)" />
        <circle cx="186" cy="150" r="9" fill="#BFC289" opacity="0.26" filter="url(#lumeGMot)" />
        <ellipse cx="180" cy="218" rx="15" ry="20" fill="#B8995E" opacity="0.30" filter="url(#lumeGMot)" />
      </g>
    </svg>
  );
}
