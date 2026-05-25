// ReferencePage — the editorial reference-guide surface (Collecting ▸ References).
//
// First visible node of the Submariner reference graph (ROADMAP Epic 5). Renders
// a hand-authored content node (src/data/referencePages/*) as a magazine-style
// page. Purpose (memory project_reference_page_design): "why you should love
// this watch" — celebrate + contextualise; the collecting JOURNEY lives in the
// coaching part of the site, never here.
//
// Section flow: hero → The Submariner (model intro) → 5512/13 story → in its
// time → points to look for (+ featured-variant call-out) → the market (one
// segmented strip) → where to explore next (the rabbit hole: AI-mapped, one card
// expands to all) → further reading (pinned guides, then stories & images) →
// collector's library → scope note.
//
// Built from the shared library (CardStrip, Card, Eyebrow, imgSrc) on the
// design-system token scales. Live/market + connection examples pull from
// `items` at render; nothing about the market is stored in the content node.

import React, { useState } from "react";
import CardStrip from "./CardStrip";
import { Card } from "./Card";
import Eyebrow from "./Eyebrow";
import { imgSrc } from "../utils";

const SERIF = "'Iowan Old Style', Georgia, 'Times New Roman', serif";

// ── item matching ──────────────────────────────────────────────────────────
const itemBlob = (it) =>
  `${it.ref || ""} ${it.reference_no || ""} ${it.model_line || ""} ${it.brand || ""}`.toLowerCase();

function matchItem(it, spec) {
  const blob = itemBlob(it);
  if (spec.brand && !blob.includes(spec.brand)) return false;
  if (spec.refs && spec.refs.some((r) => new RegExp(`\\b${r}\\b`).test(blob))) return true;
  if (spec.text && spec.text.some((t) => blob.includes(t))) return true;
  return false;
}
const isAuctionItem = (it) => !!it._isAuctionFormat || !!it._isTrackedLot;

const DIST = {
  similar: { label: "Similar", bg: "var(--brand-olive-tint-12)", fg: "var(--brand-olive-text)" },
  adjacent: { label: "Adjacent", bg: "var(--brand-tint-10)", fg: "var(--brand)" },
  edge: { label: "Edge case", bg: "var(--accent-warn-tint-10)", fg: "var(--accent-warn)" },
};

