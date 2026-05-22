// Shared date-divider component for the Listings + Watchlist grids.
//
// The divider spans the full grid width (gridColumn: 1/-1) and is
// position:sticky so it anchors at the top of the viewport while the
// user scrolls through its section. Mark spec 2026-05-22: the previous
// treatment rendered as a grey slab (the grid's `background:
// var(--border)` showed through because the divider didn't paint its
// own surface) and didn't fit the olive chrome zone.
//
// The sticky offset is read from `--sticky-top` on documentElement.
// App.js measures the mobile chrome via useLayoutEffect and sets the
// value; on desktop where the chrome isn't sticky the value stays 0
// and the divider locks at viewport top naturally.
//
// For sticky to actually work, the divider's grid wrapper must NOT
// have `overflow: hidden` — that creates a non-scrolling containment
// block and sticky binds to it instead of the page scroll. Both call
// sites drop overflow/border-radius from their wrappers.
//
// Negative top/bottom margins (-1px) mask the 1px hairline gaps that
// gridStyle's `gap: 1 + background: var(--border)` would otherwise
// render above and below the full-width divider row. Without these,
// the divider looks "framed" by light grey lines. Mark report 2026-
// 05-22: "they all have see through gaps. this has come up maybe 10
// times previously" — the gap is intrinsic to the hairline-grid
// trick; any full-bleed row needs to eat its surrounding gaps the
// same way.

import React from "react";

export default function DateDivider({ label, total, isFirst = false, meta, onClick }) {
  return (
    <div style={{
      gridColumn: "1/-1",
      position: "sticky",
      top: "var(--sticky-top, 0px)",
      zIndex: 5,
      background: "var(--bg)",
      padding: isFirst ? "8px 14px 10px" : "14px 14px 10px",
      borderTop: isFirst ? "none" : "0.5px solid var(--border)",
      borderBottom: "0.5px solid var(--border)",
      // Eat the 1px gridStyle gaps above + below so the divider reads
      // as one continuous band, not a band sandwiched between two
      // hairlines (see comment above).
      marginTop: isFirst ? 0 : -1,
      marginBottom: -1,
      // Sticky-engagement leak fix (Mark report 2026-05-22 "peek
      // through to the image"). When the divider is position:sticky,
      // negative margin doesn't translate into the sticky-positioned
      // rendering — so a 1px sliver of card image bleeds through the
      // grid hairline above the divider. A 2px var(--bg) box-shadow
      // outside the box paints over that sliver without affecting
      // layout.
      boxShadow: "0 -2px 0 var(--bg), 0 2px 0 var(--bg)",
      display: "flex",
      alignItems: "baseline",
      gap: 6,
      cursor: onClick ? "pointer" : "default",
    }}
    onClick={onClick}>
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: "var(--brand-olive-text)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0,
        flex: meta ? 1 : "0 1 auto",
      }}>
        {label}
      </span>
      {total != null && !meta && (
        <span style={{
          fontSize: 12,
          color: "var(--text3)",
          fontVariantNumeric: "tabular-nums",
        }}>
          · {Number(total).toLocaleString()}
        </span>
      )}
      {meta && (
        <span style={{
          fontSize: 12,
          color: "var(--text3)",
          fontVariantNumeric: "tabular-nums",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          {meta}
        </span>
      )}
    </div>
  );
}
