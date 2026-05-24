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
function matchesArticleQuery(article, q, bodies) {
  if (!q) return true;
  const body = bodies && article.url ? bodies[article.url] : null;
  const haystack = [
    article.title,
    article.brand,
    article.reference_no,
    article.model,
    article.model_line,
    article.author,
    article.excerpt,
    body,
    article._source && article._source.label,
  ].filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(q);
}

function Strip({ heading, count, items, onViewAll, isMobile, watchlist, handleWish, hidden, toggleHide, primaryCurrency, openCollectionPicker, handleShare, isAdmin, onClickListing }) {
  const isEmpty = items.length === 0;
  const visible = items.slice(0, STRIP_MAX);
  return (
    <section style={{ padding: isMobile ? "16px 0" : "20px 0" }}>
      {/* Header row — heading + count on left, View all on right.
          Matches Home's SectionStrip header so the surface reads as
          a Home-style slider rather than a tab content grid. */}
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
      {isEmpty ? (
        <div style={{
          padding: isMobile ? "0 16px 8px" : "0 20px 8px",
          color: "var(--text3)", fontSize: 13, fontStyle: "italic",
        }}>
          No matches.
        </div>
      ) : (
      // Horizontal-scrollable strip — mirrors Home's SectionStrip
      // layout. Mobile tiles ~38% / 170px max; desktop fixed 210px.
      <div style={{
        display: "flex", gap: 1, overflowX: "auto", overflowY: "hidden",
        padding: isMobile ? "0 16px 4px" : "0 20px 4px",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", msOverflowStyle: "none",
        // B-13 (2026-05-24): transparent (was var(--border)) so the 16/20px
        // edge inset is page-colored, not a grey band "in front of" the row
        // — most visible on the light-image auction cards, but applied to
        // all strips so they stay consistent.
        background: "transparent",
      }}>
        {visible.map(item => (
          <div key={item.id} style={isMobile ? {
            flex: "0 0 38%", maxWidth: 170, scrollSnapAlign: "start",
            background: "var(--card-bg)", position: "relative",
          } : {
            flex: "0 0 210px", scrollSnapAlign: "start",
            background: "var(--card-bg)", position: "relative",
          }}>
            <Card
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
          </div>
        ))}
      </div>
      )}
    </section>
  );
}

