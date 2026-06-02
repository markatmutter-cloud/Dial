import React, { useState, useEffect, useMemo, useCallback } from "react";
import { fmt, imgSrc, priceIn, FX_RATES_USD_PER } from "../utils";

// Share-receive surface for a single shared LISTING — the first-impression
// surface a recipient (often signed-out, often new) lands on from a shared
// link. Self-contained: all hooks live INSIDE this component so App.js's hook
// count never changes (React #310 — see the v2 regression history).
//
// 2026-06-01 register shift (Mark): this is the unified share/library surface's
// first type. The surface is now SELF-EXPLANATORY FROM ITS ACTIONS — no
// instructional paragraphs, no "First time on Watchlist?" onboarding panel, no
// "sign in only if…" reassurance. One attribution line ("X shared a watch with
// you") + the artifact + a consistent action bar (View on dealer · Save ·
// Add to list · Share) + quiet no-dead-end nav cues. Signed-out is beautiful
// and ungated (every public verb works); sign-in is offered once, folded into
// Save, never as a nag. The shared FRAME + the other five object types
// (catalog/list/article/guide/challenge) extract from this in Phase 6b.
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
  // 2026-06-01: the action bar's new verbs. openCollectionPicker → "Add to
  // list" (signed-in); handleShare → "Share" (onward share).
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

  const isAlreadySaved = sharedItem && watchlist && !!watchlist[sharedItem.id];
  const sender = (shareIntent.from || "").trim();

  const fmtPriceLine = (item) => {
    if (!item || !item.priceUSD || !item.price) return "";
    const native = item.currency || "USD";
    const primary = primaryCurrency || "USD";
    const primaryAmt = primary === "USD" ? item.priceUSD : priceIn(item.priceUSD, "USD", primary, FX_RATES_USD_PER);
    if (!primaryAmt) return fmt(item.price, native);
    if (native === primary) return fmt(item.price, native);
    return `${fmt(primaryAmt, primary)} · ${fmt(item.price, native)}`;
  };

  const goBrowse = () => { clearIntent(); if (typeof setTab === "function") setTab("listings"); };
  const goLists = () => { clearIntent(); if (typeof setTab === "function") setTab("watchlist"); };

  return (
    <div style={{ padding: "16px 16px 110px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>
      {/* [A] Attribution — sender + what was shared. The one line of chrome
          copy; no explanatory paragraph. */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span aria-hidden style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: 999,
          background: "var(--brand-olive-tint-12)", color: "var(--brand-olive-ink)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700,
        }}>{sender ? sender.charAt(0).toUpperCase() : "♡"}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
          textTransform: "uppercase", color: "var(--text2)",
        }}>{sender ? `${sender} shared a watch with you` : "Shared with you"}</span>
      </div>

      {sharedItem ? (
        <div style={{
          borderRadius: 12, overflow: "hidden", border: "0.5px solid var(--border)",
          background: "var(--card-bg)", boxShadow: "var(--shadow-modal)",
        }}>
          {/* [B] Hero */}
          <a href={sharedItem.url} target="_blank" rel="noopener noreferrer"
            onClick={() => { if (onClickListing) onClickListing(sharedItem); }}
            style={{ position: "relative", display: "block", aspectRatio: "16 / 10", background: "var(--surface)" }}
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

          {/* Title + identity */}
          <div style={{ padding: "16px 18px 4px" }}>
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
          </div>

          {/* [C] Action bar — consistent verbs, self-explanatory. One olive
              primary (the dealer view); the rest subtle. */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 18px 18px" }}>
            <a href={sharedItem.url} target="_blank" rel="noopener noreferrer"
              onClick={() => { if (onClickListing) onClickListing(sharedItem); }}
              style={{ ...primaryBtnStyle, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              View on {sharedItem.source || "dealer"} →
            </a>
            {user ? (
              <>
                <button onClick={onSave} disabled={busy || isAlreadySaved}
                  style={{ ...subtleBtnStyle, opacity: (busy || isAlreadySaved) ? 0.6 : 1, cursor: busy ? "wait" : (isAlreadySaved ? "default" : "pointer") }}>
                  {isAlreadySaved ? "♥ Saved" : (busy ? "Saving…" : "♡ Save")}
                </button>
                {openCollectionPicker && (
                  <button onClick={() => openCollectionPicker(sharedItem)} style={subtleBtnStyle}>Add to list</button>
                )}
              </>
            ) : (
              isAuthConfigured && signInWithGoogle && (
                <button onClick={signInWithGoogle} style={subtleBtnStyle}>Sign in to save</button>
              )
            )}
            {handleShare && (
              <button onClick={() => handleShare(sharedItem)} style={subtleBtnStyle}>Share</button>
            )}
          </div>
        </div>
      ) : (
        // Shared item not in the live feed (dealer pulled it / scrolled off).
        // Still no dead end — offer the way into the app.
        <div style={{
          padding: "28px 22px", borderRadius: 12, border: "0.5px solid var(--border)",
          background: "var(--card-bg)", boxShadow: "var(--shadow-modal)", maxWidth: 560,
        }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text1)", marginBottom: 6 }}>
            This listing isn't available right now
          </div>
          <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, marginBottom: 14 }}>
            The dealer may have removed it. The rest of Watchlist is here.
          </div>
          <button onClick={goBrowse} style={primaryBtnStyle}>Browse Watchlist →</button>
        </div>
      )}

      {/* [E] Navigation cues — quiet, no dead end. */}
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 16 }}>
        <button onClick={goBrowse} style={navCueStyle}>Browse Watchlist →</button>
        {user && <button onClick={goLists} style={navCueStyle}>Your lists →</button>}
      </div>
    </div>
  );
}

const primaryBtnStyle = {
  border: "none", background: "var(--brand-olive)", color: "#fff",
  padding: "10px 18px", borderRadius: 8, fontFamily: "inherit",
  fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const subtleBtnStyle = {
  border: "0.5px solid var(--border)", background: "var(--surface)", color: "var(--text1)",
  padding: "10px 16px", borderRadius: 8, fontFamily: "inherit", fontSize: 14, fontWeight: 500, cursor: "pointer",
};
const navCueStyle = {
  border: "none", background: "transparent", color: "var(--text2)",
  padding: 0, fontFamily: "inherit", fontSize: 13, cursor: "pointer",
};
