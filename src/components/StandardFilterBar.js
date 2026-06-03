import React from "react";

// StandardFilterBar — THE one filter-bar layout for named, finite surfaces
// (Mark 2026-06-03, the "standard library" chrome pass — P-2/P-4/P-8/P-13).
//
//   desktop: [filter pills · left] [search · CENTERED fixed slot] [right zone] [count · reserved]
//   mobile:  one wrapping pill row + the reserved count (search lives in the
//            shell's sticky search row, or in a caller-provided row above —
//            never a second input inside the bar)
//
// Rules this component ENFORCES so surfaces can't drift apart again:
//  - the search input sits in a fixed, centered grid column — it cannot move
//    or change size as the pill count varies between tabs/sub-tabs (P-2);
//  - the item count renders right-aligned in a reserved-width slot, so a
//    count that arrives a beat late never jogs the layout (P-8/P-16);
//  - ONE search input per surface (P-13): pass `search` here OR rely on the
//    shell search row — never both.
//
// The caller provides the horizontal inset (portal/sticky wrappers already
// carry the surface's edge padding) — the bar itself is inset-agnostic.
export function StandardFilterBar({ pills, search, right, count, isMobile, background = "var(--bg)", expanded = false }) {
  const countSlot = (
    <span style={{
      minWidth: 86, textAlign: "right", flexShrink: 0,
      fontSize: 12, color: "var(--text3)", whiteSpace: "nowrap",
    }}>{count || ""}</span>
  );
  const borderBottom = expanded ? "none" : "0.5px solid var(--border)";
  if (isMobile) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        padding: "6px 0", background, borderBottom,
      }}>
        {pills}
        <span style={{ marginLeft: "auto" }} />
        {right}
        {countSlot}
      </div>
    );
  }
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr minmax(200px, 340px) 1fr",
      alignItems: "center", columnGap: 12,
      padding: "6px 0", background, borderBottom,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
        {pills}
      </div>
      <div style={{ minWidth: 0 }}>{search}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", minWidth: 0 }}>
        {right}
        {countSlot}
      </div>
    </div>
  );
}

// The one search-input recipe for the centered slot — callers spread extra
// per-surface props (value/onChange/placeholder) onto a real <input>.
export const standardSearchInputStyle = {
  width: "100%", minWidth: 0, fontFamily: "inherit", fontSize: 13,
  color: "var(--text1)", background: "transparent",
  border: "0.5px solid var(--border)", borderRadius: 18,
  padding: "6px 14px", outline: "none", boxSizing: "border-box",
};
