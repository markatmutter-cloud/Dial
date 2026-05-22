import React, { useMemo, useState, useRef, useEffect } from "react";
import { Card } from "./Card";

// Cross-tab search results — the "Search all" destination (PR_W v1,
// 2026-05-22). When the user picks "Search all" from the Home
// dropdown / mobile overlay, the regular tab content is replaced
// with this view: FOUR horizontal scrollable strips of cards
// (Live listings · Live auctions · Archive sold · Articles), each
// filtered by the query. Each strip has a "View all" CTA that
// jumps to the corresponding tab+sub-tab with the search preserved.
//
// PR_φ2 2026-05-22 added the Articles strip — App.js lazy-fetches
// the editorial corpus when searchAllActive flips true (parallel
// fetch across all SOURCE URLs, meta records only, no bodies).
// Cards in the Articles strip render via ArticleCard's image+title
// shape using the same items-grid Strip used to use; the article
// projection (kind='article') flows through.
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

// PR_φ2 2026-05-22: article fields differ slightly from listing
// fields — title is the article title; excerpt + author live in
// nested fields; brand/reference_no are still flat. Use a slim
// per-shape haystack so we don't double-match on listing-only keys.
function matchesArticleQuery(article, q) {
  if (!q) return true;
  const haystack = [
    article.title,
    article.brand,
    article.reference_no,
    article.model,
    article.model_line,
    article.author,
    article.excerpt,
    article._source && article._source.label,
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
  articles,
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
  onViewAllArticles,
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

  // PR_φ2 2026-05-22: article matches across the editorial corpus.
  // App.js lazy-fetches the source JSONs the first time
  // searchAllActive flips true; articles is [] until that resolves.
  const articleHits = useMemo(() => {
    if (!Array.isArray(articles) || articles.length === 0) return [];
    return articles.filter(a => matchesArticleQuery(a, q));
  }, [articles, q]);

  const totalHits = liveListings.length + liveAuctions.length
    + soldItems.length + articleHits.length;

  // PR_φ1 2026-05-22: inline-edit affordance for the query echo. Click
  // the "moonphase" header → swap to an editable input (same chrome
  // as the top-bar expanding search). Esc / blur reverts the view
  // (search still committed via onChange). When `setSearch` isn't
  // passed (legacy or read-only contexts) the click no-ops.
  // PR_φ-refresh 2026-05-22: query is always an editable input now
  // (was click-to-edit). State retained as a no-op shape for forward
  // compatibility — useEffect autofocuses once on mount.
  // eslint-disable-next-line no-unused-vars
  const [editing, setEditing] = useState(true);
  const inputRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Don't select() on mount — user landed here intentionally and
        // probably wants to read the current query before refining.
      }
    }, 20);
    return () => clearTimeout(t);
  }, []);
  const canEdit = typeof setSearch === "function";

  // PR_φ1 2026-05-22: strip-order is dynamic by hit count desc; empty
  // strips are dropped entirely (no "No matches" clutter). Each entry
  // owns its render props so the iteration loop stays clean.
  // PR_φ2 2026-05-22: articles strip uses kind='article' so the loop
  // can dispatch between Card (listings) and ArticleStrip (articles).
  const stripDefs = [
    { key: "live", heading: "Live listings", kind: "listing", count: liveListings.length, items: liveListings, onViewAll: onViewAllLive },
    { key: "auctions", heading: "Live auctions", kind: "listing", count: liveAuctions.length, items: liveAuctions, onViewAll: onViewAllAuctions },
    { key: "sold", heading: "Archive (Sold)", kind: "listing", count: soldItems.length, items: soldItems, onViewAll: onViewAllSold },
    { key: "articles", heading: "Articles", kind: "article", count: articleHits.length, items: articleHits, onViewAll: onViewAllArticles },
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
        padding: isMobile ? "14px 16px 10px" : "18px 20px 12px",
        borderBottom: "0.5px solid var(--border)",
      }}>
        {/* Eyebrow row — section label on the left, Exit on the right.
            Both small; the search input below is the visual anchor. */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 8,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "var(--text3)",
          }}>
            Search results
            {totalHits > 0 && (
              <span style={{
                marginLeft: 10, fontWeight: 500, letterSpacing: "0.04em",
                textTransform: "none", color: "var(--text3)",
                fontVariantNumeric: "tabular-nums",
              }}>
                {totalHits.toLocaleString()} match{totalHits === 1 ? "" : "es"}
              </span>
            )}
          </div>
          <button onClick={onExit}
            style={{
              background: "transparent", border: "0.5px solid var(--border)",
              borderRadius: 18, padding: "5px 12px",
              fontFamily: "inherit", fontSize: 12, fontWeight: 500,
              color: "var(--text2)", cursor: "pointer", flexShrink: 0,
              whiteSpace: "nowrap",
            }}>
            Exit
          </button>
        </div>
        {/* PR_φ-refresh 2026-05-22: query is always an editable input
            (was a click-to-edit button). Cleaner affordance — same
            chrome as the top-bar expanding search, sized up to read
            as the page's primary input. Auto-focus when entering the
            surface so the user can immediately refine without clicking. */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "transparent",
          border: "0.5px solid var(--border)",
          borderRadius: 10,
          padding: "8px 14px",
          maxWidth: isMobile ? "100%" : 520,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ color: "var(--text3)", flexShrink: 0 }} aria-hidden="true">
            <circle cx="11" cy="11" r="7"/>
            <line x1="21" y1="21" x2="16.5" y2="16.5"/>
          </svg>
          <input
            ref={inputRef}
            value={search}
            onChange={e => canEdit && setSearch(e.target.value)}
            readOnly={!canEdit}
            onKeyDown={e => {
              if (e.key === "Enter") { e.target.blur(); }
              if (e.key === "Escape") { e.target.blur(); }
            }}
            placeholder="Search reference, brand, model…"
            style={{ flex: 1, border: "none", background: "transparent",
                     fontSize: isMobile ? 15 : 16, fontWeight: 600,
                     color: "var(--text1)", outline: "none",
                     fontFamily: "inherit", minWidth: 0 }}
          />
          {search && canEdit && (
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
      </div>

      {stripDefs.length === 0 && (
        <div style={{
          padding: isMobile ? "40px 16px" : "60px 20px",
          textAlign: "center",
          color: "var(--text3)", fontSize: 14,
        }}>
          No matches across listings, auctions, archive, or articles. Try a different query.
        </div>
      )}

      {stripDefs.map(s => (
        s.kind === "article" ? (
          <ArticleStrip
            key={s.key}
            heading={s.heading}
            count={s.count}
            items={s.items}
            onViewAll={s.onViewAll}
            isMobile={isMobile}
          />
        ) : (
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
        )
      ))}
    </div>
  );
}

