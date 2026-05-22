import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Card } from "./Card";
import { SearchIcon, TabIcon } from "./icons";
import { MoonPhaseIndicator } from "./MoonPhaseIndicator";

// Home tab — phase 4 polish (2026-05-11).
//
// Editorial landing: a centered uppercase "WATCHLIST" hero block, a
// dominant search composite with Listings as the primary submit
// (Auctions/Sold underneath), then three single-row section strips
// in the order Mark settled on:
//   Recently added → Recently sold → Ending next at auction.
//
// Scope decisions (confirmed with Mark 2026-05-11):
// - One row × 7 cards per section. Two rows felt heavy; 7 in a row
//   tightens the images and makes each section read as a slice.
// - Top-bar search input is suppressed on Home (shells gate on
//   tab === "home") to avoid the duplicate-search-bar pattern.
// - Persistent top-bar wordmark + tab pills stay for navigation —
//   the centered editorial wordmark in the body is a brand hero,
//   not the nav surface (Fratello reference: persistent right-side
//   sign-up + centered brand block coexist).
// - No new typefaces. Editorial feel comes from letter-spacing,
//   uppercase, thin horizontal rules — not serif imports.
//
// Component is render-only — every list it shows comes in as a
// precomputed prop. Hooks live in App.js above the loading early
// returns (CLAUDE.md "Don't add new useState/useMemo/useCallback
// deep into App.js").

// Both mobile and desktop now use a horizontal slider strip (Mark
// spec 2026-05-12: "I meant slider for desktop browser like mobile").
// Desktop bumped 14 → 20 (2026-05-19) — at wide viewports a 14-card
// strip ran out of tiles before the right edge, leaving an empty
// gradient gap. Mobile stays at 14 (tile widths are flex-percentage,
// so the strip extends as far as the user can swipe regardless).
const CARDS_PER_SECTION_MOBILE = 14;
const CARDS_PER_SECTION_DESKTOP = 20;

// Editorial hero — phase 4c (2026-05-11). Restraint dial-up per
// Mark feedback after #228: drop the weight and tracking a notch,
// flank an italic tagline with hairline rules above + below. Reads
// as a masthead rather than a header label. No new typefaces — the
// system stack carries the italic via the regular `font-style`.
function EditorialHero({ isMobile, dark }) {
  // Hero stays on neutral page bg — olive was tried in PR #450 and
  // pulled back 2026-05-22 (Mark: "undo the green on the landing
  // page. remove green altogether"). Home is the editorial moment;
  // the colored chrome zone lives only on Listings/Watchlists/
  // Collecting where it's an identity cue, not on Home.
  return (
    <section style={{
      // PR 2026-05-22 rebalance (Mark report: hero too small after
      // #507 compression; band too tall after #508 padding bump).
      // Bring the hero back up — bigger wordmark + moonphase, less
      // top padding so the whole composition sits closer to the
      // top of the viewport.
      padding: isMobile ? "4px 16px 6px" : "4px 16px 10px",
      textAlign: "center",
    }}>
      <div style={{
        display: "flex", justifyContent: "center",
        marginBottom: isMobile ? 8 : 14,
      }}>
        <MoonPhaseIndicator size={isMobile ? 120 : 200} dark={dark} />
      </div>
      <h1 style={{
        margin: isMobile ? "0 0 8px" : "0 0 14px",
        fontFamily: "inherit",
        fontSize: isMobile ? 30 : 56,
        fontWeight: 500,
        letterSpacing: isMobile ? "0.14em" : "0.16em",
        // PR_δ2 2026-05-22: wordmark in brand olive — threads the brand
        // color into the neutral Home chrome without flooding the page.
        color: "var(--brand-olive-text)",
        textTransform: "uppercase",
        textAlign: "center",
        paddingLeft: isMobile ? "0.14em" : "0.16em",
      }}>
        Watchlist
      </h1>
      {/* Short olive kicker rule (PR #501) — sized to the wordmark
          beneath it so it reads as a continuation, not a separator. */}
      <div style={{
        height: 2,
        width: isMobile ? 56 : 96,
        background: "var(--brand-olive-text)",
        margin: "0 auto",
      }} />
    </section>
  );
}

// Live counts strip — small caps under the hero confirming the
// value prop at a glance. Numbers come from the same arrays
// every other surface reads.
function LiveCounts({ counts }) {
  if (!counts) return null;
  const fmt = (n) => (n || 0).toLocaleString("en-US");
  return (
    <div style={{
      textAlign: "center", padding: "14px 16px 20px",
      fontSize: 11, fontWeight: 500, letterSpacing: "0.18em",
      textTransform: "uppercase", color: "var(--text3)",
    }}>
      Status: {fmt(counts.listings)} listings · {fmt(counts.lots)} lots
    </div>
  );
}

