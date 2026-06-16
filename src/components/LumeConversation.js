import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../supabase";
import { dispatchAction, resolveItemByUrl } from "./ActionBus";

// LumeConversation — the conversation CORE shared by both Lumé surfaces: the
// floating ChatBubbleHost and the inline LumeTab. It owns the message list +
// composer render and the chat state/loop (via useLumeChat), so the bubble and
// the full-page tab can't drift in how a reply renders, how links route, or how
// the agentic send loop behaves. Surface-specific behaviour (minimise on action,
// how a watch link opens) is injected by the parent via onOpenItem/onActionResult.
//
// NB: solid-olive surfaces use #fff text, NOT --brand-olive-ink (that ink is the
// DARK sage for light olive *tints* — invisible on solid olive). (B-39)

export const NAME = "Lumé";

// Display-only opener — sets Lumé's voice + teaches the pronunciation; the
// substantive get_user_context-grounded cold open comes from the model.
export const GREETING =
  "I'm Lumé.\n\nSo, what's your watch problem?\n\nLate-night Speedmaster browsing? Talking yourself into a vintage Sub? I speak fluent Speedy, Sub, QP, gilt, tropical, ghost bezel, soft case, and \"why is this one somehow twice the price?\"\n\nGive me 3–5 watches you like, one you're thinking about buying, and a rabbit hole you want to go down. The more you give me, the better I'll be.\n\nWhat should we look at first?";

export const SUGGESTIONS = ["What should I look at?", "I'm into dive watches", "Surprise me"];

const LINK_STYLE = { color: "var(--brand)", textDecoration: "underline" };
const ANIM_CSS = "@keyframes lumeBlink{0%,80%,100%{opacity:.25}40%{opacity:1}}";

// Device-native dictation engine (Web Speech API uses the OS/browser engine).
// null where unsupported → the mic button is hidden.
export const SpeechRec =
  typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

// "Share with Lumé" seed: compose the opening user message from a listing the
// user handed to Lumé via a card's ⋯ menu. Lumé resolves brand/model/ref (and
// the URL) with its tools and engages about THIS watch.
export function describeItem(it) {
  if (!it || typeof it !== "object") return "Tell me about this watch.";
  const bits = [it.brand, it.model || it.model_line, it.reference_id || it.reference_no]
    .filter(Boolean).join(" ").trim();
  const title = (it.title || bits || "this watch").toString().trim();
  const price = it.priceUSD ? `, $${Number(it.priceUSD).toLocaleString()}` : "";
  const src = it.source ? ` (${it.source})` : "";
  const url = it.url ? ` ${it.url}` : "";
  return `I'm looking at this listing: ${title}${price}${src}. What should I know about it?${url}`;
}

// Minimal rich-text renderer for assistant replies: **bold**, [md](links),
// bare URLs (→ clickable, new tab), line breaks. No markdown dep; React nodes.
// Tolerates a url wrapped in angle brackets — the model sometimes writes
// [label](<https://…>), which would otherwise fail to parse as a link and leak
// the raw markdown / a broken href.
const RICH = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(<?(https?:\/\/[^)\s>]+)>?\)|(https?:\/\/[^\s)>]+)/g;

// A link in Lumé's reply: if it resolves to a live watch we hold, open it IN-APP
// (the shared surface) instead of bouncing to the dealer site — Mark's "the body
// links are direct links, I want the shared surface" fix. Anything else (an
// article, a citation, a watch that's gone) stays a normal external link. The
// resolve check is synchronous so we never fall back to an async window.open()
// a popup-blocker would eat.
function renderLink(url, label, key, openInApp) {
  if (openInApp && resolveItemByUrl(url)) {
    return (
      <a key={key} href={url} onClick={(e) => { e.preventDefault(); openInApp(url); }} style={LINK_STYLE}>{label}</a>
    );
  }
  return <a key={key} href={url} target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>{label}</a>;
}

