import React, { useRef, useEffect } from "react";
import { SpeechRec } from "./LumeConversation";

// LumeComposer — the single chat input (mobile home). Search is chat-driven now
// (you ask Lumé; it engages search), so there's one input, not a Search/Ask
// split. Sends to the conversation. Reuses useLumeChat's draft/mic state.
const MicIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

export default function LumeComposer({ chat, onSend, isMobile, placeholder = "Ask Lumé, or search the catalog…" }) {
  const { draft, setDraft, loading, toggleMic, listening } = chat;
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft]);

  const submit = () => {
    const text = (draft || "").trim();
    if (!text || loading) return;
    onSend(text);
  };

  const disabled = loading || !((draft || "").trim());

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{
      display: "flex", alignItems: "flex-end", gap: 8,
      padding: isMobile ? "10px 12px calc(10px + env(safe-area-inset-bottom))" : "10px 12px",
      borderTop: "0.5px solid var(--border)", flexShrink: 0,
    }}>
      {SpeechRec && (
        <button type="button" onClick={toggleMic}
          aria-label={listening ? "Stop dictation" : "Dictate"} title="Dictate"
          style={{
            border: "0.5px solid var(--border)", borderRadius: 10, height: 38, width: 38,
            flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontFamily: "inherit",
            background: listening ? "var(--brand-olive)" : "transparent",
            color: listening ? "#fff" : "var(--text2)",
          }}>
          <MicIcon />
        </button>
      )}
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
        placeholder={placeholder}
        disabled={loading}
        rows={1}
        style={{
          flex: 1, border: "0.5px solid var(--border)", borderRadius: 10, padding: "10px 14px",
          fontSize: 14, fontFamily: "inherit", lineHeight: 1.4, background: "var(--bg)",
          color: "var(--text1)", WebkitTextFillColor: "var(--text1)", caretColor: "var(--text1)",
          outline: "none", resize: "none", maxHeight: 120, overflowY: "auto",
        }}
      />
      <button type="submit" disabled={disabled} style={{
        border: "none", background: "var(--brand-olive)", color: "#fff", borderRadius: 10,
        padding: "0 16px", height: 38, flexShrink: 0, fontSize: 14, fontWeight: 600,
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, fontFamily: "inherit",
      }}>Send</button>
    </form>
  );
}
