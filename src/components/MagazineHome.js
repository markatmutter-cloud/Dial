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

const FONTS = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500&family=Archivo:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";

// A lot closing further out than this isn't "next" in any useful sense.
const CAL_HORIZON_DAYS = 60;
const CAL_MAX = 8;
const ROTATOR_COUNT = 3;

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

function Rotator({ articles }) {
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
    homeMastheadTabs, homeSearchSubmit, goToSavedHearts, watchlist,
  } = props;

  useFonts();
  const counts = homeSectionCounts || {};
  const [q, setQ] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);

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

  const savedCount = watchlist ? Object.keys(watchlist).length : 0;
  const initial = (user && (user.user_metadata?.full_name || user.email) || "").trim().charAt(0).toUpperCase();

  const submitSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (term && homeSearchSubmit) homeSearchSubmit(term, "all");
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
          <h1 className="mag-wordmark">Watchlist</h1>
        </div>
        <div className="mag-util">
          <form className={`mag-search${searchFocus ? " is-focus" : ""}`} role="search" onSubmit={submitSearch}>
            <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" /><path d="M11 11l4 4" />
            </svg>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
                   onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
                   placeholder="Brand, model, reference" aria-label="Search watches" />
          </form>
          {user ? (
            <>
              <button className="mag-icon" type="button" aria-label="Saved watches" onClick={goToSavedHearts}>
                <svg viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M10 17S3 12.6 3 7.9A3.9 3.9 0 0 1 10 5.6a3.9 3.9 0 0 1 7 2.3C17 12.6 10 17 10 17z" />
                </svg>
                {savedCount > 0 ? <span className="mag-badge">{savedCount}</span> : null}
              </button>
              <span className="mag-avatar" aria-hidden="true">{initial || "•"}</span>
            </>
          ) : null}
        </div>
      </header>

      <nav className="mag-nav" aria-label="Sections">
        <div className="mag-tabs">
          {(homeMastheadTabs || []).map((t) => (
            <button key={t.key} type="button" onClick={t.onSelect} className={t.active ? "on" : ""}>
              {isMobile && t.mobileLabel ? t.mobileLabel : t.label}
            </button>
          ))}
        </div>
        <p className="mag-strap">Aggregated watch listings</p>
      </nav>

      {articles.length > 0 && (
        <section className="mag-sec mag-sec--first">
          <SectionHeadBtn title="Recent Articles" onClick={goToArticles} cta="All articles" />
          <Rotator articles={articles} />
          <div className="mag-cards">
            {articles.slice(0, 8).map((a) => (
              <article className="mag-card" key={a.url}>
                <a className="mag-card-img" href={a.url} target="_blank" rel="noopener noreferrer">
                  <img src={imgSrc(a.image, 520)} alt="" loading="lazy" />
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
          {feature && (
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
          )}
          <div className="mag-cat">{grid.map(tile)}</div>
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

      <p className="mag-colophon">
        Watchlist &middot; {counts.live ? `${counts.live.toLocaleString()} watches for sale` : "aggregated watch listings"}
      </p>
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
            gap: 24px; padding: 22px 0 10px; }
.mag-mark { display: flex; align-items: center; gap: 14px; min-width: 0; }
.mag-moon { width: clamp(30px,4vw,44px); height: clamp(30px,4vw,44px); flex: 0 0 auto; color: var(--brand-olive-text); }
.mag-wordmark { font-family: var(--mag-display); font-weight: 500; margin: 0;
                font-size: clamp(28px,6vw,64px); line-height: .88; letter-spacing: .015em; color: var(--text1); }
.mag-util { display: flex; align-items: center; gap: 12px; flex: 0 0 auto; }
.mag-search { display: flex; align-items: center; gap: 8px; border: .5px solid var(--border);
              border-radius: 999px; padding: 8px 14px; min-width: 240px; background: var(--card-bg); }
.mag-search.is-focus { border-color: var(--brand-olive-text); }
.mag-search svg { width: 13px; height: 13px; flex: 0 0 auto; color: var(--text3); }
.mag-search input { border: none; background: transparent; outline: none; width: 100%;
                    font-family: var(--mag-data); font-size: 11px; letter-spacing: .06em; color: var(--text1); }
.mag-search input::placeholder { color: var(--text3); text-transform: uppercase; letter-spacing: .12em; }
.mag-icon { width: 36px; height: 36px; border-radius: 999px; border: .5px solid var(--border);
            background: transparent; cursor: pointer; display: flex; align-items: center;
            justify-content: center; color: var(--text1); position: relative; padding: 0; }
.mag-icon:hover { border-color: var(--brand-olive-text); color: var(--brand-olive-text); }
.mag-icon svg { width: 15px; height: 15px; }
.mag-badge { position: absolute; top: -3px; right: -3px; min-width: 16px; height: 16px; border-radius: 999px;
             background: var(--brand-olive-text); color: var(--bg); font-family: var(--mag-data);
             font-size: 9px; line-height: 16px; text-align: center; padding: 0 4px; }
.mag-avatar { width: 36px; height: 36px; border-radius: 999px; background: var(--brand-olive-text);
              color: var(--bg); font-family: var(--mag-display); font-size: 16px; font-weight: 500;
              display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }

.mag-nav { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between;
           gap: 8px 28px; padding: 4px 0 11px; border-bottom: 1.5px solid var(--text1); }
.mag-tabs { display: flex; flex-wrap: wrap; gap: 4px 26px; }
.mag-tabs button { font-family: var(--mag-data); font-size: 11px; letter-spacing: .16em;
                   text-transform: uppercase; color: var(--text1); background: none; cursor: pointer;
                   padding: 3px 0; border: none; border-bottom: 1.5px solid transparent; }
.mag-tabs button:hover, .mag-tabs button.on { border-bottom-color: var(--brand-olive-text); color: var(--brand-olive-text); }
.mag-strap { margin: 0; font-family: var(--mag-data); font-size: 10.5px; letter-spacing: .12em;
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
             grid-template-columns: repeat(auto-fit, minmax(232px,1fr)); align-items: start;
             margin-top: clamp(28px,3.2vw,42px); }
.mag-card { display: grid; gap: 8px; align-content: start; }
.mag-card-img { display: block; aspect-ratio: 13/9; overflow: hidden; background: var(--card-bg); }
.mag-card-head { font-family: var(--mag-display); font-weight: 500; margin: 0;
                 font-size: clamp(17px,2vw,23px); line-height: 1.12; }
.mag-card-head a { text-decoration: none; }
.mag-card-head a:hover { color: var(--brand-olive-text); }

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
           grid-template-columns: repeat(auto-fill, minmax(210px,1fr)); align-items: start; }
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
.mag-cal-row { display: grid; grid-template-columns: 132px minmax(0,1fr) auto; gap: 4px 20px;
               align-items: baseline; padding: 13px 0; border-bottom: .5px solid var(--border);
               text-decoration: none; }
.mag-cal-row:hover .mag-cal-title { color: var(--brand-olive-text); }
.mag-cal-house { font-family: var(--mag-data); font-size: 10.5px; letter-spacing: .15em;
                 text-transform: uppercase; color: var(--brand-olive-text); }
.mag-cal-title { font-family: var(--mag-display); font-size: clamp(17px,1.9vw,21px); line-height: 1.15; display: block; }
.mag-cal-place { font-size: 13px; color: var(--text3); margin-top: 2px; display: block; }
.mag-cal-when { font-family: var(--mag-data); font-size: 12px; color: var(--text2); text-align: right;
                white-space: nowrap; font-variant-numeric: tabular-nums; }
.mag-live { display: inline-block; margin-left: 8px; font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase;
            color: var(--brand-olive-text); border: .5px solid var(--brand-olive-text); border-radius: 999px; padding: 2px 7px; }

.mag-colophon { margin: clamp(40px,5vw,70px) 0 0; padding: 18px 0 40px; border-top: 1.5px solid var(--text1);
                font-family: var(--mag-data); font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase;
                color: var(--text3); }

@media (max-width: 900px) { .mag-search { min-width: 0; width: 170px; } }
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
  .mag-cal-row { grid-template-columns: 52px minmax(0,1fr); align-items: start; gap: 3px 14px; padding: 14px 0; }
  .mag-cal-house { grid-column: 1 / -1; }
  .mag-cal-when { grid-column: 1 / -1; text-align: left; margin-top: 6px; }
}
@media (max-width: 620px) { .mag-search { display: none; } .mag-flag { align-items: center; } }
@media (prefers-reduced-motion: reduce) { .mag * { transition: none !important; } }
`;
