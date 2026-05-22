import { useState, useEffect, useCallback } from "react";

// Home-only hide set. Mark feedback 2026-05-11: the × overlay on
// Home cards should hide the listing FROM HOME ONLY — not from the
// rest of the site, not from other users. (The ⋯ menu Hide entry
// still does the full per-user + global-curation hide.)
//
// Scoped to localStorage so it survives reloads on the same browser
// but doesn't need any DB / sync infrastructure. This is an admin-
// curation tool primarily, and admin uses one or two browsers — full
// cross-device sync is overkill.
//
// Auto-expire on a rolling N-day window (Mark spec 2026-05-22):
// hides are stamped with timestampMs at the moment of the action;
// stale entries (>EXPIRE_DAYS old) are dropped at load. Reason:
// some hides are "great watch, horrible photo" — not taste signal,
// just curation noise that shouldn't persist indefinitely. Per-
// entry rolling expiry keeps recent hides while letting old ones
// reappear (in case the dealer fixes the photo or just to refresh
// the eye).
//
// Backward-compat: legacy array-of-IDs format (pre-2026-05-22)
// is migrated on first load — treated as recent (stamped with
// load-time) so existing hides don't all vanish at once.

const STORAGE_KEY = "dial_home_hidden_v1";
const EXPIRE_DAYS = 7;
const EXPIRE_MS = EXPIRE_DAYS * 24 * 60 * 60 * 1000;

function load() {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw);
    const now = Date.now();
    // Legacy: array of IDs. Migrate to {id: now} so they age out
    // from this point forward instead of disappearing on first load.
    if (Array.isArray(parsed)) {
      const m = new Map();
      for (const id of parsed) m.set(id, now);
      return m;
    }
    // Current shape: {id: timestampMs}. Drop entries older than
    // EXPIRE_DAYS so the set self-prunes.
    if (parsed && typeof parsed === "object") {
      const m = new Map();
      for (const [id, ts] of Object.entries(parsed)) {
        if (typeof ts === "number" && now - ts < EXPIRE_MS) m.set(id, ts);
      }
      return m;
    }
    return new Map();
  } catch {
    return new Map();
  }
}

function persist(map) {
  if (typeof window === "undefined") return;
  try {
    const obj = {};
    for (const [id, ts] of map) obj[id] = ts;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // localStorage full / disabled — fail silently. The state stays
    // in memory for the session.
  }
}

export function useHomeHidden() {
  const [map, setMap] = useState(() => load());

  // Cross-tab sync: if the user opens Home in two tabs and hides on
  // one, the other should reflect it on next interaction. Cheap.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      setMap(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toggle = useCallback((id) => {
    setMap(prev => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, Date.now());
      persist(next);
      return next;
    });
  }, []);

  // Expose ids as a Set so consumers (HomeTab strip filters) get the
  // same .has(id) API they used before the auto-expire rework. The
  // timestamp data stays internal; nothing outside this hook needs it.
  const ids = new Set(map.keys());
  return { ids, toggle };
}