// Search composite (2026-05-11). Empty state: just the input + a
// primary "Search" button (Listings default on click / Enter).
// When the user starts typing, a typeahead popover drops below
// the input with three target rows — Listings / Auctions / Sold —
// so the user can pick which sub-tab they want before submitting.
// Click outside or empty the input to dismiss.
function HomeSearchBar({ onSubmit, onLiveQuery, isMobile, dealerSources, onJumpToDealer, recentSearches, addRecentSearch, removeRecentSearch, counts }) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  // Mobile-only: separate overlay state so the inline input loses focus
  // when the overlay mounts (otherwise iOS shows the keyboard against
  // the wrong input). PR_Z 2026-05-21.
  const [mobileOverlay, setMobileOverlay] = useState(false);
  const wrapRef = useRef(null);
  const overlayInputRef = useRef(null);
  const fire = (target) => {
    const q = draft.trim();
    if (q && addRecentSearch) addRecentSearch(q);
    onSubmit(q, target);
    setDraft("");
    setFocused(false);
    setMobileOverlay(false);
  };
  // Recent-search chip click — fire the search directly without
  // making the user retype. Defaults to Search-all so they land on
  // the strip view (the most useful destination for a remembered
  // query). Doesn't bump position because addRecentSearch already
  // promotes on use.
  const fireFromRecent = (q) => {
    if (!q) return;
    if (addRecentSearch) addRecentSearch(q);
    onSubmit(q, "all");
    setDraft("");
    setFocused(false);
    setMobileOverlay(false);
  };
  // Live-filter the strip view as the user types (Mark spec
  // 2026-05-22): from the first 2 chars, open Search-all and
  // narrow live as more characters arrive. Keystrokes call the
  // parent's onLiveQuery with the current draft; the parent flips
  // searchAllActive=true + setSearch. Below 2 chars we revert
  // (closes the strip view if it's open from a previous type).
  const handleDraftChange = (next) => {
    setDraft(next);
    if (!onLiveQuery) return;
    const q = next.trim();
    onLiveQuery(q.length >= 2 ? q : "");
  };
  const closeMobileOverlay = () => {
    setMobileOverlay(false);
    setFocused(false);
  };

  // When the mobile overlay opens, focus its input on the next tick so
  // iOS Safari raises the keyboard. Blur the inline input first so the
  // browser doesn't keep two focused inputs.
  useEffect(() => {
    if (!mobileOverlay) return undefined;
    const id = setTimeout(() => {
      if (overlayInputRef.current) overlayInputRef.current.focus();
    }, 30);
    return () => clearTimeout(id);
  }, [mobileOverlay]);

  // Click-outside dismiss (desktop popover only — mobile uses the
  // Cancel button + tap-target rows on the overlay). mousedown not
  // click so the popover row's own click still fires (mousedown-on-row
  // → blur on input → click on row; without this guard the popover
  // would unmount before the click lands).
  useEffect(() => {
    if (!focused || mobileOverlay) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [focused, mobileOverlay]);

  const trimmed = draft.trim();
  const hasRecent = !!(recentSearches && recentSearches.length > 0);
  // Show the popover on focus when EITHER the user has started typing
  // OR there's recent-search history to surface. Empty + no recent =
  // no popover (don't render an empty dropdown shell).
  const showPopover = focused && (trimmed.length > 0 || hasRecent);
  const echo = trimmed.length > 24 ? trimmed.slice(0, 24) + "…" : trimmed;
  // Live-count formatter — `counts` is an object keyed by target
  // (all / live / auctions / sold) with integer values. Missing /
  // null values render no count chip.
  const fmtCount = (n) => (n == null ? null : Number(n).toLocaleString());

  const targets = [
    ["all",      "Search all", "Across Listings, Auctions, Sold"],
    ["live",     "Listings",   "Live dealer items"],
    ["auctions", "Auctions",   "Active auction lots"],
    ["sold",     "Sold",       "Archive of sold items"],
  ];

  // Dealer name typeahead — case-insensitive substring match. Caps at
  // 5 results so the popover doesn't dominate the page. Only shows
  // for queries ≥ 2 chars (single-char matches are too noisy).
  const dealerMatches = (() => {
    if (!dealerSources || !onJumpToDealer) return [];
    if (trimmed.length < 2) return [];
    const q = trimmed.toLowerCase();
    return dealerSources
      .filter(n => n && n.toLowerCase().includes(q))
      .slice(0, 5);
  })();
  const jumpToDealer = (name) => {
    onJumpToDealer(name);
    setDraft("");
    setFocused(false);
  };

  return (
    <section style={{
      // PR 2026-05-22: bottom padding zeroed out. This section used
      // to be a standalone block beneath the wordmark with built-in
      // 28-36px of breathing room below it. After the masthead
      // restructure (#502), HomeSearchBar lives INSIDE the olive
      // band — that hidden bottom padding was silently expanding
      // the space below the search bar regardless of the band's
      // own padding/gap, which is why every "shift the search
      // lower" attempt drifted back to centered. The olive band
      // now owns the surrounding spacing; this section just renders
      // the input.
      padding: 0,
      maxWidth: 720,
      margin: "0 auto",
      width: "100%",
    }}>
      <div ref={wrapRef} style={{ position: "relative" }}>
        <div style={{
          display: "flex", alignItems: "stretch",
          background: "var(--surface)", borderRadius: 12,
          border: "0.5px solid var(--border)",
          overflow: "hidden",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 10, padding: isMobile ? "0 12px" : "0 14px", flex: 1, minWidth: 0 }}>
            <SearchIcon />
            <input
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              onFocus={(e) => {
                setFocused(true);
                // PR_Z 2026-05-21: on mobile, take the user into a
                // full-screen search overlay (Spotify pattern). The
                // inline popover doesn't work on mobile because the
                // iOS keyboard covers it. Blur the inline input so
                // iOS hands focus to the overlay's input cleanly.
                if (isMobile) {
                  e.target.blur();
                  setMobileOverlay(true);
                }
              }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fire("all"); } }}
              placeholder={isMobile ? "Reference or brand…" : "Reference, brand, model…"}
              style={{ flex: 1, border: "none", background: "transparent", fontSize: isMobile ? 14 : 15, color: "var(--text1)", outline: "none", fontFamily: "inherit", minWidth: 0, padding: isMobile ? "11px 0" : "13px 0" }}
            />
            {draft && (
              <button onMouseDown={(e) => e.preventDefault()} onClick={() => setDraft("")} aria-label="Clear" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", padding: 2, fontFamily: "inherit", display: "flex", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <button onClick={() => fire("all")}
            aria-label="Search"
            style={{
              flexShrink: 0,
              border: "none", borderLeft: "0.5px solid var(--border)",
              // PR olive-on-home 2026-05-22: brand-color the primary
              // search CTA so the main action carries the olive
              // identity through the editorial hero on Home.
              background: "var(--brand-olive)", color: "#ffffff",
              fontFamily: "inherit", fontSize: isMobile ? 12 : 13, fontWeight: 600,
              letterSpacing: "0.04em", cursor: "pointer",
              padding: isMobile ? "0 14px" : "0 22px",
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
            }}>
            Search <span aria-hidden style={{ fontSize: 14 }}>→</span>
          </button>
        </div>
        {/* Typeahead popover — desktop only. Mobile uses the Spotify-
            pattern overlay further down (PR_Z 2026-05-21).
            Two modes (PR 2026-05-22):
              - Empty draft + recent history: surface recent searches
                as one-tap chips ("Recent" section).
              - Non-empty draft: target rows with live count chips
                ("Listings · 23") so the user can see hit volume in
                each category before pressing Enter. */}
        {showPopover && !isMobile && (
          <div role="listbox"
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
              background: "var(--card-bg)", border: "0.5px solid var(--border)",
              borderRadius: 10, overflow: "hidden", zIndex: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}>
            {trimmed.length === 0 && hasRecent ? (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 14px 6px" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text3)" }}>
                    Recent
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "0 14px 12px" }}>
                  {recentSearches.map((q) => (
                    <span key={q} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      borderRadius: 999, border: "0.5px solid var(--border)",
                      background: "var(--surface)",
                    }}>
                      <button
                        onMouseDown={(e) => { e.preventDefault(); fireFromRecent(q); }}
                        style={{
                          background: "transparent", border: "none", cursor: "pointer",
                          fontFamily: "inherit", fontSize: 13, color: "var(--text2)",
                          padding: "6px 4px 6px 12px",
                        }}>
                        {q}
                      </button>
                      {removeRecentSearch && (
                        <button
                          onMouseDown={(e) => { e.preventDefault(); removeRecentSearch(q); }}
                          aria-label={`Remove ${q} from recent searches`}
                          style={{
                            background: "transparent", border: "none", cursor: "pointer",
                            color: "var(--text3)", padding: "4px 8px 4px 2px",
                            display: "flex", alignItems: "center",
                          }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <>
            <div style={{ padding: "8px 14px 6px", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text3)" }}>
              Search in
            </div>
            {targets.map(([key, label, hint], idx) => {
              const count = counts ? fmtCount(counts[key]) : null;
              return (
              <button key={key}
                onMouseDown={(e) => { e.preventDefault(); fire(key); }}
                role="option"
                style={{
                  display: "flex", alignItems: "baseline", justifyContent: "space-between",
                  width: "100%", gap: 12,
                  padding: "10px 14px",
                  background: "transparent", border: "none",
                  borderTop: idx === 0 ? "none" : "0.5px solid var(--border)",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text1)" }}>{label}</span>
                  <span style={{ fontSize: 11, color: "var(--text3)" }}>{hint}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexShrink: 0 }}>
                  {count != null && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--brand-olive-text)", fontVariantNumeric: "tabular-nums" }}>
                      {count}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic" }}>
                    "{echo}"
                  </span>
                </div>
              </button>
              );
            })}
            {dealerMatches.length > 0 && (
              <>
                <div style={{ padding: "10px 14px 6px", borderTop: "0.5px solid var(--border)", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text3)" }}>
                  Dealers matching
                </div>
                {dealerMatches.map((name) => (
                  <button key={name}
                    onMouseDown={(e) => { e.preventDefault(); jumpToDealer(name); }}
                    role="option"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", gap: 12,
                      padding: "10px 14px",
                      background: "transparent", border: "none",
                      borderTop: "0.5px solid var(--border)",
                      cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                    }}>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text1)" }}>{name}</span>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>Browse listings →</span>
                  </button>
                ))}
              </>
            )}
              </>
            )}
          </div>
        )}
      </div>
      {/* Mobile search-focus overlay (Spotify pattern). When the input
          gets focus on mobile, replace the page with a full-viewport
          search surface: input at the top (under safe-area), target
          options as full-width tappable cards filling the space above
          the keyboard. Solves the iOS keyboard covering the inline
          popover (Mark report 2026-05-21). */}
      {isMobile && mobileOverlay && typeof document !== "undefined" && createPortal(
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "var(--bg)",
          display: "flex", flexDirection: "column",
        }}>
          {/* Top bar — input + Cancel. paddingTop respects PWA status
              bar via safe-area-inset. */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px",
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)",
            borderBottom: "0.5px solid var(--border)",
            flexShrink: 0,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--surface)", borderRadius: 10,
              padding: "10px 14px", flex: 1, minWidth: 0,
            }}>
              <SearchIcon />
              <input
                ref={overlayInputRef}
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fire("all"); } }}
                placeholder="Reference, brand, dealer…"
                style={{
                  flex: 1, border: "none", background: "transparent",
                  fontSize: 16, color: "var(--text1)", outline: "none",
                  fontFamily: "inherit", minWidth: 0,
                }}
              />
              {draft && (
                <button onClick={() => setDraft("")} aria-label="Clear"
                  style={{ background: "none", border: "none", cursor: "pointer",
                          color: "var(--text3)", padding: 2, flexShrink: 0,
                          display: "flex", alignItems: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <button onClick={closeMobileOverlay}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text2)", fontSize: 14, fontWeight: 500,
                fontFamily: "inherit", padding: "8px 4px",
                flexShrink: 0, whiteSpace: "nowrap",
              }}>
              Cancel
            </button>
          </div>
          {/* Options list — always visible above the keyboard. Each
              row spans the full width and is a clear tap target.
              Two modes match the desktop popover: empty draft +
              recent → recent-search chips; otherwise targets with
              live counts. */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0 0" }}>
            {trimmed.length === 0 && hasRecent ? (
              <>
                <div style={{
                  padding: "12px 16px 8px",
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  color: "var(--text3)",
                }}>
                  Recent
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {recentSearches.map((q) => (
                    <button key={q}
                      onClick={() => fireFromRecent(q)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", gap: 12,
                        padding: "14px 16px",
                        background: "transparent", border: "none",
                        borderTop: "0.5px solid var(--border)",
                        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      }}>
                      <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text1)" }}>{q}</span>
                      {removeRecentSearch && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeRecentSearch(q); }}
                          aria-label={`Remove ${q}`}
                          style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text3)", padding: 4, display: "flex", alignItems: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
            <div style={{
              padding: "12px 16px 8px",
              fontSize: 10, fontWeight: 600,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: "var(--text3)",
            }}>
              Search in
            </div>
            {targets.map(([key, label, hint]) => {
              const count = counts ? fmtCount(counts[key]) : null;
              return (
              <button key={key}
                onClick={() => fire(key)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", gap: 12,
                  padding: "14px 16px",
                  background: "transparent", border: "none",
                  borderTop: "0.5px solid var(--border)",
                  cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text1)" }}>{label}</span>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>{hint}</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexShrink: 0 }}>
                  {count != null && (
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-olive-text)", fontVariantNumeric: "tabular-nums" }}>
                      {count}
                    </span>
                  )}
                  {trimmed && (
                    <span style={{ fontSize: 12, color: "var(--text2)", fontStyle: "italic" }}>
                      "{echo}"
                    </span>
                  )}
                </div>
              </button>
              );
            })}
            {dealerMatches.length > 0 && (
              <>
                <div style={{
                  padding: "16px 16px 8px",
                  borderTop: "0.5px solid var(--border)",
                  fontSize: 10, fontWeight: 600,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  color: "var(--text3)",
                }}>
                  Dealers matching
                </div>
                {dealerMatches.map((name) => (
                  <button key={name}
                    onClick={() => { jumpToDealer(name); setMobileOverlay(false); }}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", gap: 12,
                      padding: "14px 16px",
                      background: "transparent", border: "none",
                      borderTop: "0.5px solid var(--border)",
                      cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                    }}>
                    <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text1)" }}>{name}</span>
                    <span style={{ fontSize: 12, color: "var(--text3)" }}>Browse listings →</span>
                  </button>
                ))}
              </>
            )}
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}

