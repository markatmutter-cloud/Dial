// CardStrip — the shared horizontal-scroll strip for card rows.
//
// Part of the unified card design system. The scroll container + the per-tile
// wrapper (fixed-width, scroll-snap, card-bg) were copy-pasted in THREE places
// — SearchResultsView's Strip + ArticleStrip and HomeTab's SectionStrip — and
// had quietly diverged (different backgrounds, an inverted padding variant on
// Home). This consolidates them. The caller owns the section HEADER and passes
// a `renderCard` function for the per-item card, so listings/auctions/sold/
// article cards all sit in identical tiles that line up by construction.
//
// Tile sizing (history baked in): mobile 38% / max 170px so ~2.5 tiles +
// a hint show; desktop fixed 210px so ~6 show on a 1440px window. The action
// buttons on the card are absolute and don't shrink with the tile, which is
// why mobile didn't go narrower than 38%.

import React from "react";

export default function CardStrip({
  items,
  renderCard,            // (item) => node — the per-item card (Card / CardShell)
  isMobile,
  max,                   // cap visible tiles (STRIP_MAX / CARDS_PER_SECTION)
  background = "transparent",
  inset = true,          // false = bleed to edges (Home inverted band)
}) {
  const slice = max != null ? items.slice(0, max) : items;
  return (
    <div style={{
      display: "flex", gap: 1, overflowX: "auto", overflowY: "hidden",
      padding: inset ? (isMobile ? "0 16px 4px" : "0 20px 4px") : "0 0 4px",
      scrollSnapType: "x mandatory",
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none", msOverflowStyle: "none",
      background,
    }}>
      {slice.map((item, i) => (
        <div key={item.id || item.url || i} style={isMobile
          ? { flex: "0 0 38%", maxWidth: 170, scrollSnapAlign: "start", background: "var(--card-bg)", position: "relative" }
          : { flex: "0 0 210px", scrollSnapAlign: "start", background: "var(--card-bg)", position: "relative" }}>
          {renderCard(item)}
        </div>
      ))}
    </div>
  );
}
