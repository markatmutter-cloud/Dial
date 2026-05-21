import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { pillBase, inputBase } from "../styles";
import { Chip } from "./Chip";
import { shortHash } from "../utils";
import { HeartIcon } from "./icons";

// Map an editorial article record into the listing-shaped item that
// useWatchlist / watchlist_items expects. The `kind: 'article'`
// marker on the snapshot is what downstream surfaces (Watchlists
// Saved sub-tabs, the Saved-articles virtual row, future sold-state
// inference) branch on. Listing-style toggling reuses the existing
// `toggleWatchlist` path so we don't fork the heart primitive.
function articleAsListing(article) {
  if (!article || !article.url) return null;
  const sourceMeta = article._source || {};
  return {
    id: shortHash(article.url),
    url: article.url,
    img: article.image || null,
    ref: article.title || "",
    title: article.title || "",
    brand: article.brand || "",
    model: article.model || null,
    model_line: article.model_line || null,
    reference_no: article.reference_no || null,
    // kind marker — downstream code uses this to discriminate
    // article entries from real listings in shared watchlist_items.
    kind: "article",
    article: {
      author: article.author || "",
      published_at: article.published_at || "",
      excerpt: article.excerpt || "",
      source_key: sourceMeta.key || article.source || "",
      source_label: sourceMeta.label || sourceMeta.publication || "",
    },
    // Suppress the sold/active flow — articles never go sold.
    sold: false,
    price: null,
    currency: null,
  };
}

// Editorial sub-tab — v0 (2026-05-18). Surfaces the saved editorial
// corpus (Hairspring Finds + Hodinkee Bring a Loupe today; more sources
// land here as their scrapers ship). Cards are READ-ONLY links out to
// the original article — we never re-host content, only surface our
// own metadata + an excerpt to drive discovery to the publisher.
//
// Filter row deliberately mirrors the Listings / Watchlists shape
// (Mark spec 2026-05-18): single horizontal pill strip with Date sort
// toggle + Source pill + Brand pill, inline-expansion panels below the
// strip for the chip cluster, article count right-aligned, "× Clear
// all" link when any filter fires. Search lives above the strip as
// its own input (Listings uses the global top-bar search; Editorial
// needs its own field for body-text matching that's distinct from
// listing search).
//
// Phase 2 will add `tags` / `audience` / `references_mentioned` /
// `dates_referenced` to each record via the editorial_index.py
// enrichment script. The component already reads from those fields
// when present — chips for them are simply not rendered until the
// fields exist on the records. So a v1 upgrade is additive (new chip
// groups in the filter rail), not a rewrite.
//
// New sources plug in via a one-line addition to the SOURCES array
// once their JSON lands in public/.

// Per-source manifest. `url` is the metadata file (title / author /
// date / image / brand / etc.) — loaded eagerly on sub-tab open.
// `bodies_url` is the {url: body_text} map — loaded lazily on the
// first search keystroke so the initial render isn't blocked by
// ~14 MB of prose the user may never search.
const SOURCES = [
  {
    key: "hairspring_finds",
    label: "Hairspring Finds",
    publication: "Hairspring",
    column: "Finds",
    url: "/hairspring_finds.json",
    bodies_url: "/hairspring_finds_bodies.json",
  },
  {
    key: "hodinkee_bring_a_loupe",
    label: "Bring a Loupe",
    publication: "Hodinkee",
    column: "Bring a Loupe",
    url: "/bring_a_loupe.json",
    bodies_url: "/bring_a_loupe_bodies.json",
  },
  {
    key: "rolex_magazine",
    label: "Rolex Magazine",
    publication: "Rolex Magazine",
    column: null,
    url: "/rolex_magazine.json",
    bodies_url: "/rolex_magazine_bodies.json",
  },
  {
    key: "onthedash",
    label: "On The Dash",
    publication: "On The Dash",
    column: null,
    url: "/onthedash.json",
    bodies_url: "/onthedash_bodies.json",
  },
  {
    key: "bulang_watch_talks",
    label: "Bulang & Sons Watch Talks",
    publication: "Bulang & Sons",
    column: "Watch Talks",
    url: "/bulang_watch_talks.json",
    bodies_url: "/bulang_watch_talks_bodies.json",
  },
  // Hodinkee Shop deliberately NOT surfaced as an Editorial source
  // (Mark spec 2026-05-19: watch-listings don't belong in the
  // editorial section). The corpus JSON still ships — App.js's
  // hodinkeeShopItems memo projects records into Listings > Sold
  // archive as a dealer source, and the scraped body_text remains
  // available for the future editorial_index.py recommender pass.
  {
    key: "hodinkee_reference_points",
    label: "Reference Points",
    publication: "Hodinkee",
    column: "Reference Points",
    url: "/hodinkee_reference_points.json",
    bodies_url: "/hodinkee_reference_points_bodies.json",
  },
  {
    key: "acollectedman_journal",
    label: "A Collected Man",
    publication: "A Collected Man",
    column: "Journal",
    url: "/acollectedman_journal.json",
    bodies_url: "/acollectedman_journal_bodies.json",
  },
  {
    key: "woe_dispatch",
    label: "WOE Dispatch",
    publication: "Watches of Espionage",
    column: "Dispatch",
    url: "/woe_dispatch.json",
    bodies_url: "/woe_dispatch_bodies.json",
  },
  {
    key: "screwdowncrown",
    label: "Screw Down Crown",
    publication: "Screw Down Crown",
    column: null,
    url: "/screwdowncrown.json",
    bodies_url: "/screwdowncrown_bodies.json",
    // Subscription publication on Substack. We surface only the
    // publicly-accessible posts (audience='everyone') here — paid
    // content stays out of the public corpus. `subscribe_url`
    // amplifies the publisher; consumers can render a "Subscribe to
    // <publication>" CTA when this source is filtered on.
    publication_url: "https://www.screwdowncrown.com/",
    subscribe_url: "https://www.screwdowncrown.com/subscribe",
  },
  {
    key: "fratello",
    label: "Fratello Watches",
    publication: "Fratello",
    column: null,
    url: "/fratello.json",
    bodies_url: "/fratello_bodies.json",
    // Scrape is brand-allowlist-filtered at ingestion time (Mark spec
    // 2026-05-20). The corpus here is the watch-taste subset of
    // Fratello's full output, not the whole publication — covering
    // Rolex / Omega / TAG / IWC / Casio (G-Shock) / Lange / Longines
    // / Zenith / Breitling, plus the TBT (Throwback Thursday) vintage
    // series and a small collector-philosophy keyword fallback. AP /
    // Hublot / Seiko / sub-$500 / microbrand / gift-guide content is
    // explicitly excluded.
    publication_url: "https://www.fratellowatches.com/",
  },
];

