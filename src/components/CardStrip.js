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
//
// Scroll affordance (B-33, 2026-05-27): a slim always-on scroll indicator under
// the strip on DESKTOP (mobile relies on touch + the peeking next tile), so it's
// obvious the row scrolls sideways. Native scrollbars stay hidden; this is a
// custom thin track + thumb sized to the visible/total ratio.

import React, { useRef, useState, useEffect, useCallback } from "react";

export default function CardStrip({
  items,
  renderCard,            // (item) => node — the per-item card (Card / CardShell)
  isMobile,
  max,                   // cap visible tiles (STRIP_MAX / CARDS_PER_SECTION)
  background = "transparent",
  inset = true,          // false = bleed to edges (Home inverted band)
  fadeColor = "var(--bg)", // right-edge fade target; pass var(--text1) on inverted bands
}) {
  const slice = max != null ? items.slice(0, max) : items;
  const scrollRef = useRef(null);
  // thumb: width + left as % of the track; show only when the strip overflows.
  const [thumb, setThumb] = useState({ w: 0, l: 0, show: false });

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollWidth, clientWidth, scrollLeft } = el;
    const overflowing = scrollWidth > clientWidth + 2;
    setThumb({
      w: overflowing ? Math.max((clientWidth / scrollWidth) * 100, 8) : 0,
      l: overflowing ? (scrollLeft / scrollWidth) * 100 : 0,
      show: overflowing,
    });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, slice.length, isMobile]);

  const padX = inset ? (isMobile ? 16 : 20) : 0;

  return (
    <div>
      {/* position:relative wrapper hosts the right-edge fade overlay so it
          tracks the scroll area (not the indicator below). Fade is part of
          CardStrip itself now (2026-05-28) — every strip that uses CardStrip
          gets the same affordance, instead of each caller adding its own
          (only SectionStrip had one, so the Articles strip read differently). */}
      <div style={{ position: "relative" }}>
        <div ref={scrollRef} onScroll={update} style={{
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
              {renderCard(item, i)}
            </div>
          ))}
        </div>
        {/* Right-edge fade — only when the strip overflows. pointerEvents
            none so it never swallows taps/swipes. */}
        {thumb.show && (
          <div aria-hidden style={{
            position: "absolute", top: 0, right: 0, bottom: 0,
            width: isMobile ? 36 : 72, pointerEvents: "none",
            background: `linear-gradient(to right, transparent 0%, ${fadeColor} 75%)`,
          }} />
        )}
      </div>
      {/* Slim scroll indicator — desktop only, only when the strip overflows. */}
      {!isMobile && thumb.show && (
        <div style={{
          height: 3, margin: `4px ${padX}px 0`, borderRadius: 2,
          background: "var(--border)", position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, height: 3, borderRadius: 2,
            width: `${thumb.w}%`, left: `${thumb.l}%`,
            background: "var(--text3)", transition: "left 0.06s linear",
          }} />
        </div>
      )}
    </div>
  );
}
