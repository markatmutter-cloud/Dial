import React, { useState, useEffect, useCallback } from "react";
import { supabase, useAuth } from "../supabase";

// Settings panel for Lumé's memory (the per-user taste profile). View what it's
// learned, turn it on/off, and reset (forget). Reads the profile directly (RLS
// allows own-row select); writes go through SECURITY DEFINER RPCs (a direct
// authenticated write is rejected on this project regardless of RLS).
const label = {
  fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase",
  color: "var(--text3)", marginTop: 20, marginBottom: 8,
};

function profileSummary(profile) {
  if (!profile || typeof profile !== "object" || !Object.keys(profile).length) return "";
  if (profile.summary && typeof profile.summary === "string") return profile.summary;
  // Fall back to a compact line from the structured fields.
  const parts = [];
  for (const k of ["brands", "model_lines", "eras", "budget", "likes", "dislikes", "considering", "owns"]) {
    const v = profile[k];
    if (Array.isArray(v) && v.length) parts.push(`${k}: ${v.join(", ")}`);
    else if (typeof v === "string" && v) parts.push(`${k}: ${v}`);
  }
  return parts.join(" · ");
}

export function LumeMemorySettings() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await supabase.from("ai_user_profile").select("enabled, profile").maybeSingle();
      if (data) { setEnabled(data.enabled !== false); setProfile(data.profile || null); }
      else { setEnabled(true); setProfile(null); }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (user) load(); }, [user, load]);

  if (!user) return null;

  const toggle = async () => {
    const next = !enabled;
    setBusy(true); setStatus("");
    try { await supabase.rpc("set_ai_memory_enabled", { p_enabled: next }); setEnabled(next); }
    catch { setStatus("Couldn't update — try again."); }
    setBusy(false);
  };
  const reset = async () => {
    setBusy(true); setStatus("");
    try { await supabase.rpc("reset_ai_profile"); setProfile(null); setStatus("Cleared — Lumé starts fresh."); }
    catch { setStatus("Couldn't reset — try again."); }
    setBusy(false);
  };

  const summary = profileSummary(profile);

  return (
    <div>
      <div style={label}>Lumé memory</div>
      <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5, marginBottom: 10 }}>
        Lumé quietly learns your taste as you chat, so it remembers you across sessions. It's private to you.
      </div>

      <button onClick={toggle} disabled={busy} style={{
        width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 10,
        border: "0.5px solid var(--border)", cursor: busy ? "default" : "pointer",
        fontFamily: "inherit", fontSize: 13, fontWeight: 500,
        background: enabled ? "var(--brand-olive)" : "transparent",
        color: enabled ? "#fff" : "var(--text1)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span>{enabled ? "Remembering your taste" : "Memory is off"}</span>
        <span style={{ fontSize: 12, opacity: 0.85 }}>{enabled ? "On — tap to turn off" : "Off — tap to turn on"}</span>
      </button>

      {loaded && (
        <div style={{ fontSize: 12, color: "var(--text3)", margin: "10px 0", lineHeight: 1.5 }}>
          {summary
            ? <>What it remembers: <span style={{ color: "var(--text2)" }}>{summary.slice(0, 400)}</span></>
            : "Nothing yet — chat a few messages with Lumé and it'll start learning your taste."}
        </div>
      )}

      <button onClick={reset} disabled={busy || !summary} style={{
        padding: "8px 12px", borderRadius: 10, border: "0.5px solid var(--border)",
        background: "transparent", color: summary ? "var(--danger)" : "var(--text3)",
        cursor: busy || !summary ? "default" : "pointer", fontFamily: "inherit",
        fontSize: 13, fontWeight: 500,
      }}>Forget everything</button>

      {status && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>{status}</div>}
    </div>
  );
}
