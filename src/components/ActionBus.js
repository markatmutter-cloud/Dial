// ActionBus — module-level imperative bridge so the decoupled concierge bubble
// (ChatBubbleHost) can trigger app-level actions without prop-threading. Same
// pattern as ConfirmModal.js's `pushRequest`: App registers a {type -> handler}
// map via registerActionHandlers() inside an effect; ChatBubbleHost imports
// dispatchAction() and calls it when the user taps one of Lumé's offered actions.
//
// Each handler runs an app capability (navigate/filter, open a watch, mutate a
// list…) closing over the live App handlers. dispatchAction always resolves
// {ok, message} (never throws) so the bubble can show inline feedback, and
// degrades gracefully ({ok:false}) if the host isn't mounted or the action type
// isn't wired yet (action types are added per PR).

let handlers = null;

export function registerActionHandlers(map) {
  handlers = map;
  return () => {
    if (handlers === map) handlers = null;
  };
}

// Synchronous URL → live-item resolver (registered by App, closing over
// liveStateById). ChatBubbleHost uses it to decide AT RENDER TIME whether a
// link in Lumé's reply is a watch we can open in-app (→ render an in-app
// button) or anything else (→ a normal external link). Synchronous on purpose:
// classifying links up front avoids an async window.open() that popup-blockers
// would swallow. Returns the item, or null if it's not a resolvable live watch.
let itemResolver = null;

export function registerItemResolver(fn) {
  itemResolver = fn;
  return () => {
    if (itemResolver === fn) itemResolver = null;
  };
}

export function resolveItemByUrl(url) {
  if (!url || !itemResolver) return null;
  try { return itemResolver(url) || null; } catch { return null; }
}

export async function dispatchAction(action) {
  if (!action || typeof action.type !== "string") {
    return { ok: false, message: "Unknown action." };
  }
  const fn = handlers && handlers[action.type];
  if (typeof fn !== "function") {
    return { ok: false, message: "Can't do that just yet. Try again in a moment." };
  }
  try {
    const res = await fn(action.payload || {});
    // A handler may return {ok, message} (to signal failure / a note) or nothing.
    if (res && typeof res === "object" && "ok" in res) return res;
    return { ok: true };
  } catch (e) {
    return { ok: false, message: (e && e.message) || "That didn't work." };
  }
}
