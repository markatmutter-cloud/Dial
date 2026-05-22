import { useState, useCallback, useEffect } from "react";

// Recent-search history for the Home search bar (Mark spec
// 2026-05-22: "would be great to see how many items would return
// for each category as you're typing" + "see recent search terms
// in to the landing page search bar").
//
// localStorage-backed because the Home search input is the cheapest
// surface to make personally adaptive, and persisting the history
// in Supabase isn't worth the round-trip for ~5 strings.
//
// Shape: array of strings, MRU-first, capped at MAX. Adding an
// already-present query promotes it to the front instead of
// duplicating.

const STORAGE_KEY = "dial_recent_searches_v1";
const MAX = 6;

function load() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(s => typeof s === "string" && s.trim()).slice(0, MAX);
  } catch {
    return [];
  }
}

function persist(arr) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // localStorage full/disabled — stay in memory for the session.
  }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState(() => load());

  // Cross-tab sync on the same browser. Cheap.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY) return;
      setRecent(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((query) => {
    const q = (query || "").trim();
    if (!q) return;
    setRecent(prev => {
      const next = [q, ...prev.filter(s => s.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((query) => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return;
    setRecent(prev => {
      const next = prev.filter(s => s.toLowerCase() !== q);
      persist(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    persist([]);
    setRecent([]);
  }, []);

  return { recent, add, remove, clear };
}
