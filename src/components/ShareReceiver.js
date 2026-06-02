import React, { useState, useEffect, useMemo, useCallback } from "react";
import { fmt, imgSrc, priceIn, FX_RATES_USD_PER } from "../utils";
import { SharedReceiveFrame } from "./SharedReceiveFrame";

// Share-receive adapter for a single shared LISTING. Owns the URL parse + data
// lookup + save logic (all hooks live INSIDE this component so App.js's hook
// count never changes — React #310). It builds a listing descriptor and renders
// the shared SharedReceiveFrame, which owns the common chrome/layout/action bar
// (so a chrome change propagates to every shared type). 2026-06-01.
//
// Returns null when no share intent — zero render cost in the common path.

export function ShareReceiver({
  items,
  user,
  watchlist,
  toggleWatchlist,
  addToSharedInbox,
  isAuthConfigured,
  signInWithGoogle,
  primaryCurrency,
  setShareActive,
  onClickListing,
  setTab,
  resetTick,
  openTick,
  openListingId,
  openCollectionPicker,
  handleShare,
}) {
  const [shareIntent, setShareIntent] = useState(null);
  const [busy, setBusy] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("shared") !== "1") return;
      const id = params.get("listing");
      const fromName = params.get("from") || "";
      if (id) setShareIntent({ id, from: fromName });
    } catch (e) {
      console.warn("share URL parse failed", e);
    }
  }, []);

  useEffect(() => {
    if (typeof setShareActive === "function") setShareActive(!!shareIntent);
  }, [shareIntent, setShareActive]);

  useEffect(() => {
    if (resetTick && resetTick > 0) setShareIntent(null);
  }, [resetTick]);

  useEffect(() => {
    if (openTick && openTick > 0 && openListingId) {
      setShareIntent({ id: openListingId, from: "" });
      setImgFailed(false);
    }
  }, [openTick, openListingId]);

  const sharedItem = useMemo(() => {
    if (!shareIntent || !shareIntent.id) return null;
    if (!Array.isArray(items) || items.length === 0) return null;
    return items.find(i => i && i.id === shareIntent.id) || null;
  }, [shareIntent, items]);

  const clearIntent = useCallback(() => {
    setShareIntent(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("listing");
      url.searchParams.delete("shared");
      window.history.replaceState({}, "", url.toString());
    } catch {}
  }, []);

  const onSave = useCallback(async () => {
    if (!sharedItem || !user) { clearIntent(); return; }
    setBusy(true);
    try {
      if (watchlist && !watchlist[sharedItem.id] && typeof toggleWatchlist === "function") {
        toggleWatchlist(sharedItem);
      }
      if (typeof addToSharedInbox === "function") await addToSharedInbox(sharedItem);
    } catch (e) {
      console.warn("share save failed", e);
    }
    setBusy(false);
    clearIntent();
  }, [sharedItem, user, watchlist, toggleWatchlist, addToSharedInbox, clearIntent]);

  if (!shareIntent) return null;
  if (!Array.isArray(items) || items.length === 0) return null;

  const sender = (shareIntent.from || "").trim();
  const goBrowse = () => { clearIntent(); if (typeof setTab === "function") setTab("listings"); };
  const goLists = () => { clearIntent(); if (typeof setTab === "function") setTab("watchlist"); };
  const navCues = [{ label: "Browse Watchlist →", onClick: goBrowse }];
  if (user) navCues.push({ label: "Your lists →", onClick: goLists });

  // Shared listing not in the live feed (dealer pulled it / scrolled off).
  // Still no dead end — render through the frame with a "not available" hero.
  if (!sharedItem) {
    return (
      <SharedReceiveFrame
        sender={sender}
        typeLabel="watch"
        hero={
          <div style={{
            position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 8, padding: 24,
            textAlign: "center", color: "var(--text3)", fontSize: 13,
          }}>
            <span>This listing isn't available right now</span>
          </div>
        }
        identity={
          <>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text1)", margin: 0, lineHeight: 1.25 }}>
              This listing isn't available
            </h2>
            <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, marginTop: 6 }}>
              The dealer may have removed it. The rest of Watchlist is here.
            </div>
          </>
        }
        primaryCTA={{ label: "Browse Watchlist →", onClick: goBrowse }}
        signedIn={!!user}
        navCues={navCues}
      />
    );
  }

  const isAlreadySaved = !!(watchlist && watchlist[sharedItem.id]);
  const fmtPriceLine = (item) => {
    if (!item || !item.priceUSD || !item.price) return "";
    const native = item.currency || "USD";
    const primary = primaryCurrency || "USD";
    const primaryAmt = primary === "USD" ? item.priceUSD : priceIn(item.priceUSD, "USD", primary, FX_RATES_USD_PER);
    if (!primaryAmt) return fmt(item.price, native);
    if (native === primary) return fmt(item.price, native);
    return `${fmt(primaryAmt, primary)} · ${fmt(item.price, native)}`;
  };

  const hero = (
    <a href={sharedItem.url} target="_blank" rel="noopener noreferrer"
      onClick={() => { if (onClickListing) onClickListing(sharedItem); }}
      style={{ position: "absolute", inset: 0, display: "block" }}
      title={`Open ${sharedItem.source} listing`}>
      {sharedItem.img && !imgFailed ? (
        <img src={imgSrc(sharedItem.img)} alt={sharedItem.ref || sharedItem.title || "shared watch"}
          onError={() => setImgFailed(true)} loading="eager"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 6,
          color: "var(--text3)", fontSize: 13, padding: 16, textAlign: "center",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
          </svg>
          <span>Open on {sharedItem.source} to see it</span>
        </div>
      )}
      {sharedItem.sold && (
        <span style={{
          position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.7)", color: "#fff",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", padding: "4px 8px",
          borderRadius: 4, textTransform: "uppercase",
        }}>Sold</span>
      )}
    </a>
  );

  const identity = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text2)" }}>
          {sharedItem.source || ""}
        </span>
        {sharedItem.brand && <span style={{ fontSize: 12, color: "var(--text2)" }}>{sharedItem.brand}</span>}
      </div>
      <h2 style={{ fontSize: 19, fontWeight: 700, color: "var(--text1)", margin: "6px 0 0", lineHeight: 1.2 }}>
        {sharedItem.ref || sharedItem.title || "Watch"}
      </h2>
      {(sharedItem.price || sharedItem.priceUSD) ? (
        <div style={{ fontSize: 17, fontWeight: 600, color: "var(--text1)", marginTop: 4 }}>
          {fmtPriceLine(sharedItem) || (sharedItem.price ? fmt(sharedItem.price, sharedItem.currency || "USD") : "")}
        </div>
      ) : null}
    </>
  );

  return (
    <SharedReceiveFrame
      sender={sender}
      typeLabel="watch"
      hero={hero}
      identity={identity}
      primaryCTA={{
        label: `View on ${sharedItem.source || "dealer"} →`,
        href: sharedItem.url,
        onClick: () => { if (onClickListing) onClickListing(sharedItem); },
      }}
      signedIn={!!user}
      onSave={user ? onSave : null}
      saved={isAlreadySaved}
      onSignIn={(!user && isAuthConfigured && signInWithGoogle) ? signInWithGoogle : null}
      onAddToList={(user && openCollectionPicker) ? () => openCollectionPicker(sharedItem) : null}
      onShare={handleShare ? () => handleShare(sharedItem) : null}
      busy={busy}
      navCues={navCues}
    />
  );
}
