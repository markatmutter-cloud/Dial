import React, { useState } from "react";

// LumeSearchBar — the left-pane search input for the desktop two-pane layout.
// Search lives with the content (left); Ask lives with the chat rail (right),
// so the Search-vs-Ask choice is spatial. Owns its OWN draft (the right rail's
// chat owns chat.draft) so the two inputs never collide.
export default function LumeSearchBar({ onSearch, placeholder = "Search listings, sold, and auctions…" }) {
  const [q, setQ] = useState("");
  const submit = () => { const t = q.trim(); if (t) onSearch(t); };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
      borderTop: "0.5px solid var(--border)", flexShrink: 0,
    }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1, border: "0.5px solid var(--border)", borderRadius: 10, padding: "10px 14px",
          fontSize: 14, fontFamily: "inherit", background: "var(--bg)",
          color: "var(--text1)", WebkitTextFillColor: "var(--text1)", caretColor: "var(--text1)",
          outline: "none",
        }}
      />
      <button type="submit" disabled={!q.trim()} style={{
        border: "none", background: "var(--brand-olive)", color: "#fff", borderRadius: 10,
        padding: "0 16px", height: 40, flexShrink: 0, fontSize: 14, fontWeight: 600,
        cursor: q.trim() ? "pointer" : "default", opacity: q.trim() ? 1 : 0.5, fontFamily: "inherit",
      }}>Search</button>
    </form>
  );
}
