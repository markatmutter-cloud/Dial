import React from "react";

/**
 * Shared filter-strip primitive used by Listings (in DesktopShell) and
 * Editorial (inside the scroll container as a sticky-positioned row).
 *
 * Both surfaces render the same row shape — a flex container of filter
 * pills + sort controls + count + clear — but they used to be two
 * separate `<div>` definitions that drifted apart on every edit
 * (different padding, different gap, different borderBottom logic,
 * etc.) because there was no shared declaration.
 *
 * This component standardizes the strip itself. The surrounding
 * geometry (sticky wrapper, edge-to-edge negative margins, expansion
 * panels rendered as siblings) stays at the call site because it
 * differs meaningfully between surfaces:
 *
 *   - Listings (shell-level): strip sits in DesktopShell chrome, above
 *     the scroll container. Nothing else wraps it.
 *   - Editorial (inside scroll): strip is wrapped in a sticky div
 *     that uses negative horizontal margins to extend edge-to-edge
 *     through the scroll container's padding. The expansion panels
 *     render as siblings INSIDE that sticky wrapper so they stay
 *     anchored to the strip during scroll.
 *
 * Mobile shell's horizontal-scroll filter row (overflowX:auto, smaller
 * gap, count chip leading) is intentionally NOT routed through this
 * primitive — it's a different shape, and absorbing it would force
 * cross-surface complexity that has no payoff. Keep it as its own
 * thing in MobileShell.
 *
 * Props:
 *   expanded — when any chip-group panel below is open, hide the
 *     bottom border so the strip + panel read as one surface.
 *   paddingX — horizontal inset for the pills. Caller decides
 *     (Listings uses 20 to match shell chrome inset; Editorial uses
 *     0 because its sticky wrapper already provides the inset).
 *   paddingY — vertical padding. Defaults to 6 to match the existing
 *     row heights on both surfaces.
 *   background — optional override (Editorial passes filterBandBg).
 *   children — pills + sort controls + count + clear.
 */
export function FilterRow({
  expanded = false,
  paddingX = 20,
  paddingY = 6,
  background,
  children,
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: `${paddingY}px ${paddingX}px`,
      background,
      borderBottom: expanded ? "none" : "0.5px solid var(--border)",
      flexShrink: 0, flexWrap: "wrap",
      position: "relative",
    }}>
      {children}
    </div>
  );
}

export default FilterRow;
