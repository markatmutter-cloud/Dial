// CardShell — the shared presentational frame for every card in the app.
//
// Part of the unified card design system (see memory project-card-design-system
// / DESIGN_SYSTEM.md). CardShell owns the LAYOUT and CHROME that every card
// shares — square/editorial image area + placeholder, the L1/L2/L3 text slots,
// the action stack (quick-action ↑ / heart / ⋯ menu), and the single portal
// menu — so listings, auctions, sold, and articles all line up by construction
// and future surfaces (reference pages, wishlists) inherit correct cards.
//
// It is purely presentational + slot-driven: callers (Card.js for priced items,
// the article card for editorial) compute their own content and hand it in as
// nodes. NONE of Card.js's price/FX/auction logic lives here — that stays in
// Card.js, which simply renders INTO these slots.
//
// Stage 0 of the migration: extracted verbatim from Card.js so the priced card
// is pixel-identical. Other renderers fold in over later stages.
//
// IMPORTANT (preserved from Card.js):
//   - The ⋯ menu renders via createPortal to document.body and MUST pin an
//     explicit font-family, or iOS falls back to Times (Mark report 2026-05-11).
//   - Menu is viewport-anchored via getBoundingClientRect (top/right) and
//     width-clamped so it can't fall off-screen on rightmost cards.
//   - Action-button sizes track `size` ("compact" = 26/16px, "full" = 36/16px)
//     — at 1/2/3 cols a 26px tap target is too small (Mark 2026-05-xx).

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { HeartIcon } from "./icons";

