// MagazineHome — the parallel landing page (Epic 9, 2026-09-07).
//
// This is a SECOND Home, not a replacement. App.js builds `homeTabJSX` from
// this component instead of <HomeTab> only when the magazine view is on
// (`?view=magazine`), so the live landing page is untouched until Mark says
// otherwise. Nothing else in the app changes: both shells still render one
// `homeTabJSX`, so there is no shell-lockstep risk here.
//
// It reads exactly the props HomeTab already receives. No new data plumbing,
// no new fetch: the same listings, articles, auctions and counts.
//
// Deliberate departures from the rest of the app, all approved in the design
// thread and all scoped to this component:
//  - Three faces (Bodoni Moda / Archivo / IBM Plex Mono) loaded on mount and
//    only on mount, so the default app's font payload is unchanged. This is
//    the one place DESIGN_SYSTEM's "no new typefaces" rule is set aside, on
//    purpose, for a view that is not yet reachable.
//  - One <style> block rather than inline styles. Media queries, hover, the
//    cover gradient and ::placeholder can't be expressed inline; CardStrip
//    already sets the precedent for a component injecting its own rule.
//    Everything is namespaced `mag-` so it cannot leak into the live app.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { imgSrc, fmt, priceIn, CURRENCY_SYM, fmtSaleDateRange } from "../utils";
import { FooterBand } from "./HomeTab";
import { articleAsListing } from "./EditorialView";

const FONTS = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";