// One-row horizontal section. Desktop renders 7 cards in a CSS grid;
// mobile flips to a horizontal scroll with snap so cards 4-7 slide in
// from the right. App.js caps the data slice at 20; this strip then
// renders 14 (mobile) or 20 (desktop) of those.
// Eyebrow labels removed 2026-05-11 — Mark feedback: they
// duplicated the heading text below ("ON THE FEED" + "Recently
// added"). Heading + descriptor carry the editorial signal on
// their own.
function SectionStrip({ heading, descriptor, items, onViewAll, onScreen, screenCount, isMobile, watchlist, hidden, handleWish, toggleHide, toggleHomeHide, primaryCurrency, onShare, onView, onClickListing, openCollectionPicker, isAdmin, user, compact, inverted, shellPad }) {
  if (!items || items.length === 0) return null;
  const slice = items.slice(0, isMobile ? CARDS_PER_SECTION_MOBILE : CARDS_PER_SECTION_DESKTOP);
  // Inverted bleed (phase 4c, 2026-05-11): one section gets a dark
  // band that runs edge-to-edge of the viewport, breaking the
  // visual rhythm of the page (editorial trick — Mark's v0.5
  // mockup had this for one section). We escape the parent shell's
  // horizontal padding via negative margins matching `shellPad`,
  // then add our own padding back inside so card content sits in
  // the right rhythm.
  const wrapperStyle = inverted ? {
    background: "var(--text1)",
    marginLeft: -shellPad,
    marginRight: -shellPad,
    padding: `${isMobile ? 26 : 34}px ${shellPad}px ${isMobile ? 30 : 38}px`,
    marginBottom: isMobile ? 30 : 36,
  } : { marginBottom: 28 };
  const headingColor = inverted ? "var(--bg)" : "var(--text1)";
  const descriptorColor = inverted ? "var(--text-on-dark-2)" : "var(--text2)";
  const viewAllColor = inverted ? "var(--text-on-dark-1)" : "var(--text2)";
  return (
    <section style={wrapperStyle}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: inverted ? 0 : "0 16px", marginBottom: 12, gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          {/* Mobile stays at 16 (Mark feedback 2026-05-15 — 18 read as
              three giant blocks at phone widths). Desktop bumps to 22
              (Mark 2026-05-15 desktop audit: "Home strip headings on
              desktop can get bigger") — at 1280+ viewports the 16px
              heading didn't carry against 210px-wide tiles, the eye
              skipped past the section labels entirely. */}
          <h2 style={{
            margin: 0,
            // PR 2026-05-22: drop the serif on Home strip headings —
            // it diverged from every other tab's sans treatment and
            // Mark flagged the inconsistency. Strip headings now use
            // the inherited system stack, same as Listings / Watchlist
            // / Editorial section labels.
            fontFamily: "inherit",
            fontSize: isMobile ? 16 : 18,
            fontWeight: 600,
            color: headingColor,
            letterSpacing: "0.01em",
          }}>
            {heading}
          </h2>
          {descriptor && (
            <div style={{ fontSize: 13, color: descriptorColor, marginTop: 4, maxWidth: 480 }}>
              {descriptor}
            </div>
          )}
        </div>
        {/* "View all" lifted from a muted text link to a bordered
            pill button (Mark feedback 2026-05-11: needs to read as
            "this is a real destination" rather than incidental
            metadata). Keeps a low-key affordance — outline pill,
            not a CTA fill — but the border + slightly bolder weight
            communicates clickability.
            "Screen N new" pill (2026-05-15) sits to the left when
            there's a fresh-listings diff to review. Filled brand
            because it's the primary action when present; the prior
            grey-bar banner above the page got retired in favour of
            this in-context affordance (Mark spec: "I want it to not
            have a grey bar at the top"). */}
        <div style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 8 }}>
          {/* Screen pill retired from Home 2026-05-22 (Mark spec).
              Screener still reachable via auction catalogs + the
              feed-screening entry remains wired (openFeedScreener
              prop still flows through for the per-strip button if
              re-enabled in future). Home strips now lead with View
              all only — cleaner header, matches the editorial-
              section pattern the rest of the site uses. */}
          <button onClick={onViewAll}
            style={{
              cursor: "pointer", fontFamily: "inherit",
              fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
              padding: "8px 14px", borderRadius: 999,
              border: `0.5px solid ${inverted ? "var(--text-on-dark-3)" : "var(--text2)"}`,
              background: "transparent",
              color: viewAllColor,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
            View all <span aria-hidden style={{ fontSize: 13 }}>→</span>
          </button>
        </div>
      </div>
      {/* Unified horizontal-slider strip (Mark spec 2026-05-12):
          desktop now scrolls horizontally like mobile rather than
          rendering everything in a 7-col grid. Tile widths differ by
          viewport — narrower flex-percentage tiles on mobile, fixed
          pixel-width tiles on desktop so the slider feels intentional
          at large viewports.

          Right-edge fade overlay (Mark feedback 2026-05-15: "wanted
          the fade but didn't seem to come through"). Without it, the
          right-cut card is the only signal there's more to scroll;
          the gradient makes the affordance explicit. pointerEvents
          none so it doesn't swallow taps/swipes through the overlay. */}
      <div style={{ position: "relative" }}>
      <div style={{
        display: "flex", gap: 1, overflowX: "auto", overflowY: "hidden",
        padding: inverted ? "0 0 4px" : "0 16px 4px",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", msOverflowStyle: "none",
        background: inverted ? "var(--surface-on-dark)" : "var(--border)",
      }}>
        {slice.map(item => (
          <div key={item.id} style={isMobile ? {
            // Mobile tiles — sized so 2.5 fit on a typical phone
            // viewport (393–430px). 28% / 140px (Mark 2026-05-15)
            // went too narrow: the heart / × / ⋯ overlay buttons
            // are absolute-positioned and don't shrink with the
            // tile, so at 110-140px width they visually dominate
            // the image, plus the title becomes hard to read at
            // glance. 38% / 170px restores legible tiles while
            // still showing partial 3rd tile + a 4th hint — the
            // "more to scroll" affordance is preserved.
            // (History: 60%/240px → 44%/180px → 28%/140px → 38%/170px)
            flex: "0 0 38%", maxWidth: 170, scrollSnapAlign: "start", background: "var(--card-bg)",
            position: "relative",
          } : {
            // Desktop tiles — fixed pixel width so the strip reads as a
            // proper slider regardless of viewport. ~210px lands ~6 tiles
            // visible on a typical 1440px window with the rest hinting
            // off the right edge.
            flex: "0 0 210px", scrollSnapAlign: "start", background: "var(--card-bg)",
            position: "relative",
          }}>
            <Card item={item} wished={!!watchlist[item.id]} onWish={handleWish}
              compact={compact}
              onHide={isAdmin ? toggleHide : undefined}
              // On Home the × overlay handles Home-only hide.
              // Rename the ⋯ menu Hide entry to "Hide everywhere"
              // so the two actions are visually disambiguated
              // (Mark feedback 2026-05-11). Card respects
              // hideLabel via its existing prop.
              hideLabel="Hide everywhere"
              isHidden={!!hidden[item.id]}
              onAddToCollection={user ? openCollectionPicker : undefined}
              primaryCurrency={primaryCurrency}
              onShare={onShare} onView={onView} onClickListing={onClickListing} />
            {/* Admin one-tap quick-hide overlay — Home only (2026-05-11).
                Mark report: "crappy watches showing up on the home
                screen and I want to hide on a daily basis." Fires
                `toggleHomeHide(item.id)` which writes to a local
                home-only set (localStorage `dial_home_hidden_v1`) —
                hides the listing from THIS page only, doesn't touch
                hidden_listings or admin_hidden_listings. Other tabs
                and other users still see it. The ⋯ menu Hide is
                unchanged and still does the full per-user + global
                curation hide for cases where Mark wants the listing
                gone from everywhere. */}
            {isAdmin && toggleHomeHide && (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleHomeHide(item.id); }}
                aria-label="Hide from Home"
                title="Hide from Home (this page only)"
                style={{
                  position: "absolute", top: 6, left: 6, zIndex: 5,
                  width: 26, height: 26, borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.55)", color: "#fff",
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: 0,
                }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
        {/* Right-edge fade — lives inside the position:relative wrapper
            opened above the scroll div. Mark 2026-05-15 desktop audit:
            "wanted the fade but didn't seem to come through" — bumped
            from 36→72 on desktop (mobile stays 36, has less room) and
            extended the gradient ramp (start fading at 30% in rather
            than dead transparent) so the right-cut card reads as
            clearly under a fade, not just as a thin lip. */}
        <div aria-hidden style={{
          position: "absolute", top: 0, right: 0, bottom: 0,
          width: isMobile ? 36 : 72, pointerEvents: "none",
          background: `linear-gradient(to right, transparent 0%, ${inverted ? "var(--text1)" : "var(--bg)"} 75%)`,
        }} />
      </div>
    </section>
  );
}

// Manage-your-collection callout. Single editorial strip between the
// discovery sections and the footer that nudges signed-in users back
// into the collection-management surfaces (Saved listings, My watches,
// Lists). Three small text-style CTAs — no card chrome, no images.
// Manage callout — phase 4e (2026-05-11). Tried the inverted-bleed
// treatment on the search composite (#232 → reverted) and the Ending
// Next section (#230 → reverted) and both crashed: too heavy at the
// top, and white cards on dark read as broken respectively. The
// callout is the right surface for the bleed band — it's mid-page
// (visual rhythm break lands cleanly), all text + CTAs (no card
// photography), and reads as a "pause and think" beat between the
// discovery sections and the footer. Negative-margin escape via
// shellPad so the band runs edge-to-edge of the viewport.
function ManageCallout({ goToSavedLists, goToMyWatches, goToChallenges, isMobile, shellPad }) {
  return (
    <section style={{
      // PR olive-on-home 2026-05-22: switch the Watchbox bleed block
      // from dark to olive. Brand color carries through the editorial
      // hero on Home (was: pure dark band; could feel disconnected
      // from the olive chrome zone everywhere else). Olive + white
      // text on the same dark-mode contrast curve as the previous
      // dark + white pairing.
      background: "var(--brand-olive)",
      color: "#ffffff",
      marginLeft: -shellPad,
      marginRight: -shellPad,
      marginTop: isMobile ? 8 : 16,
      marginBottom: isMobile ? 28 : 36,
      padding: isMobile ? "36px 20px" : "56px 28px",
      textAlign: "center",
    }}>
      {/* Eyebrow — anchors the band to a single named destination
          (Mark feedback 2026-05-15 desktop audit: "the watchbox
          element on the home page is hidden or not clear enough
          — could be better/clearer this is a separate engagement
          surface"). The avatar pill + dropdown already promote
          Watchbox at the chrome level; this band makes it a
          discoverable destination FROM Home for users who haven't
          ventured into the dropdown yet. */}
      <div style={{
        fontSize: 11, fontWeight: 600,
        letterSpacing: "0.18em", textTransform: "uppercase",
        color: "var(--text-on-dark-3)",
        marginBottom: 12,
      }}>
        Watchbox
      </div>
      <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 28, fontWeight: 600, color: "#ffffff", letterSpacing: "-0.3px" }}>
        Your collecting space.
      </h2>
      <p style={{ margin: "10px auto 0", maxWidth: 560, fontSize: 14, color: "var(--text-on-dark-2)", lineHeight: 1.5 }}>
        Shortlists, ownership history, references worth revisiting — kept together thoughtfully.
      </p>
      <div style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        gap: 12, marginTop: 26, flexWrap: "wrap",
      }}>
        <button onClick={goToMyWatches} style={calloutPrimaryCta()}>
          Open Watchbox <span aria-hidden style={{ fontSize: 15 }}>→</span>
        </button>
      </div>
      <div style={{
        display: "flex", justifyContent: "center",
        gap: 10, marginTop: 16, flexWrap: "wrap",
      }}>
        <button onClick={goToSavedLists} style={calloutSecondaryCta()}>Saved lists</button>
        <button onClick={goToChallenges} style={calloutSecondaryCta()}>Challenges</button>
      </div>
    </section>
  );
}

