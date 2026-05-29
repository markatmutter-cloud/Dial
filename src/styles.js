// Shared style tokens. Extracted 2026-04-30 after the design pass left
// near-identical pill / icon-button / modal styles copy-pasted across
// App.js + each modal file. Mark spotted "sub-pixel mismatch" between
// the mobile sort row pills (boxShadow border) and the sub-tab pills
// (real border) — exactly the class of bug shared tokens prevent.
//
// Token style: each export is either
//   - a plain object (use directly: style={modalBackdrop})
//   - a function returning an object (use with state: style={pillBase(active)})
//
// Keep these tokens narrow and presentation-only. No app state, no
// behavior. Components compose them with their own per-instance overrides
// using the spread operator: style={{ ...iconButton(), background: ... }}.

// ── TYPEFACES ─────────────────────────────────────────────────────────
// The ONLY place a font-family string should live (2026-05-28 type-system
// pass). Two voices, one axis: sans = "scan and act" (the interface, also
// the body default in public/index.html); serif = "sit and read" (the
// editorial register — article/reference titles + prose). Serif face is
// Hoefler Text (Mark's call): Apple-native, ligatures, magazine contrast;
// Iowan Old Style / Georgia are fallbacks. Never inline a font string —
// import from here so the editorial face can't drift per surface. See
// DESIGN_SYSTEM.md "Serif vs sans". (Portal menus that must hard-set a
// face for the iOS Times-serif fallback are the one exception — see
// PORTAL_SANS in CardShell.js.)
export const FONT_SANS = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif";
export const FONT_SERIF = "'Hoefler Text', 'Iowan Old Style', Georgia, 'Times New Roman', serif";          // body + titles
export const FONT_SERIF_DISPLAY = "'Hoefler Text', 'Iowan Old Style', Georgia, 'Times New Roman', serif";  // hero/display (same face; separate name documents the role)

// ── PILLS ─────────────────────────────────────────────────────────────

// Sort/filter pills in the sticky/filter rows. Inactive = transparent
// (or surface-tinted) with inset border, active = inverted dark. Used by
// both mobile sort row (default size — bigger for touch) and desktop
// filter row (`compact: true` — denser horizontal layout). Pass
// `surface: true` for the desktop variant where inactive pills sit on a
// `--surface` background instead of transparent.
// ── The one "selected/active" treatment ──────────────────────────────
// 2026-05-28 design-library pass (Mark): every toggle/filter chip that can
// be "on" reads the SAME way — an olive TINT fill + readable olive INK +
// a 0.5px olive hairline. Single source of truth: pillBase /
// innerToggleButton / iconButton (and Chip) all spread this, so
// "selected = olive" can't drift per surface. Replaces the old split
// (pillBase bold-black-border ghost; innerToggle/icon solid-black fill;
// stray blue tints). --brand-olive-ink is theme-aware (lightens to sage in
// dark) so the ink stays readable on #000, where --brand-olive is too dark.
export const SELECTED_FILL = {
  background: "var(--brand-olive-tint-12)",
  color: "var(--brand-olive-ink)",
  boxShadow: "inset 0 0 0 0.5px var(--brand-olive-ink)",
};

// Default (unselected) chrome: transparent (or surface-tinted) + hairline.
const UNSELECTED = (surface) => ({
  background: surface ? "var(--surface)" : "transparent",
  color: "var(--text2)",
  boxShadow: "inset 0 0 0 0.5px var(--border)",
});

export const pillBase = (active, { compact = false, surface = false } = {}) => ({
  fontSize: 13,
  padding: compact ? "6px 12px" : "9px 14px",
  borderRadius: 20, cursor: "pointer",
  fontFamily: "inherit", whiteSpace: "nowrap", border: "none", outline: "none",
  fontWeight: active ? 600 : 500,
  ...(active ? SELECTED_FILL : UNSELECTED(surface)),
});

