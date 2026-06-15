import React from "react";
import { LumeConversation, NAME } from "./LumeConversation";
import { LumeIcon } from "./LumeIcon";

// LumeTab — the full-page Lumé surface (Epic 10). A real destination tab that
// hosts the catch-up journeys as one-tap launchers above the SAME conversation
// engine the bubble uses (LumeConversation). The chat state lives in App
// (useLumeChat passed in as `chat`), so opening a watch full-page and coming
// back keeps the thread intact.
//
// Journey prompts mirror the #870 prompt orchestration — Lumé chains the rest
// (got-away → widen → hearted-that-sold → latest) from there.
const JOURNEYS = [
  { label: "What I missed", prompt: "What have I missed this week that I haven't saved but fits my taste?" },
  { label: "The ones that got away", prompt: "What sold this week that I missed and would have liked?" },
  { label: "Latest listed", prompt: "Show me the latest watches listed." },
  { label: "My saved that sold", prompt: "Have any of my saved watches sold recently?" },
];

const journeyChip = {
  border: "0.5px solid var(--border)", background: "var(--surface)", color: "var(--text1)",
  borderRadius: 999, padding: "8px 14px", fontSize: 13, fontWeight: 500,
  cursor: "pointer", fontFamily: "inherit",
};

export function LumeTab({ chat, user, isMobile = false, onOpenItem, onActionResult, onSignIn }) {
  if (!user) {
    return (
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px", display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LumeIcon size={26} />
          <span style={{ fontSize: 22, fontWeight: 600 }}>{NAME}</span>
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--text1)" }}>
          Sign in to chat with <strong>Lumé</strong>, your watch guide. Catch up on what you
          missed, dig into a reference, and save things to your lists — all in one place.
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
    // Bound the surface to the viewport so LumeConversation's flex layout keeps
    // the composer pinned at the bottom (the shells use body-flow scroll, so we
    // can't rely on a height-bounded parent). The chrome offset is approximate —
    // tune live if the composer sits a touch high/low.
    <div style={{
      display: "flex", flexDirection: "column",
      height: isMobile ? "calc(100dvh - 124px)" : "calc(100dvh - 140px)",
      maxWidth: 820, margin: "0 auto", width: "100%",
    }}>
      <div style={{ flexShrink: 0, padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <LumeIcon size={20} />
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>{NAME}</span>
          <span style={{ fontSize: 13, color: "var(--text2)" }}>· pick up where you left off</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {JOURNEYS.map((j) => (
            <button key={j.label} onClick={() => chat.send(j.prompt)} style={journeyChip}>{j.label}</button>
          ))}
        </div>
      </div>
      <LumeConversation
        chat={chat}
        onOpenItem={onOpenItem}
        onActionResult={onActionResult}
        isMobile={isMobile}
        suggestions={[]}
      />
    </div>
  );
}
