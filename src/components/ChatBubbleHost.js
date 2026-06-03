import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase, useAuth } from "../supabase";
import { dispatchAction } from "./ActionBus";
import { registerLumeOpener } from "./LumeBus";
import { LumeIcon } from "./LumeIcon";

// "Share with Lumé" seed: compose the opening user message from a listing the
// user handed to Lumé via a card's ⋯ menu. Lumé resolves brand/model/ref (and
// the URL) with its tools and engages about THIS watch.
function describeItem(it) {
  if (!it || typeof it !== "object") return "Tell me about this watch.";
  const bits = [it.brand, it.model || it.model_line, it.reference_id || it.reference_no]
    .filter(Boolean).join(" ").trim();
  const title = (it.title || bits || "this watch").toString().trim();
  const price = it.priceUSD ? `, $${Number(it.priceUSD).toLocaleString()}` : "";
  const src = it.source ? ` (${it.source})` : "";
  const url = it.url ? ` ${it.url}` : "";
  return `I'm looking at this listing — ${title}${price}${src}. What should I know about it?${url}`;
}

// Lumé — the watch-expert concierge bubble (Epic 9 "AI spine").
//
// Mounts ONCE at the top of the app next to <ConfirmHost/> (App.js), as a
// sibling of the shells — all its state lives here, App.js gains no new hooks
// (no React #310 risk) and no shellProps. Theme inherits via :root CSS vars
// (portal → document.body).
//
// Signed-OUT users see the launcher too (B-43) — tapping it prompts sign-in.
// Signed-in: the grounded chat. The cold-open VOICE + grounding live server-side
// in SYSTEM_PROMPT (api/chat.js); this stays a thin shell.
//
// NB: solid-olive surfaces use #fff text, NOT --brand-olive-ink (that ink is the
// DARK sage for light olive *tints* — invisible on solid olive). (B-39)

const Z = 1400; // below confirm/overlay modals, above page content
const NAME = "Lumé";
const OPENED_KEY = "lume_opened_v1";

// Device-native dictation engine (Web Speech API uses the OS/browser engine).
// null where unsupported → the mic button is hidden.
const SpeechRec =
  typeof window !== "undefined" ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

// Display-only opener — sets Lumé's voice + teaches the pronunciation; the
// substantive get_user_context-grounded cold open comes from the model.
const GREETING =
  "I'm Lumé.\n\nSo, what's your watch problem?\n\nLate-night Speedmaster browsing? Talking yourself into a vintage Sub? I speak fluent Speedy, Sub, QP, gilt, tropical, ghost bezel, soft case, and \"why is this one somehow twice the price?\"\n\nGive me 3–5 watches you like, one you're thinking about buying, and a rabbit hole you want to go down. The more you give me, the better I'll be.\n\nWhat should we look at first?";

const SUGGESTIONS = ["What should I look at?", "I'm into dive watches", "Surprise me"];

const LINK_STYLE = { color: "var(--brand)", textDecoration: "underline" };
const ANIM_CSS = "@keyframes lumeBlink{0%,80%,100%{opacity:.25}40%{opacity:1}}";

// Minimal rich-text renderer for assistant replies: **bold**, [md](links),
// bare URLs (→ clickable, new tab), line breaks. No markdown dep; React nodes.
const RICH = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|(https?:\/\/[^\s)]+)/g;