export function SearchResultsView({
  search,
  setSearch,
  mainFeedItems,
  auctionLotItems,
  articles,
  articleBodies,
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

  // PR 2026-05-22 (task #11): local Brand + Price filters scoped to
  // this surface. Mark spec: "If I search submariner it could be a
  // tudor or rolex. maybe i want dive watch... then filter by
  // brand/source etc." Local state so filters reset when the user
  // exits Search-all — these are ad-hoc disambiguators, not durable
  // preferences. Brand multi-select; Price as min/max text inputs
  // (same shape as the global filter row).
  const [selBrands, setSelBrands] = useState([]);
  const [minPriceText, setMinPriceText] = useState("");
  const [maxPriceText, setMaxPriceText] = useState("");
  const minPrice = useMemo(() => {
    if (!minPriceText) return 0;
    return parseInt(minPriceText.replace(/[^0-9]/g, ""), 10) || 0;
  }, [minPriceText]);
  const maxPrice = useMemo(() => {
    if (!maxPriceText) return Number.POSITIVE_INFINITY;
    return parseInt(maxPriceText.replace(/[^0-9]/g, ""), 10) || Number.POSITIVE_INFINITY;
  }, [maxPriceText]);
  const toggleBrand = (b) =>
    setSelBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  const clearFilters = () => {
    setSelBrands([]);
    setMinPriceText("");
    setMaxPriceText("");
  };
  const matchesFilters = (i) => {
    if (selBrands.length > 0 && !selBrands.includes(i.brand)) return false;
    if (minPriceText || maxPriceText) {
      // Use priceUSD for cross-currency comparison; items without
      // priceUSD survive the price filter (don't penalise for
      // missing data).
      const p = i.priceUSD;
      if (p != null) {
        if (p < minPrice || p > maxPrice) return false;
      }
    }
    return true;
  };

  const liveListings = useMemo(() => {
    const arr = mainFeedItems.filter(i =>
      !i.sold && !hidden[i.id]
      && !i._isAuctionFormat && !i._isTrackedLot
      && matchesQuery(i, q)
      && matchesFilters(i)
    );
    return arr;
  }, [mainFeedItems, hidden, q, selBrands, minPrice, maxPrice]); // eslint-disable-line

  const liveAuctions = useMemo(() => {
    const arr = auctionLotItems.filter(i =>
      !i.sold && !hidden[i.id] && matchesQuery(i, q)
      && matchesFilters(i)
    );
    return arr;
  }, [auctionLotItems, hidden, q, selBrands, minPrice, maxPrice]); // eslint-disable-line

  const soldItems = useMemo(() => {
    const arr = [
      ...mainFeedItems.filter(i => i.sold),
      ...auctionLotItems.filter(i => i.sold),
    ].filter(i => !hidden[i.id] && matchesQuery(i, q) && matchesFilters(i));
    return arr;
  }, [mainFeedItems, auctionLotItems, hidden, q, selBrands, minPrice, maxPrice]); // eslint-disable-line

  // Available brand chips — top brands across the un-brand-filtered
  // matched set, sorted by total hit count (Live + Auctions + Sold).
  // Computed without selBrands so the chip list stays stable when
  // the user toggles a chip (otherwise toggling a brand off would
  // drop other brands from the list — confusing UX).
  const availableBrands = useMemo(() => {
    if (!q) return [];
    const tally = new Map();
    const tick = (i) => {
      if (!i || !i.brand) return;
      tally.set(i.brand, (tally.get(i.brand) || 0) + 1);
    };
    for (const i of mainFeedItems) {
      if (hidden[i.id]) continue;
      if (matchesQuery(i, q)) tick(i);
    }
    for (const i of auctionLotItems) {
      if (hidden[i.id]) continue;
      if (matchesQuery(i, q)) tick(i);
    }
    return Array.from(tally.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([brand, count]) => ({ brand, count }));
  }, [mainFeedItems, auctionLotItems, hidden, q]);
  const hasFilters = selBrands.length > 0 || !!minPriceText || !!maxPriceText;

  // PR_φ2 2026-05-22: article matches across the editorial corpus.
  // App.js lazy-fetches the source JSONs the first time
  // searchAllActive flips true; articles is [] until that resolves.
  const articleHits = useMemo(() => {
    if (!Array.isArray(articles) || articles.length === 0) return [];
    return articles.filter(a => matchesArticleQuery(a, q, articleBodies));
  }, [articles, q, articleBodies]);

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

  // Strip order — fixed sequence per Mark spec 2026-05-22:
  // live → auctions → articles → sold. ALL four strips render
  // every time, even when the count is 0, so the user can see
  // that the system did search each corpus (and articles in
  // particular — Mark report 2026-05-22: "what about auction
  // and editorial that I asked for?"). Empty strips show a slim
  // "No matches" body instead of the slider grid.
  const stripDefs = [
    { key: "live", heading: "Live listings", kind: "listing", count: liveListings.length, items: liveListings, onViewAll: onViewAllLive },
    { key: "auctions", heading: "Live auctions", kind: "listing", count: liveAuctions.length, items: liveAuctions, onViewAll: onViewAllAuctions },
    { key: "articles", heading: "Articles", kind: "article", count: articleHits.length, items: articleHits, onViewAll: onViewAllArticles },
    { key: "sold", heading: "Archive (Sold)", kind: "listing", count: soldItems.length, items: soldItems, onViewAll: onViewAllSold },
  ];

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
        {/* Filter row — Brand chips + Price min/max. Local-state
            filters scoped to this surface; Mark spec: "submariner
            could be Tudor or Rolex — filter by brand / source etc."
            Brand chips show the top brands present in the matched
            corpus; click to toggle multi-select. Price uses USD as
            the cross-currency bridge (matches Listings filter row).
            Skip the row entirely when there's no query yet (nothing
            to filter). */}
        {q && (availableBrands.length > 0 || hasFilters) && (
          <div style={{
            marginTop: 10,
            display: "flex", alignItems: "center", gap: 8,
            flexWrap: "wrap",
          }}>
            {availableBrands.slice(0, 8).map(({ brand, count }) => {
              const active = selBrands.includes(brand);
              return (
                <button key={brand}
                  onClick={() => toggleBrand(brand)}
                  style={{
                    fontFamily: "inherit", fontSize: 12,
                    padding: "5px 11px", borderRadius: 999, cursor: "pointer",
                    background: active ? "var(--brand-olive-text)" : "transparent",
                    color: active ? "#fff" : "var(--text2)",
                    border: `0.5px solid ${active ? "var(--brand-olive-text)" : "var(--border)"}`,
                    fontWeight: active ? 600 : 500,
                    whiteSpace: "nowrap",
                  }}>
                  {brand}
                  <span style={{
                    marginLeft: 6,
                    color: active ? "rgba(255,255,255,0.8)" : "var(--text3)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
            {/* Price — two slim inputs side by side. Same chrome as
                the Listings filter row's price popover. USD-based
                comparison. */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 4px 3px 10px", borderRadius: 999,
              border: "0.5px solid var(--border)",
              background: "transparent",
              fontFamily: "inherit",
            }}>
              <span style={{ fontSize: 12, color: "var(--text3)", whiteSpace: "nowrap" }}>$</span>
              <input
                type="text"
                inputMode="numeric"
                value={minPriceText}
                onChange={e => setMinPriceText(e.target.value)}
                placeholder="Min"
                style={{
                  width: 56, fontFamily: "inherit", fontSize: 12,
                  border: "none", outline: "none", background: "transparent",
                  color: "var(--text1)", padding: "3px 0",
                }}
              />
              <span style={{ fontSize: 12, color: "var(--text3)" }}>–</span>
              <input
                type="text"
                inputMode="numeric"
                value={maxPriceText}
                onChange={e => setMaxPriceText(e.target.value)}
                placeholder="Max"
                style={{
                  width: 60, fontFamily: "inherit", fontSize: 12,
                  border: "none", outline: "none", background: "transparent",
                  color: "var(--text1)", padding: "3px 8px 3px 0",
                }}
              />
            </div>
            {hasFilters && (
              <button onClick={clearFilters}
                style={{
                  fontFamily: "inherit", fontSize: 12, fontWeight: 500,
                  background: "transparent", border: "none", cursor: "pointer",
                  color: "var(--text3)", padding: "5px 4px",
                  textDecoration: "underline",
                }}>
                Clear
              </button>
            )}
          </div>
        )}
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
      {/* Horizontal-scrollable strip — mirrors Strip + Home pattern. */}
      <div style={{
        display: "flex", gap: 1, overflowX: "auto", overflowY: "hidden",
        padding: isMobile ? "0 16px 4px" : "0 20px 4px",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", msOverflowStyle: "none",
        // B-13 (2026-05-24): transparent (was var(--border)) so the 16/20px
        // edge inset is page-colored, not a grey band "in front of" the row
        // — most visible on the light-image auction cards, but applied to
        // all strips so they stay consistent.
        background: "transparent",
      }}>
        {visible.map(a => (
          <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer"
            style={isMobile ? {
              flex: "0 0 38%", maxWidth: 170, scrollSnapAlign: "start",
              display: "flex", flexDirection: "column",
              textDecoration: "none", color: "inherit",
              background: "var(--card-bg)",
            } : {
              flex: "0 0 210px", scrollSnapAlign: "start",
              display: "flex", flexDirection: "column",
              textDecoration: "none", color: "inherit",
              background: "var(--card-bg)",
            }}>
            {/* B-12 (2026-05-24): square image + placeholder to match the
                listing/auction/sold Cards in the other strips (was 16/10
                landscape, which read as a different card type). Always
                rendered so tile heights line up across strips. Mirrors
                Card's 1:1 image + favicon placeholder. */}
            <div style={{ position: "relative", paddingTop: "100%", background: "var(--surface)", overflow: "hidden" }}>
              {a.image ? (
                <img src={a.image} alt="" loading="lazy"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img src="/favicon-192.png" alt="" aria-hidden="true" style={{ width: "44%", maxWidth: 88, opacity: 0.55 }} />
                </div>
              )}
            </div>
            <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: "var(--text3)",
                textTransform: "uppercase", letterSpacing: 0.4,
              }}>
                {(a._source && a._source.label) || a.source || ""}
              </div>
              <div style={{
                fontSize: 12, fontWeight: 500, color: "var(--text1)",
                lineHeight: 1.3,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>{a.title}</div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
