import React from "react";
import { imgSrc } from "../utils";

// LumeHeroCard — the lead journey, promoted to a wide hero that carries its
// warm contextual line AND a peek of the real watches (thumbnails). This is the
// "more designed, more impactful" starter (Mark, 2026-06-16): content sells
// itself, and the conversation lives ON the card instead of a floating banner.
export default function LumeHeroCard({ journey, onSelect, isMobile }) {
  if (!journey) return null;
  const { key, label, line, thumbItems = [] } = journey;
  const thumbs = thumbItems.filter((it) => it && it.img).slice(0, isMobile ? 3 : 4);

  return (
    <button onClick={() => onSelect && onSelect(key)} style={{
      width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit",
      border: "0.5px solid var(--border)", borderRadius: 18, padding: isMobile ? 16 : 20,
      background: "var(--brand-olive-tint, rgba(125,134,94,0.10))", color: "var(--text1)",
      display: "flex", flexDirection: isMobile ? "column" : "row",
      alignItems: isMobile ? "stretch" : "center", gap: isMobile ? 14 : 20,
    }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "var(--brand-olive)" }}>
          {label}
        </div>
        <div style={{ fontSize: isMobile ? 18 : 21, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
          {line}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--brand-olive)" }}>Take a look →</div>
      </div>

      {thumbs.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {thumbs.map((it, i) => (
            <div key={it.id || it.url || i} style={{
              width: isMobile ? 72 : 96, height: isMobile ? 72 : 96, borderRadius: 12, overflow: "hidden",
              background: "var(--card-bg)", flexShrink: 0, border: "0.5px solid var(--border)",
            }}>
              <img src={imgSrc(it.img, 240)} alt="" loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
