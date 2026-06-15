import React, { useState } from "react";
import { imgSrc, fmtSaleDateRange } from "../utils";

// Shared auction-sale thumbnail primitives — the colored placeholder tint +
// house logo used by the auction calendar cards AND the Home "Finishing soon"
// followed-auction tiles (Mark 2026-06-15). One source of truth so the two
// surfaces can't drift (CLAUDE.md cross-surface consistency). Lives in its
// own module (not AuctionCalendar.js) so HomeTab can import the tile without
// pulling the lazy-loaded calendar into the main bundle.

// Deterministic muted tint for the text-only placeholder — shown before a
// sale publishes a cover image (mirrors the houses' own "coming soon" cards).
// Each house gets a stable soft colour so the squares read as branded.
const PLACEHOLDER_TINTS = [
  { bg: "#ece3da", fg: "#3a3128" }, // warm sand
  { bg: "#e3e7ec", fg: "#2c343d" }, // cool slate
  { bg: "#e7e9e2", fg: "#33372c" }, // olive stone
  { bg: "#ece2e4", fg: "#3d2c30" }, // muted rose
  { bg: "#e2e8e8", fg: "#2a3838" }, // teal grey
  { bg: "#eae4ec", fg: "#352c3d" }, // mauve
];
export function houseTint(house) {
  const s = String(house || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PLACEHOLDER_TINTS[h % PLACEHOLDER_TINTS.length];
}

// House-logo slug for the cover stand-in: when a sale has no scraped cover,
// show the house's logo from public/logos/<slug>.svg|png (text-mark fallback
// via HouseLogo's onError, so uncollected houses keep the text treatment).
export function houseLogoSlug(house) {
  return String(house || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function HouseLogo({ house }) {
  // try .svg first, then .png, then the text mark
  const [attempt, setAttempt] = useState(0);
  const slug = houseLogoSlug(house);
  if (!slug || attempt >= 2) {
    return (
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                    textTransform: "uppercase", lineHeight: 1.25 }}>
        {house || "Auction"}
      </div>
    );
  }
  const ext = attempt === 0 ? "svg" : "png";
  return (
    <img src={`/logos/${slug}.${ext}`} alt={house || "Auction house"}
      loading="lazy" decoding="async"
      onError={() => setAttempt(a => a + 1)}
      style={{ maxWidth: "78%", maxHeight: "55%", objectFit: "contain",
               mixBlendMode: "multiply" }} />
  );
}

// Compact followed-auction tile for the Home "Finishing soon" strip — a
// calendar-style cover square (scraped cover → top-lot hero → branded tint +
// logo) over a house · title · date block. Tapping opens the sale's lots.
export function AuctionThumb({ sale, onOpen, width = 150 }) {
  if (!sale) return null;
  const cover = sale.image || sale._heroImg;
  const tint = houseTint(sale.house);
  const dateLabel = fmtSaleDateRange(sale);
  const lotCount = sale._lotCount || 0;
  return (
    <button
      onClick={onOpen ? () => onOpen(sale) : undefined}
      title={lotCount ? `View ${lotCount} lots` : (sale.title || "Auction")}
      style={{
        flexShrink: 0, width, scrollSnapAlign: "start",
        display: "flex", flexDirection: "column",
        border: "0.5px solid var(--border)", borderRadius: 12, overflow: "hidden",
        background: "var(--card-bg)", color: "inherit", fontFamily: "inherit",
        padding: 0, cursor: onOpen ? "pointer" : "default", textAlign: "left",
      }}>
      <div style={{
        position: "relative", width: "100%", height: Math.round(width * 0.72),
        background: "var(--surface)", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {cover ? (
          <img src={imgSrc(cover)} alt="" loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: tint.bg, color: tint.fg,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "10px 12px", textAlign: "center",
          }}>
            <HouseLogo house={sale.house} />
          </div>
        )}
      </div>
      <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase",
                       letterSpacing: "0.08em", fontWeight: 600,
                       whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {sale.house}
        </span>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text1)", lineHeight: 1.3,
                       display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                       overflow: "hidden" }}>
          {sale.title || "Auction"}
        </span>
        {dateLabel && (
          <span style={{ fontSize: 11, color: "var(--text2)",
                         whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {dateLabel}
          </span>
        )}
      </div>
    </button>
  );
}
