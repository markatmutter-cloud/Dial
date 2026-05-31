// LumeBus — the reverse of ActionBus. ActionBus lets Lumé drive the app
// (Lumé → app); LumeBus lets the app hand a listing TO Lumé (app → Lumé), so a
// card's "Share with Lumé" ⋯ row can open the concierge bubble seeded with that
// watch and start a conversation about it. Same module-level imperative pattern
// as ActionBus / ConfirmModal: ChatBubbleHost registers the opener once it
// mounts; Card calls askLumeAbout(item). No-op (returns false) if the bubble
// isn't mounted yet, so callers never throw.

let opener = null;

export function registerLumeOpener(fn) {
  opener = fn;
  return () => {
    if (opener === fn) opener = null;
  };
}

export function askLumeAbout(item) {
  if (typeof opener === "function") {
    try { opener(item); } catch {}
    return true;
  }
  return false;
}