export function ReferencePage({
  node,
  items = [],
  isMobile,
  watchlist = {},
  handleWish,
  openCollectionPicker,
  handleShare,
  hidden = {},
  primaryCurrency,
  onClickListing,
  compact,
  user,
  onViewAll,
}) {
  const [segment, setSegment] = useState("live");
  const [openConn, setOpenConn] = useState(null);
  if (!node) return null;

  const matched = items.filter((it) => matchItem(it, node.market));
  const market = {
    live: matched.filter((it) => !it.sold && !isAuctionItem(it)),
    auctions: matched.filter((it) => isAuctionItem(it) && !it.sold),
    sold: matched.filter((it) => it.sold),
  };

  const renderListingCard = (item) => (
    <Card
      item={item}
      wished={!!watchlist[item.id]}
      onWish={handleWish}
      compact={compact}
      isHidden={!!hidden[item.id]}
      onAddToCollection={user ? openCollectionPicker : undefined}
      primaryCurrency={primaryCurrency}
      onShare={handleShare}
      onClickListing={onClickListing}
    />
  );

  // editorial-card renderer (reference guides + stories tiers)
  const renderEditorialCard = (a) => (
    <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
      <div style={{ width: "100%", aspectRatio: "4 / 3", overflow: "hidden", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {a.img
          ? <img src={imgSrc(a.img)} alt={a.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <span style={{ fontFamily: SERIF, fontSize: 15, color: "var(--text3)", padding: 12, textAlign: "center" }}>{a.publication}</span>}
      </div>
      <div style={{ padding: "8px 10px 12px" }}>
        <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: "var(--text1)", lineHeight: 1.25 }}>{a.title}</div>
        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>{a.publication} ↗</div>
      </div>
    </a>
  );

  const wrap = (children, maxWidth = 1080) => (
    <div style={{ maxWidth, margin: "0 auto", width: "100%" }}>{children}</div>
  );
  const prose = { maxWidth: 720, margin: "0 auto", padding: isMobile ? "0 16px" : "0 20px" };
  const gap = isMobile ? 34 : 52;

  const firstPara = node.story[0] || "";

  const sectionHead = (eyebrow, count, viewAll) => (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: isMobile ? "0 16px 10px" : "0 20px 12px" }}>
      <Eyebrow>{eyebrow}{count != null && <span style={{ color: "var(--text3)", marginLeft: 8, fontWeight: 500 }}>{count}</span>}</Eyebrow>
      {viewAll && (
        <button onClick={viewAll} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, color: "var(--brand)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>View all →</button>
      )}
    </div>
  );

  return (
    <div style={{ background: "var(--bg)", paddingBottom: isMobile ? 60 : 48 }}>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ position: "relative", width: "100%", height: isMobile ? 320 : 480, overflow: "hidden" }}>
        <img src={imgSrc(node.hero.img)} alt={`${node.brand} ${node.modelLine} ${node.group}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0.18) 48%, rgba(0,0,0,0.05) 100%)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: isMobile ? "0 16px 20px" : "0 20px 34px" }}>
          {wrap(
            <>
              <div style={{ fontSize: isMobile ? 15 : 20, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.86)", marginBottom: isMobile ? 8 : 10 }}>{node.brand} · {node.modelLine}</div>
              <h1 style={{ fontFamily: SERIF, fontWeight: 600, color: "#fff", margin: 0, fontSize: isMobile ? 44 : 72, lineHeight: 0.98, letterSpacing: "-0.01em" }}>{node.group}</h1>
              <div style={{ color: "rgba(255,255,255,0.82)", fontSize: isMobile ? 13 : 14, marginTop: 10, letterSpacing: "0.01em" }}>{node.definer}</div>
            </>
          )}
        </div>
        {node.hero.credit && (
          <a href={node.hero.creditUrl} target="_blank" rel="noopener noreferrer" style={{ position: "absolute", right: 10, top: 10, fontSize: 10, color: "rgba(255,255,255,0.66)", textDecoration: "none", background: "rgba(0,0,0,0.32)", padding: "3px 8px", borderRadius: 999 }}>Photo · {node.hero.credit} ↗</a>
        )}
      </div>

      {/* ── THE SUBMARINER (model intro) ─────────────────────── */}
      {node.modelIntro && (
        <div style={{ ...prose, marginTop: gap }}>
          <Eyebrow style={{ marginBottom: 12 }}>The {node.modelLine}</Eyebrow>
          <p style={{ fontFamily: SERIF, fontSize: isMobile ? 17 : 19, lineHeight: 1.6, color: "var(--text2)", margin: 0 }}>{node.modelIntro}</p>
        </div>
      )}

      {/* ── STORY ────────────────────────────────────────────── */}
      <div style={{ ...prose, marginTop: gap }}>
        <Eyebrow style={{ marginBottom: 14 }}>The {node.group}</Eyebrow>
        <p style={{ fontFamily: SERIF, fontSize: isMobile ? 18 : 20, lineHeight: 1.6, color: "var(--text1)", margin: 0 }}>
          <span style={{ fontFamily: SERIF, float: "left", fontSize: isMobile ? 52 : 64, lineHeight: 0.82, fontWeight: 600, color: "var(--brand-olive-text)", paddingRight: 10, marginTop: 4 }}>{firstPara.charAt(0)}</span>
          {firstPara.slice(1)}
        </p>
        {node.story.slice(1).map((p, i) => (
          <p key={i} style={{ fontFamily: SERIF, fontSize: isMobile ? 16 : 18, lineHeight: 1.65, color: "var(--text1)", marginTop: 18, marginBottom: 0 }}>{p}</p>
        ))}
      </div>

      {/* ── IN ITS TIME (cultural beat) ──────────────────────── */}
      {node.inItsTime && (
        <div style={{ ...prose, marginTop: gap }}>
          <Eyebrow style={{ marginBottom: 12 }}>In its time</Eyebrow>
          <div style={{ borderLeft: "3px solid var(--brand-olive)", paddingLeft: isMobile ? 14 : 20, fontFamily: SERIF, fontSize: isMobile ? 17 : 19, lineHeight: 1.6, color: "var(--text1)" }}>{node.inItsTime}</div>
        </div>
      )}

      {/* ── POINTS TO LOOK FOR (+ variant call-out) ──────────── */}
      <div style={{ ...prose, marginTop: gap }}>
        <Eyebrow style={{ marginBottom: 16 }}>Points to look for</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 0 }}>
          {node.pointsToLookFor.map((c, i) => (
            <div key={i} style={{ padding: "11px 0", borderTop: "0.5px solid var(--border)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text1)" }}>{c.term}</div>
              {c.note && <div style={{ fontSize: 13, lineHeight: 1.45, color: "var(--text3)", marginTop: 2 }}>{c.note}</div>}
            </div>
          ))}
        </div>
      </div>
      {node.variants?.length > 0 && (
        <div style={{ marginTop: isMobile ? 20 : 24 }}>
          {wrap(<div style={{ padding: isMobile ? "0 16px 8px" : "0 20px 10px" }}><Eyebrow tone="secondary">Variants to know</Eyebrow></div>)}
          {wrap(
            <CardStrip items={node.variants} isMobile={isMobile} background="var(--border)" renderCard={(v) => (
              <a href={v.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                <div style={{ width: "100%", aspectRatio: "1 / 1", overflow: "hidden", background: "var(--surface)" }}>
                  <img src={imgSrc(v.img)} alt={v.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div style={{ padding: "8px 10px 12px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text1)", lineHeight: 1.25 }}>{v.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3, lineHeight: 1.35 }}>{v.traits}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>{v.source} ↗</div>
                </div>
              </a>
            )} />
          )}
        </div>
      )}

      {/* ── THE MARKET (one segmented strip) ─────────────────── */}
      <div style={{ marginTop: gap }}>
        {wrap(
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: isMobile ? "0 16px 12px" : "0 20px 14px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { k: "live", label: "Available", sub: "live" },
                { k: "auctions", label: "At auction", sub: "auctions" },
                { k: "sold", label: "Sold", sub: "sold" },
              ].map(({ k, label }) => {
                const active = segment === k;
                return (
                  <button key={k} onClick={() => setSegment(k)} style={{
                    border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
                    padding: "6px 12px", borderRadius: 999,
                    background: active ? "var(--brand-olive)" : "var(--surface)",
                    color: active ? "#fff" : "var(--text2)",
                  }}>{label} <span style={{ opacity: 0.7, fontWeight: 500 }}>{market[k].length}</span></button>
                );
              })}
            </div>
            {market[segment].length > 0 && onViewAll && (
              <button onClick={() => onViewAll(node.market.refs, segment)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, color: "var(--brand)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}>View all →</button>
            )}
          </div>
        )}
        {market[segment].length > 0
          ? wrap(<CardStrip items={market[segment]} isMobile={isMobile} max={12} background="var(--border)" renderCard={renderListingCard} />)
          : wrap(<div style={{ padding: isMobile ? "0 16px" : "0 20px", fontSize: 13, color: "var(--text3)" }}>Nothing here right now — this refreshes as the scrape runs.</div>)}
      </div>

      {/* ── WHERE TO EXPLORE NEXT (the rabbit hole) ──────────── */}
      {node.connections?.length > 0 && (
        <div style={{ marginTop: gap }}>
          {wrap(
            <div style={{ padding: isMobile ? "0 16px 4px" : "0 20px 4px" }}>
              <Eyebrow>Where to explore next</Eyebrow>
              <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6, lineHeight: 1.5, maxWidth: 560 }}>
                An AI map across thousands of listings and write-ups — part machine, part human, and still learning. Something look off?{" "}
                <a href="mailto:mark@mutter.co.uk?subject=Reference%20suggestion%3A%205512%2F5513" style={{ color: "var(--brand)", textDecoration: "none" }}>Suggest a fix</a>.
              </div>
            </div>
          )}
          {wrap(
            <div style={{ marginTop: 8 }}>
              {node.connections.map((conn, i) => {
                const ex = items.filter((it) => matchItem(it, conn.match));
                ex.sort((a, b) => (a.sold === b.sold ? 0 : a.sold ? 1 : -1));
                const d = DIST[conn.distance] || DIST.adjacent;
                const open = openConn === i;
                const chip = (
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: d.fg, background: d.bg, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{d.label}</span>
                );
                if (open) {
                  return (
                    <div key={i} style={{ borderTop: "0.5px solid var(--border)", padding: isMobile ? "14px 0" : "16px 0" }}>
                      <div style={{ padding: isMobile ? "0 16px" : "0 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
                          <button onClick={() => setOpenConn(null)} style={{ border: "none", background: "var(--surface)", color: "var(--text2)", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 999 }}>✕ Close</button>
                          {chip}
                          <span style={{ fontFamily: SERIF, fontSize: isMobile ? 17 : 19, fontWeight: 600, color: "var(--text1)" }}>{conn.label}</span>
                        </div>
                        <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text2)", maxWidth: 640 }}>{conn.why}</div>
                      </div>
                      {ex.length > 0 && <div style={{ marginTop: 12 }}><CardStrip items={ex} isMobile={isMobile} max={14} background="var(--border)" renderCard={renderListingCard} /></div>}
                    </div>
                  );
                }
                const thumb = ex[0]?.img;
                const canOpen = ex.length > 0;
                return (
                  <div key={i} onClick={canOpen ? () => setOpenConn(i) : undefined} style={{ display: "flex", gap: 12, alignItems: "center", borderTop: "0.5px solid var(--border)", padding: isMobile ? "12px 16px" : "14px 20px", cursor: canOpen ? "pointer" : "default" }}>
                    <div style={{ flex: "0 0 auto", width: 56, height: 56, borderRadius: 8, overflow: "hidden", background: "var(--surface)" }}>
                      {thumb && <img src={imgSrc(thumb)} alt={conn.label} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                        {chip}
                        <span style={{ fontFamily: SERIF, fontSize: isMobile ? 16 : 18, fontWeight: 600, color: "var(--text1)" }}>{conn.label}</span>
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.45, color: "var(--text2)" }}>{conn.why}</div>
                    </div>
                    {canOpen && <div style={{ flex: "0 0 auto", color: "var(--brand)", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{ex.length} →</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── FURTHER READING — pinned guides, then stories ────── */}
      {node.referenceGuides?.length > 0 && (
        <div style={{ marginTop: gap }}>
          {wrap(<div style={{ padding: isMobile ? "0 16px 10px" : "0 20px 12px" }}><Eyebrow>Reference guides</Eyebrow></div>)}
          {wrap(<CardStrip items={node.referenceGuides} isMobile={isMobile} background="var(--border)" renderCard={renderEditorialCard} />)}
        </div>
      )}
      {node.storiesAndImages?.length > 0 && (
        <div style={{ marginTop: isMobile ? 22 : 28 }}>
          {wrap(<div style={{ padding: isMobile ? "0 16px 10px" : "0 20px 12px" }}><Eyebrow tone="secondary">Stories &amp; images</Eyebrow></div>)}
          {wrap(<CardStrip items={node.storiesAndImages} isMobile={isMobile} background="var(--border)" renderCard={renderEditorialCard} />)}
        </div>
      )}

      {/* ── COLLECTOR'S LIBRARY ──────────────────────────────── */}
      {node.books?.length > 0 && (
        <div style={{ ...prose, marginTop: gap }}>
          <Eyebrow style={{ marginBottom: 4 }}>Collector's library</Eyebrow>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>Selected for reference value — credited links, no affiliations.</div>
          {node.books.map((b, i) => (
            <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline", textDecoration: "none", color: "inherit", padding: "11px 0", borderTop: "0.5px solid var(--border)" }}>
              <span style={{ fontFamily: SERIF, fontSize: isMobile ? 16 : 17, color: "var(--text1)", lineHeight: 1.3 }}>{b.title}</span>
              <span style={{ fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{b.author} ↗</span>
            </a>
          ))}
        </div>
      )}

      {/* ── SCOPE & SOURCING ─────────────────────────────────── */}
      {node.scopeNote && (
        <div style={{ ...prose, marginTop: gap }}>
          <div style={{ borderTop: "0.5px solid var(--border)", paddingTop: 14 }}>
            <Eyebrow style={{ marginBottom: 8 }}>Scope &amp; sourcing</Eyebrow>
            <div style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text3)" }}>{node.scopeNote}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReferencePage;