function renderInline(text, kp) {
  const out = [];
  let last = 0, i = 0, m;
  RICH.lastIndex = 0;
  while ((m = RICH.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<strong key={`${kp}-${i}`}>{m[1]}</strong>);
    } else if (m[2] !== undefined) {
      out.push(<a key={`${kp}-${i}`} href={m[3]} target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>{m[2]}</a>);
    } else if (m[4] !== undefined) {
      out.push(<a key={`${kp}-${i}`} href={m[4]} target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>{m[4]}</a>);
    }
    i += 1;
    last = RICH.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderRich(text) {
  return String(text || "").split("\n").map((line, i) => (
    <React.Fragment key={i}>{i > 0 && <br />}{renderInline(line, `l${i}`)}</React.Fragment>
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

export function ChatBubbleHost({ seedItem = null }) {
  // seedItem (Mark 2026-06-01): on the share-receive surfaces the floating
  // launcher STAYS, but it pops out an "Ask Lumé" callout and opens SEEDED with
  // the shared item (so the chat is about what's on screen, not blank). Off the
  // share surfaces seedItem is null and the launcher opens a normal chat.
  const { user, signInWithGoogle } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [capped, setCapped] = useState(false);
  const [error, setError] = useState("");
  const [actionState, setActionState] = useState({});
  const [listening, setListening] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(max-width: 600px)").matches
  );
  const [hasOpened, setHasOpened] = useState(() => {
    try { return typeof localStorage !== "undefined" && localStorage.getItem(OPENED_KEY) === "1"; }
    catch { return false; }
  });
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  const openChat = useCallback(() => {
    setOpen(true);
    setHasOpened(true);
    try { localStorage.setItem(OPENED_KEY, "1"); } catch {}
  }, []);

  const runAction = useCallback(async (action, key) => {
    setActionState((s) => ({ ...s, [key]: { status: "running" } }));
    const res = await dispatchAction(action);
    setActionState((s) => ({ ...s, [key]: { status: res.ok ? "done" : "failed", message: res.message } }));
    if (res.ok) setOpen(false); // minimise so the result behind is visible (Mark)
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

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, open]);

  // Auto-grow the composer with the draft (B-41), to ~5 lines then scroll.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [draft, open]);

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
        if (!res.ok) { setError("Something went wrong — try again in a moment."); setLoading(false); return; }
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
  // Speech-bubble launcher: a rounded square with one squared corner (tail) so
  // it reads as a chat icon, not a plain circle. (B-43)
  // Back to a circle (Mark), with a larger lume glow + drop shadow.
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
  const panelFrame = isMobile
    ? {
        position: "fixed", inset: 0, zIndex: Z,
        width: "100%", height: "100dvh",
        display: "flex", flexDirection: "column",
        background: "var(--bg)",
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
      {/* Mobile: a down-chevron reads as "minimise" (drop it back to the launcher);
          desktop: the usual ×. Both just setOpen(false). */}
      <button onClick={() => setOpen(false)} aria-label="Minimise" title="Minimise" style={{
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
  );

  let node;

  if (!open) {
    // Tapping the launcher (or the callout) opens SEEDED when there's a
    // shared item on screen, else a normal chat. The callout reads "Ask Lumé"
    // on a share surface (always shown there) or the first-run "Ask me" hint.
    //
    // Seed ONLY an empty conversation (P-29, 2026-06-03): Lumé minimises
    // itself after every action button (deliberate — the result behind should
    // be visible), so without the guard every reopen re-sent the same seed
    // question — one full model turn per round-trip, costing real API spend
    // just to get back to the transcript. With a transcript present, reopening
    // simply shows it.
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
            Sign in to chat with <strong>Lumé</strong> — your watch guide. It digs through live
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
    // Signed-in: the full chat.
    const display = [{ role: "assistant", content: GREETING }, ...messages];
    node = (
      <div style={{ ...panelFrame, ...(isMobile ? {} : { height: "min(560px, calc(100vh - 120px))" }) }} role="dialog" aria-label={NAME}>
        <style>{ANIM_CSS}</style>
        {header}
        <div ref={scrollRef} style={{
          flex: 1, overflowY: "auto", overscrollBehavior: "contain", padding: "14px",
          display: "flex", flexDirection: "column", gap: 10,
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
                        <button key={ai} onClick={() => runAction(a, key)} disabled={running || done}
                          title={failed ? st.message : undefined}
                          style={{
                            border: "none", borderRadius: 999, padding: "6px 12px", fontSize: 13,
                            fontFamily: "inherit", cursor: running || done ? "default" : "pointer",
                            background: failed ? "var(--danger)" : "var(--brand-olive)", color: "#fff",
                            opacity: running ? 0.6 : 1,
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

          {messages.length === 0 && !loading && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 }}>
              {SUGGESTIONS.map((s) => (
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
              You've used today's messages with {NAME} — back tomorrow.
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
      </div>
    );
  }

  return createPortal(node, document.body);
}
