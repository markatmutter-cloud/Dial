import React, { useEffect, useRef } from "react";
import { SearchIcon, TabIcon, HomeIcon, HeartIcon } from "./icons";
import { Chip } from "./Chip";
import { AboutModal } from "./AboutModal";
import { SignInPromptModal } from "./SignInPromptModal";
import { FilterRow } from "./FilterRow";
import { pillBase, tabPill } from "../styles";

// Saved shortcut for the top-right chrome cluster — a heart that matches the
// HomeIcon's white outline (Mark 2026-06-02). Sits between About and the auth
// circle, tight padding so the cluster reads as one unit; fills red on hover.
function SavedHeartLink({ onGo, onOlive }) {
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
    filterBrands, filterSources, filterModels,
    effectiveBrandsCount = 0, effectiveSourcesCount = 0, effectiveModelsCount = 0,
    listingsSubTab,
    allFiltered, displayedCount,
    hasFilters, hiddenItems,
    maxPriceText, minPriceText,
    filterHearted, search, signInPromptOpen, signInWithGoogle, sort,
    tab, user, visibleBrands, visibleSources, visibleModels,
    goToSaved,
    MODELS, MODELS_SHOW, modelsExpanded, setModelsExpanded,
    watchTopTab, watchlist,
    heartedGroupBy = "none", setHeartedGroupBy, heartedGroupDir = "desc", setHeartedGroupDir,
    savedHeaderJSX,
    // Setters / handlers
    handleWish, openFavPrompt, resetFilters,
    setAboutModalOpen, setActiveFilterPop, setBrandsExpanded,
    setMaxPriceText, setMinPriceText,
    setFilterHearted, setPage, setSearch, setSignInPromptOpen, setSort,
    setTab,
    toggleBrand, toggleHide, toggleSource, toggleModel,
    // Open the auction calendar modal (Phase 4) — replaces the old
    // Sale-picker pill on the auction surfaces.
    onOpenCalendar,
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
    saleContextHeaderJSX,
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

  // Collapsing header (Mark 2026-06-02): on the auction catalog AND the Saved
  // (hearted) surface the title scrolls away while the filter bar pins. We move
  // both INTO the scroll pane — title in normal flow (scrolls), filter in a
  // sticky wrapper (pins). Catalog title = saleContextHeaderJSX (its grid is
  // flat, no dividers); Saved title = savedHeaderJSX. Other surfaces keep the
  // filter in the fixed chrome above the pane (their date dividers stick
  // cleanly below it). On Saved the grouped quick-jump bar scrolls rather than
  // pinning, so it can't fight the sticky filter for top:0 (see HeartedView).
  const isSavedHearted = tab === "watchlist" && watchTopTab === "hearted";
  const collapsingHeader = (!anyShareActive && !searchAllActive)
    ? (saleContextHeaderJSX || (isSavedHearted ? savedHeaderJSX : null))
    : null;
  const useCollapse = !!collapsingHeader;

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
                  // PR 2026-05-22 (Mark spec): match the pill type
                  // system so search reads as part of the filter row,
                  // not a different control. radius 10 → 20.
                  borderRadius: 20,
                  padding: "4px 12px",
                  width: 320, minWidth: 0,
                  height: 30,
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
    const anyExpanded = expandedSource || expandedBrand || expandedModel;
    return (
    <>
    <FilterRow expanded={anyExpanded} paddingX={20} paddingY={6}>
      {/* Filter row reorder PR 2026-05-22 (Mark spec):
          LEFT — noun filters (Source / Brand / Sale / Model)
          MIDDLE — search anchor (the "more in the middle of the page" framing)
          RIGHT — numeric range + sort + saved (Min-Max / Date / Price / Saved)
          plus the count + Clear-all tail. */}

      {/* Auction calendar launcher (Phase 4) — far left, before the
          noun filters (Mark 2026-05-26). Styled as a filter pill (was a
          prominent brand-olive button; 2026-05-28 Mark wanted it sized
          consistent with the filter-line pills). Opens the calendar modal
          (the sale-picker); the active-sale state shows in the grid's
          sale-context header, with its own Clear there. Auction surfaces only. */}
      {/* The Calendar pill is interactive only on Auctions/Sold, but we
          render it on ALL listings sub-tabs so the left cluster keeps a
          CONSTANT width — otherwise the pill's appearance on Auctions/Sold
          widened the left side and shoved the centered search bar right,
          so search visibly jumped position when switching sub-tabs (Mark
          2026-05-28). On Live it's a hidden, inert placeholder that only
          reserves space (visibility:hidden, removed from a11y + tab order). */}
      {/* Calendar pill renders ONLY on Auctions/Sold now. The old
          visibility:hidden placeholder on Live reserved space and left a
          gap before Source so the row looked unfinished/misaligned (Mark
          2026-06-01) — alignment wins over the minor search-shift the
          placeholder was preventing. */}
      {tab === "listings" && (listingsSubTab === "auctions" || listingsSubTab === "sold") && !!onOpenCalendar && (() => {
        return (
          <button onClick={onOpenCalendar}
            title="Browse the auction calendar"
            style={{
              ...dtPill(false),
              display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
              whiteSpace: "nowrap",
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Calendar
          </button>
        );
      })()}
      {/* LEFT — Source / Brand / Model */}
      <button onClick={() => setActiveFilterPop(p => p === "source" ? null : "source")}
        style={dtPill(filterSources.length > 0 || activeFilterPop === "source")}>
        Source{filterSources.length > 0 ? ` · ${filterSources.length}` : ""}
      </button>
      <button onClick={() => setActiveFilterPop(p => p === "brand" ? null : "brand")}
        style={dtPill(filterBrands.length > 0 || activeFilterPop === "brand")}>
        Brand{filterBrands.length > 0 ? ` · ${filterBrands.length}` : ""}
      </button>
      {(MODELS?.length || 0) > 0 && (
        <button onClick={() => setActiveFilterPop(p => p === "model" ? null : "model")}
          style={dtPill((filterModels?.length || 0) > 0 || activeFilterPop === "model")}>
          Model{(filterModels?.length || 0) > 0 ? ` · ${filterModels.length}` : ""}
        </button>
      )}

      {/* MIDDLE — search bar. marginLeft:auto pulls it right of the
          left filters; the right-cluster's marginLeft:auto below
          balances it back into the middle. */}
      <div style={{ marginLeft: "auto" }}>
        {expandingSearchJSX}
      </div>

      {/* RIGHT — Min-Max price, Date sort, Price sort, Saved hearted,
          watchlist hearted-toggle (when applicable), count, Clear all. */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {watchHeartedToggleJSX && (
          <>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {watchHeartedToggleJSX}
            </div>
            <div aria-hidden style={{ width: 1, height: 18, background: "var(--border)", margin: "0 2px" }} />
          </>
        )}

        {/* Min/Max price — same compact pill height as the rest. */}
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

        {/* Date sort pill */}
        {(() => {
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

        {/* Price sort pill */}
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

        {/* Group-by pills — Saved surface only (Mark 2026-06-02). Arrange the
            hearted grid into Brand / Source sections ordered by group size; the
            arrow flips most-first ↔ least-first, exactly like the Date/Price
            sort pills. Replaces the old separate GROUP bar in HeartedView. */}
        {tab === "watchlist" && watchTopTab === "hearted" && ["brand", "source"].map((key) => {
          const active = heartedGroupBy === key;
          const labelBase = key === "brand" ? "Brand" : "Source";
          const text = active ? `${labelBase} ${heartedGroupDir === "asc" ? "↑" : "↓"}` : labelBase;
          return (
            <button key={key} onClick={() => {
              if (!active) { setHeartedGroupBy && setHeartedGroupBy(key); setHeartedGroupDir && setHeartedGroupDir("desc"); }
              else if (heartedGroupDir === "desc") setHeartedGroupDir && setHeartedGroupDir("asc");
              else setHeartedGroupBy && setHeartedGroupBy("none");
            }} style={{ ...pillBase(active, { compact: true }), fontWeight: active ? 600 : 500 }}>{text}</button>
          );
        })}

        {/* ♥ Saved-only filter pill */}
        {tab === "listings" && user && listingsSubTab !== "calendar" && (
          <button onClick={() => setFilterHearted && setFilterHearted(!filterHearted)}
            aria-pressed={!!filterHearted}
            title={filterHearted ? "Show all" : "Show only saved"}
            style={{
              // Active state now comes straight from pillBase (olive
              // tinted-fill) — no blue override. Heart svg stays red below.
              ...pillBase(!!filterHearted, { compact: true, surface: true }),
              display: "flex", alignItems: "center", gap: 5,
            }}>
            <svg width="11" height="11" viewBox="0 0 24 24"
              fill={filterHearted ? "var(--danger)" : "none"}
              stroke="var(--danger)"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Saved
          </button>
        )}
        {/* Count tail at the end of the right cluster. The single
            "Clear all" now lives in the active-filters strip next to the
            chips (Mark 2026-05-28) — removed the redundant filter-bar copy. */}
        <span style={{
          flexShrink: 0,
          fontSize: 12, color: "var(--text3)", fontFamily: "inherit",
          whiteSpace: "nowrap", padding: "0 6px",
        }}>
          {(displayedCount || 0).toLocaleString()} {displayedCount === 1 ? "watch" : "watches"}
        </span>
      </div>
    </FilterRow>
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
              {/* Sub-headers (Dealers / Auction houses) removed 2026-05-26
                  (Mark): they made the Source panel a different height than
                  the headerless Brand panel. Chips only now. */}
              {showDealerSources && visDealers.map(s => (
                <Chip key={s} label={s} active={filterSources.includes(s)} onClick={() => toggleSource(s)} />
              ))}
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
      </div>
    )}
    </>
    );
  })();

  return (
    <div style={{ ...baseStyle, position: "relative", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
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
        // Olive chrome must OR-in the receive flags, not gate on tab!=="home" alone: onOlive = tab!=="home" || anyShareActive || searchAllActive. Share/search-all surfaces leave tab unchanged.
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
        <div style={{ display: "flex", alignItems: "center", gap: 10,
                      padding: minimalTopBar ? "6px 20px" : "10px 20px",
                      // No border on Home — keeps the top of the
                      // page clean (no visible bar above the hero).
                      borderBottom: onOlive ? "none" : (minimalTopBar ? "none" : "0.5px solid var(--border)"),
                      background: onOlive ? "var(--brand-olive)" : "transparent",
                      // Home: float the bar (just About + M, top-right) as an
                      // absolute OVERLAY so it doesn't consume vertical space —
                      // the content pane + moonphase then start at the very top
                      // and the moon is no longer clipped behind the bar
                      // (Mark 2026-05-28). Centered hero vs right-aligned pill
                      // = no collision. z above the hero so the pill stays
                      // clickable over the white hero area.
                      ...(minimalTopBar
                        ? { position: "absolute", top: 0, right: 0, zIndex: 40 }
                        : { flexShrink: 0 }),
                    }}>
        {/* Top wordmark hidden on Home (editorial hero in body is the
            brand mark there) AND on the minimal Home top bar. */}
        {onOlive && !minimalTopBar && (
          <button onClick={() => { setTab("home"); setPage(1); }}
            aria-label="Home" title="Home"
            style={{ background: "none", border: "none", cursor: "pointer",
                    padding: 0, paddingLeft: "0.16em", fontFamily: "inherit",
                    fontSize: 24, fontWeight: 700, letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#ffffff", flexShrink: 0,
                    // Home icon (Mark 2026-05-28): a real user didn't realise
                    // the wordmark was the home button — the leading house
                    // outline makes it read as one. Inherits currentColor
                    // (white on the olive bar).
                    display: "inline-flex", alignItems: "center", gap: 9 }}>
            <HomeIcon size={20} />
            <span>Watchlist</span>
          </button>
        )}
        {/* Tabs cluster — hidden on minimal Home top bar (tabs live
            in the masthead band under the hero on Home). */}
        {!minimalTopBar && (
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexShrink: 0, marginLeft: 8 }}>
          {[["listings", "Watches"], ["watchlist", "Lists"], ["references", "Collecting"]].map(([key, label]) => {
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
        {/* Heart link to Saved — matches the HomeIcon white outline, sits
            between About and the auth circle, fills red on hover (Mark
            2026-06-02). Signed-in only. */}
        {user && goToSaved && (
          <SavedHeartLink onGo={goToSaved} onOlive={onOlive} />
        )}
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
      {/* Catalog + Saved headers + their filter bar moved INTO the scroll pane
          (Mark 2026-06-02) so the title scrolls away and the filter pins — see
          the useCollapse block inside data-desktop-main below. On other surfaces
          the filter bar still renders here, in the fixed chrome above the pane. */}
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
        // On a collapsing-header surface (catalog / Saved) the filter bar
        // renders INSIDE the pane (sticky, below the scrolling title) — see the
        // useCollapse block below.
        if (useCollapse) return null;
        const showFullFilterRow =
          (tab === "listings" && showListingsFilterRow) ||
          inListsDrillIn ||
          // Lists tab: the filter row belongs to the Hearted surface only
          // (2026-06-01). Lists / Searches / Shared are not filterable grids.
          (tab === "watchlist" && watchTopTab === "hearted");
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
          // Top padding is 0 on ALL tabs (B-11, 2026-05-24). A sticky
          // child inside a scroll pane with top padding sticks BELOW
          // that padding, so the padding becomes a transparent strip
          // where content scrolls through (the long-recurring
          // "see-through" gap above the DateDivider on Listings and
          // above the olive band on Home). Watchlist/Collecting were
          // already 0 and never showed the gap — proof of cause.
          // Zeroing it everywhere removes the gap at the root (not a
          // mask) and makes every desktop tab consistent. Breathing
          // room now comes from the sticky element's own padding
          // (DateDivider, masthead band), which scrolls flush under
          // the chrome instead of leaving a hole.
          padding: `0 20px 32px`,
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
              {/* Collapsing header (Mark 2026-06-02): the title scrolls away in
                  normal flow; the filter bar pins via a sticky wrapper at the
                  top of the pane. Both bleed edge-to-edge (negative margins
                  cancel the pane's 20px padding, mirroring EditorialView's
                  sticky filter). Catalog grids are flat; on Saved the quick-jump
                  bar scrolls (HeartedView) so nothing fights top:0. */}
              {useCollapse && (
                <>
                  <div style={{ marginLeft: -20, marginRight: -20 }}>{collapsingHeader}</div>
                  <div style={{
                    position: "sticky", top: 0, zIndex: 15,
                    background: "var(--bg)",
                    marginLeft: -20, marginRight: -20,
                    paddingLeft: 20, paddingRight: 20,
                  }}>
                    {filterRowJSX}
                  </div>
                </>
              )}
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
