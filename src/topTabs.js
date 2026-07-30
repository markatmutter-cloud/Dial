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
  { key: "articles",  label: "Articles", icon: "articles", tab: "references", sub: "editorial" },
  // "Reference Guides" on desktop, "Guides" on mobile (Mark's call — bare
  // "Reference" reads as ref-numbers; the full label doesn't fit mobile).
  { key: "guides", label: "Reference Guides", mobileLabel: "Guides", icon: "references", tab: "references", sub: "references" },
  // "Lists" (2026-07-30). It was renamed Saved on 2026-06-03 to resolve a
  // Lists-tab-containing-a-Lists-sub-tab collision; that collision no longer
  // exists, because ♡ Watches moved to Watches > ♡ Saved and Searches became
  // a section of this tab's landing. With nothing else under it, "Saved" was
  // the wrong name: everything saved now lives on its own content tab, and
  // what remains here is lists. Sits LAST because it's the slowest surface
  // (a list is something you build over time, not something you browse).
  { key: "watchlist", label: "Lists", icon: "watchlist" },
];

export function isTopTabActive(entry, tab, referencesSubTab) {
  const dest = entry.tab || entry.key;
  if (dest !== tab) return false;
  return entry.sub ? referencesSubTab === entry.sub : true;
}
