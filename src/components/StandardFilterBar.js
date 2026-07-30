import React from "react";
import { SearchIcon } from "./icons";
import { CHROME } from "../styles";
import { useWidth } from "../hooks";

// StandardFilterBar — THE one filter-bar layout for named, finite surfaces
// (Mark 2026-06-03, the "standard library" chrome pass — P-2/P-4/P-8/P-13).
//
//   desktop: [filter pills · left] [search · CENTERED fixed slot] [right zone] [count · reserved]
//   mobile:  one wrapping pill row + the reserved count (search lives in the
//            shell's sticky search row, or in a caller-provided row above —
//            never a second input inside the bar)
//
// Rules this component ENFORCES so surfaces can't drift apart again:
//  - the search input sits in a fixed, centered grid column — it cannot move
//    or change size as the pill count varies between tabs/sub-tabs (P-2);
//  - the item count renders right-aligned in a reserved-width slot, so a
//    count that arrives a beat late never jogs the layout (P-8/P-16);
//  - ONE search input per surface (P-13): pass `search` here OR rely on the
//    shell search row — never both.
//
// The caller provides the horizontal inset (portal/sticky wrappers already
// carry the surface's edge padding) — the bar itself is inset-agnostic.
export function StandardFilterBar({ pills, search, right, count, isMobile, background = "var(--bg)", expanded = false }) {
  // Narrow-desktop guard (Mark 2026-06-06, B-64): below ~1250px the
  // single-line grid can't fit — the right zone (Min/Max · Date · Price ·
  // count) overflowed INTO the centered search slot (half-screen Safari
  // windows). Self-measured here so every consumer surface inherits the
  // stacked layout: search on its own full-width line, pills + sort
  // wrapping beneath.
  const vw = useWidth();
  const narrow = !isMobile && vw < 1250;
  const countSlot = (
    <span style={{
      minWidth: 86, textAlign: "right", flexShrink: 0,
      fontSize: 12, color: "var(--text3)", whiteSpace: "nowrap",
    }}>{count || ""}</span>
  );
  const borderBottom = expanded ? "none" : "0.5px solid var(--border)";
  if (isMobile) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        padding: "6px 0", background, borderBottom,
      }}>
        {pills}
        <span style={{ marginLeft: "auto" }} />
        {right}
        {countSlot}
      </div>
    );
  }
  if (narrow) {
    return (
      <div style={{ padding: "6px 0", background, borderBottom }}>
        {search && (
          <div style={{ marginBottom: 8 }}>{search}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {pills}
          <span style={{ marginLeft: "auto" }} />
          {right}
          {countSlot}
        </div>
      </div>
    );
  }
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr minmax(200px, 340px) 1fr",
      alignItems: "center", columnGap: 12,
      padding: "6px 0", background, borderBottom,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
        {pills}
      </div>
      <div style={{ minWidth: 0 }}>{search}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", minWidth: 0 }}>
        {right}
        {countSlot}
      </div>
    </div>
  );
}

