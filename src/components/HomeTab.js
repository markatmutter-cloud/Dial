import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Card } from "./Card";
import CardStrip from "./CardStrip";
import CardShell from "./CardShell";
import SectionHeader from "./SectionHeader";
import HomeAuctionModule from "./HomeAuctionModule";
import { HOME_SECTIONS } from "../homeSections";
import { articleAsListing } from "./EditorialView";
import { askLumeAbout } from "./LumeBus";
import { SearchIcon, TabIcon } from "./icons";
import { imgSrc } from "../utils";
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
      // Desktop top padding 4 → 24 (Mark 2026-05-28): with the top bar now an
      // overlay the moon sat flush to the very top; this drops it so its top
      // lands ~halfway down the About/M bar. Mobile unchanged.
      // Fold subtraction (Epic 9 step 4, 2026-08-30). Before this, 325px of
      // a 720px desktop fold was masthead + nav + search: 45% of the first
      // screen spent before a single piece of content. The masthead was also
      // carrying no information, just the name. Trimmed here and in the moon /
      // wordmark sizes below so a full card row clears the fold.
      padding: isMobile ? "2px 16px 4px" : "12px 16px 8px",
      textAlign: "center",
    }}>
      <div style={{
        display: "flex", justifyContent: "center",
        marginBottom: isMobile ? 6 : 8,
      }}>
        <MoonPhaseIndicator size={isMobile ? 96 : 110} dark={dark} />
      </div>
      <h1 style={{
        margin: isMobile ? "0 0 6px" : "0 0 10px",
        fontFamily: "inherit",
        fontSize: isMobile ? 34 : 42,
        fontWeight: 500,
        letterSpacing: isMobile ? "0.14em" : "0.16em",
        // PR_δ2 2026-05-22: wordmark in brand olive — threads the brand
        // color into the neutral Home chrome without flooding the page.
        // 2026-08-30: --brand-olive-text is a fixed #3b4a36 in BOTH themes,
        // which on the dark page measured about 2.2:1, under the 3:1 floor
        // for large text (B-91). --brand-olive-ink is the theme-aware pair
        // (#3b4a36 light / #a8b3a0 dark), so the wordmark keeps the same
        // colour in light mode and becomes legible in dark.
        color: "var(--brand-olive-ink)",
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
        width: isMobile ? 64 : 84,
        background: "var(--brand-olive-ink)",
        margin: "0 auto",
      }} />
    </section>
  );
}

// (LiveCounts strip removed 2026-06-07 — it was defined but unmounted,
// and its `homeCounts` feed from App.js carried a hardcoded stale
// house count. Counts policy now: no live-count copy that can rot.)

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
    ["all",      "Search all", "For sale · Auctions · Sold"],
    ["live",     "For sale",   "Live dealer items"],
    ["auctions", "Auctions",   "Active auction lots"],
    ["sold",     "Sold",       "Archive of sold items"],
    // Articles (Mark 2026-06-06). No live count chip: the article corpus
    // lazy-loads with Search-all (B-17 keeps it off the Home payload), so
    // there's no match count to show pre-navigation — fmtCount(null)
    // renders no chip, the others keep theirs.
    ["articles", "Articles",   "Magazine + journal articles"],
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
              placeholder={isMobile ? "Brand or reference…" : "Brand, model, reference…"}
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
                placeholder="Brand, model, dealer…"
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
// Render-gate for below-the-fold home strips. First paint then only builds
// the above-the-fold strip (~14 cards) instead of all ~50; the rest mount
// just before they scroll into view (rootMargin pre-warms them so it feels
// instant). The parent's memos stay eager — only the JSX render is deferred,
// so this can't trip React #310. No-IntersectionObserver / SSR → render now.
function DeferUntilVisible({ children, minHeight = 320, rootMargin = "600px" }) {
  const [visible, setVisible] = useState(
    typeof IntersectionObserver === "undefined"
  );
  const ref = useRef(null);
  useEffect(() => {
    if (visible || !ref.current) return undefined;
    const obs = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisible(true);
        obs.disconnect();
      }
    }, { rootMargin });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [visible, rootMargin]);
  if (visible) return children;
  return <div ref={ref} aria-hidden style={{ minHeight }} />;
}