// PR_φ2 2026-05-22: slim article-strip variant. Different shape from
// the listings Strip — articles have image + title + source/date,
// no price / heart / dealer-link. Tiles open the article URL in a
// new tab. Capped at STRIP_MAX with a View all that lands on
// Collecting > Editorial with the search query preserved.
function ArticleStrip({ heading, count, items, onViewAll, isMobile }) {
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
        {count > STRIP_MAX && onViewAll && (
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
        display: "grid",
        gridTemplateColumns: isMobile
          ? "repeat(auto-fill, minmax(140px, 1fr))"
          : "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 10,
        padding: isMobile ? "0 16px" : "0 20px",
      }}>
        {visible.map(a => (
          <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
            style={{
              display: "flex", flexDirection: "column",
              textDecoration: "none", color: "inherit",
              background: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderRadius: 8, overflow: "hidden",
            }}>
            {a.image && (
              <div style={{ width: "100%", aspectRatio: "16 / 10", background: "var(--bg)" }}>
                <img src={a.image} alt="" loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            )}
            <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text3)",
                textTransform: "uppercase", letterSpacing: 0.4,
              }}>
                {(a._source && a._source.label) || a.source || ""}
              </div>
              <div style={{
                fontSize: 13, fontWeight: 600, color: "var(--text1)",
                lineHeight: 1.3,
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>{a.title}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