// Inner-toggle pill. Smaller, denser variant used for nested sub-toggles
// inside a tab (Listings/Auctions/Sold inside Saved; Owned/Sold/All/
// Shortlist inside My watches). Visually distinct from `pillBase` — uses
// a real border (not boxShadow) and adds bold-on-active to signal the
// secondary hierarchy. Promoted 2026-05-08 from inline duplicates in
// App.js + CollectionsTab.js.
export const innerToggleButton = (active) => ({
  padding: "4px 12px", borderRadius: 999,
  border: "none", outline: "none",
  cursor: "pointer", fontFamily: "inherit", fontSize: 12,
  fontWeight: active ? 600 : 500,
  flexShrink: 0,
  // 2026-05-28: active now uses the shared olive SELECTED_FILL (was a
  // solid black fill). Same "selected = olive" language as every pill.
  ...(active ? SELECTED_FILL : UNSELECTED(false)),
});

// Sub-tab strip (Listings / Searches / Calendar). Underline pattern,
// intentionally NOT pill-shaped — sub-tabs sit beneath the main tabs in
// the visual hierarchy and need to look secondary. Active = bold +
// 2px underline, inactive = lighter colour, no chrome. Vertical padding
// stays generous (10px) so tap targets remain ~40px tall on mobile.
//
// `marginBottom: -1` pulls the underline down to overlap the strip's
// 0.5px borderBottom, so the active indicator pierces the divider
// cleanly instead of floating above it.
export const tabPill = (active, opts = {}) => {
  // PR_β-A 2026-05-22: `onOlive` flips active/inactive colors for the
  // colored-chrome zone (white-on-olive instead of dark-on-white).
  // Used by mobile sub-tab strips when the chrome above is olive.
  //
  // PR 2026-05-22 chrome harmonization (Mark spec): on neutral chrome
  // (Home + sub-tab strips that sit below olive), active state picks
  // up `var(--brand-olive-text)` instead of `var(--text1)`. Ties the
  // active tab visually to the wordmark color on landing without
  // introducing a separate token. On olive chrome, white stays white.
  const onOlive = opts.onOlive === true;
  return {
    padding: "10px 4px",
    border: "none", outline: "none",
    background: "transparent",
    cursor: "pointer", fontFamily: "inherit", fontSize: 13,
    fontWeight: active ? 600 : 500,
    letterSpacing: "0.01em",
    color: onOlive
      ? (active ? "#ffffff" : "rgba(255,255,255,0.65)")
      : (active ? "var(--brand-olive-text)" : "var(--text3)"),
    borderBottom: onOlive
      ? (active ? "2px solid #ffffff" : "2px solid transparent")
      : (active ? "2px solid var(--brand-olive-text)" : "2px solid transparent"),
    borderRadius: 0,
    marginBottom: -1,
  };
};

// Compact action buttons used in tab headers, list-drill-in toolbars,
// and inline editors (Share / Manage / Rename / Delete / + From feed /
// + Add a watch / inline-editor Cancel-Save). Three variants:
//   - primary: brand-fill, white text, semi-bold (the dominant CTA)
//   - subtle:  bordered-transparent with text2 (default)
//   - danger:  bordered-transparent with --danger color
// Geometry sized so the button lands at ~32px tall — close to the iOS
// PWA tap-target bar without disrupting visual rhythm in dense headers.
// Promoted 2026-05-08 from inline duplicates spread across CollectionsTab
// + WatchlistTab.
export const actionButton = ({ variant = "subtle" } = {}) => {
  const base = {
    padding: "8px 12px", borderRadius: 6,
    fontFamily: "inherit", fontSize: 12,
    cursor: "pointer", whiteSpace: "nowrap",
  };
  if (variant === "primary") return {
    ...base,
    border: "none",
    // PR 2026-05-22: primary CTAs swept from brand-blue to brand-
    // olive to match the olive thread shipped across icons, avatar,
    // dropdown, view-settings, etc. Mark spec: "+ From feed in
    // Watchbox could be green" — applied site-wide for consistency.
    background: "var(--brand-olive)", color: "#fff",
    fontWeight: 500,
  };
  if (variant === "danger") return {
    ...base,
    border: "0.5px solid var(--border)",
    background: "transparent", color: "var(--danger)",
  };
  return {
    ...base,
    border: "0.5px solid var(--border)",
    background: "transparent", color: "var(--text2)",
  };
};