// Primary CTA — dominant filled pill (light fill on dark band).
// Marks the destination this band is anchored to.
function calloutPrimaryCta() {
  return {
    padding: "12px 24px", borderRadius: 999,
    // Literal white bg + dark text so the CTA reads cleanly on the
    // olive callout block in BOTH light and dark themes (var(--bg)
    // would flip to black in dark mode = invisible on olive).
    border: "none", background: "#ffffff",
    color: "#1d1d1f", fontFamily: "inherit", fontSize: 14,
    fontWeight: 600, letterSpacing: "0.02em", cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 8,
  };
}

// Secondary CTAs — ghost pills for the related-but-not-primary
// destinations. Lighter visual weight so the eye lands on the
// primary first.
function calloutSecondaryCta() {
  return {
    padding: "8px 16px", borderRadius: 999,
    border: "0.5px solid var(--text-on-dark-3)",
    background: "transparent",
    color: "var(--text-on-dark-1)", fontFamily: "inherit", fontSize: 13,
    fontWeight: 500, letterSpacing: "0.02em", cursor: "pointer",
  };
}

// (NewSinceLastVisitBanner retired 2026-05-15 — the grey bar at the
// top of Home cycled back every few hours as scrapers landed fresh
// items, which read as "the banner is stuck" rather than "fresh
// listings landed since your last screening." Replaced by a "Screen
// N new" pill on the Recently added section header.)

