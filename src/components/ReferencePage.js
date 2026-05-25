// ReferencePage — the editorial reference-guide surface (Collecting ▸ References).
//
// The first visible node of the Submariner reference graph (ROADMAP Epic 5).
// Renders a hand-authored content node (src/data/referencePages/*) as a
// magazine-style page: hero → story → why it matters → how to read → featured
// variants → live/auction/sold sliders → connections → further reading →
// collector's library → scope note.
//
// Built from the shared library where one exists (CardStrip, Card, Eyebrow,
// imgSrc tokens) and stays on the design-system scales. The live/auction/sold
// and connection sliders pull from `items` at render time (nothing about the
// market is stored in the content file). Sections are self-contained blocks so
// they can later power composable Lists (ROADMAP Epic 3).

import React from "react";
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

// ── small presentational helpers ─────────────────────────────────────────────
function SectionHead({ eyebrow, count, onViewAll, isMobile }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", justifyContent: "space-between",
      gap: 12, padding: isMobile ? "0 16px 10px" : "0 20px 12px",
    }}>
      <Eyebrow>{eyebrow}{count != null && <span style={{ color: "var(--text3)", marginLeft: 8, fontWeight: 500 }}>{count}</span>}</Eyebrow>
      {onViewAll && (
        <button onClick={onViewAll} style={{
          border: "none", background: "none", cursor: "pointer", padding: 0,
          color: "var(--brand)", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
          letterSpacing: "0.02em", whiteSpace: "nowrap",
        }}>View all →</button>
      )}
    </div>
  );
}

const TEMP = {
  conform: { label: "Close", bg: "var(--brand-olive-tint-12)", fg: "var(--brand-olive-text)" },
  expand: { label: "Expand", bg: "var(--brand-tint-10)", fg: "var(--brand)" },
  bridge: { label: "Bridge", bg: "var(--accent-warn-tint-10)", fg: "var(--accent-warn)" },
};