// Image sub-component: owns the onError→placeholder fallback (dealer image
// URLs 404 over time — Card.js relied on this). Falls back to the same
// favicon placeholder when there's no src OR the load fails.
function CardImage({ image, priority }) {
  const [failed, setFailed] = useState(false);
  const showImg = image && image.src && !failed;
  return (
    <>
      {showImg ? (
        <img src={image.src} alt={image.alt || ""}
          onError={() => setFailed(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          loading={priority ? "eager" : "lazy"} decoding="async" fetchpriority={priority ? "high" : "auto"} />
      ) : (
        <div style={{
          position: "absolute", inset: 0, background: "var(--surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: 6,
        }}>
          <img src="/favicon-192.png" alt="" aria-hidden="true"
            style={{ width: "44%", maxWidth: 88, opacity: 0.55 }} />
          <span style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text3)" }}>
            Image not available
          </span>
        </div>
      )}
    </>
  );
}

const SANS_STACK = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const ASPECT = { square: "100%", editorial: "62.5%" /* 16:10 */ };

export default function CardShell({
  // Image
  image,                 // { src, alt } | null  (src already run through imgSrc by caller)
  priority,              // high fetchpriority for above-the-fold cards
  aspect = "square",     // "square" | "editorial"
  imageOverlay,          // node — top-left state chips (SOLD / countdown / AUCTION)
  // Text levels
  level1,                // node — title (brand+model prefix for priced; article title)
  level2,                // node — source / house / publication kicker (rendered above L1)
  level3,                // node — price block / sold-date / days-left / byline
  // Link
  href,
  onClickLink,           // fired on link follow (telemetry: onClickListing)
  // Sizing
  size = "full",         // "compact" | "full" — chrome + action-button scale
  // Body padding (caller can match its old value during migration)
  bodyPadding,
  // Actions
  quickAction,           // { label, icon, active, onClick } | null
  heart,                 // { wished, onToggle } | null
  menu,                  // { onShare, onAddToCollection, onHide, hideLabel, isHidden, extraMenuItems, shareFeedbackText } | null
  // Telemetry / layout
  innerRef,              // ref forwarded to the root (IntersectionObserver in Card)
  children,              // optional extra body content below L3
}) {
  const compact = size === "compact";
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const [shareFeedback, setShareFeedback] = useState("");
  const triggerRef = useRef(null);
  const portalRef = useRef(null);

  // Click-outside closes the portal menu. Deferred bind (setTimeout 0) so the
  // opening click doesn't immediately re-close it.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      if (portalRef.current && portalRef.current.contains(e.target)) return;
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    // Defer one tick so the click that opened the menu doesn't immediately
    // close it. mousedown + Escape, matching the original Card.js behaviour.
    const id = setTimeout(() => {
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const menuItemStyle = {
    display: "block", width: "100%", textAlign: "left",
    background: "none", border: "none", cursor: "pointer",
    padding: "8px 12px", fontFamily: "inherit", fontSize: 13,
    color: "var(--text1)", whiteSpace: "nowrap", borderRadius: 6,
  };
  const hasMenu = !!menu && (menu.onShare || menu.onAddToCollection || menu.onHide
    || (menu.extraMenuItems && menu.extraMenuItems.length > 0));
  const actionSize = compact ? 26 : 36;
  const heartIconSize = compact ? 12 : 16;

  return (
    <div ref={innerRef} style={{ background: "var(--card-bg)", display: "flex", flexDirection: "column", position: "relative", minWidth: 0, overflow: "hidden" }}>
      <a href={href} target="_blank" rel="noopener noreferrer"
        onClick={() => { if (onClickLink) onClickLink(); }}
        style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}>
        <div style={{ position: "relative", paddingTop: ASPECT[aspect] || ASPECT.square, overflow: "hidden" }}>
          <CardImage image={image} priority={priority} />
          {imageOverlay}
        </div>
        <div style={{ padding: bodyPadding || (compact ? "8px 10px 10px" : "10px 12px 12px"), minWidth: 0 }}>
          {level2}
          {level1}
          {level3}
          {children}
        </div>
      </a>
      {quickAction && (
        <button onClick={e => { e.preventDefault(); e.stopPropagation(); quickAction.onClick(); }}
          aria-label={quickAction.label} title={quickAction.label}
          style={{
            position: "absolute", top: 6, left: 6,
            width: compact ? 22 : 28, height: compact ? 22 : 28,
            borderRadius: "50%", border: "none", cursor: "pointer",
            background: quickAction.active ? "rgba(220,38,38,0.88)" : "rgba(0,0,0,0.55)",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: compact ? 12 : 14, fontWeight: 700, fontFamily: "inherit", padding: 0, lineHeight: 1,
          }}>{quickAction.icon || "↑"}</button>
      )}
      {(heart || hasMenu) && (
        <div style={{ position: "absolute", top: 6, right: 6, display: "flex", flexDirection: "column", gap: 6 }}>
          {heart && (
            <button onClick={e => { e.preventDefault(); e.stopPropagation(); heart.onToggle(); }}
              aria-label="Save"
              style={{ width: actionSize, height: actionSize, borderRadius: "50%", border: "none", cursor: "pointer",
                      background: heart.wished ? "rgba(220,38,38,0.88)" : "rgba(0,0,0,0.28)",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <HeartIcon filled={heart.wished} size={heartIconSize} />
            </button>
          )}
          {hasMenu && (
            <div style={{ position: "relative" }}>
              <button ref={triggerRef}
                onClick={e => {
                  e.preventDefault(); e.stopPropagation();
                  if (!menuOpen && triggerRef.current) {
                    const r = triggerRef.current.getBoundingClientRect();
                    setMenuPos({ top: r.bottom + 4, right: Math.max(8, window.innerWidth - r.right) });
                  }
                  setMenuOpen(o => !o);
                }}
                aria-label="More actions"
                style={{ width: actionSize, height: actionSize, borderRadius: "50%", border: "none", cursor: "pointer",
                        background: menuOpen ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.28)",
                        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 0, fontFamily: "inherit", fontSize: compact ? 16 : 20, lineHeight: 1 }}>
                ⋯
              </button>
              {menuOpen && menuPos && createPortal(
                <div ref={portalRef} onClick={e => e.preventDefault()}
                  style={{
                    position: "fixed", top: menuPos.top, right: menuPos.right, zIndex: 1000,
                    maxWidth: `calc(100vw - ${menuPos.right + 16}px)`,
                    background: "var(--bg)", border: "0.5px solid var(--border)",
                    borderRadius: 8, padding: 4, whiteSpace: "nowrap",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                    // Portal mounts to document.body — pin font-family or iOS
                    // falls back to Times (Mark report 2026-05-11).
                    fontFamily: SANS_STACK,
                  }}>
                  {menu.onShare && (
                    <button onClick={async e => {
                      e.preventDefault(); e.stopPropagation();
                      let result;
                      try { result = await menu.onShare(); }
                      catch (err) { console.warn("share failed", err); result = null; }
                      if (result?.copied) { setShareFeedback("Copied!"); setTimeout(() => { setShareFeedback(""); setMenuOpen(false); }, 1200); }
                      else { setMenuOpen(false); }
                    }} style={menuItemStyle}>{shareFeedback || "Share"}</button>
                  )}
                  {menu.onAddToCollection && (
                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); menu.onAddToCollection(); }}
                      style={menuItemStyle}>Add to…</button>
                  )}
                  {menu.onHide && (
                    <button onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); menu.onHide(); }}
                      style={menuItemStyle}>
                      {menu.hideLabel === "Remove from list" ? "Remove" : (menu.hideLabel || (menu.isHidden ? "Unhide" : "Hide"))}
                    </button>
                  )}
                  {(menu.extraMenuItems || []).map((entry, i) => (
                    <button key={i} onClick={e => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); entry.onClick(); }}
                      style={menuItemStyle}>{entry.label}</button>
                  ))}
                </div>,
                document.body
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
