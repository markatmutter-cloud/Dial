// Top-level tab model — ONE source of truth (2026-06-03 IA restructure:
// Watches · Saved · Articles · Reference Guides). Consumed by DesktopShell,
// MobileShell and the HomeTab masthead via the `topTabs` entry App.js builds
// from this. The arrays used to be duplicated inline in all three render
// sites — exactly how labels drift (the consistency bug class).
//
// Internal keys are unchanged (CLAUDE.md "Internal-vs-UI naming"): the old
// Collecting container (`tab="references"`) now hosts TWO top pills —
// Articles (sub "editorial") and Reference Guides (sub "references") — so a
// pill's active state keys off (tab, referencesSubTab), not tab alone. The
// tools family (size / links / challenges, launched from the account menu)
// highlights neither pill. URL keys (?tab=learn&sub=…) are untouched; old
// deep links resolve exactly as before.
export const TOP_TABS = [
  { key: "listings",  label: "Watches",  icon: "listings" },
  // "Saved" (2026-06-03, was "Lists") — the truthful umbrella: hearts,
  // lists and searches are all things you saved. Resolves the documented
  // Lists/Lists label collision from the #655 rename.
  { key: "watchlist", label: "Saved", icon: "watchlist" },
  { key: "articles",  label: "Articles", icon: "articles", tab: "references", sub: "editorial" },
  // "Reference Guides" on desktop, "Guides" on mobile (Mark's call — bare
  // "Reference" reads as ref-numbers; the full label doesn't fit mobile).
  { key: "guides", label: "Reference Guides", mobileLabel: "Guides", icon: "references", tab: "references", sub: "references" },
];

export function isTopTabActive(entry, tab, referencesSubTab) {
  const dest = entry.tab || entry.key;
  if (dest !== tab) return false;
  return entry.sub ? referencesSubTab === entry.sub : true;
}