function SectionStrip({ heading, eyebrow, descriptor, count, items, onViewAll, isMobile, watchlist, hidden, handleWish, toggleHide, primaryCurrency, onShare, onView, onClickListing, openCollectionPicker, isAdmin, user, compact, inverted, shellPad, priorityFirst }) {
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
  return (
    <section style={wrapperStyle}>
      <SectionHeader
        eyebrow={eyebrow}
        heading={heading}
        count={count}
        descriptor={descriptor}
        onViewAll={onViewAll}
        isMobile={isMobile}
        inverted={inverted}
        padding={inverted ? 0 : undefined}
      />
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
          none so it doesn't swallow taps/swipes through the overlay.

          Strip background (B-87, 2026-08-30, Mark): the non-inverted variant
          used to pass "var(--border)". CardStrip has 4px of bottom padding, so
          that container background showed as a grey rail under every Home row
          and read as a dead scrollbar, while the Articles strip (mounted
          directly in HomeTab with no background prop) had none. Transparent is
          what every other CardStrip on the site already uses
          (SearchResultsView / ReferencePage / Lume), so Home was the outlier.
          Tiles still separate: `gap: 1` shows the page background through. */}
      <CardStrip
        items={slice}
        label={heading}
        isMobile={isMobile}
        background={inverted ? "var(--surface-on-dark)" : "transparent"}
        inset={!inverted}
        fadeColor={inverted ? "var(--text1)" : "var(--bg)"}
        renderCard={(item, i) => (
          <>
            <Card item={item} wished={!!watchlist[item.id]} onWish={handleWish}
              priority={priorityFirst && i === 0}
              compact={compact}
              onHide={isAdmin ? toggleHide : undefined}
              hideLabel="Hide everywhere"
              isHidden={!!hidden[item.id]}
              onAddToCollection={user ? openCollectionPicker : undefined}
              primaryCurrency={primaryCurrency}
              onShare={onShare} onView={onView} onClickListing={onClickListing} />
            {/* Home-only "×" overlay retired 2026-06-01 (Mark): admin Hide
                ("Hide everywhere", in the ⋯ menu) is the single curation tool. */}
          </>
        )}
      />
    </section>
  );
}