// Footer band — closes the page rather than trailing off. Hairline
// rule above the link row, small centered text. About + Privacy +
// Terms always; Sign in only when signed-out.
function FooterBand({ openAbout, signInWithGoogle, user }) {
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

export function HomeTab(props) {
  const {
    homeRecentAdded, homeRecentSold, homeEndingNext,
    homeRecentlyHearted, goToSavedHearts,
    homeDealerSources, homeJumpToDealer,
    goToRecentAdded, goToRecentSold, goToEndingNext,
    homeSearchSubmit,
    homeCounts,
    goToSavedLists, goToMyWatches, goToChallenges,
    openAbout, signInWithGoogle,
    isMobile,
    watchlist, hidden, handleWish, toggleHide, toggleHomeHide, primaryCurrency,
    onShare, onView, onClickListing, openCollectionPicker, isAdmin,
    user, compact,
    feedScreenerItemsCount, openFeedScreener,
    dark,
    // Masthead-nav props — top-bar chrome suppressed on Home, these
    // render the equivalent block inside the olive-bleed band below
    // the wordmark (PR 2026-05-22 γ).
    homeMastheadTabs,
    homeGoToTab,
    homeMastheadAuthJSX,
    // Search-bar augmentations (PR 2026-05-22): recent-search history
    // + live counts per target + live filtering on the strip view as
    // the user types.
    homeRecentSearches,
    homeAddRecentSearch,
    homeRemoveRecentSearch,
    homeSearchCounts,
    homeSearchLiveQuery,
  } = props;

  // The shell adds horizontal padding around its main content (16px
  // mobile, 20px desktop). The inverted-bleed section needs to extend
  // past that padding to reach the viewport edges — pass shellPad
  // through so the negative-margin escape uses the right value.
  const shellPad = isMobile ? 16 : 20;

  return (
    <div style={{
      paddingBottom: 0,
      // Safe-area-inset on mobile now that the utility row above the
      // hero is gone — About + Watchbox moved into the olive band
      // below to give Watchbox a consistent olive background across
      // all tabs (Mark feedback 2026-05-22: "currently when I
      // navigate to the tabs it catches my eye as it looks like it
      // jumps up and right" — perceived as motion because Watchbox
      // flipped from white-context to olive-context).
      paddingTop: isMobile ? "env(safe-area-inset-top, 0px)" : 0,
    }}>
      <EditorialHero isMobile={isMobile} dark={dark} />
      {/* Masthead nav block — PR 2026-05-22 (Mark γ). The persistent
          top-bar chrome (tabs / About / auth pill) is suppressed on
          Home in the shells; everything moves under the wordmark in
          a single olive-bleed band. Tabs + search + auth/about
          stacked, framed by an olive-tint background that bleeds
          edge-to-edge via negative margins (the shell adds 16-20px
          horizontal padding, we escape it with -shellPad).
          Brand thread + magazine-cover layout: hero on top, all
          navigation + search clustered below as one band. */}
      <div style={{
        marginLeft: -shellPad,
        marginRight: -shellPad,
        background: "var(--brand-olive-tint-12)",
        // PR 2026-05-22 (Mark spec, "distribute vertically"): equal
        // top padding, gap, and bottom padding — same idea as
        // PowerPoint's Distribute Vertically. Tabs row + search bar
        // each occupy ~half the band's vertical content area,
        // separated and bracketed by equal whitespace.
        padding: isMobile ? "14px 16px" : "16px 20px",
        marginBottom: isMobile ? 14 : 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: isMobile ? 14 : 16,
      }}>
        {homeMastheadTabs && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? 14 : 22,
            flexWrap: "wrap",
          }}>
            {/* Tabs — Mark feedback 2026-05-22: match the non-Home
                top-bar tabs which carry icons + label. Same TabIcon
                helper used by DesktopShell so the symbol vocabulary
                is consistent across surfaces.
                About + Watchbox moved BACK to a top utility row
                above the hero 2026-05-22 (after the in-band version
                broke "same position on all tabs"). */}
            {homeMastheadTabs.map(([key, label]) => (
              <button key={key}
                onClick={() => homeGoToTab && homeGoToTab(key)}
                style={{
                  background: "transparent", border: "none",
                  cursor: "pointer", fontFamily: "inherit",
                  fontSize: isMobile ? 14 : 13,
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  color: "var(--text2)",
                  padding: 0,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                <TabIcon kind={key} />
                {label}
              </button>
            ))}
          </div>
        )}
        {homeSearchSubmit && (
          <div style={{ width: "100%", maxWidth: isMobile ? "none" : 720 }}>
            <HomeSearchBar
              onSubmit={homeSearchSubmit}
              onLiveQuery={homeSearchLiveQuery}
              isMobile={isMobile}
              dealerSources={homeDealerSources}
              onJumpToDealer={homeJumpToDealer}
              recentSearches={homeRecentSearches}
              addRecentSearch={homeAddRecentSearch}
              removeRecentSearch={homeRemoveRecentSearch}
              counts={homeSearchCounts}
            />
          </div>
        )}
      </div>
      <SectionStrip
        heading="Recently added"
        items={homeRecentAdded}
        onViewAll={goToRecentAdded}
        onScreen={openFeedScreener}
        screenCount={feedScreenerItemsCount}
        isMobile={isMobile} shellPad={shellPad}
        watchlist={watchlist} hidden={hidden} handleWish={handleWish}
        toggleHide={toggleHide} toggleHomeHide={toggleHomeHide} primaryCurrency={primaryCurrency}
        onShare={onShare} onView={onView} onClickListing={onClickListing}
        openCollectionPicker={openCollectionPicker} isAdmin={isAdmin}
        user={user} compact={compact}
      />
      {/* Signed-in user's most-recently hearted strip — Mark spec
          2026-05-11: "users most recent hearted items on the home
          page as a strip... if they are logged in... second row".
          SectionStrip already returns null on empty items so signed-
          out users / users with no hearts get no row. */}
      <SectionStrip
        heading="Recently hearted"
        items={homeRecentlyHearted}
        onViewAll={goToSavedHearts}
        isMobile={isMobile} shellPad={shellPad}
        watchlist={watchlist} hidden={hidden} handleWish={handleWish}
        toggleHide={toggleHide} toggleHomeHide={toggleHomeHide} primaryCurrency={primaryCurrency}
        onShare={onShare} onView={onView} onClickListing={onClickListing}
        openCollectionPicker={openCollectionPicker} isAdmin={isAdmin}
        user={user} compact={compact}
      />
      <SectionStrip
        heading="Recently sold"
        items={homeRecentSold}
        onViewAll={goToRecentSold}
        isMobile={isMobile} shellPad={shellPad}
        watchlist={watchlist} hidden={hidden} handleWish={handleWish}
        toggleHide={toggleHide} toggleHomeHide={toggleHomeHide} primaryCurrency={primaryCurrency}
        onShare={onShare} onView={onView} onClickListing={onClickListing}
        openCollectionPicker={openCollectionPicker} isAdmin={isAdmin}
        user={user} compact={compact}
      />
      <SectionStrip
        heading="Ending next at auction"
        items={homeEndingNext}
        onViewAll={goToEndingNext}
        isMobile={isMobile} shellPad={shellPad}
        watchlist={watchlist} hidden={hidden} handleWish={handleWish}
        toggleHide={toggleHide} toggleHomeHide={toggleHomeHide} primaryCurrency={primaryCurrency}
        onShare={onShare} onView={onView} onClickListing={onClickListing}
        openCollectionPicker={openCollectionPicker} isAdmin={isAdmin}
        user={user} compact={compact}
      />
      <ManageCallout
        goToSavedLists={goToSavedLists}
        goToMyWatches={goToMyWatches}
        goToChallenges={goToChallenges}
        isMobile={isMobile}
        shellPad={shellPad}
      />
      <FooterBand openAbout={openAbout} signInWithGoogle={signInWithGoogle} user={user} />
    </div>
  );
}
