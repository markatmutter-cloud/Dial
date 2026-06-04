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
// Scroll affordance (B-33, 2026-05-27; reworked 2026-05-28): the row scrolls
// sideways, signalled by a right-edge fade gradient + the peeking next tile.
// Native scrollbars stay hidden. We deliberately do NOT render a custom thumb:
// the prior version drove a thumb off `onScroll` -> setState every frame with a
// `transition: left 0.06s` ease, so the indicator visibly trailed the scroll
// ("scroll, stop, then the bar catches up"). The fade is the affordance now; the
// only scroll state we track is a guarded `atEnd` boolean (re-renders only when
// it flips) so the fade can hide once you reach the end.

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
  // Two cheap booleans, not per-frame geometry: does the strip overflow, and is
  // it scrolled to the end. The fade shows only when overflowing && !atEnd.
  const [overflowing, setOverflowing] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  // Measure overflow on mount / resize / content change — NOT on scroll.
  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setOverflowing(el.scrollWidth > el.clientWidth + 2);
  }, []);

  // Scroll handler is a guarded boolean flip: setState bails out (no re-render)
  // unless `atEnd` actually changes, so dragging doesn't churn React.
  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ended = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setAtEnd((prev) => (prev === ended ? prev : ended));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, slice.length, isMobile]);

  return (
    <div>
      {/* position:relative wrapper hosts the right-edge fade overlay so it
          overlays the scroll area. Fade is part of CardStrip itself now
          (2026-05-28) — every strip that uses CardStrip gets the same
          affordance, instead of each caller adding its own (only SectionStrip
          had one, so the Articles strip read differently). */}
      <div style={{ position: "relative" }}>
        {/* scrollbarWidth:none is Firefox-only — WebKit (Safari/Chrome with
            "always show scroll bars" on macOS) needs the ::-webkit-scrollbar
            rule, which inline styles can't express. Without it some strips
            drew a grey track bar and others didn't (Mark 2026-06-03). */}
        <style>{`.wl-hscroll::-webkit-scrollbar{display:none}`}</style>
        <div ref={scrollRef} onScroll={onScroll} className="wl-hscroll" style={{
          display: "flex", gap: 1, overflowX: "auto", overflowY: "hidden",
          padding: inset ? (isMobile ? "0 16px 4px" : "0 20px 4px") : "0 0 4px",
          // proximity (not mandatory) so the drag stays free / un-sticky and
          // only gently lands on a tile when you let go near one.
          scrollSnapType: "x proximity",
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
        {/* Right-edge fade — the scroll affordance. Shows only when the strip
            overflows AND you're not at the end, and fades in/out smoothly via
            opacity (cheap; no layout, no per-frame state). pointerEvents none so
            it never swallows taps/swipes. */}
        <div aria-hidden style={{
          position: "absolute", top: 0, right: 0, bottom: 0,
          width: isMobile ? 36 : 72, pointerEvents: "none",
          background: `linear-gradient(to right, transparent 0%, ${fadeColor} 75%)`,
          opacity: overflowing && !atEnd ? 1 : 0,
          transition: "opacity 0.15s ease",
        }} />
      </div>
    </div>
  );
}
