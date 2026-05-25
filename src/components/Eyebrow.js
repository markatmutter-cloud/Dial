// Eyebrow — the small uppercase, letter-spaced label that sits above a
// heading or section. Promotes the pattern flagged in DESIGN_SYSTEM.md
// ("Open promotion candidates") that was re-rolled at ~10 sites (group
// banners, sub-section labels, section eyebrows). One primitive so the
// register stays consistent across the app.
//
// Usage:  <Eyebrow>The story</Eyebrow>
//         <Eyebrow tone="brand" as="h2">At auction</Eyebrow>
//
// tone: "muted" (default, --text3) · "secondary" (--text2) · "brand" (olive)

import React from "react";

const TONE = {
  muted: "var(--text3)",
  secondary: "var(--text2)",
  brand: "var(--brand-olive-text)",
};

export default function Eyebrow({ children, tone = "muted", as = "div", style, ...rest }) {
  const Tag = as;
  return (
    <Tag
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: TONE[tone] || TONE.muted,
        margin: 0,
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
