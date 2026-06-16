import React, { useRef, useEffect } from "react";
import { SpeechRec } from "./LumeConversation";

// LumeComposer — the always-present input on the canvas. Two explicit actions
// (Mark's call): Search (visual cross-type results — the primary, Enter-bound)
// and Ask (the conversation). Writes the SAME chat.draft so either action reads
// one input, and reuses useLumeChat's draft/mic state (no second source).
const MicIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

export default function LumeComposer({ chat, onSearch, onAsk, isMobile, placeholder = "Search watches, or ask Lumé anything…" }) {
  const { draft, setDraft, loading, toggleMic, listening } = chat;
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft]);

  const text = () => (draft || "").trim();
  const disabled = loading || !text();
  const doSearch = () => { if (!disabled) onSearch(text()); };
  const doAsk = () => { if (!disabled) onAsk(text()); };

  const btn = (filled) => ({
    border: filled ? "none" : "0.5px solid var(--border)",
    background: filled ? "var(--brand-olive)" : "transparent",
    color: filled ? "#fff" : "var(--text1)", borderRadius: 10,
    padding: "0 14px", height: 38, flexShrink: 0, fontSize: 14, fontWeight: 600,
    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1, fontFamily: "inherit",
  });

  return (
    // Enter runs Search (the primary posture: results, not chat).
    <form onSubmit={(e) => { e.preventDefault(); doSearch(); }} style={{
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
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSearch(); } }}
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
      <button type="submit" disabled={disabled} style={btn(true)}>Search</button>
      <button type="button" onClick={doAsk} disabled={disabled} style={btn(false)}>Ask</button>
    </form>
  );
}
