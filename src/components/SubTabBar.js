// SubTabBar — the one shared sub-tab row for the whole app.
//
// Why this exists: the underline sub-tab strip had drifted. The Watches and
// Collecting rows (Listings/Auctions/Sold, Articles/References/…) used the
// library `tabPill` token, but the Lists-page section-nav hand-rolled its own
// (14px / always-600 / 1.5px underline / 2px padding) so it read as a different
// font and weight next to the others — Mark's "looks like 6 iterations" call.
// On top of that the two App.js rows were byte-identical copies of each other.
//
// One component now owns the scrollable button row + the `tabPill` styling, so
// every underline sub-tab row is identical by construction and can't re-drift.
// It works for BOTH real tab-switchers and section-nav (jump-to-section) — the
// look is one library component; only what `onSelect` does differs. Surface
// chrome that legitimately differs (olive-on-mobile background, sticky
// positioning) is passed in via `containerStyle`, not baked in.

import React from "react";
import { tabPill } from "../styles";

export default function SubTabBar({
  tabs,                 // [[key, label], …] or [{ key, label }, …]
  activeKey,
  onSelect,             // (key) => void
  isMobile,
  onOlive = false,      // white-on-olive active state (mobile colored chrome)
  containerStyle,       // surface chrome: background / borderBottom / sticky / margin
  ariaLabel,
}) {
  const items = tabs.map((t) => (Array.isArray(t) ? { key: t[0], label: t[1] } : t));
  return (
    <div role="tablist" aria-label={ariaLabel} style={{
      display: "flex", gap: isMobile ? 14 : 20, alignItems: "center",
      padding: isMobile ? "0 14px" : "0 20px",
      flexShrink: 0,
      overflowX: "auto", overflowY: "hidden",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none", msOverflowStyle: "none",
      ...containerStyle,
    }}>
      {items.map(({ key, label }) => {
        const active = activeKey === key;
        return (
          <button key={key} role="tab" aria-selected={active}
            onClick={() => onSelect(key)}
            style={{ ...tabPill(active, { onOlive }), flexShrink: 0 }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}
