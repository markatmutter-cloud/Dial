// SubTabBar — the one shared sub-tab row for the whole app.
//
// Why this exists: the underline sub-tab strip had drifted. The Watches and
// Collecting rows (Listings/Auctions/Sold, Articles/References/…) used the
// library `tabPill` token, but the Lists-page section-nav hand-rolled its own
// (14px / always-600 / 1.5px underline / 2px padding) so it read as a different
// font and weight next to the others — Mark's "looks like 6 iterations" call.
// On top of that the two App.js rows were byte-identical copies of each other.
//
// One component owns the row, so every sub-tab row is identical by
// construction and can't re-drift. It works for BOTH real tab-switchers and
// section-nav (jump-to-section) — only what `onSelect` does differs. Surface
// chrome that legitimately differs (olive-on-mobile background, sticky
// positioning) is passed in via `containerStyle`, not baked in.
//
// RESTYLE audit:2026-06-06 (U-01): underline `tabPill` → enclosed SEGMENTED
// CONTROL (`segTrack`/`segItem` tokens). The underline treatment failed a
// real first-time user: inactive sub-tabs were faint grey text (reads as
// disabled) while the filter pills below looked like the buttons — told to
// "click the subtab", she tapped the pills. The enclosed track says "one
// chooser, pick a view"; the solid active fill out-shouts the filter pills'
// tint; and the top tabs keep the underline, so the two nav levels now look
// different by construction. Evidence: docs/audits/2026-06-06-usability/.

import React from "react";
import { segTrack, segItem } from "../styles";

export default function SubTabBar({
  tabs,                 // [[key, label], …] or [{ key, label }, …]
  activeKey,
  onSelect,             // (key) => void
  isMobile,
  onOlive = false,      // white-on-olive treatment (mobile colored chrome)
  containerStyle,       // surface chrome: background / borderBottom / sticky / margin
  ariaLabel,
}) {
  const items = tabs.map((t) => (Array.isArray(t) ? { key: t[0], label: t[1] } : t));
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: isMobile ? "6px 14px 10px" : "8px 20px",
      flexShrink: 0,
      overflowX: "auto", overflowY: "hidden",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none", msOverflowStyle: "none",
      ...containerStyle,
    }}>
      <div role="tablist" aria-label={ariaLabel} style={segTrack(onOlive)}>
        {items.map(({ key, label }) => {
          const active = activeKey === key;
          return (
            <button key={key} role="tab" aria-selected={active}
              onClick={() => onSelect(key)}
              style={{ ...segItem(active, { onOlive }), flexShrink: 0 }}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
