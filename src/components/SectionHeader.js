// SectionHeader — the ONE header above a Home section row.
//
// Why this exists (B-93, 2026-08-30): Home had two section headers. The
// `SectionStrip` one and a hand-rolled copy for Articles, 40 lines apart in
// the same file, with a different "View all" pill (radius 18 / 13px /
// --border vs radius 999 / 12px / --text2). Same page, two treatments. The
// repo's own rule is that a divergence like that is a missing shared
// component, not a styling nit, so this is the component.
//
// It carries four slots, in the order a reader uses them:
//   eyebrow    — WHERE the row comes from ("DEALER LISTINGS"). Ships only if
//                it says something the heading doesn't; an eyebrow that
//                restates its heading is exactly why eyebrows were pulled in
//                May 2026 ("ON THE FEED" over "Recently added").
//   heading    — the row.
//   count      — the size of the pool behind the row, derived at render.
//                Never a constant: the retired LiveCounts strip died because
//                someone hardcoded a house count and it rotted.
//   descriptor — one clause naming the mechanism AND the destination, which
//                is how this page explains itself without the description
//                paragraph Mark refuses at the top.
//
// `inverted` supports a header on a dark band. No Home section mounts one
// today; kept because the prop pair (headingColor/descriptorColor) is the
// only thing SectionStrip's inverted branch needed from a header.

import React from "react";
import Eyebrow from "./Eyebrow";

export default function SectionHeader({
  eyebrow,
  heading,
  count,
  descriptor,
  onViewAll,
  viewAllLabel = "View all",
  isMobile,
  inverted = false,
  padding,
  rule = false,          // hairline above the header (Home rhythm, step 6)
}) {
  const headingColor = inverted ? "var(--bg)" : "var(--text1)";
  const descriptorColor = inverted ? "var(--text-on-dark-2)" : "var(--text2)";
  const viewAllColor = inverted ? "var(--text-on-dark-1)" : "var(--text2)";
  const header = (
    <div style={{
      display: "flex", alignItems: "baseline", justifyContent: "space-between",
      padding: padding != null ? padding : (isMobile ? "0 16px" : "0 20px"),
      marginBottom: 12, gap: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <Eyebrow
            // Olive, not grey: this is the one place the brand colour can
            // repeat down the page instead of living only in the 50px slab at
            // the top. "ink" is the theme-aware pair, so it survives dark mode.
            tone={inverted ? "secondary" : "ink"}
            style={{ fontSize: 10, letterSpacing: "0.16em", marginBottom: 5 }}
          >
            {eyebrow}
          </Eyebrow>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h2 style={{
            margin: 0,
            fontFamily: "inherit",
            fontSize: isMobile ? 16 : 18,
            fontWeight: 600,
            color: headingColor,
            letterSpacing: "0.01em",
          }}>
            {heading}
          </h2>
          {count != null && (
            <span style={{ fontSize: 12, color: inverted ? "var(--text-on-dark-2)" : "var(--brand-olive-ink)", fontVariantNumeric: "tabular-nums" }}>
              {typeof count === "number" ? count.toLocaleString() : count}
            </span>
          )}
        </div>
        {descriptor && (
          <div style={{ fontSize: 13, color: descriptorColor, marginTop: 4, maxWidth: 520, lineHeight: 1.35 }}>
            {descriptor}
          </div>
        )}
      </div>
      {onViewAll && (
        <div style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <button onClick={onViewAll}
            style={{
              cursor: "pointer", fontFamily: "inherit",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
              padding: "8px 14px", borderRadius: 999,
              border: `0.5px solid ${inverted ? "var(--text-on-dark-3)" : "var(--text2)"}`,
              background: "transparent",
              color: viewAllColor,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
            {viewAllLabel} <span aria-hidden style={{ fontSize: 13 }}>→</span>
          </button>
        </div>
      )}
    </div>
  );
  if (!rule) return header;
  // The rule sits ABOVE the header at full content width. Editorially it is
  // what closes the previous section: without it, four sections separated by
  // equal whitespace read as one continuous stream.
  return (
    <>
      <div aria-hidden style={{
        height: 0,
        borderTop: "0.5px solid var(--border)",
        margin: padding != null ? 0 : (isMobile ? "0 16px 16px" : "0 20px 18px"),
      }} />
      {header}
    </>
  );
}
