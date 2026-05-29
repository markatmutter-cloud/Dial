import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase, useAuth } from "../supabase";

// Floating watch-expert concierge bubble (Epic 9 "AI spine", Phase A).
//
// Mounts ONCE at the top of the app next to <ConfirmHost/> (App.js), as a
// sibling of the shells — so all of its state lives here and App.js gains
// no new hooks (no React #310 early-return risk) and no shellProps change.
// Theme is inherited for free via :root CSS vars (portal → document.body).
//
// Signed-in only for v1: renders nothing when there's no user. Talks to
// the grounded /api/chat endpoint with the user's Supabase JWT; the cold-
// open VOICE + grounding rules live server-side in SYSTEM_PROMPT, so this
// file stays a thin shell. The opening teaser below is display-only (the
// real, context-aware cold open arrives on the first user turn).

const Z = 1400; // below confirm/overlay modals, above page content

// Display-only opener. Deliberately short — it sets the voice and hands
// off; the substantive, get_user_context-grounded cold open comes from the
// model on the first real turn (don't duplicate the full voice here).
const GREETING =
  "Hi — I'm the watch nerd who lives in the corner of this app. Every word I say costs someone real money, so let's skip the small talk. Tell me what you're into, or pick a nudge below.";

const SUGGESTIONS = [
  "What should I look at?",
  "I'm into dive watches",
  "Surprise me",
];

export function ChatBubbleHost() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // real turns only: {role, content}
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [capped, setCapped] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  const send = useCallback(
    async (text) => {
      const content = (text || "").trim();
      if (!content || loading) return;
      setError("");
      setDraft("");
      const next = [...messages, { role: "user", content }];
      setMessages(next);
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (!token) {
          setError("Please sign in again.");
          setLoading(false);
          return;
        }
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ messages: next }),
        });
        if (res.status === 429) {
          setCapped(true);
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError("Something went wrong — try again in a moment.");
          setLoading(false);
          return;
        }
        const body = await res.json();
        setMessages([...next, { role: "assistant", content: body.reply || "" }]);
      } catch {
        setError("Couldn't reach the concierge — check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  // Signed-in only (v1). Also bail on SSR / pre-mount.
  if (typeof document === "undefined" || !user) return null;

  const display = [{ role: "assistant", content: GREETING }, ...messages];

  const node = open ? (
    <div
      style={{
        position: "fixed",
        right: "max(16px, env(safe-area-inset-right))",
        bottom: "max(16px, env(safe-area-inset-bottom))",
        zIndex: Z,
        width: "min(380px, calc(100vw - 24px))",
        height: "min(560px, calc(100vh - 120px))",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        border: "0.5px solid var(--border)",
        borderRadius: 16,
        boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
        overflow: "hidden",
      }}
      role="dialog"
      aria-label="Watch concierge"
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          background: "var(--brand-olive)",
          color: "var(--brand-olive-ink, #fff)",
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600 }}>Concierge</div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          style={{
            border: "none",
            background: "transparent",
            color: "inherit",
            fontSize: 20,
            lineHeight: 1,
            cursor: "pointer",
            padding: 2,
          }}
        >
          ×
        </button>
      </div>

      {/* messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {display.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              padding: "8px 12px",
              borderRadius: 12,
              fontSize: 14,
              lineHeight: 1.45,
              whiteSpace: "pre-wrap",
              background: m.role === "user" ? "var(--brand-olive)" : "var(--card, var(--bg))",
              color: m.role === "user" ? "var(--brand-olive-ink, #fff)" : "var(--text1)",
              border: m.role === "user" ? "none" : "0.5px solid var(--border)",
            }}
          >
            {m.content}
          </div>
        ))}

        {/* one-tap nudges, only before the first real turn */}
        {messages.length === 0 && !loading && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  border: "0.5px solid var(--border)",
                  background: "transparent",
                  color: "var(--text1)",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ alignSelf: "flex-start", fontSize: 13, color: "var(--text2)", padding: "4px 2px" }}>
            thinking…
          </div>
        )}
        {error && (
          <div style={{ fontSize: 13, color: "var(--danger)", padding: "2px" }}>{error}</div>
        )}
        {capped && (
          <div style={{ fontSize: 13, color: "var(--text2)", padding: "2px" }}>
            You've used today's concierge messages — back tomorrow.
          </div>
        )}
      </div>

      {/* composer */}
      {!capped && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          style={{
            display: "flex",
            gap: 8,
            padding: "10px 12px",
            borderTop: "0.5px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask about a watch…"
            disabled={loading}
            style={{
              flex: 1,
              border: "0.5px solid var(--border)",
              borderRadius: 10,
              padding: "9px 12px",
              fontSize: 14,
              fontFamily: "inherit",
              background: "var(--bg)",
              color: "var(--text1)",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            style={{
              border: "none",
              background: "var(--brand-olive)",
              color: "var(--brand-olive-ink, #fff)",
              borderRadius: 10,
              padding: "0 14px",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading || !draft.trim() ? "default" : "pointer",
              opacity: loading || !draft.trim() ? 0.5 : 1,
              fontFamily: "inherit",
            }}
          >
            Send
          </button>
        </form>
      )}
    </div>
  ) : (
    <button
      onClick={() => setOpen(true)}
      aria-label="Open watch concierge"
      style={{
        position: "fixed",
        right: "max(16px, env(safe-area-inset-right))",
        bottom: "max(16px, env(safe-area-inset-bottom))",
        zIndex: Z,
        width: 52,
        height: 52,
        borderRadius: "50%",
        border: "none",
        background: "var(--brand-olive)",
        color: "var(--brand-olive-ink, #fff)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.22)",
        cursor: "pointer",
        fontSize: 22,
        lineHeight: 1,
      }}
    >
      ✦
    </button>
  );

  return createPortal(node, document.body);
}
