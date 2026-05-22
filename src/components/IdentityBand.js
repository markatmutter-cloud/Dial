import React from "react";

// Identity band — full-width colored slab that sits below the
// controls row (desktop) or sub-tab strip (mobile, post-swap) on
// every non-Home tab.
//
// Mark spec 2026-05-21: unify the per-tab "what's below sub-tabs"
// zone so every tab has the same skeleton (top bar → sub-tabs →
// controls → identity band → content). The band carries:
//
//   [label] · [count]                                    [+action]
//
// Tone: "olive" for Listings + Watchlists (matches the favicon's
// army-olive hourglass background, --brand-olive); "dark" for
// Collecting (matches the retired FEATURED slab). The default
// "green" alias maps to olive for back-compat with earlier
// in-progress wiring (PR_Y1).
//
// The band extends edge-to-edge via negative horizontal margins
// through the parent scroll container's padding — same pattern the
// retired FEATURED band used. Callers pass the parent's horizontal
// padding via `pad` so the bleed math is local.
//
// Counts move OUT of the filter row's right edge and INTO the band.
// +action affordances (`+ New search` / `+ New challenge` / `+ Add a
// watch` etc.) consolidate here too — previously they lived in each
// sub-tab component's inline group header.
export function IdentityBand({
  label,
  count,            // optional — number or pre-formatted string (e.g. "23 upcoming · 7 archived")
  action,           // optional — JSX rendered on the right (e.g. a +New button)
  tone = "olive",   // "olive" | "dark" | "green" (alias for olive)
  isMobile = false,
  pad,              // parent scroll container's horizontal padding (number, px). For full bleed.
}) {
  const isDark = tone === "dark";
  const bg = isDark ? "var(--text1)" : "var(--brand-olive)";
  const fg = isDark ? "var(--bg)"    : "#ffffff";
  const subOpacity = isDark ? 0.55 : 0.75;

  // Option A (Mark spec 2026-05-21): band aligns with the card grid
  // edges instead of bleeding edge-to-edge. Outer margins match the
  // shell content padding (16px mobile / 20px desktop). `pad` arg
  // kept on the API for back-compat but ignored — every current
  // caller wants the contained shape.
  // marginBottom = 0 (down from 12–14): the row below already has
  // its own top padding; the gap was reading as wasted space.
  void pad; // suppress unused-warning if eslint inspects
  const sideMargin = isMobile ? 16 : 20;
  return (
    <div style={{
      background: bg,
      color: fg,
      padding: isMobile ? "10px 14px" : "12px 18px",
      marginLeft: sideMargin,
      marginRight: sideMargin,
      marginBottom: 0,
      borderRadius: 8,
      display: "flex", alignItems: "center", gap: 10,
      flexShrink: 0,
    }}>
      <div style={{
        fontSize: 12, fontWeight: 700,
        letterSpacing: "0.14em", textTransform: "uppercase",
        color: fg,
        flexShrink: 0,
      }}>
        {label}
      </div>
      {count != null && count !== "" && (
        <div style={{
          fontSize: 12, color: fg, opacity: subOpacity,
          minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          · {typeof count === "number" ? count.toLocaleString() : count}
        </div>
      )}
      {action && (
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          {action}
        </div>
      )}
    </div>
  );
}

// Helper: pill-shape button styling for the band's +action slot.
// Outlined-on-band style so the action reads as secondary to the
// section label but is still clearly tappable.
export function bandActionStyle(tone = "green") {
  const onDark = tone === "dark";
  return {
    background: "transparent",
    border: `1px solid ${onDark ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.85)"}`,
    color: onDark ? "var(--bg)" : "#ffffff",
    padding: "6px 12px",
    borderRadius: 18,
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    letterSpacing: "0.02em",
  };
}
