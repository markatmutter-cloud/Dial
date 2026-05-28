import React from "react";
import { SELECTED_FILL } from "../styles";

// Pill-style filter button (mobile filter row + auctions tab). Active uses
// the shared olive SELECTED_FILL. `blue` (a non-filter accent for
// expand/collapse chips like "+N more") now reads olive too — single accent
// across chrome. `count` appends "· N".
const accent = (blue) => ({
  background: "transparent",
  color: blue ? "var(--brand-olive-ink)" : "var(--text2)",
  boxShadow: `inset 0 0 0 0.5px ${blue ? "var(--brand-olive-ink)" : "var(--border)"}`,
});

export function Chip({ label, active, onClick, blue, count }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12, padding: "4px 12px", borderRadius: 20, cursor: "pointer",
      fontFamily: "inherit", whiteSpace: "nowrap", border: "none", outline: "none",
      ...(active ? SELECTED_FILL : accent(blue)),
    }}>
      {label}{count !== undefined ? ` · ${count}` : ""}
    </button>
  );
}

// Smaller pill used in the desktop sidebar (denser layout).
export function SidebarChip({ label, active, onClick, blue }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 11, padding: "2px 10px", borderRadius: 20, cursor: "pointer",
      fontFamily: "inherit", whiteSpace: "nowrap", border: "none", outline: "none",
      marginBottom: 4, marginRight: 4,
      ...(active ? SELECTED_FILL : accent(blue)),
    }}>
      {label}
    </button>
  );
}
