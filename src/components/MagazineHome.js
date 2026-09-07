// MagazineHome — the landing page.
//
// Built as a parallel page behind `?view=magazine` on 2026-09-07 and promoted
// to the default the same week, after Mark used it daily and signed it off.
// HomeTab, the page it replaced, was retired at the same time; its footer
// moved to SiteFooter.js so nothing here depends on a deleted component.
//
// It reads the props Home has always received: the same listings, articles,
// auctions and counts, with no separate fetch.
//
// Two deliberate departures, both scoped to this component:
//  - Three faces (Bodoni Moda / Archivo / IBM Plex Mono) loaded on mount, so
//    the rest of the app's font payload is unchanged. This is the one place
//    DESIGN_SYSTEM's "no new typefaces" rule is set aside, on purpose.
//  - One <style> block rather than inline styles. Media queries, hover, the
//    cover gradient and ::placeholder can't be expressed inline; CardStrip
//    already sets the precedent for a component injecting its own rule.
//    Everything is namespaced `mag-` and every colour comes from the app's
//    own :root tokens, so dark mode needs no second palette.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { imgSrc, fmt, priceIn, CURRENCY_SYM, fmtSaleDateRange } from "../utils";
import { FooterBand } from "./SiteFooter";
import { articleAsListing, sourceLabel } from "./EditorialView";
import { MoonPhaseIndicator } from "./MoonPhaseIndicator";

const FONTS = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";

// A lot closing further out than this isn't "next" in any useful sense.
const CAL_HORIZON_DAYS = 60;
const CAL_MAX = 8;
const ROTATOR_COUNT = 5;
const DEALER_MAX = 12;

// Signed out there are no hearts to rank by, and ranking on "who happened to
// list this week" is arbitrary. This is Mark's own order, taken from his 570
// saved watches with the auction houses removed, so a stranger sees the
// dealers the site actually rates rather than a scrape artefact. Any name
// that isn't currently a source is skipped, so a retired dealer drops out on
// its own (Mark, 2026-09-07).
const SEEDED_DEALERS = [
  "Wind Vintage", "Tropical Watch", "Hodinkee Shop", "Bulang & Sons",
  "Moonphase", "Grey & Patina", "Falco Watches", "Collectors Corner NY",
  "Oliver & Clarke", "Shuck the Oyster", "Watchfid", "Somlo",
  "MVV Watches", "Menta Watches", "Analog Shift", "Craft & Tailored",
];

// Fill the row, don't leave a ragged tail. Mark: "I'd still like the width to
// define the number of articles shown ... then if I hide an article the next
// oldest adds to the screen." CSS can't tell you how many columns auto-fill
// produced, so measure the resolved template and round the slice down to a
// whole number of rows. Re-measures on resize; when an item disappears the
// next one moves up on its own because the list is just re-sliced.
function useWholeRows(ref, total, maxRows) {
  const [cols, setCols] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return undefined;
    const measure = () => {
      const t = window.getComputedStyle(el).gridTemplateColumns;
      const n = t && t !== "none" ? t.split(" ").filter(Boolean).length : 0;
      setCols((prev) => (prev === n ? prev : n));
    };
    measure();
    const RO = window.ResizeObserver;
    if (RO) { const ro = new RO(measure); ro.observe(el); return () => ro.disconnect(); }
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [ref, total]);
  if (!cols) return total;
  const rows = Math.max(1, Math.min(maxRows, Math.floor(total / cols)));
  return Math.min(total, rows * cols);
}

// A white cut-out on a near-white page has no edge, and most dealer product
// shots are exactly that, so the featured slot kept landing on a watch that
// floated (Mark, 2026-09-07). We can't know a photo's background without
// looking at it, so look: pull a 24px thumbnail of the top candidates through
// the same wsrv proxy the page already uses (it sends CORS headers, so the
// canvas isn't tainted) and measure how white the border pixels are. Four
// tiny requests, off the critical path, and the pick upgrades when they land.
function edgeWhiteness(src) {
  return new Promise((resolve) => {
    if (typeof document === "undefined") { resolve(1); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const n = 24;
        const c = document.createElement("canvas");
        c.width = n; c.height = n;
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0, n, n);
        const d = ctx.getImageData(0, 0, n, n).data;
        let white = 0, total = 0;
        const at = (x, y) => { const i = (y * n + x) * 4; return d[i] > 232 && d[i + 1] > 232 && d[i + 2] > 232; };
        for (let x = 0; x < n; x++) { [0, n - 1].forEach((y) => { total++; if (at(x, y)) white++; }); }
        for (let y = 1; y < n - 1; y++) { [0, n - 1].forEach((x) => { total++; if (at(x, y)) white++; }); }
        resolve(total ? white / total : 1);
      } catch { resolve(1); }
    };
    img.onerror = () => resolve(1);
    img.src = src;
  });
}

function useFonts() {
  useEffect(() => {
    if (document.getElementById("mag-fonts")) return;
    const link = document.createElement("link");
    link.id = "mag-fonts";
    link.rel = "stylesheet";
    link.href = FONTS;
    document.head.appendChild(link);
  }, []);
}

// Same price rule as Card's dealer branch: show native when it matches the
// user's primary currency, otherwise convert via priceUSD, and only fall back
// to native when there's no bridge. Getting this wrong is the "CHF doesn't
// convert 1:1 to USD" bug from May 2026.
function money(item, primaryCurrency) {
  if (!item) return "";
  if (item.priceOnRequest) return "Price on request";
  const itemCurrency = item.currency || "USD";
  if (itemCurrency === primaryCurrency) return fmt(item.price, primaryCurrency);
  const converted = priceIn(item, primaryCurrency);
  if (converted == null) return fmt(item.price, itemCurrency);
  return `${CURRENCY_SYM[primaryCurrency] || ""}${Math.round(converted).toLocaleString()}`;
}

function refLine(item) {
  const bits = [];
  if (item.reference_id) bits.push(`Ref. ${item.reference_id}`);
  if (item.model_line) bits.push(item.model_line);
  return bits.join(" · ");
}