// A lot closing further out than this isn't "next" in any useful sense.
const CAL_HORIZON_DAYS = 60;
const CAL_MAX = 8;
const ROTATOR_COUNT = 3;

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
  return (a && a._source && a._source.label) || (a && a.source) || "";
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
function pickFeature(items) {
  const usable = (items || []).filter((i) => i && i.img && i.ref);
  if (!usable.length) return null;
  const score = (i) =>
    (i.reference_id ? 2 : 0) +
    (i.model_line ? 2 : 0) +
    (i.brand && i.brand !== "Other" ? 1 : 0) +
    (i.priceUSD ? 1 : 0);
  return usable.slice().sort((a, b) => score(b) - score(a) || (b.priceUSD || 0) - (a.priceUSD || 0))[0];
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
    onClickListing, primaryCurrency, isMobile, user,
    homeMastheadTabs, homeSearchSubmit,
    homeSearchLiveQuery, homeSearchCounts, homeRecentSearches, homeAddRecentSearch,
    homeAuctionHeroes, toggleHide, isAdmin, openAbout, signInWithGoogle,
  } = props;

  useFonts();
  const counts = homeSectionCounts || {};

  const articles = useMemo(() => (homeRecentArticles || []).filter((a) => a && a.title && a.image), [homeRecentArticles]);
  const feature = useMemo(() => pickFeature(homeRecentAdded), [homeRecentAdded]);
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

  const cardsRef = useRef(null);
  const catRef = useRef(null);
  // Up to three rows of stories and two of watches, always whole rows.
  const articleRows = useWholeRows(cardsRef, articles.length, 3);
  const listingRows = useWholeRows(catRef, grid.length, 2);

  const hideArticle = (a) => {
    const projected = articleAsListing(a);
    if (projected && toggleHide) toggleHide(projected);
  };

  const tile = (i) => (
    <article className="mag-lot" key={i.id || i.url}>
      <a className="mag-lot-img" href={i.url} target="_blank" rel="noopener noreferrer"
         onClick={() => onClickListing && onClickListing(i)}>
        <img src={imgSrc(i.img, 480)} alt="" loading="lazy" />
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

  return (
    <div className="mag">
      <style>{MAG_CSS}</style>

      <header className="mag-flag">
        <div className="mag-mark">
          <svg className="mag-moon" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="15.2" fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".55" />
            <path d="M20 4.8a15.2 15.2 0 0 0 0 30.4 11 15.2 0 0 1 0-30.4z" fill="currentColor" />
          </svg>
          <div>
            <h1 className="mag-wordmark">Watchlist</h1>
            <p className="mag-strap">Aggregated watch listings</p>
          </div>
        </div>
        {/* No heart or account circle here: the app's own persistent Home
            overlay already carries both, and rendering a second set was the
            duplication Mark spotted. Search is the one control this masthead
            owns, and it gets the width to look like the page's main input. */}
        <MagSearch big onSubmit={homeSearchSubmit} onLiveQuery={homeSearchLiveQuery}
                   counts={homeSearchCounts} recent={homeRecentSearches} addRecent={homeAddRecentSearch} />
      </header>


      {/* Persistent bar (Mark, 2026-09-07): once the masthead scrolls away the
          tabs and search should still be there. Sticky rather than fixed, so
          it never covers content and needs no scroll listener. */}
      <div className="mag-bar">
        <span className="mag-bar-mark">Watchlist</span>
        <div className="mag-bar-tabs">
          {(homeMastheadTabs || []).map((t) => (
            <button key={t.key} type="button" onClick={t.onSelect} className={t.active ? "on" : ""}>
              {isMobile && t.mobileLabel ? t.mobileLabel : t.label}
            </button>
          ))}
        </div>
        <MagSearch onSubmit={homeSearchSubmit} onLiveQuery={homeSearchLiveQuery}
                   counts={homeSearchCounts} recent={homeRecentSearches} addRecent={homeAddRecentSearch} />
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
                <p className="mag-stamp">{fmtDate(a.published_at, { day: "numeric", month: "short" })}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {(feature || grid.length > 0) && (
        <section className="mag-sec">
          <SectionHeadBtn title="New Listings This Week" onClick={goToRecentAdded} cta="All watches" />
          {/* A band behind the featured watch: dealer product shots are shot
              on white, so on a near-white page the watch floated with no edge
              (Mark, 2026-09-07). The band gives it a ground to sit on. */}
          {feature && (
            <div className="mag-pick-band">
            <div className="mag-pick">
              <a className="mag-pick-img" href={feature.url} target="_blank" rel="noopener noreferrer"
                 onClick={() => onClickListing && onClickListing(feature)}>
                <img src={imgSrc(feature.img, 900)} alt="" />
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

.mag-flag { display: flex; align-items: flex-end; justify-content: space-between;
            gap: 24px; padding: 22px 0 14px; }
.mag-mark { display: flex; align-items: center; gap: 14px; min-width: 0; }
.mag-moon { width: clamp(30px,4vw,44px); height: clamp(30px,4vw,44px); flex: 0 0 auto; color: var(--brand-olive-text); }
.mag-wordmark { font-family: var(--mag-display); font-weight: 500; margin: 0;
                font-size: clamp(28px,6vw,64px); line-height: .88; letter-spacing: .015em; color: var(--text1); }
/* One tile width for both grids, so a story and a watch are the same object
   on the page (Mark, 2026-09-07). Change it here and both grids move. */
.mag { --mag-tile: 210px; }

.mag-searchwrap { position: relative; flex: 0 0 auto; }
.mag-searchwrap--big { flex: 1 1 460px; max-width: 560px; }
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
.mag-searchwrap--big .mag-search { padding: 8px 8px 8px 20px; }
.mag-searchwrap--big .mag-search input { font-size: 16px; padding: 8px 0; }
.mag-search-go { font-family: var(--mag-data); font-size: 10.5px; letter-spacing: .14em;
                 text-transform: uppercase; border: none; border-radius: 999px; cursor: pointer;
                 background: var(--brand-olive-text); color: var(--bg); padding: 9px 16px; flex: 0 0 auto; }
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
.mag-bar { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 18px;
           padding: 9px 0; margin-bottom: 4px; background: var(--bg);
           border-bottom: .5px solid var(--border); }
.mag-bar-mark { font-family: var(--mag-display); font-size: 19px; font-weight: 500; letter-spacing: .02em;
                color: var(--text1); flex: 0 0 auto; }
.mag-bar-tabs { display: flex; flex-wrap: wrap; gap: 4px 18px; flex: 1 1 auto; }
.mag-bar-tabs button { font-family: var(--mag-data); font-size: 10.5px; letter-spacing: .14em;
                       text-transform: uppercase; color: var(--text2); background: none; border: none;
                       cursor: pointer; padding: 2px 0; border-bottom: 1.5px solid transparent; }
.mag-bar-tabs button:hover, .mag-bar-tabs button.on { color: var(--brand-olive-text); border-bottom-color: var(--brand-olive-text); }
.mag-bar .mag-searchwrap { width: 230px; }

/* admin hide */
.mag-hide { position: absolute; top: 10px; right: 10px; z-index: 4; width: 26px; height: 26px;
            border-radius: 999px; border: none; cursor: pointer; background: rgba(8,10,6,.55);
            color: #fff; font-size: 15px; line-height: 1; padding: 0; }
.mag-hide:hover { background: rgba(8,10,6,.8); }
.mag-hide--tile { width: 24px; height: 24px; font-size: 14px; }

.mag-strap { margin: 6px 0 0; font-family: var(--mag-data); font-size: 10.5px; letter-spacing: .12em;
             text-transform: uppercase; color: var(--text3); }

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

.mag-cover { position: relative; aspect-ratio: 16/9; overflow: hidden; background: var(--card-bg); }
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
.mag-dots { position: absolute; z-index: 3; right: clamp(20px,3.4vw,46px); bottom: clamp(22px,3.4vw,46px); display: flex; gap: 9px; }
.mag-dot { width: 30px; height: 3px; padding: 0; border: none; cursor: pointer;
           background: rgba(251,250,243,.45); box-shadow: 0 0 6px rgba(8,10,6,.55); }
.mag-dot[aria-current="true"] { background: #FBFAF3; }

.mag-cards { display: grid; gap: clamp(22px,2.6vw,34px) clamp(18px,2vw,26px);
             grid-template-columns: repeat(auto-fill, minmax(var(--mag-tile),1fr)); align-items: start;
             margin-top: clamp(28px,3.2vw,42px); }
.mag-card { display: grid; gap: 8px; align-content: start; }
.mag-card-img { display: block; position: relative; aspect-ratio: 13/9; overflow: hidden; background: var(--card-bg); }
.mag-card-head { font-family: var(--mag-display); font-weight: 500; margin: 0;
                 font-size: clamp(17px,2vw,23px); line-height: 1.12; }
.mag-card-head a { text-decoration: none; }
.mag-card-head a:hover { color: var(--brand-olive-text); }

.mag-pick-band { background: var(--surface, rgba(0,0,0,.035)); padding: clamp(22px,3vw,40px);
                 margin-bottom: clamp(26px,3vw,38px); }
.mag-pick-band .mag-pick { padding-bottom: 0; margin-bottom: 0; border-bottom: none; }
.mag-pick { display: grid; grid-template-columns: minmax(0,1.05fr) minmax(0,1fr); gap: clamp(20px,3vw,40px);
            align-items: center; padding-bottom: clamp(26px,3vw,38px); margin-bottom: clamp(26px,3vw,38px);
            border-bottom: .5px solid var(--border); }
.mag-pick-img { display: block; aspect-ratio: 4/3; overflow: hidden; background: var(--card-bg); }
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
.mag-lot-img { display: block; aspect-ratio: 1; overflow: hidden; background: var(--card-bg); }
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

.mag-cal { border-top: .5px solid var(--border); }
.mag-cal-row { display: grid; grid-template-columns: 104px 128px minmax(0,1fr) auto; gap: 6px 22px;
               align-items: center; padding: 14px 0; border-bottom: .5px solid var(--border);
               text-decoration: none; }
.mag-cal-art { width: 104px; height: 104px; overflow: hidden; background: var(--card-bg);
               display: flex; align-items: center; justify-content: center; }
.mag-cal-mark { font-family: var(--mag-display); font-size: 27px; color: var(--text3); letter-spacing: .03em; }
.mag-cal-row:hover .mag-cal-title { color: var(--brand-olive-text); }
.mag-cal-house { font-family: var(--mag-data); font-size: 10.5px; letter-spacing: .15em;
                 text-transform: uppercase; color: var(--brand-olive-text); }
.mag-cal-title { font-family: var(--mag-display); font-size: clamp(17px,1.9vw,21px); line-height: 1.15; display: block; }
.mag-cal-place { font-size: 13px; color: var(--text3); margin-top: 2px; display: block; }
.mag-cal-when { font-family: var(--mag-data); font-size: 12px; color: var(--text2); text-align: right;
                white-space: nowrap; font-variant-numeric: tabular-nums; }
.mag-live { display: inline-block; margin-left: 8px; font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase;
            color: var(--brand-olive-text); border: .5px solid var(--brand-olive-text); border-radius: 999px; padding: 2px 7px; }


@media (max-width: 900px) { .mag-bar .mag-searchwrap { width: 170px; } }
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
  .mag-cal-row { grid-template-columns: 72px minmax(0,1fr); align-items: start; gap: 4px 14px; padding: 14px 0; }
  .mag-cal-art { width: 72px; height: 72px; grid-row: span 2; }
  .mag-cal-house { grid-column: 2; }
  .mag-cal-when { grid-column: 1 / -1; text-align: left; margin-top: 6px; }
}
@media (max-width: 620px) { .mag-bar .mag-searchwrap { display: none; } .mag-bar-mark { display: none; } }
@media (prefers-reduced-motion: reduce) { .mag * { transition: none !important; } }
`;
