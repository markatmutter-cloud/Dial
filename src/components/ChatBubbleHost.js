import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase, useAuth } from "../supabase";
import { dispatchAction } from "./ActionBus";
import { LumeIcon } from "./LumeIcon";

// Lumé — the watch-expert concierge bubble (Epic 9 "AI spine", Phase A).
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
//
// NB: surfaces painted with the SOLID olive (--brand-olive) use #fff text,
// NOT --brand-olive-ink — that ink is the DARK sage meant for light olive
// *tints* (chips), so on the solid dark olive it renders invisible (B-39).

const Z = 1400; // below confirm/overlay modals, above page content
const NAME = "Lumé";

// Display-only opener — sets Lumé's voice and hands off; the substantive,
// get_user_context-grounded cold open comes from the model on the first turn.
const GREETING =
  "Hey — I'm Lumé, your watch person here. Every word I say costs someone real money, so let's make it count. Tell me what you're into, or tap a nudge below.";

const SUGGESTIONS = [
  "What should I look at?",
  "I'm into dive watches",
  "Surprise me",
];

const LINK_STYLE = { color: "var(--brand)", textDecoration: "underline" };
const ANIM_CSS =
  "@keyframes lumeBlink{0%,80%,100%{opacity:.25}40%{opacity:1}}";

// Minimal rich-text renderer for assistant replies: **bold**, [md](links),
// bare URLs (→ clickable, new tab), and line breaks. No markdown dependency,
// builds React nodes (no dangerouslySetInnerHTML).
const RICH = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s)]+)/g;

function renderInline(text, kp) {
  const out = [];
  let last = 0;
  let i = 0;
  let m;
  RICH.lastIndex = 0;
  while ((m = RICH.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={`${kp}-${i}`}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      out.push(
        <a key={`${kp}-${i}`} href={m[3]} target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>{m[2]}</a>
      );
    } else if (m[4] !== undefined) {
      out.push(
        <a key={`${kp}-${i}`} href={m[4]} target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>{m[4]}</a>
      );
    }
    i += 1;
    last = RICH.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderRich(text) {
  return String(text || "").split("\n").map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {renderInline(line, `l${i}`)}
    </React.Fragment>
  ));
}

export function ChatBubbleHost() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // real turns only: {role, content}
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [capped, setCapped] = useState(false);
  const [error, setError] = useState("");
  const [actionState, setActionState] = useState({}); // "<msgIdx>-<actIdx>" -> {status, message}
  const scrollRef = useRef(null);

  const runAction = useCallback(async (action, key) => {
    setActionState((s) => ({ ...s, [key]: { status: "running" } }));
    const res = await dispatchAction(action);
    setActionState((s) => ({
      ...s,
      [key]: { status: res.ok ? "done" : "failed", message: res.message },
    }));
  }, []);

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
        setMessages([...next, {
          role: "assistant",
          content: body.reply || "",
          actions: Array.isArray(body.actions) ? body.actions : [],
        }]);
      } catch {
        setError("Couldn't reach Lumé — check your connection.");
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
      aria-label={NAME}
    >
      <style>{ANIM_CSS}</style>
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 14px",
          background: "var(--brand-olive)",
          color: "#fff",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LumeIcon size={22} style={{ borderRadius: 6, display: "block" }} />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>{NAME}</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          style={{
            border: "none",
            background: "rgba(255,255,255,0.16)",
            color: "#fff",
            width: 26,
            height: 26,
            borderRadius: "50%",
            fontSize: 17,
            lineHeight: "26px",
            textAlign: "center",
            cursor: "pointer",
            padding: 0,
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
        {display.map((m, i) => {
          const isUser = m.role === "user";
          const acts = !isUser && Array.isArray(m.actions) ? m.actions : [];
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isUser ? "flex-end" : "flex-start",
                gap: 6,
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "8px 12px",
                  borderRadius: 12,
                  fontSize: 14,
                  lineHeight: 1.45,
                  background: isUser ? "var(--brand-olive)" : "var(--card-bg, var(--surface))",
                  color: isUser ? "#fff" : "var(--text1)",
                  border: isUser ? "none" : "0.5px solid var(--border)",
                }}
              >
                {isUser ? m.content : renderRich(m.content)}
              </div>
              {acts.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: "90%" }}>
                  {acts.map((a, ai) => {
                    const key = `${i}-${ai}`;
                    const st = actionState[key];
                    const failed = st && st.status === "failed";
                    const done = st && st.status === "done";
                    const running = st && st.status === "running";
                    return (
                      <button
                        key={ai}
                        onClick={() => runAction(a, key)}
                        disabled={running || done}
                        title={failed ? st.message : undefined}
                        style={{
                          border: "none",
                          borderRadius: 999,
                          padding: "6px 12px",
                          fontSize: 13,
                          fontFamily: "inherit",
                          cursor: running || done ? "default" : "pointer",
                          background: failed ? "var(--danger)" : "var(--brand-olive)",
                          color: "#fff",
                          opacity: running ? 0.6 : 1,
                        }}
                      >
                        {done ? "✓ " : ""}{a.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

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
          <div
            aria-label={`${NAME} is thinking`}
            style={{
              alignSelf: "flex-start",
              display: "flex",
              gap: 4,
              alignItems: "center",
              padding: "10px 12px",
              borderRadius: 12,
              background: "var(--card-bg, var(--surface))",
              border: "0.5px solid var(--border)",
            }}
          >
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--text2)",
                  display: "inline-block",
                  animation: "lumeBlink 1.2s infinite",
                  animationDelay: `${d * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}
        {error && (
          <div style={{ fontSize: 13, color: "var(--danger)", padding: "2px" }}>{error}</div>
        )}
        {capped && (
          <div style={{ fontSize: 13, color: "var(--text2)", padding: "2px" }}>
            You've used today's messages with {NAME} — back tomorrow.
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
              // Explicit text colour + webkit fill + caret so the typed text
              // is always visible regardless of inherited colour (B-39).
              color: "var(--text1)",
              WebkitTextFillColor: "var(--text1)",
              caretColor: "var(--text1)",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            style={{
              border: "none",
              background: "var(--brand-olive)",
              color: "#fff",
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
      aria-label={`Open ${NAME}`}
      style={{
        position: "fixed",
        right: "max(16px, env(safe-area-inset-right))",
        bottom: "max(16px, env(safe-area-inset-bottom))",
        zIndex: Z,
        width: 52,
        height: 52,
        borderRadius: 15,
        border: "none",
        padding: 0,
        // The Lumé mark carries its own dark tile; match the button bg so any
        // sub-pixel corner gap stays seamless, and clip to the button radius.
        background: "#1c1c1e",
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(0,0,0,0.28)",
        cursor: "pointer",
        lineHeight: 0,
      }}
    >
      <LumeIcon size={52} style={{ display: "block" }} />
    </button>
  );

  return createPortal(node, document.body);
}