// Sale cover if the house publishes one, else the sale's top lot, else a
// monogram. Never another sale's picture: a borrowed photo next to this
// sale's date is a small lie.
// Dealer marks come from the dealer's own favicon, resolved from a URL we
// already hold for them. No logo files to collect and nothing to maintain: a
// dealer we scrape is a dealer we can show. Falls back to the name alone.
function faviconFor(url) {
  try { return `https://icons.duckduckgo.com/ip3/${new URL(url).hostname.replace(/^www\./, "")}.ico`; }
  catch { return null; }
}

// Mark's hot list, computed from his own hearts rather than a static ranking:
// "are you able to see my most hearted items and which dealers they are from".
// Signed out there are no hearts, so fall back to who is listing right now,
// which is at least true rather than a guess at taste.
function topDealers(watchlist, fallbackItems, exclude, known) {
  const tally = new Map();
  const seenUrl = new Map();
  const skip = new Set(exclude || []);
  const add = (source, url) => {
    // Auction houses are not dealers and their listings live behind the
    // Auctions sub-tab, so a chip that filters "For sale" by Phillips returns
    // nothing (Mark, 2026-09-07).
    if (!source || skip.has(source)) return;
    tally.set(source, (tally.get(source) || 0) + 1);
    if (url && !seenUrl.has(source)) seenUrl.set(source, url);
  };
  const hearted = watchlist ? Object.values(watchlist) : [];
  hearted.forEach((it) => add(it && it.source, it && it.url));

  // Any hearts at all beat the seed: three saved dealers is still this
  // person's taste, where the seed is only ever a stand-in for not knowing it.
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length > 0) {
    return ranked.slice(0, DEALER_MAX)
      .map(([name, n]) => ({ name, n, icon: faviconFor(seenUrl.get(name)) }));
  }

  // No hearts: fall back to the seeded order, keeping only names that are
  // still live sources, then top up from whoever is listing now.
  const live = new Set((fallbackItems || []).map((i) => i && i.source).filter(Boolean));
  const urlFor = new Map();
  (fallbackItems || []).forEach((i) => { if (i && i.source && i.url && !urlFor.has(i.source)) urlFor.set(i.source, i.url); });
  const sources = known && known.length ? new Set(known) : null;
  const out = [];
  const push = (name) => {
    if (!name || skip.has(name) || out.some((d) => d.name === name)) return;
    out.push({ name, n: 0, icon: faviconFor(urlFor.get(name) || seenUrl.get(name)) });
  };
  SEEDED_DEALERS.forEach((name) => {
    if (out.length >= DEALER_MAX) return;
    if (sources ? sources.has(name) : live.has(name)) push(name);
  });
  (fallbackItems || []).forEach((i) => { if (out.length < DEALER_MAX) push(i && i.source); });
  return out;
}

function saleArt(sale, heroes) {
  if (!sale) return null;
  return sale.image || (heroes && heroes[sale.url]) || null;
}

function initials(house) {
  const parts = String(house || "").split(/[^A-Za-z]+/).filter((p) => p.length > 1);
  if (!parts.length) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts.slice(0, 2).map((p) => p[0]).join("")).toUpperCase();
}

function articleSource(a) {
  if (!a) return "";
  return (a._source && (a._source.publication || a._source.label)) || sourceLabel(a.source);
}

function fmtDate(iso, opts) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, opts || { day: "numeric", month: "long", year: "numeric" });
}

// The featured watch is picked on how much we can SAY about it, not on how
// new it is (Mark, 2026-09-07: "the one with the best new content and image,
// not necessarily the very latest"). Reference intelligence is the thing
// Watchlist knows that the dealer's own page doesn't say out loud, so an item
// we can caption properly beats a bare one that landed an hour later.
function featureScore(i) {
  return (i.reference_id ? 2 : 0) +
    (i.model_line ? 2 : 0) +
    (i.brand && i.brand !== "Other" ? 1 : 0) +
    (i.priceUSD ? 1 : 0);
}

function featureCandidates(items) {
  return (items || [])
    .filter((i) => i && i.img && i.ref)
    .slice()
    .sort((a, b) => featureScore(b) - featureScore(a) || (b.priceUSD || 0) - (a.priceUSD || 0));
}

// Metadata picks the shortlist; the photograph picks the winner. A candidate
// whose border is more than 70% white loses to one that isn't, and within
// each group the metadata order stands.
function useFeature(items) {
  const candidates = useMemo(() => featureCandidates(items), [items]);
  const [best, setBest] = useState(null);
  useEffect(() => {
    let dead = false;
    setBest(null);
    const shortlist = candidates.slice(0, 4);
    if (!shortlist.length) return undefined;
    Promise.all(shortlist.map((i) => edgeWhiteness(imgSrc(i.img, 24)).then((w) => ({ i, w }))))
      .then((scored) => {
        if (dead) return;
        const good = scored.filter((s) => s.w <= 0.7);
        setBest((good.length ? good : scored)[0].i);
      })
      .catch(() => {});
    return () => { dead = true; };
  }, [candidates]);
  return best || candidates[0] || null;
}

