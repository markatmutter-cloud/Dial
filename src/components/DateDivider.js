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
// **Gap-mask via absolute-positioned child elements** (PR 2026-05-22
// after #524's box-shadow approach proved insufficient — Mark report
// "still got a gap on the headers"). The earlier strategies failed
// because:
//   - Negative margin (-1px) only covers the gap when the divider is
//     in NORMAL flow. As soon as `position: sticky` engages, the
//     margin doesn't translate to visual offset, so the gridStyle
//     hairline reappears.
//   - `box-shadow: 0 -2px 0 var(--bg)` paints outside the box, but
//     gets clipped by overflow constraints somewhere in the stack
//     and doesn't reliably cover the gap in sticky state.
// The reliable fix: render two absolutely-positioned mask divs as
// children of the divider, each painted `var(--bg)`, extending
// above + below the divider into the gridStyle gap region. These
// move with the divider as it sticks, so the mask is always present.

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
      display: "flex",
      alignItems: "baseline",
      gap: 6,
      cursor: onClick ? "pointer" : "default",
    }}
    onClick={onClick}>
      {/* Top gap-mask — paints var(--bg) into the 1px gridStyle gap
          above the divider. Absolute-positioned so it travels with
          the sticky element. left/right inset by 0 covers the full
          grid width. Pointer-events disabled so click-through works. */}
      {!isFirst && (
        <div aria-hidden style={{
          position: "absolute",
          top: -3,
          left: 0,
          right: 0,
          height: 3,
          background: "var(--bg)",
          pointerEvents: "none",
        }} />
      )}
      {/* Bottom gap-mask — same role, paints into the gap below the
          divider so cards beneath don't bleed through. */}
      <div aria-hidden style={{
        position: "absolute",
        bottom: -3,
        left: 0,
        right: 0,
        height: 3,
        background: "var(--bg)",
        pointerEvents: "none",
      }} />
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
