import React from "react";

// LumeReasonChip — a small, muted pill stating why a card was surfaced. Quiet
// by design (it's metadata, not a headline); the watch is the hero, the chip
// just earns its place on the page.
export default function LumeReasonChip({ label, tone = "muted" }) {
  if (!label) return null;
  const accent = tone === "accent";
  return (
    <span style={{
      display: "inline-block", fontSize: 10, fontWeight: 600, letterSpacing: 0.4,
      textTransform: "uppercase", padding: "3px 7px", borderRadius: 6, whiteSpace: "nowrap",
      background: accent ? "var(--brand-olive-tint, rgba(125,134,94,0.16))" : "var(--surface)",
      color: accent ? "var(--brand-olive)" : "var(--text2)",
      border: "0.5px solid var(--border)",
    }}>{label}</span>
  );
}