// (Bottom bleed band removed entirely 2026-06-07 per Mark, after a
// brief Watchbox → Reference Guides re-anchor. History for any future
// band: phase 4e (2026-05-11) found this mid-page slot the only spot
// where the inverted-bleed treatment worked (#230/#232 reverted at the
// top sections); olive-on-home 2026-05-22 set the palette. Home now
// flows discovery sections straight into the footer.)

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
    homeRecentArticles, goToArticles,
    // Pool counts for the section headers (B-93 / Epic 9 step 1). Derived at
    // render in App.js from the same filtered sets the rows come from, never
    // constants: the retired LiveCounts strip died of a hardcoded number.
    homeSectionCounts,
    // Auction module (Epic 9 step 3): the calendar's own sale feed, plus the
    // two routes out of the block.
    homeAuctionSales, homeOpenSale, homeOpenCalendar,
    homeDealerSources, homeJumpToDealer,
    goToRecentAdded, goToRecentSold, goToEndingNext,
    homeSearchSubmit,
    openAbout, signInWithGoogle,
    isMobile,
    watchlist, hidden, handleWish, toggleHide, primaryCurrency,
    onShare, onView, onClickListing, openCollectionPicker, isAdmin,
    user, compact,
    // feedScreenerItemsCount / openFeedScreener retired from Home here
    // (B-94): the "Screen N new" pill was pulled from the section header
    // 2026-05-22 and these had been threaded through to nothing ever since.
    // App.js still passes them; the props are simply not read.
    dark,
    // Masthead-nav props — top-bar chrome suppressed on Home, these
    // render the equivalent block inside the olive-bleed band below
    // the wordmark (PR 2026-05-22 γ).
    // 2026-06-03: homeMastheadTabs is now the shared top-tab MODEL from
    // App.js ({key,label,mobileLabel,icon,active,onSelect}) — same object
    // both shells render, so Home can't drift. homeGoToTab retired
    // (onSelect is embedded per entry).
    homeMastheadTabs,
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
  // Section-header pool counts. `{}` when App.js hasn't supplied them (older
  // callers, tests) so every `counts.x` reads undefined and SectionHeader
  // simply omits the count rather than rendering a zero.
  const counts = homeSectionCounts || {};

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
      // Hero sits at the very top now: the minimal Home top bar (About/M)
      // is an absolute overlay (DesktopShell), so it no longer pushes the
      // moonphase down. (The earlier -28 marginTop clipped the moonphase
      // against the scroll pane's top edge — Mark 2026-05-28.)
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
        // B-10 (2026-05-24, Mark): pin the Home nav band (tabs + search) so
        // it stays reachable at any scroll depth — the hero scrolls away
        // above it, the strips scroll under it. top uses safe-area-inset so
        // it sits below the iOS status bar on the PWA, not under the notch.
        position: "sticky",
        top: "env(safe-area-inset-top, 0px)",
        zIndex: 30,
        // B-07 (2026-05-24, Mark): full olive (was --brand-olive-tint-12)
        // so Home's nav band matches the core tabs' olive chrome — smooths
        // the jarring neutral-Home → olive-core-tab tonal jump. Hero above
        // stays neutral. Tab labels below flip to white for contrast.
        background: "var(--brand-olive)",
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
            {homeMastheadTabs.map((t) => (
              <button key={t.key}
                onClick={t.onSelect}
                style={{
                  background: "transparent", border: "none",
                  cursor: "pointer", fontFamily: "inherit",
                  // Desktop bumped 13 → 15 (Mark 2026-05-28: home subtabs a
                  // little larger). Mobile stays 14.
                  fontSize: isMobile ? 14 : 15,
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                  // B-07: white on the now-olive band (was --text2, which
                  // vanished against dark olive). TabIcon inherits currentColor.
                  color: "#ffffff",
                  padding: 0,
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}>
                <TabIcon kind={t.icon} />
                {isMobile ? t.mobileLabel : t.label}
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
        heading={HOME_SECTIONS.recentAdded.heading}
        eyebrow={HOME_SECTIONS.recentAdded.eyebrow}
        descriptor={HOME_SECTIONS.recentAdded.descriptor}
        count={counts.live}
        items={homeRecentAdded}
        priorityFirst
        onViewAll={goToRecentAdded}
        isMobile={isMobile} shellPad={shellPad}
        watchlist={watchlist} hidden={hidden} handleWish={handleWish}
        toggleHide={toggleHide} primaryCurrency={primaryCurrency}
        onShare={onShare} onView={onView} onClickListing={onClickListing}
        openCollectionPicker={openCollectionPicker} isAdmin={isAdmin}
        user={user} compact={compact}
      />
      {/* Recent editorial articles (B-32, 2026-05-27) — idle-loaded; renders
          via CardShell article tiles (not SectionStrip, which is listing-shaped). */}
      {homeRecentArticles && homeRecentArticles.length > 0 && (
        <section style={{ padding: isMobile ? "16px 0" : "20px 0" }}>
          <SectionHeader
            eyebrow={HOME_SECTIONS.articles.eyebrow}
            heading={HOME_SECTIONS.articles.heading}
            count={counts.articles != null ? counts.articles : homeRecentArticles.length}
            descriptor={HOME_SECTIONS.articles.descriptor}
            onViewAll={goToArticles}
            isMobile={isMobile}
          />
          <CardStrip items={homeRecentArticles} isMobile={isMobile}
            label={HOME_SECTIONS.articles.heading}
            max={isMobile ? CARDS_PER_SECTION_MOBILE : CARDS_PER_SECTION_DESKTOP}
            renderCard={a => {
            // B-37: give Home article tiles the same heart + ⋯ actions as listing
            // cards (project the article to a listing so the watchlist/collection
            // wiring works), incl. "Share with Lumé". CardShell's action buttons
            // preventDefault+stopPropagation so they don't follow the article href.
            const al = articleAsListing(a);
            return (
              <CardShell href={a.url} aspect="square" bodyPadding="10px 12px 12px"
                // imgSrc: CardShell expects a pre-proxied src (PageSpeed 2026-06-06 — raw blogger originals were the Home LCP)
                image={a.image ? { src: imgSrc(a.image, 480), alt: "" } : null}
                level2={<div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>{(a._source && a._source.label) || a.source || ""}</div>}
                level1={<div style={{ fontSize: 12, fontWeight: 500, color: "var(--text1)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</div>}
                heart={al && handleWish ? { wished: !!(watchlist && watchlist[al.id]), onToggle: () => handleWish(al) } : null}
                menu={al ? {
                  onAddToCollection: openCollectionPicker ? () => openCollectionPicker(al) : null,
                  onShare: onShare ? () => onShare(al) : null,
                  extraMenuItems: [{ label: "Share with Lumé", onClick: () => askLumeAbout(al) }],
                } : null}
              />
            );
          }} />
        </section>
      )}
      {homeRecentSold?.length > 0 && (
        <DeferUntilVisible>
          <SectionStrip
            heading={HOME_SECTIONS.recentSold.heading}
            eyebrow={HOME_SECTIONS.recentSold.eyebrow}
            descriptor={HOME_SECTIONS.recentSold.descriptor}
            count={counts.sold}
            items={homeRecentSold}
            onViewAll={goToRecentSold}
            isMobile={isMobile} shellPad={shellPad}
            watchlist={watchlist} hidden={hidden} handleWish={handleWish}
            toggleHide={toggleHide} primaryCurrency={primaryCurrency}
            onShare={onShare} onView={onView} onClickListing={onClickListing}
            openCollectionPicker={openCollectionPicker} isAdmin={isAdmin}
            user={user} compact={compact}
          />
        </DeferUntilVisible>
      )}
      {/* "Recently hearted" strip removed 2026-08-30 (Mark, landing-page
          review): it was the only personal row on a page otherwise about
          discovery, it was empty for every signed-out visitor, and Watches >
          ♡ Saved does the job properly. If a personal moment returns to Home
          it should be one line ("3 of your saved watches moved this week"),
          not another 20-tile rail. App.js kept nothing for it. */}
      {/* The auction section is a dated ruled list, not a fifth photo rail
          (Epic 9 step 3, 2026-08-30). Rationale lives in HomeAuctionModule;
          the short version is that variety on this page has to come from row
          SHAPE, and this is the block that also explains what the site is. */}
      {homeEndingNext?.length > 0 && (
        <DeferUntilVisible minHeight={420}>
          <HomeAuctionModule
            sales={homeAuctionSales}
            lots={homeEndingNext}
            count={counts.endingNext}
            isMobile={isMobile}
            primaryCurrency={primaryCurrency}
            onClickListing={onClickListing}
            onOpenSale={homeOpenSale}
            onOpenCalendar={homeOpenCalendar || goToEndingNext}
          />
        </DeferUntilVisible>
      )}
      <FooterBand openAbout={openAbout} signInWithGoogle={signInWithGoogle} user={user} />
    </div>
  );
}
