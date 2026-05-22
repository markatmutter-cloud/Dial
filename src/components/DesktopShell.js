import React, { useEffect, useRef } from "react";
import { SearchIcon, TabIcon } from "./icons";
import { Chip } from "./Chip";
import { AboutModal } from "./AboutModal";
import { SignInPromptModal } from "./SignInPromptModal";
import { pillBase, tabPill } from "../styles";

// Desktop shell — receives everything the desktop branch needs from
// App.js as a single props bag. Stage 2 of recommendation #1 (extracted
// 2026-04-30 alongside MobileShell).
//
// filterRowJSX is built inline here rather than passed in: it's
// substantial JSX that's only ever rendered by the desktop shell, so
// it lives where it's used. dtPill is a local alias for the compact
// pill variant — used only by this shell's filter row pills.
export function DesktopShell(props) {
  const {
    // Catalog
    BRANDS, BRANDS_SHOW, SOURCES, SOURCES_SHOW,
    DEALER_SOURCES, AUCTION_SOURCES,
    // State
    aboutModalOpen, activeFilterPop,
    brandsExpanded, sourcesExpanded, setSourcesExpanded,
    currentIsSaved,
    filterBrands, filterSources, filterModels, filterSaleUrls,
    effectiveBrandsCount = 0, effectiveSourcesCount = 0, effectiveModelsCount = 0,
    listingsSubTab,
    allFiltered, displayedCount,
    hasFilters, hiddenItems,
    maxPriceText, minPriceText,
    filterHearted, search, signInPromptOpen, signInWithGoogle, sort,
    tab, user, visibleBrands, visibleSources, visibleModels,
    MODELS, MODELS_SHOW, modelsExpanded, setModelsExpanded,
    watchTopTab, watchlist,
    // Setters / handlers
    handleWish, openFavPrompt, resetFilters,
    setAboutModalOpen, setActiveFilterPop, setBrandsExpanded,
    setFilterBrands, setFilterSources, setFilterModels,
    setMaxPriceText, setMinPriceText,
    setFilterHearted, setPage, setSearch, setSignInPromptOpen, setSort,
    setTab,
    toggleBrand, toggleHide, toggleSource, toggleModel, toggleSaleUrl,
    // Sale filter (PR 2026-05-22): list of active sales for the
    // dropdown + the lot counts so the chip can show counts.
    auctions, lotCountsByAuctionUrl, setFilterSaleUrls,
    // Pre-built JSX
    addSearchModalJSX,
    authJSX, baseStyle,
    collectionEditModalJSX, collectionPickerModalJSX,
    favSearchModalJSX,
    adminTabJSX, homeTabJSX, listingsGridJSX, listingsTabContentJSX, primaryCurrency, settingsModalJSX, shareReceiverJSX,
    challengeReceiverJSX,
    listReceiverJSX,
    listingsSubTabsJSX,
    referencesSubTabsJSX,
    trackNewItemModalJSX, watchSubTabsJSX, watchHeartedToggleJSX, collectionsSubTabsJSX, watchlistTabJSX,
    watchboxTabJSX,
    referencesTabJSX, collectionsTabJSX,
    lotMigrationBannerJSX,
    userLimitBannerJSX,
    identityBandJSX,
    searchAllResultsJSX,
    searchAllActive,
    shareActive,
    challengeShareActive,
    listShareActive,
    colDrillInId,
  } = props;
  const anyShareActive = shareActive || challengeShareActive || listShareActive;
  // True when we're drilled into a list (Watchlists > Lists > [list]).
  // Filter row is shown here so users can date-sort, narrow by source/
  // brand, etc. inside a long list — same UX as the Listings tab.
  const inListsDrillIn = tab === "watchlist" && watchTopTab === "lists" && !!colDrillInId;

  // Listings sub-tab gates filter exposure: Live listings hides
  // auction-house chips (no live dealer items in those sources);
  // Live auctions hides dealer chips for the same reason. Sold +
  // Calendar show both. Watchlist tab and other main tabs always
  // see both groups.
  const showDealerSources  = !(tab === "listings" && listingsSubTab === "auctions");
  const showAuctionSources = !(tab === "listings" && listingsSubTab === "live");
  // Whether the filter row should render at all on this sub-tab.
  // Calendar sub-tab has no filterable list — hide the row.
  const showListingsFilterRow = !(tab === "listings" && listingsSubTab === "calendar");

  // (sidebarToggleJSX retired — desktop sidebar removed in the April '26
  // filter-consolidation pass; toggle const + render slot deleted in the
  // 2026-05-04 cleanup pass.)

  // Pill helper for the desktop filter row — denser padding than mobile
  // because horizontal real estate is the constraint, not tap targets.
  const dtPill = (active) => pillBase(active, { compact: true });

  // Top-bar search — PR_ε1.5 2026-05-22. Returns to the top bar as an
  // expanding icon-then-input pattern (replaces PR_V's filter-row
  // search). Rationale: density (no row gain), editorial pattern
  // (Hodinkee / Chrono24 / GitHub), olive-top-bar inheritance for
  // PR_ε2, single source of truth (Editorial's inline input from
  // PR #442 reverts). Mobile keeps the Spotify overlay from PR_Z —
  // same icon, different surface.
  const topBarInputRef = useRef(null);
  // Global `/` shortcut — focuses the always-present search input.
  // Skipped when an input/textarea is already focused (don't hijack
  // typing in other fields). PR 2026-05-22: the search is always
  // expanded now, so the shortcut just focuses (no expand state).
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      const inField = tag === "input" || tag === "textarea" || e.target.isContentEditable;
      if (e.key === "/" && !inField) {
        e.preventDefault();
        if (topBarInputRef.current) topBarInputRef.current.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const searchPlaceholder = tab === "references"
    ? "Search articles by title, author, body…"
    : "Search reference or brand...";
  // Top-bar search JSX — collapsed icon button OR expanded inline input.
  // Width grows from ~32px (icon-only) to 320px on expand. Esc collapses.
  // PR_ε2 2026-05-22: colors flip when the top bar is olive (every tab
  // except Home — icon button is rendered only on non-Home anyway).
  // Olive top bar applies to every non-Home tab AND to focused
  // destination surfaces (share-receive, challenge-receive,
  // list-receive, cross-tab Search-all). Those surfaces take over
  // the content area; the chrome above them should still read as
  // the rest of the site, not flip back to neutral just because
  // the underlying tab value is "home". Fix 2026-05-22.
  // Search rendered in the filter row (PR 2026-05-22, Mark spec
  // "search bar location should apply to all tabs where the search
  // bar exists, other than landing page and strip search"). Filter
  // row is always neutral bg so the chrome colors are fixed.
  const tbBorderColor = "var(--border)";
  const tbTextColor   = "var(--text1)";
  const tbIconColor   = "var(--text2)";
  const tbMutedColor  = "var(--text3)";
  // PR 2026-05-22: search bar is now ALWAYS expanded as an inline
  // input (Mark spec: "I want the search bar to the right of the
  // filters not hidden/collapsed and working how it already does").
  // The icon → input toggle + "Close" chevron are retired. `/`
  // shortcut now focuses (instead of expanding-then-focusing).
  const expandingSearchJSX = (
    <div style={{ display: "flex", alignItems: "center", gap: 8,
                  background: "transparent",
                  border: `0.5px solid ${tbBorderColor}`,
                  borderRadius: 10,
                  padding: "6px 12px",
                  width: 320, minWidth: 0,
                  color: tbIconColor }}>
      <SearchIcon />
      <input
        ref={topBarInputRef}
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") e.target.blur();
          if (e.key === "Escape") { setSearch(""); e.target.blur(); }
        }}
        placeholder={searchPlaceholder}
        style={{ flex: 1, border: "none", background: "transparent",
                 fontSize: 13, color: tbTextColor, outline: "none",
                 fontFamily: "inherit", minWidth: 0 }}
      />
      {search && user && (
        <button onClick={openFavPrompt}
          aria-label={currentIsSaved ? "Already saved" : "Save search as favorite"}
          title={currentIsSaved ? "Saved to favorites" : "Save as favorite search"}
          disabled={currentIsSaved}
          style={{ flexShrink: 0, background: "none", border: "none",
                  cursor: currentIsSaved ? "default" : "pointer",
                  color: currentIsSaved ? "var(--brand)" : tbIconColor,
                  padding: "2px 4px", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 5, fontSize: 12, fontWeight: 500 }}>
          <svg width="14" height="14" viewBox="0 0 24 24"
            fill={currentIsSaved ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>{currentIsSaved ? "Saved" : "Save"}</span>
        </button>
      )}
      {search && (
        <button onClick={() => setSearch("")} aria-label="Clear search"
          style={{ flexShrink: 0, background: "none", border: "none",
                  cursor: "pointer", color: tbMutedColor, padding: 2,
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
  );
  // PR_ε1.5 retires searchComposite from the filter row. Keep the
  // declaration here ONLY as a no-op so future-self doesn't reach for
  // it expecting filter-row search.
  const searchComposite = null;

  // Slim row used on non-Home tabs that don't render the full filter
  // row today. Matches filterRowJSX's outer padding + border + flex
  // pattern exactly so the search input vertical position is identical
  // across every tab (Mark feedback 2026-05-21: "feint line and
  // spacing difference across the tabs").
  const searchOnlyRowJSX = (
    <div style={{ display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 20px",
                  borderBottom: "0.5px solid var(--border)",
                  flexShrink: 0, flexWrap: "wrap" }}>
      {searchComposite}
    </div>
  );

  const filterRowJSX = (() => {
    // Source + Brand expansion panel — chip cluster shown directly
    // below the filter row when either pill is active. Inline-expand
    // pattern (vs the prior floating popover) so all filter controls
    // share the same "tap a pill" interaction.
    const expansionPanelStyle = {
      // Bottom padding 24 → 14 on 2026-05-22 (density pass): the
      // chunky bottom slab was burning ~10px above the fold for no
      // structural reason. 14px keeps the chip cluster off the
      // bottom border cleanly.
      padding: "8px 20px 14px",
      borderBottom: "0.5px solid var(--border)",
      background: "var(--surface)",
      display: "flex", flexWrap: "wrap", gap: 8,
      alignItems: "flex-start",
      // Explicit lineHeight so the chip pills don't collide vertically
      // when they wrap to multiple rows. Without this the inherited
      // line-height-1 from <button> can push wrapped chips into one
      // another's box.
      lineHeight: 1.5,
    };
    const expandedSource = activeFilterPop === "source";
    const expandedBrand  = activeFilterPop === "brand";
    const expandedModel  = activeFilterPop === "model";
    const expandedSale   = activeFilterPop === "sale";
    return (
    <>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 20px",
                  borderBottom: expandedSource || expandedBrand || expandedModel || expandedSale ? "none" : "0.5px solid var(--border)",
                  flexShrink: 0, flexWrap: "wrap", position: "relative" }}>
      {/* Search — leftmost cluster (2026-05-21, Mark spec): in line
          with sort + filter chips. Behavior unchanged from when it
          lived in the top bar. */}
      {searchComposite}

      {/* Status segment retired 2026-05-04 — both Listings AND
          Watchlist now have sub-tabs that cover Live / Sold. */}

      {/* Saved hearted-sub-tab toggle (Listings/Auctions/Sold) —
          rendered as a leading cluster on the filter row when on
          Saved + a hearted sub-tab. App.js builds the pill fragment
          (or null when off-tab); a thin divider after the cluster
          visually separates it from the sort/filter controls.
          (2026-05-08 — Mark feedback: was a separate row above. */}
      {watchHeartedToggleJSX && (
        <>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {watchHeartedToggleJSX}
          </div>
          <div aria-hidden style={{ width: 1, height: 18, background: "var(--border)", margin: "0 2px" }} />
        </>
      )}

      {/* Sort — Date + Price toggle pills. Date pill semantics depend
          on the active Listings sub-tab (newest firstSeen on Live;
          ending order on Live auctions; sold-date on All sold) — the
          dispatch lives in App.js's allFiltered memo. */}
      <div style={{ display: "flex", gap: 6 }}>
        {(() => {
          // On Home, the activity grouping is the visible order — not
          // a date sort. Suppress the active state on Home so the
          // pill doesn't lie about state. Click still routes to
          // Listings via the interact-routes effect.
          const isDate = sort === "date" || sort === "date-asc";
          const label = sort === "date" ? "Date ↓"
                      : sort === "date-asc" ? "Date ↑"
                      : "Date";
          return (
            <button onClick={() => {
              if (sort === "date") setSort("date-asc");
              else if (sort === "date-asc") setSort("date");
              else setSort("date");
            }} style={{ ...pillBase(isDate, { compact: true }), fontWeight: isDate ? 600 : 500 }}>{label}</button>
          );
        })()}
        {(() => {
          const isPrice = sort === "price-asc" || sort === "price-desc";
          const label = sort === "price-desc" ? "Price ↓"
                      : sort === "price-asc" ? "Price ↑"
                      : "Price";
          return (
            <button onClick={() => {
              if (sort === "price-desc") setSort("price-asc");
              else if (sort === "price-asc") setSort("price-desc");
              else setSort("price-desc");
            }} style={{ ...pillBase(isPrice, { compact: true }), fontWeight: isPrice ? 600 : 500 }}>{label}</button>
          );
        })()}
        {/* Lot # pill retired 2026-05-07 (Mark feedback): the
            catalog-order behavior is now baked into the default
            Date sort — within a single auction (same auction_end),
            lots order by lot_number ascending. Christie's lots
            stay grouped + in catalog order, then Phillips, etc.
            Toggle UI removed because there's no longer a meaningful
            alternate ordering — the sort always reads as you'd see
            it on the auction house's own site. */}
        {/* ♥ Saved-only filter pill (Bundle 2B) — Listings + Home,
            signed-in users only. Same data as the Saved tab
            sub-tabs; this is the in-flow alternate access path. On
            Home the click routes to Listings via the interact-routes
            effect in App.js. */}
        {tab === "listings" && user && listingsSubTab !== "calendar" && (
          <button onClick={() => setFilterHearted && setFilterHearted(!filterHearted)}
            aria-pressed={!!filterHearted}
            title={filterHearted ? "Show all" : "Show only saved"}
            style={{
              ...pillBase(!!filterHearted, { compact: true, surface: true }),
              background: filterHearted ? "var(--brand)" : "var(--surface)",
              color:      filterHearted ? "#fff"         : "var(--text2)",
              fontWeight: filterHearted ? 600 : 500,
              display: "flex", alignItems: "center", gap: 5,
            }}>
            {/* Heart always renders red (--danger) so the chip reads
                as "the heart filter" at a glance — same color as the
                hearted-card overlay. Filled when active; outlined
                when off. (2026-05-09 Mark feedback: the heart was
                color-following the pill state and got lost on the
                white-on-brand active state.) */}
            <svg width="11" height="11" viewBox="0 0 24 24"
              fill={filterHearted ? "var(--danger)" : "none"}
              stroke="var(--danger)"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Saved
          </button>
        )}
      </div>

      {/* Price — inline min/max inputs. USD-only labels because the
          feed is USD-normalized. */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "var(--surface)",
        border: "0.5px solid var(--border)",
        borderRadius: 20, padding: "0 6px 0 12px", height: 30,
      }}>
        <span style={{ fontSize: 11, color: "var(--text3)" }}>$</span>
        <input value={minPriceText}
          onChange={e => setMinPriceText(e.target.value)}
          placeholder="Min" inputMode="numeric"
          aria-label="Minimum price USD"
          style={{
            border: "none", background: "transparent",
            color: "var(--text1)", outline: "none",
            fontFamily: "inherit", fontSize: 13,
            width: 56, padding: "4px 0",
          }} />
        <span style={{ fontSize: 11, color: "var(--text3)" }}>–</span>
        <input value={maxPriceText}
          onChange={e => setMaxPriceText(e.target.value)}
          placeholder="Max" inputMode="numeric"
          aria-label="Maximum price USD"
          style={{
            border: "none", background: "transparent",
            color: "var(--text1)", outline: "none",
            fontFamily: "inherit", fontSize: 13,
            width: 60, padding: "4px 0",
          }} />
        {(minPriceText || maxPriceText) && (
          <button onClick={() => { setMinPriceText(""); setMaxPriceText(""); }}
            aria-label="Clear price filter"
            style={{
              border: "none", background: "transparent",
              color: "var(--text3)", cursor: "pointer",
              fontFamily: "inherit", fontSize: 14,
              padding: "0 4px", lineHeight: 1,
            }}>×</button>
        )}
      </div>

      {/* Source + Brand pills are inline-expand toggles — tap → chip
          cluster appears in a panel below the filter row. */}
      <button onClick={() => setActiveFilterPop(p => p === "source" ? null : "source")}
        style={dtPill(filterSources.length > 0 || activeFilterPop === "source")}>
        Source{filterSources.length > 0 ? ` · ${filterSources.length}` : ""}
      </button>
      <button onClick={() => setActiveFilterPop(p => p === "brand" ? null : "brand")}
        style={dtPill(filterBrands.length > 0 || activeFilterPop === "brand")}>
        Brand{filterBrands.length > 0 ? ` · ${filterBrands.length}` : ""}
      </button>
      {/* Model trigger — only renders when there are any model_line
          values to filter by (MODELS is empty until the matcher hits
          enough items). Avoids a permanent-dead pill on tabs/views
          with no matched items. */}
      {(MODELS?.length || 0) > 0 && (
        <button onClick={() => setActiveFilterPop(p => p === "model" ? null : "model")}
          style={dtPill((filterModels?.length || 0) > 0 || activeFilterPop === "model")}>
          Model{(filterModels?.length || 0) > 0 ? ` · ${filterModels.length}` : ""}
        </button>
      )}
      {/* Sale filter — Listings > Live auctions only (PR 2026-05-22
          auction IA). Lots are bucketed by closing-time bands; the
          Sale chip lets you drill into a specific catalog. */}
      {tab === "listings" && listingsSubTab === "auctions" && (
        <button onClick={() => setActiveFilterPop(p => p === "sale" ? null : "sale")}
          style={dtPill((filterSaleUrls?.length || 0) > 0 || activeFilterPop === "sale")}>
          Sale{(filterSaleUrls?.length || 0) > 0 ? ` · ${filterSaleUrls.length}` : ""}
        </button>
      )}

      {/* Auctions-only pill retired 2026-05-04 — Watchlist > Saved
          auctions sub-tab covers it. */}

      {/* Search — moved here 2026-05-22 (Mark spec: filter row,
          right-aligned, "search bar more often in the middle of
          the page"). Same expanding-icon-then-input pattern that
          previously lived in the top bar (PR_ε1.5). Applies to
          every tab that has a filter row (Listings / Watchlists /
          Editorial); Home + Search-all skip it. marginLeft: auto
          pushes it (plus the trailing count + Clear-all) to the
          right edge. */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {expandingSearchJSX}
        {/* Count chip — RESTORED 2026-05-22 (Mark spec, after
            retiring the identity band). Stays in the right cluster
            beside the search pill. */}
        <span style={{
          flexShrink: 0,
          fontSize: 12, color: "var(--text3)", fontFamily: "inherit",
          whiteSpace: "nowrap", padding: "0 6px",
        }}>
          {(displayedCount || 0).toLocaleString()} {displayedCount === 1 ? "watch" : "watches"}
        </span>
        {hasFilters && (
          <button onClick={resetFilters} style={{
            fontSize: 13, padding: "6px 12px", borderRadius: 20, cursor: "pointer",
            fontFamily: "inherit", whiteSpace: "nowrap",
            border: "none", outline: "none",
            background: "transparent", color: "var(--brand)",
            boxShadow: "inset 0 0 0 0.5px var(--brand)",
          }}>× Clear all</button>
        )}
      </div>
    </div>
    {expandedSource && (() => {
      // Iterate the cross-axis-filtered effective list (visibleSources)
      // — NOT the raw DEALER_SOURCES / AUCTION_SOURCES catalogs.
      // Without this, picking brand=Urwerk shrinks the chip rail
      // behind the pill but tapping "Source" still revealed every
      // dealer (Mark feedback 2026-05-20). MobileShell already does
      // this via PR_A; DesktopShell was missed.
      const visDealers  = (visibleSources || []).filter(s => (DEALER_SOURCES || []).includes(s));
      const visAuctions = (visibleSources || []).filter(s => (AUCTION_SOURCES || []).includes(s));
      const hasAny = visDealers.length > 0 || visAuctions.length > 0;
      return (
        <div style={expansionPanelStyle}>
          {!hasAny ? (
            <span style={{ fontSize: 12, color: "var(--text3)" }}>
              {(filterBrands?.length || 0) > 0 || (filterModels?.length || 0) > 0
                ? "No sources match the active brand / model filter."
                : "No sources yet."}
            </span>
          ) : (
            <>
              {showDealerSources && visDealers.length > 0 && (
                <span style={{
                  flexBasis: "100%", fontSize: 10, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  color: "var(--text3)", marginBottom: 2,
                }}>Dealers</span>
              )}
              {showDealerSources && visDealers.map(s => (
                <Chip key={s} label={s} active={filterSources.includes(s)} onClick={() => toggleSource(s)} />
              ))}
              {showAuctionSources && visAuctions.length > 0 && (
                <span style={{
                  flexBasis: "100%", fontSize: 10, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  color: "var(--text3)", marginTop: visDealers.length > 0 ? 8 : 0, marginBottom: 2,
                }}>Auction houses</span>
              )}
              {showAuctionSources && visAuctions.map(s => (
                <Chip key={s} label={s} active={filterSources.includes(s)} onClick={() => toggleSource(s)} />
              ))}
              {/* +N more / Less expander — Mark report 2026-05-22:
                  "sold tab — there are ten thousand listings but only
                  a few sources in the filter — don't think filters
                  are working." Brand panel had this expander; source
                  panel was missing it, so anything past the first
                  SOURCES_SHOW (8) sources was hidden behind a
                  non-existent toggle. */}
              {effectiveSourcesCount > (SOURCES_SHOW || 0) && (
                <Chip
                  label={sourcesExpanded ? "Less ↑" : `+${effectiveSourcesCount - (SOURCES_SHOW || 0)} more`}
                  active={false}
                  onClick={() => setSourcesExpanded(!sourcesExpanded)}
                  blue
                />
              )}
              {filterSources.length > 0 && (
                <button onClick={() => setFilterSources([])} style={{
                  marginLeft: "auto", fontSize: 12, padding: "4px 10px", borderRadius: 6,
                  border: "0.5px solid var(--border)", background: "transparent",
                  color: "var(--text2)", cursor: "pointer", fontFamily: "inherit",
                }}>Clear</button>
              )}
            </>
          )}
        </div>
      );
    })()}
    {expandedBrand && (
      <div style={expansionPanelStyle}>
        {visibleBrands.map(b => (
          <Chip key={b} label={b} active={filterBrands.includes(b)} onClick={() => toggleBrand(b)} />
        ))}
        {effectiveBrandsCount > BRANDS_SHOW && (
          <Chip label={brandsExpanded ? "Less ↑" : `+${effectiveBrandsCount - BRANDS_SHOW} more`}
            active={false} onClick={() => setBrandsExpanded(!brandsExpanded)} blue />
        )}
        {filterBrands.length > 0 && (
          <button onClick={() => setFilterBrands([])} style={{
            marginLeft: "auto", fontSize: 12, padding: "4px 10px", borderRadius: 6,
            border: "0.5px solid var(--border)", background: "transparent",
            color: "var(--text2)", cursor: "pointer", fontFamily: "inherit",
          }}>Clear</button>
        )}
      </div>
    )}
    {expandedModel && (
      <div style={expansionPanelStyle}>
        {(visibleModels || []).map(m => (
          <Chip key={m} label={m} active={(filterModels || []).includes(m)} onClick={() => toggleModel && toggleModel(m)} />
        ))}
        {effectiveModelsCount > (MODELS_SHOW || 0) && (
          <Chip label={modelsExpanded ? "Less ↑" : `+${effectiveModelsCount - MODELS_SHOW} more`}
            active={false} onClick={() => setModelsExpanded && setModelsExpanded(!modelsExpanded)} blue />
        )}
        {(filterModels?.length || 0) > 0 && (
          <button onClick={() => setFilterModels && setFilterModels([])} style={{
            marginLeft: "auto", fontSize: 12, padding: "4px 10px", borderRadius: 6,
            border: "0.5px solid var(--border)", background: "transparent",
            color: "var(--text2)", cursor: "pointer", fontFamily: "inherit",
          }}>Clear</button>
        )}
      </div>
    )}
    {expandedSale && (() => {
      // Sale picker — active sales only, sorted closing-soonest.
      // Skips sales with zero lots (the chip wouldn't be useful).
      const active = ((auctions || []) || []).filter(a =>
        a && a.url && ((lotCountsByAuctionUrl || {})[a.url] || 0) > 0
      ).filter(a => {
        // Skip past sales (date_end > 1 day ago).
        const end = a.dateEnd ? new Date(a.dateEnd).getTime() : 0;
        if (!end) return true;
        return end > Date.now() - 86400000;
      }).sort((a, b) => {
        const da = a.dateEnd ? new Date(a.dateEnd).getTime() : 0;
        const db = b.dateEnd ? new Date(b.dateEnd).getTime() : 0;
        return da - db;
      });
      return (
        <div style={expansionPanelStyle}>
          {active.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--text3)" }}>
              No active sales with lots.
            </span>
          ) : (
            <>
              {active.map(a => {
                const isOn = (filterSaleUrls || []).includes(a.url);
                const count = (lotCountsByAuctionUrl || {})[a.url] || 0;
                const label = `${a.house || ""}${a.title ? " · " + a.title : ""}`.trim()
                  + (a.dateLabel ? ` · ${a.dateLabel}` : "")
                  + ` · ${count}`;
                return (
                  <Chip key={a.url} label={label} active={isOn}
                    onClick={() => toggleSaleUrl && toggleSaleUrl(a.url)} />
                );
              })}
              {(filterSaleUrls?.length || 0) > 0 && (
                <button onClick={() => setFilterSaleUrls && setFilterSaleUrls([])} style={{
                  marginLeft: "auto", fontSize: 12, padding: "4px 10px", borderRadius: 6,
                  border: "0.5px solid var(--border)", background: "transparent",
                  color: "var(--text2)", cursor: "pointer", fontFamily: "inherit",
                }}>Clear</button>
              )}
            </>
          )}
        </div>
      );
    })()}
    </>
    );
  })();

  return (
    <div style={{ ...baseStyle, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {/* Full-width top bar — PR_ε2 2026-05-22: olive chrome on every
          non-Home tab. Mirrors the mobile chrome zone (PRs #445/#446)
          and threads the brand color through the desktop nav band. On
          Home the bar stays neutral so the editorial hero (moonphase +
          olive WATCHLIST + olive Search button) carries the first
          paint. Border-bottom dropped when olive: the color flip is
          its own divider against the neutral working surface below. */}
      {(() => {
        // Same rule as topBarOnOlive above: receive surfaces +
        // Search-all also get olive chrome even if the underlying
        // `tab` is "home" (e.g. user landed via a /share link with
        // no prior nav). Fix 2026-05-22 — Mark report "still old
        // interface at the top" on share + search-all surfaces.
        // Olive bg only on non-Home tabs (Mark spec: Home stays
        // neutral, the M just inherits the position via a
        // transparent minimal top bar). Receive surfaces +
        // Search-all still get olive.
        const onOlive = tab !== "home" || anyShareActive || searchAllActive;
        // PR 2026-05-22 γ — Home masthead restructure. On Home (and
        // not over a receive/search-all destination), the persistent
        // top-bar chrome is suppressed entirely; tabs / About / auth
        // render under the wordmark inside HomeTab's olive-bleed
        // masthead band. Top bar collapses to nothing so the hero
        // is the first thing in the viewport.
        // PR 2026-05-22 (Mark feedback "same location on all tabs
        // top right so it doesn't move around"): keep the olive top
        // bar even on Home, but render only About + auth pill in it.
        // No wordmark (editorial hero owns the brand mark on Home);
        // no tabs (they live in the masthead band under the hero).
        // Just the right-side affordances at viewport top-right so
        // the M circle anchors in the same place as on every other
        // tab.
        const minimalTopBar = tab === "home" && !anyShareActive && !searchAllActive;
        return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
                      // No border on Home — keeps the top of the
                      // page clean (no visible bar above the hero).
                      borderBottom: onOlive ? "none" : (minimalTopBar ? "none" : "0.5px solid var(--border)"),
                      background: onOlive ? "var(--brand-olive)" : "transparent",
                      flexShrink: 0 }}>
        {/* Top wordmark hidden on Home (editorial hero in body is the
            brand mark there) AND on the minimal Home top bar. */}
        {onOlive && !minimalTopBar && (
          <button onClick={() => { setTab("home"); setPage(1); }}
            style={{ background: "none", border: "none", cursor: "pointer",
                    padding: 0, paddingLeft: "0.16em", fontFamily: "inherit",
                    fontSize: 24, fontWeight: 700, letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#ffffff", flexShrink: 0 }}>
            Watchlist
          </button>
        )}
        {/* Tabs cluster — hidden on minimal Home top bar (tabs live
            in the masthead band under the hero on Home). */}
        {!minimalTopBar && (
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexShrink: 0, marginLeft: 8 }}>
          {[["listings", "Listings"], ["watchlist", "Watchlists"], ["references", "Collecting"]].map(([key, label]) => {
            const active = tab === key;
            return (
              <button key={key} onClick={() => setTab(key)} style={{
                ...tabPill(active, { onOlive: true }),
                padding: "10px 0",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <TabIcon kind={key} />
                {label}
              </button>
            );
          })}
        </div>
        )}
        {/* Top-bar search relocated AGAIN 2026-05-22 (PR_ε1.5): back
            to the top bar as an expanding icon → input pattern. Sits
            in the account zone alongside About + Watchbox. Replaces
            the filter-row search (PR_V from 2026-05-21). Mobile
            unchanged (Spotify overlay from PR_Z). On non-Home tabs
            only — Home has its own editorial hero search. */}
        <div style={{ flex: 1 }} />
        {/* PR 2026-05-22 (Mark feedback): two search inputs visible
            on the Search-all page (top-bar expanding + SearchResultsView's
            sticky header). Hide the top-bar one when Search-all is
            active — the body's input is the canonical surface for
            editing the query in that context. */}
        {/* Top-bar search retired 2026-05-22 — moved into the
            filter row's right edge (see expandingSearchJSX render
            below). */}
        {/* About link — top-right area, before the auth chrome.
            Was previously next to the top-left wordmark; relocated
            2026-05-11 so it lives in the same zone as sign-in (per
            the Fratello/Hodinkee reference patterns Mark sent: brand
            on one side, account/about on the other). Color flips to
            white-on-olive when the top bar is olive (PR_ε2).
            PR 2026-05-22 chrome harmonization (Mark spec): bumped
            font 12 → 13, weight 500 (matches tabPill inactive), drop
            the 0.04em letter-spacing so chrome reads as one type
            family across wordmark / tabs / About / auth pill. */}
        <button onClick={() => setAboutModalOpen(true)}
          style={{ background: "none", border: "none", cursor: "pointer",
                  padding: "6px 8px", fontFamily: "inherit", fontSize: 13,
                  fontWeight: 500, letterSpacing: "0.01em",
                  color: onOlive ? "rgba(255,255,255,0.85)" : "var(--text3)",
                  flexShrink: 0 }}>
          About
        </button>
        {authJSX}
        </div>
        );
      })()}
      {/* Sub-tab strips — Listings on tab=listings, Watchlist on
          tab=watchlist. Sit between main tabs and the filter row.
          Hidden when a share-receive landing surface is taking over
          the content area, since the recipient has no use for the
          sub-tab + filter row chrome until they dismiss / save. */}
      {!anyShareActive && !searchAllActive && listingsSubTabsJSX}
      {!anyShareActive && !searchAllActive && watchSubTabsJSX}
      {!anyShareActive && !searchAllActive && referencesSubTabsJSX}
      {/* Identity band — moved to chrome stack 2026-05-21 (PR_Y4,
          Mark spec: "search and filter pills below the black block").
          Band reads as the section header between sub-tabs and the
          tools below, rather than scrolling inside the content.
          PR_W (2026-05-22): hidden when in cross-tab Search-all
          destination (SearchResultsView has its own header). */}
      {!anyShareActive && !searchAllActive && identityBandJSX}
      {/* watchHeartedToggleJSX is embedded inside filterRowJSX below
          (2026-05-08 — Mark feedback) so the Listings/Auctions/Sold
          pills sit on the same line as Date/Price/$Min/Source/Brand
          rather than a separate row above. */}
      {/* collectionsSubTabsJSX retired in Bundle 2A.2 (renders null) —
          the four collections-style sub-tabs are now part of
          watchSubTabsJSX. Prop kept on destructure for backward
          compat with the mock fixture. */}
      {(() => {
        if (anyShareActive || searchAllActive || tab === "home") return null;
        const showFullFilterRow =
          (tab === "listings" && showListingsFilterRow) ||
          inListsDrillIn ||
          (tab === "watchlist" && watchTopTab !== "searches" &&
            watchTopTab !== "my-collection" && watchTopTab !== "wishlist" &&
            watchTopTab !== "lists" && watchTopTab !== "challenges");
        // Full filter row carries search + chips + sort. Tabs without
        // an applicable chip set fall through to a slim search-only
        // row so the search stays at the same vertical position
        // across the app (Mark spec 2026-05-21). Listings calendar
        // sub-tab is the one exception — no search there either
        // (the calendar isn't a searchable surface).
        if (showFullFilterRow) return filterRowJSX;
        // Everything else: no shell-level filter/search row. Search
        // lives in the top bar now (PR_ε1.5 2026-05-22) so the slim
        // searchOnlyRowJSX is no longer needed. Tabs that only had
        // search (Watchlist, Collecting, Listings calendar) just
        // drop the row entirely.
        return null;
      })()}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Top padding is 0 on Watchlist so the sub-tab strip sits flush
            against the filter pill row. Listings keeps the breathing room. */}
        <div data-desktop-main style={{ flex: 1, overflowY: "auto",
          // Top padding zeroed on tabs whose first child IS a sticky
          // filter strip (Collecting Editorial) or whose content
          // doesn't need breathing room from the chrome (Watchlist
          // collections sub-tabs). Keeps the filter strip flush with
          // the sub-tab strip above — Mark report 2026-05-22:
          // "search is different Y height between listings and
          // collecting tab" was driven by this 14px gap.
          padding: `${(tab === "watchlist" || tab === "references") ? 0 : 14}px 20px 32px`,
        }}>
          {/* Share-receive surface — self-contained component. */}
          {shareReceiverJSX}
          {/* Watch Challenges receive surface (v1.5). */}
          {challengeReceiverJSX}
          {/* List-share receive surface (v1, 2026-05-07). */}
          {listReceiverJSX}
          {/* Phase B2 lot-migration banner. */}
          {lotMigrationBannerJSX}
          {/* User-limit banner (Epic 3). Renders null below soft-warn
              threshold. Fixed-position so it surfaces on any tab. */}
          {userLimitBannerJSX}
          {/* When EITHER receive surface is up (single-listing or
              challenge), skip the regular tab content so the
              recipient gets a clean first-impression page. */}
          {!anyShareActive && (
            <>
              {/* identityBandJSX moved to chrome stack 2026-05-21
                  (PR_Y4): sits between sub-tabs and filter row up
                  there, no longer inside the scroll content. */}
              {/* (Ending-soon pinned section retired 2026-05-04 —
                  Watchlist > Saved auctions sub-tab IS the
                  ending-soon view now.) */}
              {/* Bundle 2A.2 (2026-05-07): Collections is no longer
                  a top-level tab — its content renders inside the
                  Saved tab (`tab === "watchlist"`) via the
                  `watchlistTabJSX` prop, which App.js dispatches
                  between Watchlist and Collections content based on
                  the active sub-tab. */}
              {searchAllActive ? searchAllResultsJSX
                : tab === "home" ? homeTabJSX
                : tab === "listings" ? listingsTabContentJSX
                : tab === "references" ? referencesTabJSX
                : tab === "admin" ? adminTabJSX
                : tab === "watchbox" ? watchboxTabJSX
                : watchlistTabJSX}
            </>
          )}
        </div>
      </div>
      {trackNewItemModalJSX}
      {addSearchModalJSX}
      {collectionEditModalJSX}
      {collectionPickerModalJSX}
      {settingsModalJSX}
      <AboutModal
          open={aboutModalOpen}
          onClose={() => setAboutModalOpen(false)}
          primaryCurrency={primaryCurrency}
        />
        <SignInPromptModal
          open={!!signInPromptOpen}
          onClose={() => setSignInPromptOpen && setSignInPromptOpen(false)}
          onSignIn={() => signInWithGoogle && signInWithGoogle()}
        />
        {favSearchModalJSX}
    </div>
  );
}
