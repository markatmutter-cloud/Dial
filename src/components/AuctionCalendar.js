import React, { useMemo, useState, useEffect } from "react";
import { innerToggleButton } from "../styles";
import { imgSrc, fmtSaleDateRange } from "../utils";

// Auction calendar — month-banded list of every auction-house sale
// in the emitted feed. Live + upcoming render in the top section;
// past auctions land under a collapsible Archive header. Mark spec
// 2026-05-10: full list (no "Show more" preview), and past auctions
// stay in the feed indefinitely (merge.py's 30-day prune dropped) so
// the Archive section corresponds 1:1 with the sold lots in the
// listings archive view.

function fmtMonthBand(key) {
  if (key === "tbd") return "Date TBD";
  const [y, m] = key.split("-");
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const idx = parseInt(m, 10) - 1;
  if (idx < 0 || idx > 11) return key;
  return `${months[idx]} ${y}`;
}

// fmtShortDate + fmtSaleDateRange moved to ../utils (Phase 4) so the
// sale-sectioned auctions grid can share them. Imported above.

export function AuctionCalendar({
  auctions = [],
  // url → scraped lot count, for surfacing "N lots" on each row +
  // gating the "View lots" action on whether the sale has lots.
  lotCounts = {},
  // url → top-lot image, the hero for the image-forward card (Phase 2).
  heroImgByUrl = {},
  // Saved-auctions (Phase 3): Set of hearted auction_urls + a toggle.
  // onToggleSave null when signed out (heart hidden).
  savedUrls = new Set(),
  onToggleSave = null,
  onOpenSale,
  isMobile = false,
}) {
  // Archive expands on demand — past auctions accumulate forever and
  // the user typically wants the upcoming view first. localStorage
  // persists the toggle so re-opens remember the user's preference.
  const [archiveOpen, setArchiveOpen] = useState(() => {
    try { return localStorage.getItem("auctions_archive_open_v1") === "1"; }
    catch { return false; }
  });
  useEffect(() => {
    try {
      localStorage.setItem("auctions_archive_open_v1", archiveOpen ? "1" : "0");
    } catch {}
  }, [archiveOpen]);

  // House filter (Mark 2026-05-26). The calendar interleaves every house's
  // sales by month; with 6 houses that's a lot to wade through if you follow
  // one. A scoped chip row narrows to a single house. Session-local (defaults
  // to "all") on purpose — a persisted filter risks the "why am I only seeing
  // Bonhams?" confusion on a later visit.
  const [houseFilter, setHouseFilter] = useState("all");
  // Hearted filter (Phase 3) — narrows to saved sales, the fast "just
  // my auctions" scan. Session-local like the house filter.
  const [heartedOnly, setHeartedOnly] = useState(false);
  const houses = useMemo(
    () => [...new Set(auctions.map(a => a.house).filter(Boolean))].sort(),
    [auctions]
  );
  // If the selected house drops out of the feed (data refresh), fall back to
  // "all" so the calendar never gets stuck showing nothing.
  useEffect(() => {
    if (houseFilter !== "all" && !houses.includes(houseFilter)) setHouseFilter("all");
  }, [houses, houseFilter]);
  // Drop the hearted filter once nothing's saved, so it can't strand the
  // calendar on an empty view after the last un-heart.
  useEffect(() => {
    if (heartedOnly && savedUrls.size === 0) setHeartedOnly(false);
  }, [heartedOnly, savedUrls]);

  const { upcomingAuctions, pastAuctions } = useMemo(() => {
    let src = houseFilter === "all"
      ? auctions
      : auctions.filter(a => a.house === houseFilter);
    if (heartedOnly) src = src.filter(a => savedUrls.has(a.url));
    const upcoming = [];
    const past = [];
    for (const a of src) {
      (a.status === "past" ? past : upcoming).push(a);
    }
    upcoming.sort((a, b) => {
      const da = a.dateStart || "9999";
      const db = b.dateStart || "9999";
      return da.localeCompare(db) || (a.house || "").localeCompare(b.house || "");
    });
    // Past: most-recently-ended first (descending by date).
    past.sort((a, b) => {
      const da = a.dateEnd || a.dateStart || "0000";
      const db = b.dateEnd || b.dateStart || "0000";
      return db.localeCompare(da) || (a.house || "").localeCompare(b.house || "");
    });
    return { upcomingAuctions: upcoming, pastAuctions: past };
  }, [auctions, houseFilter, heartedOnly, savedUrls]);

  const groupByMonth = (arr) => {
    const buckets = new Map();
    for (const a of arr) {
      const key = a.dateStart ? a.dateStart.slice(0, 7) : "tbd";
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(a);
    }
    const keys = [...buckets.keys()];
    return { buckets, keys };
  };

  const upcomingGroups = useMemo(() => {
    const { buckets, keys } = groupByMonth(upcomingAuctions);
    keys.sort((a, b) => {
      if (a === "tbd") return 1;
      if (b === "tbd") return -1;
      return a < b ? -1 : 1;
    });
    return keys.map(key => ({ key, label: fmtMonthBand(key), items: buckets.get(key) }));
  }, [upcomingAuctions]);

  // Archive: descending by month so the most recent month is on top.
  const pastGroups = useMemo(() => {
    const { buckets, keys } = groupByMonth(pastAuctions);
    keys.sort((a, b) => {
      if (a === "tbd") return 1;
      if (b === "tbd") return -1;
      return a < b ? 1 : -1;
    });
    return keys.map(key => ({ key, label: fmtMonthBand(key), items: buckets.get(key) }));
  }, [pastAuctions]);

  if (auctions.length === 0) {
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>🔨</div>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: "var(--text1)" }}>No auctions on the calendar yet</div>
        <div style={{ fontSize: 12, color: "var(--text2)", maxWidth: 340, margin: "0 auto", lineHeight: 1.5 }}>
          Currently pulling from Antiquorum, Monaco Legend, Phillips, Bonhams, Christie's, and Sotheby's.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter chips — Hearted (saved sales) + per-house scope. Shows
          when there's something to narrow by (2+ houses or any saved
          sale). Horizontally scrollable on mobile so the chips don't
          wrap the chrome. */}
      {(houses.length > 1 || savedUrls.size > 0) && (
        <div style={{
          display: "flex", gap: 6, overflowX: "auto", padding: "0 0 12px",
          WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
        }}>
          {savedUrls.size > 0 && (
            <button onClick={() => setHeartedOnly(v => !v)}
              style={{ ...innerToggleButton(heartedOnly),
                       display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
              <svg width="11" height="11" viewBox="0 0 24 24"
                fill={heartedOnly ? "currentColor" : "none"} stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Hearted
            </button>
          )}
          {houses.length > 1 && (
            <>
              <button onClick={() => setHouseFilter("all")}
                style={innerToggleButton(houseFilter === "all")}>All</button>
              {houses.map(h => (
                <button key={h} onClick={() => setHouseFilter(h)}
                  style={innerToggleButton(houseFilter === h)}>{h}</button>
              ))}
            </>
          )}
        </div>
      )}
      {/* "N upcoming · M archived" counts line retired 2026-05-21 (PR_Y).
          The shell-level identity band on the Calendar sub-tab now
          carries those counts in its colored slab. Live-now count
          ("3 live now") was rare enough that we don't surface it
          separately — month groups make it visually obvious. */}
      {upcomingGroups.map((group, idx) => (
        <MonthBlock key={group.key} group={group} firstBlock={idx === 0}
          lotCounts={lotCounts}
          heroImgByUrl={heroImgByUrl}
          savedUrls={savedUrls}
          onToggleSave={onToggleSave}
          onOpenSale={onOpenSale}
          isMobile={isMobile} />
      ))}

      {/* Archive — past auctions, collapsed by default. The same
          auctions whose lots end up in the listings Sold archive. */}
      {pastAuctions.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button onClick={() => setArchiveOpen(o => !o)}
            style={{
              all: "unset", display: "flex", alignItems: "center", gap: 10,
              width: "100%", cursor: "pointer",
              padding: "14px 14px 12px",
              borderTop: "0.5px solid var(--border)",
              borderBottom: "0.5px solid var(--border)",
              background: "var(--surface)",
            }}>
            <span aria-hidden style={{
              display: "inline-block",
              fontSize: 12, color: "var(--text3)",
              transform: archiveOpen ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 120ms ease",
              flexShrink: 0,
            }}>▶</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text1)" }}>Archive</span>
            <span style={{ fontSize: 12, color: "var(--text3)", marginLeft: "auto" }}>
              {pastAuctions.length.toLocaleString()} past auctions
            </span>
          </button>
          {archiveOpen && pastGroups.map((group, idx) => (
            <MonthBlock key={group.key} group={group} firstBlock={idx === 0} archive
              lotCounts={lotCounts}
              heroImgByUrl={heroImgByUrl}
              savedUrls={savedUrls}
              onToggleSave={onToggleSave}
              onOpenSale={onOpenSale}
              isMobile={isMobile} />
          ))}
        </div>
      )}
    </div>
  );
}