// StandardSearchInput — THE one search-field recipe (2026-06-03 alignment
// audit; replaces the bare `standardSearchInputStyle` input). Three recipes
// used to render in the same centered slot — icon + radius 20 + height 30 on
// Watches/Saved, a bare radius-18 input on Articles/Guides, radius-8 on
// Guides-mobile — which is why "the search bar looks different" per tab
// (Mark). One component now: leading SearchIcon · radius 20 · height 30 ·
// trailing clear × when there's a value. `trailing` slot for per-surface
// extras (DesktopShell's Save-search heart); `inputRef`/`onKeyDown` for its
// `/`-shortcut + Esc behavior.
// Saved-search recall (2026-07-30). Saved searches used to be reachable only
// from their own sub-tab on the Saved tab; when that tab collapsed to Lists
// they kept a section on its landing, but that's a place you go, not a place
// you're already standing. The moment you actually want a saved search is the
// moment you touch the search box — so an empty, focused search offers them.
// The heart INSIDE this box already saves them, so save and recall now sit on
// the same control.
//
// Opt-in: surfaces that don't pass savedSearches render byte-identical DOM to
// before, no wrapper element, no behaviour change.
export function StandardSearchInput({ value, onChange, placeholder, ariaLabel, inputRef, onKeyDown, trailing,
  savedSearches, onRunSavedSearch }) {
  const [focused, setFocused] = React.useState(false);
  const recallable = (savedSearches || []).length > 0 && !!onRunSavedSearch;
  const showRecall = recallable && focused && !String(value || "").trim();
  const box = (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      border: "0.5px solid var(--border)", borderRadius: 20,
      padding: "4px 12px", height: CHROME.CONTROL_H, boxSizing: "border-box",
      width: "100%", minWidth: 0,
      // Surface fill, not transparent (Mark 2026-06-06: "easy to see the
      // search bar on Home — not on the other pages"). Home's hero search
      // reads as an input because it's a FILLED field; the transparent
      // hairline box disappeared next to the surface-filled pills around
      // it. One token — every tab's search inherits.
      background: "var(--surface)", color: "var(--text2)",
    }}>
      <SearchIcon />
      <input
        ref={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={recallable ? () => setFocused(true) : undefined}
        // Blur closes the panel, but a click on a row blurs the input BEFORE
        // the click lands. The rows fire on mouseDown (which precedes blur),
        // so no timeout race is needed here.
        onBlur={recallable ? () => setFocused(false) : undefined}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        style={{ flex: 1, border: "none", background: "transparent",
                 fontSize: 13, color: "var(--text1)", outline: "none",
                 fontFamily: "inherit", minWidth: 0 }}
      />
      {trailing}
      {value && (
        <button onClick={() => onChange({ target: { value: "" } })} aria-label="Clear search"
          style={{ flexShrink: 0, background: "none", border: "none",
                  cursor: "pointer", color: "var(--text3)", padding: 2,
                  fontFamily: "inherit", display: "flex",
                  alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}
    </div>
  );

  if (!recallable) return box;

  return (
    <div style={{ position: "relative", width: "100%", minWidth: 0 }}>
      {box}
      {showRecall && (
        <SavedSearchRecall
          searches={savedSearches}
          onRun={(sv) => { setFocused(false); onRunSavedSearch(sv); }}
        />
      )}
    </div>
  );
}

// The recall panel itself, split out so the MOBILE shell can mount it above
// its hand-rolled search input without either duplicating this markup or
// being restyled into StandardSearchInput. One panel, two hosts — the
// alternative was two panels that drift (CLAUDE.md: divergence is the bug).
// Absolutely positioned; the host supplies `position: relative`.
export function SavedSearchRecall({ searches, onRun }) {
  return (
    <div role="listbox" aria-label="Saved searches"
      style={{
        position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
        zIndex: 60,
        background: "var(--surface)",
        border: "0.5px solid var(--border)", borderRadius: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
        padding: 6, maxHeight: 320, overflowY: "auto",
      }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: 0.4,
        textTransform: "uppercase", color: "var(--text3)",
        padding: "6px 10px 8px",
      }}>Saved searches</div>
      {(searches || []).map((s) => (
        <button key={s.id} role="option" aria-selected="false"
          // mouseDown, not click: it fires before the input's blur, so the
          // panel is still mounted when the handler runs.
          onMouseDown={(e) => { e.preventDefault(); onRun(s); }}
          style={{
            display: "flex", alignItems: "baseline", gap: 8, width: "100%",
            background: "none", border: "none", cursor: "pointer",
            textAlign: "left", padding: "8px 10px", borderRadius: 8,
            fontFamily: "inherit", color: "var(--text1)", fontSize: 13,
          }}>
          <span style={{ fontWeight: 500 }}>{s.label || s.query}</span>
          {s.label && s.query && s.label !== s.query && (
            <span style={{ fontSize: 11, color: "var(--text3)", minWidth: 0,
                           overflow: "hidden", textOverflow: "ellipsis",
                           whiteSpace: "nowrap" }}>{s.query}</span>
          )}
        </button>
      ))}
    </div>
  );
}
