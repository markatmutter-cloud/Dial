import React from "react";
import { HeartIcon } from "./icons";

// Heart link to Saved — matches the HomeIcon white outline, sits between
// About and the auth circle, fills red on hover (Mark 2026-06-02). Signed-in
// only (the caller guards). Extracted from DesktopShell 2026-06-03 so
// MobileShell renders the SAME affordance next to the avatar (P-7 parity).
export function SavedHeartLink({ onGo, onOlive }) {
  const [hover, setHover] = React.useState(false);
  const base = onOlive ? "rgba(255,255,255,0.85)" : "var(--text3)";
  return (
    <button onClick={onGo} aria-label="My saved" title="My saved"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: "none", border: "none", cursor: "pointer",
              padding: "6px 6px", fontFamily: "inherit", flexShrink: 0,
              display: "inline-flex", alignItems: "center",
              color: hover ? "var(--heart)" : base, transition: "color 0.15s" }}>
      <HeartIcon size={20} filled={hover} />
    </button>
  );
}