// The search is the page's main control, so it gets width and a preview of
// what each destination holds, matching the current site's behaviour rather
// than being a decorative box in the masthead.
function MagSearch({ onSubmit, onLiveQuery, counts, recent, addRecent, big }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(false);
  const wrap = useRef(null);

  useEffect(() => {
    const away = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, []);

  const change = (v) => {
    setQ(v);
    setOpen(v.trim().length > 0);
    if (onLiveQuery) onLiveQuery(v.trim().length >= 2 ? v.trim() : "");
  };
  const fire = (target) => {
    const term = q.trim();
    if (!term) return;
    if (addRecent) addRecent(term);
    if (onSubmit) onSubmit(term, target);
    setQ(""); setOpen(false);
    if (onLiveQuery) onLiveQuery("");
  };

  const rows = [
    ["all", "Everything", counts && counts.all],
    ["live", "For sale", counts && counts.live],
    ["auctions", "At auction", counts && counts.auctions],
    ["sold", "Sold", counts && counts.sold],
  ];

  return (
    <div className={`mag-searchwrap${big ? " mag-searchwrap--big" : ""}`} ref={wrap}>
      <form className={`mag-search${focus ? " is-focus" : ""}`} role="search" onSubmit={(e) => { e.preventDefault(); fire("all"); }}>
        <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7" cy="7" r="5" /><path d="M11 11l4 4" />
        </svg>
        <input type="search" value={q} onChange={(e) => change(e.target.value)}
               onFocus={() => { setFocus(true); setOpen(q.trim().length > 0 || (recent || []).length > 0); }}
               onBlur={() => setFocus(false)}
               placeholder="Brand, model, reference" aria-label="Search watches" />
        <button type="submit" className="mag-search-go">Search</button>
      </form>
      {open && (
        <div className="mag-drop">
          {q.trim().length > 0 && rows.map(([target, label, n]) => (
            <button key={target} type="button" className="mag-drop-row" onClick={() => fire(target)}>
              <span>{label}</span>
              <span className="mag-drop-n">{n == null ? "" : n.toLocaleString()}</span>
            </button>
          ))}
          {q.trim().length === 0 && (recent || []).length > 0 && (
            <>
              <p className="mag-drop-head">Recent</p>
              {recent.slice(0, 5).map((r) => (
                <button key={r} type="button" className="mag-drop-row" onClick={() => { setQ(r); change(r); }}>
                  <span>{r}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Rotator({ articles, isAdmin, onHide }) {
  const [at, setAt] = useState(0);
  const timer = useRef(null);
  const slides = articles.slice(0, ROTATOR_COUNT);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
    if (calm && calm.matches) return undefined;
    timer.current = setInterval(() => setAt((n) => (n + 1) % slides.length), 7000);
    return () => clearInterval(timer.current);
  }, [slides.length]);

  const stop = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };
  if (!slides.length) return null;
  const a = slides[at];

  return (
    <div className="mag-rot" onMouseEnter={stop} onFocus={stop}>
      <div className="mag-cover">
        <span className="mag-cover-pic">
          {a.image ? <img src={imgSrc(a.image, 1200)} alt="" /> : null}
          {slides.length > 1 && (
            <span className="mag-dots">
              {slides.map((s, i) => (
                <button key={s.url || i} type="button" className="mag-dot"
                  aria-current={i === at ? "true" : "false"}
                  aria-label={`Show story ${i + 1} of ${slides.length}`}
                  onClick={() => { stop(); setAt(i); }} />
              ))}
            </span>
          )}
        </span>
        {isAdmin && onHide ? (
          <button type="button" className="mag-hide" title="Hide from Home"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onHide(a); }}>
            &times;
          </button>
        ) : null}
        <div className="mag-cover-lines">
          <p className="mag-kicker">{articleSource(a)}</p>
          <h3 className="mag-cover-head">
            <a href={a.url} target="_blank" rel="noopener noreferrer">{a.title}</a>
          </h3>
          {a.excerpt ? <p className="mag-cover-stand">{a.excerpt}</p> : null}
          <p className="mag-stamp">{fmtDate(a.published_at)}</p>
        </div>
      </div>
    </div>
  );
}

function SectionHeadBtn({ title, onClick, cta }) {
  return (
    <div className="mag-sec-head">
      <h2 className="mag-sec-title">{title}</h2>
      {onClick ? <button type="button" className="mag-viewall" onClick={onClick}>{cta} <span aria-hidden>&rarr;</span></button> : null}
    </div>
  );
}

export default function MagazineHome(props) {
  const {
    homeRecentAdded, homeRecentArticles, homeEndingNext,
    homeAuctionSales, homeSectionCounts,
    goToRecentAdded, goToArticles, homeOpenCalendar, homeOpenSale,
    onClickListing, primaryCurrency, isMobile, user, dark, cols,
    homeMastheadTabs, homeSearchSubmit, watchlist, homeJumpToDealer, homeAuctionSources,
    homeDealerSources,
    goToSavedHearts,
    homeSearchLiveQuery, homeSearchCounts, homeRecentSearches, homeAddRecentSearch,
    homeAuctionHeroes, toggleHide, isAdmin, openAbout, signInWithGoogle,
  } = props;

  useFonts();
  const counts = homeSectionCounts || {};

  const articles = useMemo(() => (homeRecentArticles || []).filter((a) => a && a.title && a.image), [homeRecentArticles]);
  const feature = useFeature(homeRecentAdded);
  const grid = useMemo(
    () => (homeRecentAdded || []).filter((i) => i && i.img && (!feature || i.id !== feature.id)).slice(0, 12),
    [homeRecentAdded, feature]
  );
  const sales = useMemo(() => {
    const now = Date.now();
    const horizon = now + CAL_HORIZON_DAYS * 86400000;
    const dated = (homeAuctionSales || [])
      .filter((s) => s && (s.status === "live" || s.status === "upcoming"))
      .map((s) => ({ sale: s, ends: Date.parse(s.dateEnd || s.dateStart || "") }))
      .filter((x) => !Number.isNaN(x.ends) && x.ends >= now && x.ends <= horizon)
      .sort((a, b) => a.ends - b.ends);
    // One row per house first, so the block reads as a spread of the trade
    // rather than four rows from whoever runs a weekly sale.
    const seen = new Set();
    const out = [];
    dated.forEach(({ sale }) => {
      if (out.length >= CAL_MAX || seen.has(sale.house)) return;
      seen.add(sale.house); out.push(sale);
    });
    dated.forEach(({ sale }) => { if (out.length < CAL_MAX && !out.includes(sale)) out.push(sale); });
    return out;
  }, [homeAuctionSales]);

  const dealers = useMemo(() => topDealers(watchlist, homeRecentAdded, homeAuctionSources, homeDealerSources),
    [watchlist, homeRecentAdded, homeAuctionSources, homeDealerSources]);

  const cardsRef = useRef(null);
  const catRef = useRef(null);
  // Up to three rows of stories and two of watches, always whole rows.
  const articleRows = useWholeRows(cardsRef, articles.length, 3);
  const listingRows = useWholeRows(catRef, grid.length, 2);

  const savedCount = watchlist ? Object.keys(watchlist).length : 0;
  const initial = String((user && ((user.user_metadata && user.user_metadata.full_name) || user.email)) || "")
    .trim().charAt(0).toUpperCase() || "\u2022";

  const hideArticle = (a) => {
    const projected = articleAsListing(a);
    if (projected && toggleHide) toggleHide(projected);
  };

  const tile = (i) => (
    <article className="mag-lot" key={i.id || i.url}>
      <a className="mag-lot-img" href={i.url} target="_blank" rel="noopener noreferrer"
         onClick={() => onClickListing && onClickListing(i)}>
        <img src={imgSrc(i.img, 480)} alt="" loading="lazy" />
        {isAdmin && toggleHide ? (
          <button type="button" className="mag-hide mag-hide--tile" title="Hide from Home"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleHide(i); }}>
            &times;
          </button>
        ) : null}
      </a>
      <div className="mag-lot-body">
        <p className="mag-dealer">{i.source}</p>
        <h3 className="mag-lot-title">
          <a href={i.url} target="_blank" rel="noopener noreferrer" onClick={() => onClickListing && onClickListing(i)}>{i.brand}</a>
        </h3>
        <p className="mag-lot-ref">{i.ref}</p>
        {refLine(i) ? <p className="mag-lot-meta">{refLine(i)}</p> : null}
        <p className="mag-lot-price">{money(i, primaryCurrency)}</p>
      </div>
    </article>
  );

  // The app already has a Columns control (Settings: Auto / 3-7, plus the
  // mobile 1-3). The magazine was ignoring it and sizing off a fixed tile
  // width instead, which is why it sat at four columns whatever you chose.
  // One source of truth: use the resolved count, and only fall back to the
  // fluid tile when a caller hasn't supplied one.
  const gridCols = Number.isFinite(cols) && cols > 0 ? cols : null;

  return (
    <div className="mag" style={gridCols ? { "--mag-cols": gridCols } : undefined}>
      <style>{MAG_CSS}</style>

      <header className="mag-flag">
        <div className="mag-mark">
          <h1 className="mag-wordmark">Watchlist</h1>
        </div>
        {/* The moon sits on the page's centre line, directly above the search
            in the bar below, so the two share a vertical axis instead of the
            moon hanging off the wordmark (Mark, 2026-09-07). */}
        <div className="mag-moonslot">
          <MoonPhaseIndicator size={isMobile ? 92 : 132} dark={!!dark} />
        </div>
        <div />
      </header>


      {/* Persistent bar (Mark, 2026-09-07): once the masthead scrolls away the
          tabs and search should still be there. Sticky rather than fixed, so
          it never covers content and needs no scroll listener. */}
      <div className="mag-bar">
        <div className="mag-bar-tabs">
          {(homeMastheadTabs || []).map((t) => (
            <button key={t.key} type="button" onClick={t.onSelect} className={t.active ? "on" : ""}>
              {isMobile && t.mobileLabel ? t.mobileLabel : t.label}
            </button>
          ))}
        </div>
        <MagSearch big onSubmit={homeSearchSubmit} onLiveQuery={homeSearchLiveQuery}
                   counts={homeSearchCounts} recent={homeRecentSearches} addRecent={homeAddRecentSearch} />
        {/* About, saved and account live HERE rather than in the app's floating
            overlay, so every control on the page persists together in one row
            (Mark, 2026-09-07). App.js suppresses the overlay for this view, so
            there is one set, not two. */}
        <div className="mag-bar-util">
          <button type="button" className="mag-bar-link" onClick={openAbout}>About</button>
          {user ? (
            <>
              <button type="button" className="mag-icon" aria-label="Saved watches" onClick={goToSavedHearts}>
                <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M10 17S3 12.6 3 7.9A3.9 3.9 0 0 1 10 5.6a3.9 3.9 0 0 1 7 2.3C17 12.6 10 17 10 17z" />
                </svg>
                {savedCount > 0 ? <span className="mag-badge">{savedCount}</span> : null}
              </button>
              <span className="mag-avatar" aria-hidden="true">{initial}</span>
            </>
          ) : (
            signInWithGoogle ? (
              <button type="button" className="mag-signin" onClick={signInWithGoogle}>Sign in</button>
            ) : null
          )}
        </div>
      </div>

      {articles.length > 0 && (
        <section className="mag-sec mag-sec--first">
          <SectionHeadBtn title="Recent Articles" onClick={goToArticles} cta="All articles" />
          <Rotator articles={articles} isAdmin={isAdmin} onHide={hideArticle} />
          <div className="mag-cards" ref={cardsRef}>
            {articles.slice(0, articleRows).map((a) => (
              <article className="mag-card" key={a.url}>
                <a className="mag-card-img" href={a.url} target="_blank" rel="noopener noreferrer">
                  <img src={imgSrc(a.image, 520)} alt="" loading="lazy" />
                  {isAdmin ? (
                    <button type="button" className="mag-hide mag-hide--tile" title="Hide from Home"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); hideArticle(a); }}>
                      &times;
                    </button>
                  ) : null}
                </a>
                <p className="mag-kicker mag-kicker--card">{articleSource(a)}</p>
                <h3 className="mag-card-head">
                  <a href={a.url} target="_blank" rel="noopener noreferrer">{a.title}</a>
                </h3>
                {a.excerpt ? <p className="mag-card-stand">{a.excerpt}</p> : null}
                <p className="mag-stamp">{fmtDate(a.published_at, { day: "numeric", month: "short" })}</p>
              </article>
            ))}
          </div>
          {/* Mirrors the listings section: a way out at the foot of the grid
              as well as at the head, so you don't have to scroll back up. */}
          <div className="mag-sec-foot">
            <button type="button" className="mag-viewall" onClick={goToArticles}>
              View all articles <span aria-hidden>&rarr;</span>
            </button>
          </div>
        </section>
      )}

      {(feature || grid.length > 0) && (
        <section className="mag-sec">
          <SectionHeadBtn title="New Listings This Week" onClick={goToRecentAdded} cta="All watches" />
          {dealers.length > 0 && homeJumpToDealer && (
            <div className="mag-dealers-band">
              <div className="mag-dealers-inner">
                <p className="mag-dealers-label">{user ? "Your dealers" : "Dealers we follow"}</p>
                <div className="mag-dealers">
                  {dealers.map((d) => (
                    <button key={d.name} type="button" className="mag-dealer-chip"
                            onClick={() => homeJumpToDealer(d.name)} title={`${d.n} saved from ${d.name}`}>
                      {d.icon ? (
                        <img src={d.icon} alt="" loading="lazy"
                             onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      ) : null}
                      <span>{d.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* A band behind the featured watch: dealer product shots are shot
              on white, so on a near-white page the watch floated with no edge
              (Mark, 2026-09-07). The band gives it a ground to sit on. */}
          {feature && (
            <div className="mag-pick-band">
            <div className="mag-pick">
              <a className="mag-pick-img" href={feature.url} target="_blank" rel="noopener noreferrer"
                 onClick={() => onClickListing && onClickListing(feature)}>
                <img src={imgSrc(feature.img, 900)} alt="" />
                {isAdmin && toggleHide ? (
                  <button type="button" className="mag-hide" title="Hide from Home"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleHide(feature); }}>
                    &times;
                  </button>
                ) : null}
              </a>
              <div className="mag-pick-body">
                <p className="mag-dealer mag-dealer--bare">{feature.source}</p>
                <h3 className="mag-pick-brand">
                  <a href={feature.url} target="_blank" rel="noopener noreferrer">{feature.brand}</a>
                </h3>
                <p className="mag-pick-ref">{feature.ref}</p>
                {refLine(feature) ? <p className="mag-lot-meta">{refLine(feature)}</p> : null}
                <p className="mag-pick-price">{money(feature, primaryCurrency)}</p>
              </div>
            </div>
            </div>
          )}
          <div className="mag-cat" ref={catRef}>{grid.slice(0, listingRows).map(tile)}</div>
          <div className="mag-sec-foot">
            <button type="button" className="mag-viewall" onClick={goToRecentAdded}>
              See all new listings <span aria-hidden>&rarr;</span>
            </button>
          </div>
        </section>
      )}

      {sales.length > 0 && (
        <section className="mag-sec">
          <SectionHeadBtn title="Auction Calendar" onClick={homeOpenCalendar} cta="Full calendar" />
          <div className="mag-cal">
            {sales.map((s) => (
              <a className="mag-cal-row" key={s.id || s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                 onClick={(e) => { if (homeOpenSale) { e.preventDefault(); homeOpenSale(s); } }}>
                <span className="mag-cal-art">
                  {saleArt(s, homeAuctionHeroes)
                    ? <img src={imgSrc(saleArt(s, homeAuctionHeroes), 320)} alt="" loading="lazy" />
                    : <span className="mag-cal-mark">{initials(s.house)}</span>}
                </span>
                <span className="mag-cal-house">{s.house}</span>
                <span>
                  <span className="mag-cal-title">{s.title}</span>
                  {s.location ? <span className="mag-cal-place">{s.location}</span> : null}
                </span>
                <span className="mag-cal-when">
                  {fmtSaleDateRange(s)}
                  {s.status === "live" ? <span className="mag-live">Bidding open</span> : null}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* The site's own footer, not a second one invented for this page. */}
      <FooterBand openAbout={openAbout} signInWithGoogle={signInWithGoogle} user={user} />
    </div>
  );
}

// All rules namespaced `mag-` so nothing here can reach the live app. Colour
// comes from the app's own :root tokens (App.js c-block), so dark mode works
// without a second palette; the three magazine faces are the only additions.
const MAG_CSS = `
.mag { --mag-display: "Bodoni Moda", Didot, "Times New Roman", serif;
       --mag-body: "Archivo", -apple-system, "Helvetica Neue", Arial, sans-serif;
       --mag-data: "IBM Plex Mono", ui-monospace, Menlo, monospace;
       font-family: var(--mag-body); color: var(--text1); }
.mag img { display: block; width: 100%; height: 100%; object-fit: cover; }
.mag a { color: inherit; }

/* Three zones: wordmark left, moon centred over the search below it, nothing
   on the right (the account controls moved into the persistent bar, so this
   row no longer has to leave a lane for them). */
.mag-flag { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
            gap: 24px; padding: 22px 0 14px; }
.mag-mark { display: flex; align-items: center; min-width: 0; }
.mag-moonslot { display: flex; justify-content: center; }
/* Olive wordmark (Mark, 2026-09-07). --brand-olive-ink is theme-aware: deep
   olive on paper, a lifted sage on the dark ground, so it holds contrast in
   both without needing a second colour. */
.mag-wordmark { font-family: var(--mag-display); font-weight: 500; margin: 0;
                font-size: clamp(28px,6vw,64px); line-height: .88; letter-spacing: .015em;
                color: var(--brand-olive-ink); }
/* One tile width for both grids, so a story and a watch are the same object
   on the page (Mark, 2026-09-07). Change it here and both grids move. */
.mag { --mag-tile: 268px; }

.mag-searchwrap { position: relative; flex: 0 0 auto; }
.mag-searchwrap--big { flex: 1 1 420px; max-width: 560px; }
.mag-search { display: flex; align-items: center; gap: 10px; border: .5px solid var(--border);
              border-radius: 999px; padding: 6px 6px 6px 16px; background: var(--card-bg); }
/* Do NOT use :focus-within here. jsdom resolves it with contains(activeElement)
   and throws when nothing is focused, which breaks every getByRole in this
   component's tests. Focus is tracked in React state instead. */
.mag-search.is-focus { border-color: var(--brand-olive-text); }
.mag-search svg { width: 14px; height: 14px; flex: 0 0 auto; color: var(--text3); }
.mag-search input { border: none; background: transparent; outline: none; width: 100%;
                    font-family: var(--mag-body); font-size: 14px; color: var(--text1); padding: 6px 0; }
.mag-search input::placeholder { color: var(--text3); }
.mag-searchwrap--big .mag-search { padding: 9px 9px 9px 22px; border-width: 1px;
                                  box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.mag-searchwrap--big .mag-search.is-focus { box-shadow: 0 2px 10px rgba(0,0,0,.10); }
.mag-searchwrap--big .mag-search svg { width: 17px; height: 17px; color: var(--text2); }
.mag-searchwrap--big .mag-search input { font-size: 15.5px; padding: 9px 0; }
.mag-search-go { font-family: var(--mag-data); font-size: 11.5px; letter-spacing: .16em;
                 text-transform: uppercase; border: none; border-radius: 999px; cursor: pointer;
                 background: var(--brand-olive-text); color: var(--bg); padding: 12px 22px; flex: 0 0 auto; }
.mag-searchwrap:not(.mag-searchwrap--big) .mag-search-go { display: none; }
.mag-drop { position: absolute; z-index: 40; top: calc(100% + 6px); left: 0; right: 0;
            background: var(--card-bg); border: .5px solid var(--border); border-radius: 14px;
            box-shadow: 0 12px 34px rgba(0,0,0,.16); padding: 6px; display: grid; gap: 1px; }
.mag-drop-head { font-family: var(--mag-data); font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
                 color: var(--text3); margin: 6px 10px 4px; }
.mag-drop-row { display: flex; align-items: center; justify-content: space-between; gap: 14px;
                background: none; border: none; cursor: pointer; text-align: left; width: 100%;
                padding: 10px 12px; border-radius: 10px; font-family: var(--mag-body); font-size: 14px; color: var(--text1); }
.mag-drop-row:hover { background: var(--surface, rgba(0,0,0,.05)); }
.mag-drop-n { font-family: var(--mag-data); font-size: 12px; color: var(--text3); font-variant-numeric: tabular-nums; }

/* persistent bar */
.mag-bar { position: sticky; top: 0; z-index: 30; display: flex; align-items: center;
           justify-content: space-between; gap: 22px;
           padding: 12px 0; margin-bottom: 4px; background: var(--bg);
           border-bottom: .5px solid var(--border); }
.mag-bar-tabs { display: flex; flex-wrap: wrap; gap: 4px 22px; flex: 0 0 auto; }
.mag-bar-tabs button { font-family: var(--mag-data); font-size: 12.5px; letter-spacing: .13em;
                       text-transform: uppercase; color: var(--text2); background: none; border: none;
                       cursor: pointer; padding: 2px 0; border-bottom: 1.5px solid transparent; }
.mag-bar-tabs button:hover, .mag-bar-tabs button.on { color: var(--brand-olive-text); border-bottom-color: var(--brand-olive-text); }
/* Absolutely centred on the page rather than flex-centred between the tabs
   and the account controls: the moon sits on the page's centre line, and the
   two only share a vertical axis if the search does too. Flex-centring put
   them 128px apart. Below 1180px the lanes get tight, so it falls back to
   flowing in the row. */
.mag-bar .mag-searchwrap { position: absolute; left: 50%; transform: translateX(-50%);
                           width: min(560px, 46vw); }
@media (max-width: 1180px) {
  .mag-bar .mag-searchwrap { position: static; transform: none;
                             flex: 1 1 auto; width: auto; max-width: 560px; margin: 0 auto; }
}
/* Width of the app's fixed overlay (About + heart + account) plus breathing
   room, so the sticky bar never slides under it on scroll. */
.mag-bar-util { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
.mag-bar-link { font-family: var(--mag-data); font-size: 10.5px; letter-spacing: .14em;
                text-transform: uppercase; color: var(--text2); background: none; border: none;
                cursor: pointer; padding: 4px 0; }
.mag-bar-link:hover { color: var(--brand-olive-text); }
.mag-signin { font-family: var(--mag-data); font-size: 10.5px; letter-spacing: .14em;
              text-transform: uppercase; color: var(--text1); background: none; cursor: pointer;
              border: .5px solid var(--border); border-radius: 999px; padding: 8px 16px; }
.mag-signin:hover { border-color: var(--brand-olive-text); color: var(--brand-olive-text); }
.mag-icon { width: 34px; height: 34px; border-radius: 999px; border: .5px solid var(--border);
            background: transparent; cursor: pointer; display: flex; align-items: center;
            justify-content: center; color: var(--text1); position: relative; padding: 0; }
.mag-icon:hover { border-color: var(--brand-olive-text); color: var(--brand-olive-text); }
.mag-icon svg { width: 15px; height: 15px; }
.mag-badge { position: absolute; top: -4px; right: -4px; min-width: 16px; height: 16px;
             border-radius: 999px; background: var(--brand-olive-text); color: var(--bg);
             font-family: var(--mag-data); font-size: 9px; line-height: 16px; text-align: center;
             padding: 0 4px; font-variant-numeric: tabular-nums; }
.mag-avatar { width: 34px; height: 34px; border-radius: 999px; background: var(--brand-olive-text);
              color: var(--bg); font-family: var(--mag-display); font-size: 15px; font-weight: 500;
              display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }

/* dealer shortcuts */
/* Same band treatment and the same width as the featured-watch band below,
   so the two read as one device rather than two (Mark, 2026-09-07). Inset to
   the content column, not bled to the viewport. */
.mag-dealers-band { background: var(--surface, rgba(0,0,0,.035));
                    padding: 16px clamp(22px,3vw,40px);
                    margin-bottom: clamp(24px,3vw,36px); }
.mag-dealers-inner { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 18px; }
.mag-sec--dealers { margin-top: clamp(30px,3.6vw,48px); }
.mag-dealers-label { font-family: var(--mag-data); font-size: 10.5px; letter-spacing: .16em;
                     text-transform: uppercase; color: var(--text3); margin: 0; flex: 0 0 auto; }
.mag-dealers { display: flex; flex-wrap: wrap; gap: 8px; }
.mag-dealer-chip { display: inline-flex; align-items: center; gap: 9px; cursor: pointer;
                   border: .5px solid var(--border); border-radius: 999px; background: var(--bg);
                   padding: 7px 15px 7px 9px; font-family: var(--mag-body); font-size: 13.5px;
                   color: var(--text1); }
.mag-dealer-chip:hover { border-color: var(--brand-olive-text); color: var(--brand-olive-text); }
.mag-dealer-chip img { width: 20px; height: 20px; border-radius: 4px; object-fit: contain;
                       background: var(--bg); flex: 0 0 auto; }

/* admin hide */
.mag-hide { position: absolute; top: 10px; right: 10px; z-index: 4; width: 26px; height: 26px;
            border-radius: 999px; border: none; cursor: pointer; background: rgba(8,10,6,.55);
            color: #fff; font-size: 15px; line-height: 1; padding: 0; }
.mag-hide:hover { background: rgba(8,10,6,.8); }
.mag-hide--tile { width: 24px; height: 24px; font-size: 14px; }


.mag-sec { margin-top: clamp(40px,5.4vw,76px); }
.mag-sec--first { margin-top: clamp(30px,4vw,54px); }
.mag-sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 20px;
                border-bottom: 1.5px solid var(--text1); padding-bottom: 11px; margin-bottom: clamp(18px,2.2vw,28px); }
.mag-sec-title { font-family: var(--mag-display); font-weight: 500; margin: 0;
                 font-size: clamp(22px,3.1vw,40px); line-height: 1; color: var(--text1); }
.mag-viewall { font-family: var(--mag-data); font-size: 11px; letter-spacing: .15em; text-transform: uppercase;
               color: var(--text1); background: none; border: none; border-bottom: 1.5px solid var(--text1);
               padding: 6px 0 5px; cursor: pointer; white-space: nowrap; text-decoration: none; }
.mag-viewall:hover { color: var(--brand-olive-text); border-bottom-color: var(--brand-olive-text); }
.mag-sec-foot { display: flex; justify-content: center; padding-top: clamp(24px,2.8vw,34px); }

/* Fit the window, don't exceed it. At 1400px a 16:9 cover is 787px tall, so
   on a laptop the hero ran past the fold and the headline sat below it
   (Mark, 2026-09-07). The ratio still drives the shape; the cap stops it
   growing past what you can see, and object-fit crops rather than squashes. */
.mag-cover { position: relative; width: 100%; aspect-ratio: 16/9;
             max-height: min(62vh, 620px); overflow: hidden; background: var(--card-bg); }
.mag-cover::after { content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, rgba(8,10,6,0) 45%, rgba(8,10,6,.30) 78%, rgba(8,10,6,.55) 100%); }
.mag-cover-pic { position: absolute; inset: 0; display: block; }
.mag-cover-lines { position: absolute; inset: auto 0 0 0; z-index: 2; padding: clamp(34px,5vw,64px) clamp(20px,3.4vw,46px) clamp(20px,3.4vw,46px);
  display: grid; gap: 10px;
  background: linear-gradient(180deg, rgba(8,10,6,0) 0%, rgba(8,10,6,.62) 34%, rgba(8,10,6,.88) 100%); }
.mag-kicker { font-family: var(--mag-data); font-size: 11px; letter-spacing: .18em; text-transform: uppercase;
              color: #EFE9D4; margin: 0; }
.mag-kicker--card { color: var(--brand-olive-text); font-size: 10.5px; letter-spacing: .16em; margin: 6px 0 0; }
.mag-cover-head { font-family: var(--mag-display); font-weight: 400; margin: 0; color: #FBFAF3;
                  font-size: clamp(24px,4.1vw,54px); line-height: 1.02; max-width: 21ch;
                  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.mag-cover-head a { text-decoration: none; }
.mag-cover-stand { margin: 0; max-width: 52ch; color: #DAD7C6; font-size: clamp(14px,1.35vw,16.5px); line-height: 1.5;
                   display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.mag-stamp { font-family: var(--mag-data); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase;
             color: var(--text3); margin: 0; }
.mag-cover-lines .mag-stamp { color: #B6B3A2; }
.mag-dots { position: absolute; z-index: 3; right: clamp(14px,2.6vw,38px); bottom: clamp(12px,2.4vw,34px);
            display: flex; gap: 2px; }
/* The bar is 3px tall but the button is 26px, with the bar drawn by a child.
   A 3px target was almost unclickable (Mark, 2026-09-07). */
.mag-dot { width: 42px; height: 26px; padding: 0; border: none; cursor: pointer;
           background: none; display: flex; align-items: center; justify-content: center; }
.mag-dot::before { content: ""; display: block; width: 32px; height: 3px;
                   background: rgba(251,250,243,.45); box-shadow: 0 0 6px rgba(8,10,6,.55);
                   transition: background .2s ease, height .2s ease; }
.mag-dot:hover::before { background: rgba(251,250,243,.8); }
.mag-dot[aria-current="true"]::before { background: #FBFAF3; height: 4px; }

.mag-cards { display: grid; gap: clamp(22px,2.6vw,34px) clamp(18px,2vw,26px);
             grid-template-columns: repeat(auto-fill, minmax(var(--mag-tile),1fr)); align-items: start;
             margin-top: clamp(28px,3.2vw,42px); }
/* When the app resolves a column count (Settings > Columns, Auto included),
   it wins over the fluid tile so the two grids agree with the rest of the
   site rather than inventing their own width. */
.mag[style*="--mag-cols"] .mag-cards,
.mag[style*="--mag-cols"] .mag-cat { grid-template-columns: repeat(var(--mag-cols), minmax(0,1fr)); }
.mag-card { display: grid; gap: 8px; align-content: start; }
.mag-card-img { display: block; position: relative; aspect-ratio: 13/9; overflow: hidden; background: var(--card-bg); }
.mag-card-head { font-family: var(--mag-display); font-weight: 500; margin: 0;
                 font-size: clamp(17px,2vw,23px); line-height: 1.12; }
.mag-card-head a { text-decoration: none; }
.mag-card-head a:hover { color: var(--brand-olive-text); }
.mag-card-stand { margin: 0; font-size: 14.5px; line-height: 1.5; color: var(--text2);
                  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.mag-pick-band { background: var(--surface, rgba(0,0,0,.035)); padding: clamp(22px,3vw,40px);
                 margin-bottom: clamp(26px,3vw,38px); }
.mag-pick-band .mag-pick { padding-bottom: 0; margin-bottom: 0; border-bottom: none; }
.mag-pick { display: grid; grid-template-columns: minmax(0,1.05fr) minmax(0,1fr); gap: clamp(20px,3vw,40px);
            align-items: center; padding-bottom: clamp(26px,3vw,38px); margin-bottom: clamp(26px,3vw,38px);
            border-bottom: .5px solid var(--border); }
.mag-pick-img { display: block; position: relative; aspect-ratio: 4/3; overflow: hidden; background: var(--card-bg); }
.mag-pick-body { display: grid; gap: 8px; align-content: center; }
.mag-pick-brand { font-family: var(--mag-display); font-weight: 400; margin: 2px 0 0;
                  font-size: clamp(26px,3.2vw,40px); line-height: 1.04; }
.mag-pick-brand a { text-decoration: none; }
.mag-pick-ref { margin: 0; font-size: 15px; line-height: 1.4; color: var(--text2); max-width: 44ch; }
.mag-pick-price { margin: 6px 0 0; font-family: var(--mag-data); font-weight: 500;
                  font-size: clamp(17px,1.8vw,20px); color: var(--brand-olive-text); font-variant-numeric: tabular-nums; }

.mag-cat { display: grid; gap: clamp(22px,2.4vw,32px) clamp(18px,2vw,26px);
           grid-template-columns: repeat(auto-fill, minmax(var(--mag-tile),1fr)); align-items: start; }
.mag-lot { display: grid; align-content: start; }
.mag-lot-img { display: block; position: relative; aspect-ratio: 1; overflow: hidden; background: var(--card-bg); }
.mag-lot-body { padding: 11px 0 0; display: grid; gap: 5px; }
.mag-dealer { font-family: var(--mag-data); font-size: 10px; letter-spacing: .17em; text-transform: uppercase;
              color: var(--brand-olive-text); margin: 0; padding-bottom: 6px; border-bottom: .5px solid var(--border); }
.mag-dealer--bare { border-bottom: none; padding-bottom: 0; }
.mag-lot-title { font-family: var(--mag-display); font-weight: 500; font-size: 18px; line-height: 1.12; margin: 4px 0 0; }
.mag-lot-title a { text-decoration: none; }
.mag-lot-ref { margin: 0; font-size: 13px; line-height: 1.35; color: var(--text2); }
.mag-lot-meta { margin: 1px 0 0; font-family: var(--mag-data); font-size: 10.5px; letter-spacing: .04em; color: var(--text3); }
.mag-lot-price { margin: 6px 0 0; font-family: var(--mag-data); font-size: 14px; font-weight: 500;
                 color: var(--brand-olive-text); font-variant-numeric: tabular-nums; }

/* Chronological table, not tiles (Mark, 2026-09-07: "I liked the chronological
   table that was there before rather than tiles, just it all looked too
   small"). Rows keep the reading order a calendar needs; the artwork keeps
   the size the tiles gave it. */
.mag-cal { border-top: .5px solid var(--border); }
.mag-cal-row { display: grid; grid-template-columns: 190px 170px minmax(0,1fr) auto;
               gap: 10px 30px; align-items: center; padding: 22px 0;
               border-bottom: .5px solid var(--border); text-decoration: none; }
.mag-cal-row:hover .mag-cal-title { color: var(--brand-olive-text); }
.mag-cal-art { width: 190px; height: 190px; overflow: hidden; background: var(--card-bg);
               display: flex; align-items: center; justify-content: center; }
.mag-cal-mark { font-family: var(--mag-display); font-size: 46px; color: var(--text3); letter-spacing: .03em; }
.mag-cal-house { font-family: var(--mag-data); font-size: 11.5px; letter-spacing: .16em;
                 text-transform: uppercase; color: var(--brand-olive-text); }
.mag-cal-title { font-family: var(--mag-display); font-weight: 500;
                 font-size: clamp(20px,2.3vw,27px); line-height: 1.12; display: block; }
.mag-cal-place { font-size: 14.5px; color: var(--text2); margin-top: 5px; display: block; }
.mag-cal-when { font-family: var(--mag-data); font-size: 14px; color: var(--text1);
                text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.mag-live { display: inline-block; margin-left: 8px; font-size: 10.5px; letter-spacing: .1em;
            text-transform: uppercase; color: var(--brand-olive-text);
            border: .5px solid var(--brand-olive-text); border-radius: 999px; padding: 2px 7px; }

@media (max-width: 820px) {
  .mag-cal-row { grid-template-columns: 120px minmax(0,1fr); align-items: start; gap: 5px 18px; padding: 18px 0; }
  .mag-cal-art { width: 120px; height: 120px; grid-row: span 2; }
  .mag-cal-house { grid-column: 2; }
  .mag-cal-when { grid-column: 1 / -1; text-align: left; margin-top: 8px; }
}
@media (max-width: 900px) { .mag-bar .mag-searchwrap { max-width: none; } }
@media (max-width: 860px) { .mag-pick { grid-template-columns: minmax(0,1fr); } }
@media (max-width: 700px) {
  .mag-cover { aspect-ratio: auto; overflow: visible; background: transparent; }
  .mag-cover::after { display: none; }
  .mag-cover-pic { position: relative; inset: auto; aspect-ratio: 4/3; overflow: hidden; background: var(--card-bg); display: block; }
  .mag-cover-lines { position: static; padding: 14px 0 0; gap: 8px; background: none; }
  .mag-kicker { color: var(--brand-olive-text); }
  .mag-cover-head { color: var(--text1); font-size: 27px; max-width: none; }
  .mag-cover-stand { color: var(--text2); max-width: none; }
  .mag-cover-lines .mag-stamp { color: var(--text3); }
  .mag-dots { right: 12px; bottom: 12px; }
}
@media (max-width: 620px) { .mag-bar-link { display: none; } }
@media (prefers-reduced-motion: reduce) { .mag * { transition: none !important; } }
`;