export function renderInline(text, kp, openInApp) {
  const out = [];
  let last = 0, i = 0, m;
  RICH.lastIndex = 0;
  while ((m = RICH.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={`${kp}-${i}`}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      out.push(renderLink(m[3], m[2], `${kp}-${i}`, openInApp));   // [label](url)
    } else if (m[4] !== undefined) {
      out.push(renderLink(m[4], m[4], `${kp}-${i}`, openInApp));   // bare url
    }
    i += 1;
    last = RICH.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderRich(text, openInApp) {
  return String(text || "").split("\n").map((line, i) => (
    <React.Fragment key={i}>{i > 0 && <br />}{renderInline(line, `l${i}`, openInApp)}</React.Fragment>
  ));
}

const MicIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

// useLumeChat — the chat state + agentic send loop, independent of any surface.
// A parent owns one instance; the bubble keeps its own (ephemeral), the inline
// tab's lives in App so it survives the full-page share surface. runAction here
// deliberately does NOT minimise/navigate — it returns the result and the
// surface decides (the bubble minimises, the tab keeps the thread).
export function useLumeChat() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [capped, setCapped] = useState(false);
  const [error, setError] = useState("");
  const [actionState, setActionState] = useState({});
  const [listening, setListening] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

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
        if (!token) { setError("Please sign in again."); setLoading(false); return; }
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messages: next }),
        });
        if (res.status === 429) { setCapped(true); setLoading(false); return; }
        if (!res.ok) { setError("Something went wrong. Try again in a moment."); setLoading(false); return; }
        const body = await res.json();
        setMessages([...next, {
          role: "assistant",
          content: body.reply || "",
          actions: Array.isArray(body.actions) ? body.actions : [],
        }]);
      } catch {
        setError("Couldn't reach Lumé. Check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  const runAction = useCallback(async (action, key) => {
    setActionState((s) => ({ ...s, [key]: { status: "running" } }));
    const res = await dispatchAction(action);
    setActionState((s) => ({ ...s, [key]: { status: res.ok ? "done" : "failed", message: res.message } }));
    return res;
  }, []);

  // Device-native dictation: append speech into the draft. (B-43)
  const toggleMic = useCallback(() => {
    if (!SpeechRec) return;
    if (listening) { try { recognitionRef.current && recognitionRef.current.stop(); } catch {} return; }
    let rec;
    try { rec = new SpeechRec(); } catch { return; }
    rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false;
    const base = draft;
    rec.onresult = (e) => {
      let t = "";
      for (let k = 0; k < e.results.length; k++) t += e.results[k][0].transcript;
      setDraft((base ? base.replace(/\s*$/, "") + " " : "") + t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  }, [listening, draft]);

  useEffect(() => () => { try { recognitionRef.current && recognitionRef.current.stop(); } catch {} }, []);

  const reset = useCallback(() => {
    setMessages([]); setDraft(""); setError(""); setCapped(false); setActionState({});
  }, []);

  return {
    messages, setMessages, draft, setDraft, loading, capped, error, actionState, listening,
    send, runAction, toggleMic, reset, scrollRef, inputRef,
  };
}

// LumeConversation — presentational scroll area + composer. Stateless re: the
// chat (it reads/writes via the `chat` object from useLumeChat). The parent
// injects the surface-specific link/action behaviour and the cold-open copy.
export function LumeConversation({
  chat,
  greeting = GREETING,
  suggestions = SUGGESTIONS,
  onOpenItem,
  onActionResult,
  onAction,            // optional pre-handler: return true to intercept an action
                       // (e.g. route show_listings into the canvas, not the tab)
  isMobile = false,
  scrollStyle,
}) {
  const { messages, draft, setDraft, loading, capped, error, actionState, listening, send, runAction, toggleMic, scrollRef, inputRef } = chat;

  // Keep the transcript pinned to the latest message; grow the composer with
  // the draft (to ~5 lines, then scroll). Effects live here so they fire when
  // this view is mounted and the refs are attached.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, scrollRef]);
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft, inputRef]);

  const display = greeting ? [{ role: "assistant", content: greeting }, ...messages] : messages;

  return (
    <>
      <style>{ANIM_CSS}</style>
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto", overscrollBehavior: "contain", padding: "14px",
        display: "flex", flexDirection: "column", gap: 10, ...scrollStyle,
      }}>
        {display.map((m, i) => {
          const isUser = m.role === "user";
          const acts = !isUser && Array.isArray(m.actions) ? m.actions : [];
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: 6 }}>
              <div style={{
                maxWidth: "85%", padding: "8px 12px", borderRadius: 12, fontSize: 14, lineHeight: 1.45,
                background: isUser ? "var(--brand-olive)" : "var(--card-bg, var(--surface))",
                color: isUser ? "#fff" : "var(--text1)",
                border: isUser ? "none" : "0.5px solid var(--border)",
              }}>
                {isUser ? m.content : renderRich(m.content, onOpenItem)}
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
                      // Visited chips keep the ✓ but stay CLICKABLE (Mark: after
                      // opening a link I want to go back and re-open it). Only a
                      // chip mid-run is disabled.
                      <button key={ai} onClick={() => { if (onAction && onAction(a)) return; runAction(a, key).then((res) => onActionResult && onActionResult(a, res)); }} disabled={running}
                        title={failed ? st.message : undefined}
                        style={{
                          border: "none", borderRadius: 999, padding: "6px 12px", fontSize: 13,
                          fontFamily: "inherit", cursor: running ? "default" : "pointer",
                          background: failed ? "var(--danger)" : "var(--brand-olive)", color: "#fff",
                          opacity: running ? 0.6 : (done ? 0.85 : 1),
                        }}>
                        {done ? "✓ " : ""}{a.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {messages.length === 0 && !loading && suggestions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
            {suggestions.map((s) => (
              <button key={s} onClick={() => send(s)} style={{
                border: "0.5px solid var(--border)", background: "transparent", color: "var(--text1)",
                borderRadius: 999, padding: "6px 12px", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              }}>{s}</button>
            ))}
          </div>
        )}

        {loading && (
          <div aria-label={`${NAME} is thinking`} style={{
            alignSelf: "flex-start", display: "flex", gap: 4, alignItems: "center",
            padding: "10px 12px", borderRadius: 12, background: "var(--card-bg, var(--surface))",
            border: "0.5px solid var(--border)",
          }}>
            {[0, 1, 2].map((d) => (
              <span key={d} style={{
                width: 6, height: 6, borderRadius: "50%", background: "var(--text2)", display: "inline-block",
                animation: "lumeBlink 1.2s infinite", animationDelay: `${d * 0.15}s`,
              }} />
            ))}
          </div>
        )}
        {error && <div style={{ fontSize: 13, color: "var(--danger)", padding: "2px" }}>{error}</div>}
        {capped && (
          <div style={{ fontSize: 13, color: "var(--text2)", padding: "2px" }}>
            You've used today's messages with {NAME}. Back tomorrow.
          </div>
        )}
      </div>

      {!capped && (
        <form onSubmit={(e) => { e.preventDefault(); send(draft); }} style={{
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
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(draft); } }}
            placeholder="Ask about a watch…"
            disabled={loading}
            rows={1}
            style={{
              flex: 1, border: "0.5px solid var(--border)", borderRadius: 10, padding: "9px 12px",
              fontSize: 14, fontFamily: "inherit", lineHeight: 1.4, background: "var(--bg)",
              color: "var(--text1)", WebkitTextFillColor: "var(--text1)", caretColor: "var(--text1)",
              outline: "none", resize: "none", maxHeight: 120, overflowY: "auto",
            }}
          />
          <button type="submit" disabled={loading || !draft.trim()} style={{
            border: "none", background: "var(--brand-olive)", color: "#fff", borderRadius: 10,
            padding: "0 14px", height: 38, flexShrink: 0, fontSize: 14, fontWeight: 600,
            cursor: loading || !draft.trim() ? "default" : "pointer",
            opacity: loading || !draft.trim() ? 0.5 : 1, fontFamily: "inherit",
          }}>Send</button>
        </form>
      )}
    </>
  );
}
