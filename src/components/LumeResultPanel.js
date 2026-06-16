import React from "react";

// LumeResultPanel — the generic frame a journey morphs the canvas into: a
// back affordance, the journey title, Lumé's one-line voice on the result, and
// the body (a LumeResultGrid, or an empty-state). Presentational only.
export default function LumeResultPanel({ title, voice, onBack, isEmpty, emptyText, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} aria-label="Back to journeys" style={{
          border: "0.5px solid var(--border)", background: "var(--surface)", color: "var(--text1)",
          borderRadius: 999, padding: "5px 12px", fontSize: 13, fontWeight: 500,
          cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
        }}>← Back</button>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--text1)", letterSpacing: "-0.01em" }}>
          {title}
        </h2>
      </div>

      {voice && (
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text2)" }}>{voice}</div>
      )}

      {isEmpty ? (
        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text2)", padding: "10px 0" }}>
          {emptyText}
        </div>
      ) : children}
    </div>
  );
}