// "Produced" pill buttons — Mark spec 2026-05-14. The editorial-CTA
// shape used on the screening surface (View listing) and the bucket
// density toggle (Expand → / Compact ↑). Outlined rounded corners,
// uppercase tracked, 11–12px, weight 600. Tone:
//   brand:   brand-blue border + label (default)
//   neutral: hairline border + text1 label
//   solid:   brand fill + white label (dominant CTA)
// Use these when you want a button that reads as a polished CTA
// rather than a generic chrome action — primary screening verbs,
// bucket density switches, "View listing" type prompts.
export const producedPill = ({ tone = "brand" } = {}) => {
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 14px",
    borderRadius: 6,
    fontFamily: "inherit",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  };
  // 2026-05-28: olive accent (was brand-blue) — one chrome accent.
  if (tone === "solid") return {
    ...base,
    border: "1px solid var(--brand-olive)",
    background: "var(--brand-olive)",
    color: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
  };
  if (tone === "neutral") return {
    ...base,
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text1)",
  };
  // brand (default) — olive outline
  return {
    ...base,
    border: "1px solid var(--brand-olive-ink)",
    background: "transparent",
    color: "var(--brand-olive-ink)",
  };
};

// Sign-in / large primary CTA. One size class above actionButton —
// padding and radius scale up because these are typically the dominant
// CTA on a focused signed-out surface (CollectionsTab gate, WatchlistTab
// gate, ListReceiver / ChallengeReceiver landings). Brand-fill + white
// text. Promoted 2026-05-08 from inline copies (10px 18px / radius 10
// pattern repeated across ~5 files).
export const signInButton = {
  padding: "10px 20px", borderRadius: 10,
  // 2026-05-28: olive (was brand-blue) — one chrome accent across the app.
  border: "none", background: "var(--brand-olive)", color: "#fff",
  cursor: "pointer", fontFamily: "inherit",
  fontSize: 14, fontWeight: 500,
};

// ── FORM INPUTS ───────────────────────────────────────────────────────

// Standard text/number/select input style. Lifted-surface bg, no border,
// soft rounding. Override fontSize / marginBottom / flex per call site.
// Used across modal forms (search editor, manual entry, mark-as-sold,
// track-new-item) and inline price filters. Promoted 2026-05-08 from
// the App.js `inp` const that was prop-drilled through every tab + modal.
export const inputBase = {
  border: "none", borderRadius: 8,
  padding: "8px 10px", fontSize: 14,
  background: "var(--surface)", color: "var(--text1)",
  fontFamily: "inherit", outline: "none",
  width: "100%", boxSizing: "border-box",
};

// ── ICON BUTTONS ──────────────────────────────────────────────────────

// Round 40×40 icon buttons in the mobile top bar (Filter, View, Clear).
// `active` flips to the inverted dark fill — used for the Filter button
// when filters are set, and the View button when its menu is open.
export const iconButton = ({ size = 40, active = false } = {}) => ({
  flexShrink: 0,
  width: size, height: size,
  borderRadius: "50%",
  border: "none", outline: "none",
  cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  // 2026-05-28: active now uses the shared olive SELECTED_FILL (was a
  // solid black fill); inactive keeps the surface chip look.
  ...(active ? SELECTED_FILL : { background: "var(--surface)", color: "var(--text2)", boxShadow: "inset 0 0 0 0.5px var(--border)" }),
});

