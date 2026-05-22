import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card } from "./Card";

// Cross-tab search results — the "Search all" destination (PR_W v1,
// 2026-05-22). When the user picks "Search all" from the Home
// dropdown / mobile overlay, the regular tab content is replaced
// with this view: three horizontal scrollable strips of cards
// (Live listings · Live auctions · Archive sold), each filtered by
// the search query. Each strip has a "View all" CTA that jumps to
// the corresponding tab+sub-tab with the search preserved.
//
// Editorial articles aren't yet included — the corpus is loaded
// lazily inside EditorialView. v2 will lift that to App.js and add
// a fourth strip.
//
// Filter scope per Mark's spec (2026-05-21): Brand / Source apply
// per-strip using each tab's own catalogue. Price applies to
// Listings/Auctions/Sold. v1 ships strip-naive (no in-strip
// filters) — users can refine inside each tab via "View all".
// Strip-level filters are queued for v1.5.
//
// Filter logic: simple case-insensitive substring match across
// brand / ref (title) / source / reference_no. Mirrors the search
// logic in App.js's allFiltered memo for parity.

const STRIP_MAX = 8;  // cards per strip before View All takes over

function matchesQuery(item, q) {
  if (!q) return true;
  const haystack = [
    item.brand,
    item.ref,
    item.title,
    item.source,
    item.reference_no,
    item.model,
    item.model_line,
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(q);
}

function Strip({ heading, count, items, onViewAll, isMobile, gridStyle, watchlist, handleWish, hidden, toggleHide, primaryCurrency, openCollectionPicker, handleShare, isAdmin, onClickListing }) {
  if (items.length === 0) {
    return (
      <section style={{ padding: isMobile ? "16px 0" : "20px 0" }}>
        <div style={{
          display: "flex", alignItems: "baseline", justifyContent: "space-between",
          padding: isMobile ? "0 16px 8px" : "0 20px 10px",
        }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <h2 style={{
              margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 600,
              color: "var(--text1)", fontFamily: "inherit",
            }}>{heading}</h2>
            <span style={{ fontSize: 12, color: "var(--text3)" }}>0</span>
          </div>
        </div>
        <div style={{
          padding: isMobile ? "12px 16px" : "12px 20px",
          color: "var(--text3)", fontSize: 13, fontStyle: "italic",
        }}>
          No matches.
        </div>
      </section>
    );
  }
  const visible = items.slice(0, STRIP_MAX);
  return (
    <section style={{ padding: isMobile ? "16px 0" : "20px 0" }}>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        padding: isMobile ? "0 16px 10px" : "0 20px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <h2 style={{
            margin: 0, fontSize: isMobile ? 16 : 18, fontWeight: 600,
            color: "var(--text1)", fontFamily: "inherit",
          }}>{heading}</h2>
          <span style={{ fontSize: 12, color: "var(--text3)" }}>{count.toLocaleString()}</span>
        </div>
        {count > STRIP_MAX && (
          <button onClick={onViewAll}
            style={{
              background: "transparent", border: "0.5px solid var(--border)",
              borderRadius: 18, padding: "6px 14px",
              fontFamily: "inherit", fontSize: 13, fontWeight: 500,
              color: "var(--text1)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
            View all <span aria-hidden style={{ fontSize: 13 }}>→</span>
          </button>
        )}
      </div>
      <div style={{
        ...gridStyle,
        padding: isMobile ? "0 16px" : "0 20px",
      }}>
        {visible.map(item => (
          <Card key={item.id}
            item={item}
            wished={!!watchlist[item.id]}
            onWish={handleWish}
            onHide={isAdmin ? toggleHide : undefined}
            isHidden={!!hidden[item.id]}
            onAddToCollection={openCollectionPicker}
            primaryCurrency={primaryCurrency}
            onShare={handleShare}
            onClickListing={onClickListing}
          />
        ))}
      </div>
    </section>
  );
}

export function SearchResultsView({
  search,
  setSearch,
  mainFeedItems,
  auctionLotItems,
  isMobile,
  gridStyle,
  watchlist,
  handleWish,
  hidden,
  toggleHide,
  primaryCurrency,
  openCollectionPicker,
  handleShare,
  isAdmin,
  onClickListing,
  onViewAllLive,
  onViewAllAuctions,
  onViewAllSold,
  onExit,
}) {
  const q = (search || "").trim().toLowerCase();

  const liveListings = useMemo(() => {
    const arr = mainFeedItems.filter(i =>
      !i.sold && !hidden[i.id]
      && !i._isAuctionFormat && !i._isTrackedLot
      && matchesQuery(i, q)
    );
    return arr;
  }, [mainFeedItems, hidden, q]);

  const liveAuctions = useMemo(() => {
    const arr = auctionLotItems.filter(i =>
      !i.sold && !hidden[i.id] && matchesQuery(i, q)
    );
    return arr;
  }, [auctionLotItems, hidden, q]);

  const soldItems = useMemo(() => {
    const arr = [
      ...mainFeedItems.filter(i => i.sold),
      ...auctionLotItems.filter(i => i.sold),
    ].filter(i => !hidden[i.id] && matchesQuery(i, q));
    return arr;
  }, [mainFeedItems, auctionLotItems, hidden, q]);

  const totalHits = liveListings.length + liveAuctions.length + soldItems.length;

  // PR_φ1 2026-05-22: inline-edit affordance for the query echo. Click
  // the "moonphase" header → swap to an editable input (same chrome
  // as the top-bar expanding search). Esc / blur reverts the view
  // (search still committed via onChange). When `setSearch` isn't
  // passed (legacy or read-only contexts) the click no-ops.
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    if (!editing) return undefined;
    const t = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 20);
    return () => clearTimeout(t);
  }, [editing]);
  const canEdit = typeof setSearch === "function";

  // PR_φ1 2026-05-22: strip-order is dynamic by hit count desc; empty
  // strips are dropped entirely (no "No matches" clutter). Each entry
  // owns its render props so the iteration loop stays clean.
  const stripDefs = [
    { key: "live", heading: "Live listings", count: liveListings.length, items: liveListings, onViewAll: onViewAllLive },
    { key: "auctions", heading: "Live auctions", count: liveAuctions.length, items: liveAuctions, onViewAll: onViewAllAuctions },
    { key: "sold", heading: "Archive (Sold)", count: soldItems.length, items: soldItems, onViewAll: onViewAllSold },
  ].filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);

  return (
    <div style={{ paddingBottom: isMobile ? 32 : 40 }}>
      {/* Header — query echo + total + Exit. Sticky to the top of
          the scroll container so the search context (and ability to
          edit it) stays visible as the user scrolls through cards.
          z-index sits above strip headings; opaque bg so cards
          scroll under cleanly. */}
      <div style={{
        position: "sticky", top: 0, zIndex: 5,
        background: "var(--bg)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: isMobile ? "14px 16px 10px" : "18px 20px 12px",
        borderBottom: "0.5px solid var(--border)",
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--text3)",
            marginBottom: 4,
          }}>
            Search results
          </div>
          {editing && canEdit ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "transparent",
              border: "0.5px solid var(--border)",
              borderRadius: 10,
              padding: "6px 12px",
              maxWidth: isMobile ? "100%" : 480,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ color: "var(--text3)", flexShrink: 0 }} aria-hidden="true">
                <circle cx="11" cy="11" r="7"/>
                <line x1="21" y1="21" x2="16.5" y2="16.5"/>
              </svg>
              <input
                ref={inputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onBlur={() => setEditing(false)}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.target.blur(); }
                  if (e.key === "Escape") { e.target.blur(); }
                }}
                placeholder="Search reference, brand, model…"
                style={{ flex: 1, border: "none", background: "transparent",
                         fontSize: isMobile ? 16 : 17, fontWeight: 600,
                         color: "var(--text1)", outline: "none",
                         fontFamily: "inherit", minWidth: 0 }}
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search"
                  style={{ flexShrink: 0, background: "none", border: "none",
                          cursor: "pointer", color: "var(--text3)", padding: 2,
                          fontFamily: "inherit", display: "flex",
                          alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => canEdit && setEditing(true)}
              title={canEdit ? "Edit search" : undefined}
              style={{
                background: "transparent", border: "none",
                padding: 0, cursor: canEdit ? "pointer" : "default",
                fontFamily: "inherit",
                fontSize: isMobile ? 16 : 18, fontWeight: 600,
                color: "var(--text1)",
                textAlign: "left", display: "block", maxWidth: "100%",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
              “{search}”
              <span style={{
                fontSize: 13, fontWeight: 400, color: "var(--text3)",
                marginLeft: 10,
              }}>
                {totalHits.toLocaleString()} match{totalHits === 1 ? "" : "es"}
              </span>
            </button>
          )}
        </div>
        <button onClick={onExit}
          style={{
            background: "transparent", border: "0.5px solid var(--border)",
            borderRadius: 18, padding: "6px 14px",
            fontFamily: "inherit", fontSize: 13, fontWeight: 500,
            color: "var(--text2)", cursor: "pointer", flexShrink: 0,
            whiteSpace: "nowrap",
          }}>
          Exit
        </button>
      </div>

      {stripDefs.length === 0 && (
        <div style={{
          padding: isMobile ? "40px 16px" : "60px 20px",
          textAlign: "center",
          color: "var(--text3)", fontSize: 14,
        }}>
          No matches across listings, auctions, or archive. Try a different query.
        </div>
      )}

      {stripDefs.map(s => (
        <Strip
          key={s.key}
          heading={s.heading}
          count={s.count}
          items={s.items}
          onViewAll={s.onViewAll}
          isMobile={isMobile}
          gridStyle={gridStyle}
          watchlist={watchlist}
          handleWish={handleWish}
          hidden={hidden}
          toggleHide={toggleHide}
          primaryCurrency={primaryCurrency}
          openCollectionPicker={openCollectionPicker}
          handleShare={handleShare}
          isAdmin={isAdmin}
          onClickListing={onClickListing}
        />
      ))}
    </div>
  );
}