// One month-banded section of the calendar. Lifted from the inline
// map in 2026-05-10's calendar/Archive split — same render shape
// reused for both upcoming and past sections.
function MonthBlock({ group, firstBlock, archive = false, lotCounts = {}, heroImgByUrl = {}, savedUrls = new Set(), onToggleSave = null, onOpenSale, isMobile = false }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 12,
        padding: firstBlock ? "14px 14px 12px" : "28px 14px 12px",
        borderBottom: "0.5px solid var(--border)",
        marginBottom: 4,
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text1)" }}>
          {fmtMonthBand(group.key)}
        </span>
        <span style={{ fontSize: 12, color: "var(--text3)", marginLeft: "auto" }}>
          {group.items.length.toLocaleString()}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {group.items.map(a => (
          <AuctionRow key={a.id} a={a} archive={archive}
            lotCount={lotCounts[a.url] || 0}
            heroImg={heroImgByUrl[a.url] || ""}
            saved={savedUrls.has(a.url)}
            onToggleSave={onToggleSave}
            onOpenSale={onOpenSale}
            isMobile={isMobile} />
        ))}
      </div>
    </div>
  );
}

// Single calendar row + inline action buttons (Mark spec
// 2026-05-14, revised): visible buttons beat a hidden ⋯ menu —
// one click to act, no discovery cost. Buttons hide when the
// auction has no lots scraped yet (the actions would no-op).
//   • View lots — opens the in-app grid pre-filtered to this sale
//   • ↗ — opens the house's external auction page in a new tab
function AuctionRow({ a, archive, lotCount = 0, heroImg = "", saved = false, onToggleSave = null, onOpenSale, isMobile = false }) {
  const isLive   = a.status === "live";
  const isClosed = a.status === "past";
  const catalogAgeDays = a.catalogLiveAt
    ? Math.floor((Date.now() - new Date(a.catalogLiveAt).getTime()) / 86400000)
    : null;
  const catalogJustOpened = !isClosed && catalogAgeDays !== null && catalogAgeDays <= 7;

  const openExternal = () => {
    if (a.url) window.open(a.url, "_blank", "noopener,noreferrer");
  };

  // Lot-actions are exposed whenever the auction has scraped lots —
  // past auctions included (Mark spec 2026-05-15: Review + Add to
  // list need to work on the archive too so users can build lists
  // from closed catalogs). Lot count is the only gate; closed
  // catalogs with 0 scraped lots show View catalog only.
  const lotActionsAvailable = lotCount > 0;

  // Action cluster — re-used for both layouts. Mobile drops it onto
  // a second row below the title block (Mark report 2026-05-14: the
  // 3-button cluster on a Christie's / Phillips row was crushing
  // the title block; "expand the depth of the cards" so the buttons
  // get their own breathing room).
  const actionCluster = (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      flexWrap: "wrap",
      // Mobile: full-width row underneath the title block, padded
      // inset on the left to clear the date block + tiny gap below
      // the row above. Desktop: flush right of the title, vertically
      // centered.
      padding: isMobile ? "0 14px 12px" : "0 10px",
      flexShrink: 0,
      justifyContent: isMobile ? "flex-start" : "flex-end",
    }}>
      {lotActionsAvailable && onOpenSale && (
        <ActionButton label="View lots →" onClick={() => onOpenSale(a)} primary />
      )}
      {/* Subtle external link to the auction house's own page. */}
      <ActionButton label="↗" onClick={openExternal}
        title={`View on ${a.house || "the auction house"} site`} />
    </div>
  );

  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      alignItems: "stretch",
      borderRadius: 12, overflow: "hidden",
      border: "0.5px solid var(--border)", background: "var(--card-bg)",
      color: "inherit", fontFamily: "inherit",
      transition: "border-color 120ms ease",
      opacity: archive ? 0.85 : 1,
      position: "relative",
    }}>
      {/* Hero — the sale's top lot image (Phase 2 image-forward card).
          Left rail on desktop, full-width banner on mobile; clicking it
          opens the sale's lots. Falls back to the house name when the
          sale has no scraped lots yet. */}
      <div
        onClick={lotActionsAvailable && onOpenSale ? () => onOpenSale(a) : undefined}
        style={{
          position: "relative",
          flexShrink: 0,
          width: isMobile ? "100%" : 116,
          height: isMobile ? 148 : "auto",
          minHeight: isMobile ? undefined : 104,
          background: "var(--surface)",
          overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: (lotActionsAvailable && onOpenSale) ? "pointer" : "default",
        }}>
        {heroImg ? (
          <img src={imgSrc(heroImg)} alt="" loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
        ) : (
          <span style={{ fontSize: 11, color: "var(--text3)", letterSpacing: "0.14em",
                         textTransform: "uppercase", fontWeight: 600, textAlign: "center", padding: 8 }}>
            {a.house || "Auction"}
          </span>
        )}
        {/* Heart the SALE (Phase 3). Overlay top-right of the hero,
            mirroring listing-card hearts. Hidden when signed out. */}
        {onToggleSave && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSave(a.url); }}
            aria-label={saved ? "Remove this auction from saved" : "Save this auction"}
            title={saved ? "Saved — tap to remove" : "Save this auction"}
            style={{
              position: "absolute", top: 8, right: 8,
              width: 30, height: 30, borderRadius: "50%",
              border: "none", padding: 0, cursor: "pointer",
              background: saved ? "rgba(217,38,38,0.92)" : "rgba(0,0,0,0.50)",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(6px)",
            }}>
            <svg width="15" height="15" viewBox="0 0 24 24"
              fill={saved ? "#fff" : "none"} stroke="#fff"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Content + actions. Desktop: text grows, actions flush right +
          vertically centered. Mobile: text, then a full-width action
          row beneath. */}
      <div style={{ display: "flex", minWidth: 0, flex: 1,
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "stretch" : "center" }}>
        <div style={{ flex: 1, minWidth: 0, padding: "12px 14px",
                    display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
              {a.house}
            </span>
            {isLive && (
              <span style={{ fontSize: 10, fontWeight: 600, color: "#fff", background: "#c43", borderRadius: 8, padding: "2px 8px", letterSpacing: "0.06em" }}>LIVE</span>
            )}
            {isClosed && (
              <span style={{ fontSize: 10, fontWeight: 600, color: "#fff", background: "#666", borderRadius: 8, padding: "2px 8px", letterSpacing: "0.06em" }}>CLOSED</span>
            )}
            {catalogJustOpened && (
              <span style={{ fontSize: 10, fontWeight: 600, color: "#fff", background: "var(--brand)", borderRadius: 8, padding: "2px 8px", letterSpacing: "0.06em" }}>NEW CATALOG</span>
            )}
            {lotActionsAvailable && (
              <span style={{ fontSize: 10, color: "var(--text3)", fontVariantNumeric: "tabular-nums" }}>
                · {lotCount.toLocaleString()} lots
              </span>
            )}
          </div>
          <div
            onClick={lotActionsAvailable && onOpenSale ? () => onOpenSale(a) : undefined}
            title={lotActionsAvailable && onOpenSale ? "View this sale's lots" : undefined}
            style={{ fontSize: 15, fontWeight: 600, color: "var(--text1)", lineHeight: 1.25,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      cursor: (lotActionsAvailable && onOpenSale) ? "pointer" : "default" }}>
            {a.title}
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fmtSaleDateRange(a)}
            {a.location ? ` · ${a.location}` : ""}
          </div>
        </div>
        {actionCluster}
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, primary, disabled, title }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{
        flexShrink: 0,
        cursor: disabled ? "default" : "pointer",
        fontFamily: "inherit", fontSize: 12, fontWeight: 600,
        letterSpacing: "0.02em",
        padding: "6px 12px", borderRadius: 999,
        border: primary ? "none" : "0.5px solid var(--text2)",
        background: primary ? "var(--brand)" : "transparent",
        color: primary ? "#fff" : "var(--text2)",
        opacity: disabled ? 0.5 : 1,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}>
      {label}
    </button>
  );
}
