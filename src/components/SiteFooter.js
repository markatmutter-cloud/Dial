import React from "react";

// The site footer. Lived inside HomeTab until the magazine replaced that page
// (2026-09-07); pulled out so nothing depends on a retired component.
//
// Closes the page rather than letting it trail off: hairline rule above the
// link row, small centred text. About + Privacy + Terms always; Sign in only
// when signed out.
export function FooterBand({ openAbout, signInWithGoogle, user }) {
  const linkStyle = {
    background: "none", border: "none", padding: 0,
    fontFamily: "inherit", fontSize: 12, color: "var(--text2)",
    cursor: "pointer", letterSpacing: "0.02em",
  };
  return (
    <footer style={{
      marginTop: 24,
      padding: "24px 16px 16px",
      borderTop: "0.5px solid var(--border)",
      textAlign: "center",
    }}>
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 16, alignItems: "baseline" }}>
        <button onClick={openAbout} style={linkStyle}>About</button>
        <a href="/privacy.html" style={{ ...linkStyle, textDecoration: "none" }}>Privacy</a>
        <a href="/terms.html" style={{ ...linkStyle, textDecoration: "none" }}>Terms</a>
        {!user && signInWithGoogle && (
          <button onClick={signInWithGoogle} style={linkStyle}>Sign in</button>
        )}
      </div>
      <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 14 }}>
        © Watchlist · 2026
      </div>
    </footer>
  );
}

