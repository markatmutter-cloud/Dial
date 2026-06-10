import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../supabase";
import { dispatchAction, resolveItemByUrl } from "./ActionBus";
import { registerLumeOpener } from "./LumeBus";
import { LumeIcon } from "./LumeIcon";
import { useLumeChat, LumeConversation, describeItem, NAME, GREETING, SUGGESTIONS } from "./LumeConversation";

// renderInline now lives with the conversation core; re-export it so the
// existing ChatBubbleHost.test.jsx import keeps working.
export { renderInline } from "./LumeConversation";

// Lumé — the watch-expert concierge bubble (Epic 9 "AI spine").
//
// Mounts ONCE at the top of the app next to <ConfirmHost/> (App.js), as a
// sibling of the shells — its surface state lives here, App.js gains no new
// hooks (no React #310 risk) and no shellProps. The conversation itself (state +
// message/composer render) is the shared LumeConversation, so the bubble and the
// inline LumeTab can't drift. Theme inherits via :root CSS vars (portal → body).
//
// Signed-OUT users see the launcher too (B-43) — tapping it prompts sign-in.
// Signed-in: the grounded chat. The cold-open VOICE + grounding live server-side
// in SYSTEM_PROMPT (api/chat.js); this stays a thin shell.
//
// NB: solid-olive surfaces use #fff text, NOT --brand-olive-ink (that ink is the
// DARK sage for light olive *tints* — invisible on solid olive). (B-39)

const Z = 1400; // below confirm/overlay modals, above page content
const OPENED_KEY = "lume_opened_v1";