export function ReferencePage({
  node,
  items = [],
  isMobile,
  // Card plumbing (mirrors HomeTab's strip)
  watchlist = {},
  handleWish,
  openCollectionPicker,
  handleShare,
  hidden = {},
  primaryCurrency,
  onClickListing,
  compact,
  user,
  // deep-link to Listings, pre-filtered by reference
  onViewAll,
}) {
  if (!node) return null;

  const matched = items.filter((it) => matchItem(it, node.market));
  const live = matched.filter((it) => !it.sold && !isAuctionItem(it));
  const auction = matched.filter((it) => isAuctionItem(it) && !it.sold);
  const sold = matched.filter((it) => it.sold);

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

  // shared container width — editorial measure on desktop, full-bleed mobile
  const wrap = (children, maxWidth = 1080) => (
    <div style={{ maxWidth, margin: "0 auto", width: "100%" }}>{children}</div>
  );
  const prose = { maxWidth: 720, margin: "0 auto", padding: isMobile ? "0 16px" : "0 20px" };

  const gap = isMobile ? 36 : 56; // vertical rhythm between sections

  // drop-cap split for the first story paragraph
  const firstPara = node.story[0] || "";
  const dropCap = firstPara.charAt(0);
  const restFirst = firstPara.slice(1);

  return (
    <div style={{ background: "var(--bg)", paddingBottom: isMobile ? 60 : 48 }}>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{
        position: "relative", width: "100%",
        height: isMobile ? 300 : 460,
        overflow: "hidden",
      }}>
        <img
          src={imgSrc(node.hero.img)} alt={`${node.brand} ${node.modelLine} ${node.group}`}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.05) 100%)",
        }} />
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          padding: isMobile ? "0 16px 18px" : "0 20px 32px",
        }}>
          {wrap(
            <>
              <div style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.78)", marginBottom: 8,
              }}>{node.brand} · {node.modelLine}</div>
              <h1 style={{
                fontFamily: SERIF, fontWeight: 600, color: "#fff", margin: 0,
                fontSize: isMobile ? 40 : 64, lineHeight: 1.0, letterSpacing: "-0.01em",
              }}>{node.group}</h1>
              <div style={{
                color: "rgba(255,255,255,0.82)", fontSize: isMobile ? 13 : 14,
                marginTop: 10, letterSpacing: "0.01em",
              }}>{node.definer}</div>
            </>
          )}
        </div>
        {node.hero.credit && (
          <a href={node.hero.creditUrl} target="_blank" rel="noopener noreferrer" style={{
            position: "absolute", right: 10, top: 10,
            fontSize: 10, color: "rgba(255,255,255,0.66)", textDecoration: "none",
            background: "rgba(0,0,0,0.32)", padding: "3px 8px", borderRadius: 999,
          }}>Photo · {node.hero.credit} ↗</a>
        )}
      </div>

      {/* ── STORY ────────────────────────────────────────────── */}
      <div style={{ ...prose, marginTop: gap }}>
        <p style={{ fontFamily: SERIF, fontSize: isMobile ? 18 : 20, lineHeight: 1.6, color: "var(--text1)", margin: 0 }}>
          <span style={{
            fontFamily: SERIF, float: "left", fontSize: isMobile ? 52 : 64, lineHeight: 0.82,
            fontWeight: 600, color: "var(--brand-olive-text)", paddingRight: 10, marginTop: 4,
          }}>{dropCap}</span>
          {restFirst}
        </p>
        {node.story.slice(1).map((p, i) => (
          <p key={i} style={{ fontFamily: SERIF, fontSize: isMobile ? 16 : 18, lineHeight: 1.65, color: "var(--text1)", marginTop: 18, marginBottom: 0 }}>{p}</p>
        ))}
      </div>

      {/* ── WHY IT MATTERS ───────────────────────────────────── */}
      <div style={{ ...prose, marginTop: gap }}>
        <Eyebrow style={{ marginBottom: 12 }}>Why it matters</Eyebrow>
        <div style={{
          borderLeft: "3px solid var(--brand-olive)", paddingLeft: isMobile ? 14 : 20,
          fontFamily: SERIF, fontSize: isMobile ? 17 : 19, lineHeight: 1.6, color: "var(--text1)",
        }}>{node.whyItMatters}</div>
      </div>

      {/* ── HOW TO READ ──────────────────────────────────────── */}
      <div style={{ ...prose, marginTop: gap }}>
        <Eyebrow style={{ marginBottom: 16 }}>How collectors read the reference</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 0 }}>
          {node.howToRead.map((c, i) => (
            <div key={i} style={{ padding: "12px 0", borderTop: "0.5px solid var(--border)" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text1)", marginBottom: 3 }}>{c.cue}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text2)" }}>{c.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURED VARIANTS ────────────────────────────────── */}
      {node.variants?.length > 0 && (
        <div style={{ marginTop: gap }}>
          {wrap(<SectionHead eyebrow="Featured variants" isMobile={isMobile} />)}
          {wrap(
            <CardStrip
              items={node.variants} isMobile={isMobile} background="var(--border)"
              renderCard={(v) => (
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
              )}
            />
          )}
        </div>
      )}

      {/* ── MARKET: live / auction / sold ────────────────────── */}
      {[
        { key: "live", label: "On the market now", data: live, sub: "live" },
        { key: "auction", label: "At auction", data: auction, sub: "auctions" },
        { key: "sold", label: "Sold & archive", data: sold, sub: "sold" },
      ].map(({ key, label, data, sub }) => (
        <div key={key} style={{ marginTop: gap }}>
          {wrap(
            <SectionHead
              eyebrow={label} count={data.length} isMobile={isMobile}
              onViewAll={data.length > 0 && onViewAll ? () => onViewAll(node.market.refs, sub) : undefined}
            />
          )}
          {data.length > 0
            ? wrap(<CardStrip items={data} isMobile={isMobile} max={12} background="var(--border)" renderCard={renderListingCard} />)
            : wrap(<div style={{ padding: isMobile ? "0 16px" : "0 20px", fontSize: 13, color: "var(--text3)" }}>Nothing here right now — check back as the scrape refreshes.</div>)}
        </div>
      ))}

      {/* ── CONNECTIONS ──────────────────────────────────────── */}
      {node.connections?.length > 0 && (
        <div style={{ marginTop: gap }}>
          {wrap(<SectionHead eyebrow="Where collectors go next" isMobile={isMobile} />)}
          {wrap(
            <div>
              {node.connections.map((conn, i) => {
                const ex = items.filter((it) => matchItem(it, conn.match));
                ex.sort((a, b) => (a.sold === b.sold ? 0 : a.sold ? 1 : -1)); // live first
                const t = TEMP[conn.temperature] || TEMP.expand;
                return (
                  <div key={i} style={{ borderTop: "0.5px solid var(--border)", padding: isMobile ? "16px 0" : "18px 0" }}>
                    <div style={{ padding: isMobile ? "0 16px" : "0 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
                          color: t.fg, background: t.bg, padding: "2px 8px", borderRadius: 999,
                        }}>{t.label}</span>
                        <span style={{ fontFamily: SERIF, fontSize: isMobile ? 17 : 19, fontWeight: 600, color: "var(--text1)" }}>{conn.label}</span>
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--text2)", maxWidth: 640 }}>{conn.why}</div>
                    </div>
                    {ex.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <CardStrip items={ex} isMobile={isMobile} max={10} background="var(--border)" renderCard={renderListingCard} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── FURTHER READING ──────────────────────────────────── */}
      {node.readingList?.length > 0 && (
        <div style={{ ...prose, marginTop: gap }}>
          <Eyebrow style={{ marginBottom: 14 }}>Further reading</Eyebrow>
          {Array.from(new Set(node.readingList.map((r) => r.group))).map((group) => (
            <div key={group} style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>{group}</div>
              {node.readingList.filter((r) => r.group === group).map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                  display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline",
                  textDecoration: "none", color: "inherit", padding: "11px 0", borderTop: "0.5px solid var(--border)",
                }}>
                  <span style={{ fontFamily: SERIF, fontSize: isMobile ? 16 : 17, color: "var(--text1)", lineHeight: 1.3 }}>{r.title}</span>
                  <span style={{ fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{r.publication} ↗</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── COLLECTOR'S LIBRARY ──────────────────────────────── */}
      {node.books?.length > 0 && (
        <div style={{ ...prose, marginTop: gap }}>
          <Eyebrow style={{ marginBottom: 4 }}>Collector's library</Eyebrow>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>Selected for reference value — credited links, no affiliations.</div>
          {node.books.map((b, i) => (
            <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" style={{
              display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline",
              textDecoration: "none", color: "inherit", padding: "11px 0", borderTop: "0.5px solid var(--border)",
            }}>
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