// ── CHIPS / CLEAR ─────────────────────────────────────────────────────
// 2026-05-28 design-library pass. Two shared shapes that previously lived
// as divergent inline copies (blue inset / grey border / blue tint).

// Unified "Clear all" / reset control — olive-ink OUTLINE pill (no fill;
// it's a reset action, not a selected state). Replaces the inline clear-
// alls in the shells + EditorialView + ActiveFiltersStrip.
export const clearAllPill = {
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "5px 12px", borderRadius: 999,
  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
  fontSize: 12, fontWeight: 600, letterSpacing: "0.02em",
  border: "none", outline: "none",
  background: "transparent", color: "var(--brand-olive-ink)",
  boxShadow: "inset 0 0 0 0.5px var(--brand-olive-ink)",
};

// Removable active-filter chip ("× Brand"). Olive TINT fill (the same
// SELECTED_FILL identity) + a trailing × that removes the filter. The chip
// surface is non-interactive; only the × is a button (use dismissChipX).
export const dismissChip = {
  display: "inline-flex", alignItems: "center", gap: 4,
  padding: "4px 8px 4px 10px", borderRadius: 999,
  ...SELECTED_FILL,
  fontSize: 12, fontWeight: 500, letterSpacing: "0.01em",
  whiteSpace: "nowrap", cursor: "default",
};
export const dismissChipX = {
  background: "transparent", border: "none", padding: 0, marginLeft: 2,
  color: "var(--brand-olive-ink)", cursor: "pointer", fontSize: 14, lineHeight: 1,
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 16, height: 16, borderRadius: "50%",
};

// ── MODALS ────────────────────────────────────────────────────────────

// Full-viewport dimmed backdrop. All 4 modals (Hidden / About / Track /
// FavSearch) used 0.5 opacity after Mark unified them on 2026-04-30.
// z-index bumped from 200 → 2500 on 2026-05-13 so modals invoked from
// inside the screening overlay (zIndex 2000) — WatchDetailSheet from
// tap-to-expand, CollectionPicker from the ⋯ menu — render on top of
// the screening surface instead of behind it. UserLimitBanner (9000)
// still floats above all modals.
export const modalBackdrop = {
  position: "fixed", inset: 0, zIndex: 2500,
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  display: "flex", alignItems: "center", justifyContent: "center",
  padding: 20,
};

// Centered modal card. Override `maxWidth` per-modal (Hidden = 720,
// About = 440, Track = 520, FavSearch = 380). `padding` differs slightly
// between modals (Track uses 20/22, others 22) — override as needed.
// PR 2026-05-22 refresh (Mark feedback "modal could be better"):
// pronounced radius + stronger drop shadow + slightly thicker border
// for definition. The backdrop now blurs the page beneath, giving the
// modal a clearer "this is the focus" elevation cue.
export const modalShell = {
  background: "var(--bg)", borderRadius: 16,
  border: "0.5px solid var(--border)",
  padding: 24, width: "100%",
  boxShadow: "0 24px 64px rgba(0,0,0,0.32), 0 4px 12px rgba(0,0,0,0.08)",
};

// 36×36 close button (×) in the modal title row. Negative right margin
// pulls it back into alignment with the right edge of the modal padding,
// so the visual gap matches the title's left edge despite the button
// being sized for tap accessibility.
export const modalCloseButton = {
  background: "none", border: "none", cursor: "pointer",
  color: "var(--text2)", fontSize: 22, lineHeight: 1, padding: 0,
  width: 36, height: 36,
  display: "flex", alignItems: "center", justifyContent: "center",
  marginRight: -8,
};

// Common modal title row. Title text on the left, × button on the right.
// Marginbottom 14 is the conventional spacing before modal body content.
export const modalTitleRow = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  marginBottom: 14,
};

// Modal title text — 16/600/text1.
export const modalTitle = {
  fontSize: 16, fontWeight: 600, color: "var(--text1)",
};