export function ChatBubbleHost({ seedItem = null }) {
  // seedItem (Mark 2026-06-01): on the share-receive surfaces the floating
  // launcher STAYS, but it pops out an "Ask Lumé" callout and opens SEEDED with
  // the shared item (so the chat is about what's on screen, not blank). Off the
  // share surfaces seedItem is null and the launcher opens a normal chat.
  const { user, signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(max-width: 600px)").matches
  );
  // Desktop expand-to-fullscreen (Mark): the bubble is a 380px frame; ⤢ blows it
  // up to a near-full-screen takeover for a real conversation. Mobile is already
  // full-screen, so expand is desktop-only and resets on minimise.
  const [expanded, setExpanded] = useState(false);
  const [hasOpened, setHasOpened] = useState(() => {
    try { return typeof localStorage !== "undefined" && localStorage.getItem(OPENED_KEY) === "1"; }
    catch { return false; }
  });
  // The conversation state + send loop (shared with the inline tab). This is the
  // bubble's own instance — ephemeral; minimising drops nothing but the panel.
  const chat = useLumeChat();
  const { messages, send, loading } = chat;

  const openChat = useCallback(() => {
    setOpen(true);
    setHasOpened(true);
    try { localStorage.setItem(OPENED_KEY, "1"); } catch {}
  }, []);

  // Open a watch link from the reply body in-app (the shared surface). Only
  // called for links LumeConversation already confirmed resolve to a live watch.
  const openItemInApp = useCallback((url) => {
    // Resolve to the real item and open by its id — open_watch keys on the feed's
    // SHA1 id, so passing itemUrl (which it would re-hash with shortHash) wouldn't
    // resolve. resolveItemByUrl already confirmed this one resolves.
    const item = resolveItemByUrl(url);
    const payload = item ? { itemId: item.id, itemUrl: item.url } : { itemUrl: url };
    dispatchAction({ type: "open_watch", payload }).then((res) => {
      // Keep Lumé OPEN on desktop (Mark): the surface opens behind the floating
      // panel, and the most likely next click is the NEXT link in Lumé's list —
      // don't make them re-open the chat. On mobile the panel is a full-screen
      // sheet that would cover the watch, so minimise there to reveal it.
      if (res && res.ok && isMobile) setOpen(false);
    });
  }, [isMobile]);

  // Track narrow viewports → Lumé goes full-screen on mobile.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 600px)");
    const on = () => setIsMobile(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener("change", on);
    else mq.addListener(on);
    return () => { if (mq.removeEventListener) mq.removeEventListener("change", on); else mq.removeListener(on); };
  }, []);

  // While the full-screen sheet is open on mobile, lock the page behind it so
  // scrolling stays inside the chat (no underlying-screen scroll bleed — Mark).
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!(open && isMobile)) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open, isMobile]);

  // "Share with Lumé" (B-52): a card's ⋯ row calls askLumeAbout(item) → this
  // opens the bubble and, if signed in, kicks off a conversation about that
  // listing. Re-registers when send/openChat change so it always uses the live
  // handlers. Signed-out → just opens (the sign-in panel shows).
  useEffect(() => {
    return registerLumeOpener((item) => {
      openChat();
      if (user && item) send(describeItem(item));
    });
  }, [user, send, openChat]);

  if (typeof document === "undefined") return null;

  const FIXED = {
    position: "fixed",
    right: "max(16px, env(safe-area-inset-right))",
    bottom: "max(16px, env(safe-area-inset-bottom))",
    zIndex: Z,
  };
  // Speech-bubble launcher → back to a circle (Mark), with a larger lume glow +
  // drop shadow. (B-43)
  const launcherStyle = {
    width: 52, height: 52,
    borderRadius: "50%",
    border: "none", padding: 0,
    background: "var(--brand-olive)",
    boxShadow: "0 0 22px 5px rgba(201,255,214,0.45), 0 8px 24px rgba(0,0,0,0.32)",
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  // Desktop: a floating rounded frame, bottom-right. Mobile: full-screen sheet
  // (you can't see the page behind it anyway), with safe-area-aware chrome.
  // Desktop EXPANDED: a centered near-full-screen takeover over a dimmed backdrop.
  const isExpanded = expanded && !isMobile;
  const panelFrame = isMobile
    ? {
        position: "fixed", inset: 0, zIndex: Z,
        width: "100%", height: "100dvh",
        display: "flex", flexDirection: "column",
        background: "var(--bg)",
        overflow: "hidden",
      }
    : isExpanded
    ? {
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: Z,
        width: "min(880px, calc(100vw - 48px))",
        height: "min(820px, calc(100vh - 48px))",
        display: "flex", flexDirection: "column",
        background: "var(--bg)",
        border: "1px solid rgba(255,255,255,0.22)",
        borderRadius: 16,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.18), 0 24px 64px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }
    : {
        ...FIXED,
        width: "min(380px, calc(100vw - 24px))",
        display: "flex", flexDirection: "column",
        background: "var(--bg)",
        border: "1px solid rgba(255,255,255,0.22)",
        borderRadius: 16,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.18), 0 16px 48px rgba(0,0,0,0.5)",
        overflow: "hidden",
      };
  const header = (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: isMobile ? "calc(12px + env(safe-area-inset-top)) 14px 12px" : "12px 14px",
      background: "var(--brand-olive)", color: "#fff", flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LumeIcon size={18} style={{ display: "block" }} />
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{NAME}</span>
        <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.85 }}>· Watch chat</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Desktop + signed-in only: ⤢ expand to a full-screen takeover / ⤡
            collapse back to the corner frame. Mobile is already full-screen. */}
        {!isMobile && user && (
          <button onClick={() => setExpanded((e) => !e)}
            aria-label={isExpanded ? "Collapse" : "Expand"} title={isExpanded ? "Collapse" : "Expand"} style={{
            border: "none", background: "rgba(255,255,255,0.16)", color: "#fff",
            width: 26, height: 26, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0,
          }}>
            {isExpanded
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" /></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>}
          </button>
        )}
        {/* Mobile: a down-chevron reads as "minimise" (drop it back to the launcher);
            desktop: the usual ×. Both minimise + reset expand. */}
        <button onClick={() => { setOpen(false); setExpanded(false); }} aria-label="Minimise" title="Minimise" style={{
          border: "none", background: "rgba(255,255,255,0.16)", color: "#fff",
          width: isMobile ? 34 : 26, height: isMobile ? 34 : 26, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 17, lineHeight: 1, textAlign: "center", cursor: "pointer", padding: 0,
        }}>
          {isMobile
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
            : "×"}
        </button>
      </div>
    </div>
  );

  let node;

  if (!open) {
    // Tapping the launcher (or the callout) opens SEEDED when there's a shared
    // item on screen, else a normal chat. Seed ONLY an empty conversation (P-29):
    // Lumé minimises after every action button, so without the guard every reopen
    // re-sent the same seed question — one full model turn per round-trip.
    const openSeeded = () => {
      openChat();
      if (seedItem && user && messages.length === 0 && !loading) send(describeItem(seedItem));
    };
    const showCallout = !!seedItem || !hasOpened;
    node = (
      <div style={{ ...FIXED, display: "flex", alignItems: "center", gap: 10 }}>
        {showCallout && (
          <button onClick={openSeeded} style={{
            border: "none",
            background: "rgba(20,24,18,0.72)",
            WebkitBackdropFilter: "blur(6px)", backdropFilter: "blur(6px)",
            color: "#fff", borderRadius: 999, padding: "8px 12px",
            fontSize: 13, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          }}>{seedItem ? "Ask Lumé" : "Ask me"}</button>
        )}
        <button onClick={openSeeded} aria-label={`Open ${NAME}`} style={launcherStyle}>
          <LumeIcon size={44} style={{ display: "block" }} />
        </button>
      </div>
    );
  } else if (!user) {
    // Signed-out: prompt to sign in. (B-43)
    node = (
      <div style={panelFrame} role="dialog" aria-label={NAME}>
        {header}
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text1)" }}>
            Sign in to chat with <strong>Lumé</strong>, your watch guide. It digs through live
            listings and auctions, pulls up reference guides, and saves things to your lists.
          </div>
          <button onClick={() => { try { signInWithGoogle && signInWithGoogle(); } catch {} }} style={{
            border: "none", background: "var(--brand-olive)", color: "#fff",
            borderRadius: 10, padding: "11px 16px", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>Sign in to chat</button>
        </div>
      </div>
    );
  } else {
    // Signed-in: the full chat (header + the shared conversation core).
    node = (
      <div style={{ ...panelFrame, ...(isMobile || isExpanded ? {} : { height: "min(560px, calc(100vh - 120px))" }) }} role="dialog" aria-label={NAME}>
        {header}
        <LumeConversation
          chat={chat}
          onOpenItem={openItemInApp}
          onActionResult={(a, res) => { if (res && res.ok) setOpen(false); }}
          isMobile={isMobile}
          greeting={GREETING}
          suggestions={SUGGESTIONS}
        />
      </div>
    );
  }

  return createPortal(
    <>
      {/* Dimmed backdrop behind the expanded desktop takeover; click to collapse. */}
      {open && isExpanded && (
        <div onClick={() => setExpanded(false)} aria-hidden style={{
          position: "fixed", inset: 0, zIndex: Z - 1, background: "rgba(0,0,0,0.45)",
        }} />
      )}
      {node}
    </>,
    document.body
  );
}