const BRAND_TOP_N = 24;       // Show top N brands in expansion panel; "+more" expander reveals the rest
const RESULTS_PAGE_SIZE = 48; // Denser scroll (Mark spec 2026-05-20 — "24 wasn't enough to scroll through"). Bumped 24→48.
const FEATURED_COUNT = 8;     // Most-recent articles surfaced in the hero strip (visible only when no search / no filters active).

export function EditorialView({ isMobile, cols, compact, gridStyle, watchlist, handleWish, openCollectionPicker, handleShare }) {
  // cols / compact / gridStyle come from App.js's useViewSettings — the
  // same grid sizing the Listings tab uses. ArticleCard adapts its
  // typography + excerpt density to `compact` so a 7-col packed grid
  // still reads cleanly.
  const effectiveCols = cols || (isMobile ? 1 : 3);
  const articleGridStyle = gridStyle || {
    display: "grid",
    gridTemplateColumns: `repeat(${effectiveCols}, minmax(0, 1fr))`,
    gap: 12,
  };

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [articles, setArticles] = useState([]);

  // Bodies map (url → body_text). Loaded LAZILY — first user
  // keystroke in the search box triggers the fetch. Until then the
  // search box still works on title + author; body match kicks in
  // once the bodies arrive.
  const [bodies, setBodies] = useState(null); // null = not requested yet
  const [bodiesLoading, setBodiesLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [activeSources, setActiveSources] = useState([]); // [] = all
  const [activeBrands, setActiveBrands] = useState([]);    // [] = all
  // Hearted-only filter (PR_P, 2026-05-20). Mirrors the Listings
  // Hearted toggle. Off by default; tap to scope the visible set
  // to just articles the current user has hearted.
  const [heartedOnly, setHeartedOnly] = useState(false);
  // Sort modes (2026-05-20): "relevance" (only meaningful when a
  // query is present; falls back to date_desc when empty),
  // "date_desc", "date_asc". Cycles through Relevance → Date ↓ →
  // Date ↑ → Relevance when a query is typed; cycles between just
  // Date ↓ and Date ↑ otherwise.
  const [sort, setSort] = useState("date_desc");
  // Inline-expansion popover state — same shape as Listings filter row.
  // null | "source" | "brand". Tapping the active pill closes it; tapping
  // a different pill switches.
  const [activeFilterPop, setActiveFilterPop] = useState(null);
  const [brandsExpanded, setBrandsExpanded] = useState(false);
  const [collapsedYears, setCollapsedYears] = useState({});
  const [pageSize, setPageSize] = useState(RESULTS_PAGE_SIZE);

  // Eager fetch of metadata only on first mount — small (~5 MB total
  // across all sources) so this lands well inside a second on broadband.
  // The bigger bodies files defer until the user actually searches.
  useEffect(() => {
    let alive = true;
    const fetchOpts = { cache: "no-cache" };
    Promise.all(SOURCES.map(s =>
      fetch(s.url, fetchOpts)
        .then(r => r.ok ? r.json() : {})
        .catch(() => ({}))
    )).then(results => {
      if (!alive) return;
      const flat = [];
      results.forEach((data, i) => {
        const source = SOURCES[i];
        Object.values(data || {}).forEach(rec => {
          if (rec && rec.url && rec.title) {
            flat.push({ ...rec, _source: source });
          }
        });
      });
      setArticles(flat);
      setLoading(false);
    }).catch(() => {
      if (alive) {
        setLoadError(true);
        setLoading(false);
      }
    });
    return () => { alive = false; };
  }, []);

  // Lazy bodies fetch — kicks off on the first search keystroke and
  // runs once per session. Title + author search works before bodies
  // arrive; body match enables silently as soon as the fetch lands.
  useEffect(() => {
    if (!search.trim()) return;
    if (bodies !== null || bodiesLoading) return;
    setBodiesLoading(true);
    const fetchOpts = { cache: "no-cache" };
    let alive = true;
    Promise.all(SOURCES.map(s =>
      fetch(s.bodies_url, fetchOpts)
        .then(r => r.ok ? r.json() : {})
        .catch(() => ({}))
    )).then(results => {
      if (!alive) return;
      const merged = {};
      results.forEach(data => {
        Object.entries(data || {}).forEach(([url, body]) => {
          if (body) merged[url] = body;
        });
      });
      setBodies(merged);
      setBodiesLoading(false);
    }).catch(() => {
      if (alive) {
        setBodies({});
        setBodiesLoading(false);
      }
    });
    return () => { alive = false; };
  }, [search, bodies, bodiesLoading]);

  // Source counts (for the expansion-panel chip count badges).
  const sourceCounts = useMemo(() => {
    const out = {};
    articles.forEach(a => { out[a._source.key] = (out[a._source.key] || 0) + 1; });
    return out;
  }, [articles]);

  // Brand list from the corpus, ordered by frequency.
  const brandOptions = useMemo(() => {
    const counts = {};
    articles.forEach(a => {
      const b = (a.brand || "").trim();
      if (b) counts[b] = (counts[b] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([brand, count]) => ({ brand, count }));
  }, [articles]);

  // Apply filters + sort. Free-text search hits title + author always;
  // body match enables silently once the lazy bodies fetch lands. Until
  // then a search like "Railmaster" matches whichever articles name the
  // term in their title — once bodies arrive the same query expands to
  // include every article whose prose mentions it, no re-type needed.
  //
  // Relevance scoring (when sort === "relevance" + non-empty query):
  // weighted hits across title (10x) / author (5x) / body (1x per
  // occurrence, capped at 10 per term) + small recency tiebreaker.
  // Exact-title and title-contains matches get bonus weight so the
  // hero result for a typed reference number lands at the top.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const queryTerms = q ? q.split(/\s+/).filter(t => t.length > 1) : [];
    const sourceSet = activeSources.length ? new Set(activeSources) : null;
    const brandSet  = activeBrands.length  ? new Set(activeBrands)  : null;
    let out = articles.filter(a => {
      if (sourceSet && !sourceSet.has(a._source.key)) return false;
      if (brandSet && !brandSet.has((a.brand || "").trim())) return false;
      if (heartedOnly) {
        const id = shortHash(a.url);
        if (!watchlist || !watchlist[id]) return false;
      }
      if (q) {
        const body = bodies ? (bodies[a.url] || "") : "";
        const hay =
          ((a.title || "") + " " + body + " " + (a.author || "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const effectiveSort = (sort === "relevance" && !q) ? "date_desc" : sort;

    if (effectiveSort === "relevance") {
      const scored = out.map(a => {
        const title  = (a.title  || "").toLowerCase();
        const author = (a.author || "").toLowerCase();
        const body   = bodies ? ((bodies[a.url] || "")).toLowerCase() : "";
        let score = 0;
        if (title === q) score += 100;
        if (title.includes(q)) score += 50;
        if (author.includes(q)) score += 8;
        for (const w of queryTerms) {
          if (title.includes(w)) score += 10;
          if (author.includes(w)) score += 4;
          if (body) {
            // Count occurrences via split — faster + safer than regex
            // for short query terms with potential special chars (e.g.
            // "6263" or "wgch0007").
            const occ = body.split(w).length - 1;
            score += Math.min(10, occ);
          }
        }
        // Tiny recency boost so two equally-scored articles land
        // newest-first; uses date as a string-comparable proxy.
        const dateProxy = (a.published_at || "0000-00-00");
        return { a, score, dateProxy };
      });
      scored.sort((x, y) => y.score - x.score || y.dateProxy.localeCompare(x.dateProxy));
      out = scored.map(s => s.a);
    } else if (effectiveSort === "date_desc") {
      out.sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""));
    } else if (effectiveSort === "date_asc") {
      out.sort((a, b) => (a.published_at || "").localeCompare(b.published_at || ""));
    }
    return out;
  }, [articles, bodies, search, activeSources, activeBrands, sort, heartedOnly, watchlist]);

  // Lazy page-size reset whenever filters or sort change.
  useEffect(() => {
    setPageSize(RESULTS_PAGE_SIZE);
  }, [search, activeSources, activeBrands, sort, heartedOnly]);

  // hasFilters has to be defined BEFORE the featured memo references
  // it — useMemo callbacks run synchronously on first render, so a
  // forward reference to a const declared further down hits the TDZ.
  const hasFilters =
    !!search.trim() || activeSources.length > 0 || activeBrands.length > 0 || heartedOnly;

  // Featured strip — shown only when no search / filter is active.
  // Top N most-recent articles regardless of which source they came
  // from. When filters fire, the user has an intent and the featured
  // strip would just be visual noise above their results.
  const showFeatured = !hasFilters;
  const featured = useMemo(() => {
    if (!showFeatured) return [];
    return [...articles]
      .sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""))
      .slice(0, FEATURED_COUNT);
  }, [articles, showFeatured]);

  // When the featured strip is showing, exclude those URLs from the
  // dense scroll below — otherwise the newest articles appear twice
  // (once large in the featured strip, once dense in the grid below).
  const featuredUrls = useMemo(() => new Set(featured.map(a => a.url)), [featured]);
  const visible = useMemo(() => {
    const list = showFeatured
      ? filtered.filter(a => !featuredUrls.has(a.url))
      : filtered;
    return list.slice(0, pageSize);
  }, [filtered, pageSize, showFeatured, featuredUrls]);

  // Group visible items by year.
  const groups = useMemo(() => {
    const buckets = {};
    visible.forEach(a => {
      const y = (a.published_at || "").slice(0, 4) || "Undated";
      (buckets[y] = buckets[y] || []).push(a);
    });
    const years = Object.keys(buckets).sort((a, b) =>
      sort === "date_desc" ? b.localeCompare(a) : a.localeCompare(b));
    return years.map(y => ({ label: y, items: buckets[y] }));
  }, [visible, sort]);

  const toggleSource = (key) => {
    setActiveSources(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const toggleBrand = (brand) => {
    setActiveBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };
  const toggleYearCollapse = (label) => {
    setCollapsedYears(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const clearAll = () => {
    setSearch("");
    setActiveSources([]);
    setActiveBrands([]);
    setHeartedOnly(false);
    setActiveFilterPop(null);
  };

  // Sort cycle behavior:
  //   - With a query: Relevance → Date ↓ → Date ↑ → Relevance
  //   - Without a query: Date ↓ → Date ↑ → Date ↓ (Relevance hidden,
  //     the option only makes sense when there's something to score)
  // If the user types a query while on Date sort, we DON'T jump them
  // to Relevance — they chose the date axis explicitly. But if they
  // clear the query while on Relevance, the memo falls back to
  // date_desc rendering transparently (so the pill keeps showing
  // "Relevance" but the actual order is date_desc).
  const hasQuery = !!search.trim();
  const cycleSort = () => {
    setSort(s => {
      if (hasQuery) {
        if (s === "relevance") return "date_desc";
        if (s === "date_desc") return "date_asc";
        return "relevance";
      }
      return s === "date_desc" ? "date_asc" : "date_desc";
    });
  };
  const sortLabel = sort === "relevance" ? (hasQuery ? "Relevance" : "Date ↓")
                  : sort === "date_desc" ? "Date ↓"
                  : sort === "date_asc"  ? "Date ↑"
                  : "Date";

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div style={{ paddingTop: 4 }}>
        <div style={{ padding: 24, color: "var(--text2)", textAlign: "center" }}>
          Couldn't load the editorial corpus. Refresh to try again.
        </div>
      </div>
    );
  }

  const expanded = activeFilterPop !== null;
  // Filter chrome background. Reverted from the prior brand-tint
  // (Mark spec 2026-05-21, with Hodinkee Featured Videos reference):
  // the tinted strip read as "this is a different surface" but the
  // editorial-section signal now comes from the dark Featured block
  // below — letting the filter bar return to standard chrome
  // matches the rest of the app's surfaces while still keeping
  // Editorial visually distinct.
  const filterBandBg = "var(--bg)";
  const expansionPanelStyle = {
    padding: "10px 20px 24px",
    borderBottom: "0.5px solid var(--border)",
    background: "var(--bg)",
    display: "flex", flexWrap: "wrap", gap: 8,
    alignItems: "flex-start",
    lineHeight: 1.5,
  };
  const chipClearLinkStyle = {
    fontSize: 12, padding: "4px 10px", borderRadius: 20,
    fontFamily: "inherit", whiteSpace: "nowrap",
    border: "none", outline: "none", cursor: "pointer",
    background: "transparent", color: "var(--brand)",
    boxShadow: "inset 0 0 0 0.5px var(--brand)",
    marginLeft: 4,
  };
  const stripPadding = isMobile ? "8px 14px" : "8px 20px";

  return (
    <div style={{ paddingTop: 4 }}>
      {/* Sticky filter chrome (Mark feedback 2026-05-21 — Editorial
          filter/search bar disappeared on scroll; Listings is fixed).
          Wraps search input + filter strip + expansion panels so the
          whole filter UI stays anchored as the card grid scrolls.
          z-index sits below ReferencesTab's subStrip (z=25) so when
          both are stuck they layer correctly (subStrip on top, filter
          below). `top: 40` matches the tabPill subStrip height — keeps
          the two sticky bands flush instead of overlapping. Brittle
          to subStrip height changes but the simplest fix that doesn't
          require lifting the filter chrome out of EditorialView. */}
      <div style={{
        position: "sticky", top: 40, zIndex: 20,
        background: "var(--bg)",
      }}>
      {/* Search row — own input. Listings uses the global top-bar
          search; Editorial needs its own field for body-text matching
          distinct from listing search. */}
      <div style={{
        padding: isMobile ? "10px 14px 0" : "10px 20px 0",
        background: filterBandBg,
      }}>
        <input
          type="search"
          placeholder="Search title, author, or body text…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputBase, width: "100%" }}
        />
      </div>

      {/* Filter strip — mirrors Listings filterRowJSX shape. Single
          horizontal row, pill toggles, inline-expansion panels below
          for source / brand chip clusters. */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: stripPadding,
        background: filterBandBg,
        borderBottom: expanded ? "none" : "0.5px solid var(--border)",
        flexShrink: 0, flexWrap: "wrap",
      }}>
        {/* Sort pill — cycles Date ↓ / Date ↑ when no query is typed,
            expands to Relevance / Date ↓ / Date ↑ when a query is active. */}
        <button
          onClick={cycleSort}
          style={{
            ...pillBase(true, { compact: true, surface: true }),
            fontWeight: 600,
          }}>{sortLabel}</button>

        {/* Source inline-expand pill */}
        <button
          onClick={() => setActiveFilterPop(p => p === "source" ? null : "source")}
          style={pillBase(activeSources.length > 0 || activeFilterPop === "source", { compact: true })}>
          Source{activeSources.length > 0 ? ` · ${activeSources.length}` : ""}
        </button>

        {/* Brand inline-expand pill */}
        <button
          onClick={() => setActiveFilterPop(p => p === "brand" ? null : "brand")}
          style={pillBase(activeBrands.length > 0 || activeFilterPop === "brand", { compact: true })}>
          Brand{activeBrands.length > 0 ? ` · ${activeBrands.length}` : ""}
        </button>

        {/* Hearted-only toggle (PR_P, 2026-05-20). Mirrors the Listings
            Hearted pill. Only meaningful when a user is signed in
            with at least one hearted article — disabled otherwise so
            taps on the empty state don't dead-end with "no results."  */}
        <button
          onClick={() => setHeartedOnly(v => !v)}
          aria-pressed={heartedOnly}
          title={heartedOnly ? "Showing hearted articles only" : "Filter to hearted articles"}
          style={pillBase(heartedOnly, { compact: true })}>
          ♥ Hearted
        </button>

        {/* Article count — right-aligned via marginLeft auto. */}
        <span style={{
          marginLeft: "auto", flexShrink: 0,
          fontSize: 12, color: "var(--text3)", fontFamily: "inherit",
          whiteSpace: "nowrap", padding: "0 6px",
        }}>
          {loading
            ? "Loading…"
            : `${filtered.length.toLocaleString()} ${filtered.length === 1 ? "article" : "articles"}`}
        </span>

        {/* × Clear all — same shape as Listings. */}
        {hasFilters && (
          <button onClick={clearAll} style={{
            fontSize: 13, padding: "6px 12px", borderRadius: 20, cursor: "pointer",
            fontFamily: "inherit", whiteSpace: "nowrap",
            border: "none", outline: "none",
            background: "transparent", color: "var(--brand)",
            boxShadow: "inset 0 0 0 0.5px var(--brand)",
          }}>× Clear all</button>
        )}
      </div>

      {/* Source expansion panel */}
      {activeFilterPop === "source" && (
        <div style={expansionPanelStyle}>
          {SOURCES.map(s => (
            <Chip key={s.key}
              label={s.label}
              count={sourceCounts[s.key] || 0}
              active={activeSources.includes(s.key)}
              onClick={() => toggleSource(s.key)} />
          ))}
          {activeSources.length > 0 && (
            <button onClick={() => setActiveSources([])} style={chipClearLinkStyle}>× Clear</button>
          )}
        </div>
      )}

      {/* Brand expansion panel */}
      {activeFilterPop === "brand" && (
        <div style={expansionPanelStyle}>
          {brandOptions.length === 0 ? (
            <span style={{ fontSize: 12, color: "var(--text3)" }}>No brands yet.</span>
          ) : (
            <>
              {(brandsExpanded ? brandOptions : brandOptions.slice(0, BRAND_TOP_N)).map(b => (
                <Chip key={b.brand}
                  label={b.brand}
                  count={b.count}
                  active={activeBrands.includes(b.brand)}
                  onClick={() => toggleBrand(b.brand)} />
              ))}
              {brandOptions.length > BRAND_TOP_N && (
                <Chip
                  label={brandsExpanded ? "Less ↑" : `+${brandOptions.length - BRAND_TOP_N} more`}
                  active={false}
                  blue
                  onClick={() => setBrandsExpanded(v => !v)} />
              )}
              {activeBrands.length > 0 && (
                <button onClick={() => setActiveBrands([])} style={chipClearLinkStyle}>× Clear</button>
              )}
            </>
          )}
        </div>
      )}
      </div>{/* /sticky filter chrome */}

      {/* Featured strip — top N most-recent articles, shown only when
          no filter / no search is active. Horizontal scroll on mobile,
          multi-col grid on desktop. Visually distinct via a DARK
          COLOR BLOCK background (Mark spec 2026-05-21, ref Hodinkee
          Featured Videos pattern): the block signals "this is the
          editorial section" without the filter bar needing brand-tint
          chrome above. Negative horizontal margins extend the block
          edge-to-edge across the scroll container's padding so it
          reads as a full-width band, not a card sitting inside
          padding. */}
      {showFeatured && featured.length > 0 && (
        <div style={{
          background: "var(--text1)",
          color: "var(--bg)",
          padding: isMobile ? "20px 14px 24px" : "28px 20px 28px",
          marginLeft: isMobile ? -14 : -20,
          marginRight: isMobile ? -14 : -20,
          marginBottom: 16,
        }}>
          <div style={{
            display: "flex", alignItems: "baseline", gap: 8,
            marginBottom: 14,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "var(--bg)",
              opacity: 0.85,
            }}>Featured</div>
            <div style={{ fontSize: 12, color: "var(--bg)", opacity: 0.55 }}>
              · most recent
            </div>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "repeat(2, minmax(0, 1fr))"
              : `repeat(${Math.min(4, FEATURED_COUNT)}, minmax(0, 1fr))`,
            gap: isMobile ? 10 : 12,
          }}>
            {featured.map(a => (
              <ArticleCard
                key={"featured-" + a.url}
                article={a}
                isMobile={isMobile}
                compact={false}
                cols={isMobile ? 2 : 4}
                watchlist={watchlist}
                handleWish={handleWish}
                openCollectionPicker={openCollectionPicker}
                handleShare={handleShare}
              />
            ))}
          </div>
        </div>
      )}

      {/* Card grid grouped by year */}
      <div style={{ padding: isMobile ? "0 14px 110px" : "0 20px 110px" }}>
        {!loading && filtered.length === 0 && (
          <div style={{
            padding: 32, color: "var(--text2)", textAlign: "center",
            border: "0.5px dashed var(--border)", borderRadius: 8,
            marginTop: 16,
          }}>
            No articles match your filters.
          </div>
        )}

        {groups.map((group, gi) => {
          const collapsed = !!collapsedYears[group.label];
          return (
            <div key={group.label + gi} style={{ marginBottom: 12 }}>
              <button
                onClick={() => toggleYearCollapse(group.label)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "transparent", border: "none",
                  padding: "12px 0 8px", margin: 0,
                  fontSize: 13, fontWeight: 600, color: "var(--text2)",
                  cursor: "pointer", fontFamily: "inherit",
                  borderBottom: "0.5px solid var(--border)",
                  width: "100%", textAlign: "left",
                }}>
                <span style={{
                  display: "inline-block", width: 12,
                  transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
                  transition: "transform 120ms",
                }}>▾</span>
                {group.label} <span style={{ fontWeight: 400, color: "var(--text3)" }}>· {group.items.length}</span>
              </button>
              {!collapsed && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ ...articleGridStyle, borderRadius: 8, overflow: "hidden" }}>
                    {group.items.map(a => (
                      <ArticleCard
                        key={a.url}
                        article={a}
                        isMobile={isMobile}
                        compact={!!compact}
                        cols={effectiveCols}
                        watchlist={watchlist}
                        handleWish={handleWish}
                        openCollectionPicker={openCollectionPicker}
                        handleShare={handleShare}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Load more — only when there's more in the filtered set */}
        {!loading && pageSize < filtered.length && (
          <div style={{ textAlign: "center", padding: "16px 0 24px" }}>
            <button
              onClick={() => setPageSize(s => s + RESULTS_PAGE_SIZE)}
              style={{
                padding: "10px 20px",
                borderRadius: 6,
                border: "0.5px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text2)",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
              }}>
              Show {Math.min(RESULTS_PAGE_SIZE, filtered.length - pageSize)} more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ArticleCard — slim variant of the Card pattern for editorial.
// No price, no heart, no dealer link. Just image + title + meta +
// excerpt + click-out behaviour.
// ─────────────────────────────────────────────────────────────────

export function ArticleCard({ article, isMobile, compact, cols, watchlist, handleWish, openCollectionPicker, handleShare }) {
  const dateStr = formatDate(article.published_at);
  const sourceLabel = article._source.label;
  // Heart state — match the dealer-listing Card's behavior so the
  // primitive feels identical on both surfaces.
  const articleId = shortHash(article.url);
  const wished = !!(watchlist && watchlist[articleId]);
  const onHeartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!handleWish) return;
    const asListing = articleAsListing(article);
    if (asListing) handleWish(asListing);
  };

  // "..." menu state (PR_R, 2026-05-20). Same portal-to-document.body
  // pattern as Card.js so longer labels (Add to list…) don't get
  // clipped by the card's overflow:hidden root. Click-outside +
  // Escape close.
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const [shareFeedback, setShareFeedback] = useState("");
  const triggerRef = useRef(null);
  const portalRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => {
      const inTrigger = triggerRef.current && triggerRef.current.contains(e.target);
      const inPortal  = portalRef.current && portalRef.current.contains(e.target);
      if (!inTrigger && !inPortal) setMenuOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    const t = setTimeout(() => {
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);
  const onMenuClick = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!menuOpen && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setMenuPos({ top: r.bottom + 4, right: Math.max(8, window.innerWidth - r.right) });
    }
    setMenuOpen(o => !o);
  };
  const onAddToList = (e) => {
    e.preventDefault(); e.stopPropagation();
    setMenuOpen(false);
    if (!openCollectionPicker) return;
    const asListing = articleAsListing(article);
    if (asListing) openCollectionPicker(asListing);
  };
  const onShareClick = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!handleShare) { setMenuOpen(false); return; }
    let result;
    try {
      result = await handleShare({
        // handleShare reads either an item (has .url) or a string URL.
        // Articles fit the item-shape contract via their url field.
        url: article.url,
        ref: article.title,
        title: article.title,
        brand: article.brand,
      });
    } catch (err) { console.warn("share failed", err); result = null; }
    if (result?.copied) {
      setShareFeedback("Copied!");
      setTimeout(() => { setShareFeedback(""); setMenuOpen(false); }, 1200);
    } else {
      setMenuOpen(false);
    }
  };
  const showMenu = !!(openCollectionPicker || handleShare);
  // Density scaling — at high col counts (5-7), shrink typography and
  // drop the excerpt entirely so the card stays readable inside a
  // narrow tile. The `compact` flag from useViewSettings fires
  // automatically at cols >= 4.
  const dense = compact || (cols && cols >= 5);
  const veryDense = cols && cols >= 6;
  const excerptLineClamp = veryDense ? 0 : (dense ? 2 : 3);
  const excerptChars = veryDense ? 0 : (dense ? 140 : 220);
  // `excerpt` lives on the meta record (computed at scrape time by
  // editorial_corpus_io.write_split). Truncate to the density-aware
  // char target; the field is already short (~240 chars) so this is
  // a no-op for the default card and a clean clip on dense layouts.
  const excerpt = excerptChars > 0
    ? (article.excerpt || "").slice(0, excerptChars).trim()
    : "";
  const titleFontSize = veryDense ? 12 : (dense ? 13 : 15);
  const metaFontSize = veryDense ? 9 : (dense ? 10 : 11);
  const padding = dense ? "8px 10px 10px" : "12px 14px 14px";

  return (
    <div style={{ position: "relative", height: "100%" }}>
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
        background: "var(--surface)",
        border: "0.5px solid var(--border)",
        borderRadius: dense ? 6 : 8,
        overflow: "hidden",
        cursor: "pointer",
        height: "100%",
      }}>
      {article.image && (
        <div style={{
          width: "100%",
          aspectRatio: veryDense ? "1 / 1" : "16 / 10",
          background: "var(--bg)",
          overflow: "hidden",
        }}>
          <img
            src={article.image}
            alt=""
            loading="lazy"
            decoding="async"
            style={{
              width: "100%", height: "100%",
              objectFit: "cover", display: "block",
            }}
          />
        </div>
      )}
      <div style={{
        padding,
        display: "flex", flexDirection: "column", gap: dense ? 4 : 6, flex: 1,
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", gap: 8,
          fontSize: metaFontSize, color: "var(--text3)",
          textTransform: "uppercase", letterSpacing: 0.4,
        }}>
          <span style={{
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{sourceLabel}</span>
          <span style={{ flexShrink: 0 }}>{dateStr}</span>
        </div>
        <div style={{
          fontSize: titleFontSize, fontWeight: 600, lineHeight: 1.3,
          color: "var(--text1)",
          display: "-webkit-box",
          WebkitLineClamp: veryDense ? 3 : (dense ? 3 : 4),
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>{article.title}</div>
        {article.author && !veryDense && (
          <div style={{ fontSize: dense ? 11 : 12, color: "var(--text2)" }}>
            {article.author}
          </div>
        )}
        {excerpt && excerptLineClamp > 0 && (
          <div style={{
            fontSize: dense ? 11 : 12, color: "var(--text2)", lineHeight: 1.45,
            display: "-webkit-box",
            WebkitLineClamp: excerptLineClamp,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>{excerpt}…</div>
        )}
        {article.brand && !veryDense && (
          <div style={{
            marginTop: dense ? 2 : 4,
            fontSize: dense ? 10 : 11,
            color: "var(--text3)",
          }}>
            {article.brand}
          </div>
        )}
      </div>
    </a>
    {/* Heart + "..." action stack (PR_P + PR_R, 2026-05-20). Mirrors
        the Card actions on dealer listings — same shape, same colors,
        same size logic. preventDefault + stopPropagation so taps
        don't escape to the wrapping <a>. The "..." menu portals to
        document.body so longer labels (Add to list…) don't get
        clipped by the card root's overflow:hidden. */}
    {(handleWish || showMenu) && (
      <div style={{
        position: "absolute", top: 6, right: 6,
        display: "flex", flexDirection: "column", gap: 6, zIndex: 2,
      }}>
        {handleWish && (
          <button
            onClick={onHeartClick}
            aria-label={wished ? "Remove from saved articles" : "Save article"}
            title={wished ? "Saved — tap to remove" : "Save to articles"}
            style={{
              width: dense ? 26 : 32, height: dense ? 26 : 32,
              borderRadius: "50%", border: "none", cursor: "pointer",
              background: wished ? "rgba(220,38,38,0.88)" : "rgba(0,0,0,0.32)",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 0,
            }}>
            <HeartIcon filled={wished} size={dense ? 12 : 16} />
          </button>
        )}
        {showMenu && (
          <button
            ref={triggerRef}
            onClick={onMenuClick}
            aria-label="More actions"
            style={{
              width: dense ? 26 : 32, height: dense ? 26 : 32,
              borderRadius: "50%", border: "none", cursor: "pointer",
              background: menuOpen ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.32)",
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 0, fontFamily: "inherit",
              fontSize: dense ? 14 : 18, lineHeight: 1,
            }}>
            ⋯
          </button>
        )}
      </div>
    )}
    {menuOpen && menuPos && showMenu && createPortal(
      <div ref={portalRef} onClick={e => e.preventDefault()}
        style={{
          position: "fixed",
          top: menuPos.top, right: menuPos.right,
          zIndex: 1000,
          maxWidth: `calc(100vw - ${menuPos.right + 16}px)`,
          background: "var(--bg)", border: "0.5px solid var(--border)",
          borderRadius: 8, padding: 4,
          whiteSpace: "nowrap",
          boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        }}>
        {handleShare && (
          <button onClick={onShareClick} style={articleMenuItemStyle}>
            {shareFeedback || "Share"}
          </button>
        )}
        {openCollectionPicker && (
          <button onClick={onAddToList} style={articleMenuItemStyle}>
            Add to list…
          </button>
        )}
      </div>,
      document.body
    )}
    </div>
  );
}

// Menu-item style — slim, same shape as Card.js's menuItemStyle but
// kept local to this file so EditorialView doesn't depend on a
// non-exported style constant from Card.
const articleMenuItemStyle = {
  display: "block", width: "100%",
  padding: "8px 12px",
  background: "transparent", border: "none", cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit", fontSize: 13,
  color: "var(--text1)",
  borderRadius: 6,
};

function formatDate(iso) {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}, ${m[1]}`;
}
