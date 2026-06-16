import React from "react";
import { NAME } from "./LumeConversation";
import LumeCanvas from "./LumeCanvas";
import { LumeIcon } from "./LumeIcon";

// LumeTab — the full-page Lumé surface (Epic 10). A thin host: the signed-out
// sign-in gate, then the host-agnostic LumeCanvas (the morphing prompt-driven
// surface). The chat state lives in App (useLumeChat passed in as `chat`), so
// opening a watch full-page and coming back keeps the thread intact.
//
// The canvas itself is placement-agnostic — the same component graduates into
// the full-screen launcher takeover later (Phase 3) unchanged; this tab is the
// proving ground.
export function LumeTab({
  chat, user, isMobile = false, onOpenItem, onSignIn,
  liveItems, auctionLotItems, articles, watchlist, savedSearches, cardCtx,
}) {
  if (!user) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px", display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LumeIcon size={26} />
          <span style={{ fontSize: 22, fontWeight: 600 }}>{NAME}</span>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text1)" }}>
          Sign in to chat with <strong>Lumé</strong>, your watch guide. Catch up on what you
          missed, dig into a reference, and save things to your lists, all in one place.
        </div>
        <button onClick={() => { try { onSignIn && onSignIn(); } catch {} }} style={{
          border: "none", background: "var(--brand-olive)", color: "#fff",
          borderRadius: 10, padding: "11px 18px", fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: "inherit",
        }}>Sign in to chat</button>
      </div>
    );
  }

  return (
    // Bound the surface to the viewport so the canvas's flex layout keeps the
    // composer pinned at the bottom (the shells use body-flow scroll, so we
    // can't rely on a height-bounded parent). The chrome offset is approximate —
    // tune live if the composer sits a touch high/low.
    <div style={{
      height: isMobile ? "calc(100dvh - 124px)" : "calc(100dvh - 140px)",
      // Desktop runs the two-pane (content + chat rail), so it needs the room;
      // mobile is single-column and stays narrow.
      maxWidth: isMobile ? 920 : 1280, margin: "0 auto", width: "100%",
    }}>
      <LumeCanvas
        chat={chat}
        user={user}
        isMobile={isMobile}
        onOpenItem={onOpenItem}
        liveItems={liveItems}
        auctionLotItems={auctionLotItems}
        articles={articles}
        watchlist={watchlist}
        savedSearches={savedSearches}
        cardCtx={cardCtx}
      />
    </div>
  );
}
