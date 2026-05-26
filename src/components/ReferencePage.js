// ReferencePage — the editorial reference-guide surface (Collecting ▸ References).
//
// First visible node of the Submariner reference graph (ROADMAP Epic 5). Renders
// a hand-authored content node (src/data/referencePages/*) as a long-form
// collector guide. Purpose: "why you should love this watch" — celebrate +
// contextualise; the collecting JOURNEY lives in coaching, never here.
//
// Layout: mobile is a single vertical column; desktop uses the width — the
// guides and marks pair their description BESIDE the article/example they refer
// to (two columns). Reading prose (intro / story / in its time / how to look)
// stays at an editorial measure; the paired + strip sections go wide.
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
  node, items = [], isMobile,
  watchlist = {}, handleWish, openCollectionPicker, handleShare,
  hidden = {}, primaryCurrency, onClickListing, compact, user, onViewAll,
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
    <Card item={item} wished={!!watchlist[item.id]} onWish={handleWish} compact={compact}
      isHidden={!!hidden[item.id]} onAddToCollection={user ? openCollectionPicker : undefined}
      primaryCurrency={primaryCurrency} onShare={handleShare} onClickListing={onClickListing} />
  );
  const renderEditorialCard = (a) => (
    <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
      <div style={{ width: "100%", aspectRatio: "4 / 3", overflow: "hidden", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {a.img ? <img src={imgSrc(a.img)} alt={a.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
               : <span style={{ fontFamily: SERIF, fontSize: 15, color: "var(--text3)", padding: 12, textAlign: "center" }}>{a.publication}</span>}
      </div>
      <div style={{ padding: "8px 10px 12px" }}>
        <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600, color: "var(--text1)", lineHeight: 1.25 }}>{a.title}</div>
        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>{a.publication} ↗</div>
      </div>
    </a>
  );

  const wide = (children) => <div style={{ maxWidth: 1040, margin: "0 auto", width: "100%", padding: isMobile ? "0 16px" : "0 20px" }}>{children}</div>;
  const wrapStrip = (children) => <div style={{ maxWidth: 1080, margin: "0 auto", width: "100%" }}>{children}</div>;
  const prose = { maxWidth: 720, margin: "0 auto", padding: isMobile ? "0 16px" : "0 20px" };
  const gap = isMobile ? 36 : 60;

  // two-column paired row: desktop text|media, mobile media-then-text stacked
  const paired = (text, media, key) => (
    <div key={key} style={{ display: "grid", gridTemplateColumns: isMobile || !media ? "1fr" : "1fr 1fr", gap: isMobile ? 14 : 36, alignItems: "center", padding: isMobile ? "18px 0" : "22px 0", borderTop: "0.5px solid var(--border)" }}>
      {isMobile && media}
      {text}
      {!isMobile && media}
    </div>
  );

  const firstPara = node.story[0] || "";
  const stripHead = (eyebrow, tone, right) => (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: isMobile ? "0 16px 10px" : "0 20px 12px" }}>
      <Eyebrow tone={tone}>{eyebrow}</Eyebrow>{right}
    </div>
  );

  return (
    <div style={{ background: "var(--bg)", paddingBottom: isMobile ? 60 : 48 }}>
      {/* HERO */}
      <div style={{ position: "relative", width: "100%", height: isMobile ? 320 : 480, overflow: "hidden" }}>
        <img src={imgSrc(node.hero.img)} alt={`${node.brand} ${node.modelLine} ${node.group}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0.18) 48%, rgba(0,0,0,0.05) 100%)" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: isMobile ? "0 16px 20px" : "0 20px 34px" }}>
          <div style={{ maxWidth: 1040, margin: "0 auto" }}>
            <div style={{ fontSize: isMobile ? 15 : 20, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.86)", marginBottom: isMobile ? 8 : 10 }}>{node.brand} · {node.modelLine}</div>
            <h1 style={{ fontFamily: SERIF, fontWeight: 600, color: "#fff", margin: 0, fontSize: isMobile ? 44 : 72, lineHeight: 0.98, letterSpacing: "-0.01em" }}>{node.group}</h1>
            <div style={{ color: "rgba(255,255,255,0.82)", fontSize: isMobile ? 13 : 14, marginTop: 10 }}>{node.definer}</div>
          </div>
        </div>
        {node.hero.credit && (
          <a href={node.hero.creditUrl} target="_blank" rel="noopener noreferrer" style={{ position: "absolute", right: 10, top: 10, fontSize: 10, color: "rgba(255,255,255,0.66)", textDecoration: "none", background: "rgba(0,0,0,0.32)", padding: "3px 8px", borderRadius: 999 }}>Photo · {node.hero.credit} ↗</a>
        )}
      </div>

      {/* MODEL INTRO */}
      {node.modelIntro && (
        <div style={{ ...prose, marginTop: gap }}>
          <Eyebrow style={{ marginBottom: 12 }}>The {node.modelLine}</Eyebrow>
          <p style={{ fontFamily: SERIF, fontSize: isMobile ? 17 : 19, lineHeight: 1.6, color: "var(--text2)", margin: 0 }}>{node.modelIntro}</p>
        </div>
      )}

      {/* STORY */}
      <div style={{ ...prose, marginTop: gap }}>
        <Eyebrow style={{ marginBottom: 14 }}>The {node.group}</Eyebrow>
        <p style={{ fontFamily: SERIF, fontSize: isMobile ? 18 : 20, lineHeight: 1.6, color: "var(--text1)", margin: 0 }}>
          <span style={{ fontFamily: SERIF, float: "left", fontSize: isMobile ? 52 : 66, lineHeight: 0.82, fontWeight: 600, color: "var(--brand-olive-text)", paddingRight: 10, marginTop: 4 }}>{firstPara.charAt(0)}</span>
          {firstPara.slice(1)}
        </p>
        {node.story.slice(1).map((p, i) => (
          <p key={i} style={{ fontFamily: SERIF, fontSize: isMobile ? 16 : 18, lineHeight: 1.65, color: "var(--text1)", marginTop: 18, marginBottom: 0 }}>{p}</p>
        ))}
      </div>

      {/* IN ITS TIME */}
      {node.inItsTime && (
        <div style={{ ...prose, marginTop: gap }}>
          <Eyebrow style={{ marginBottom: 12 }}>In its time</Eyebrow>
          <div style={{ borderLeft: "3px solid var(--brand-olive)", paddingLeft: isMobile ? 14 : 20, fontFamily: SERIF, fontSize: isMobile ? 17 : 19, lineHeight: 1.6, color: "var(--text1)" }}>{node.inItsTime}</div>
        </div>
      )}

      {/* START HERE — annotated guides, paired */}
      {node.guides?.length > 0 && (
        <div style={{ marginTop: gap }}>
          {wide(<Eyebrow style={{ marginBottom: 4 }}>Start here — the best guides</Eyebrow>)}
          {wide(
            <div>
              {node.guides.map((g, i) => paired(
                <div key="t">
                  <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{g.publication}</div>
                  <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: SERIF, fontSize: isMobile ? 20 : 24, fontWeight: 600, color: "var(--text1)", textDecoration: "none", lineHeight: 1.2, display: "block" }}>{g.title}</a>
                  <p style={{ fontSize: isMobile ? 14 : 15, lineHeight: 1.55, color: "var(--text2)", marginTop: 10, marginBottom: 10 }}>{g.blurb}</p>
                  <div style={{ fontSize: 13, color: "var(--text2)" }}><span style={{ fontWeight: 600 }}>Read this for:</span> {g.readThisFor}. <a href={g.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand)", textDecoration: "none", whiteSpace: "nowrap" }}>Read ↗</a></div>
                </div>,
                <a key="m" href={g.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: 10, overflow: "hidden", background: "var(--surface)", aspectRatio: "4 / 3" }}>
                  {g.img ? <img src={imgSrc(g.img)} alt={g.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                         : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, color: "var(--text3)", fontSize: 16, textAlign: "center", padding: 16 }}>{g.publication}</div>}
                </a>,
                i
              ))}
            </div>
          )}
        </div>
      )}

      {/* LEARN THE MARKS — prose paired with example image */}
      {node.marks?.length > 0 && (
        <div style={{ marginTop: gap }}>
          {wide(<Eyebrow style={{ marginBottom: 4 }}>Learn the marks</Eyebrow>)}
          {wide(
            <div>
              {node.marks.map((m, i) => paired(
                <div key="t">
                  <div style={{ fontFamily: SERIF, fontSize: isMobile ? 19 : 22, fontWeight: 600, color: "var(--text1)", marginBottom: 8 }}>{m.name}</div>
                  <p style={{ fontSize: isMobile ? 15 : 16, lineHeight: 1.6, color: "var(--text2)", margin: 0 }}>{m.body}</p>
                </div>,
                m.img ? (
                  <a key="m" href={m.url || undefined} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                    <div style={{ borderRadius: 10, overflow: "hidden", background: "var(--surface)", aspectRatio: "4 / 3" }}>
                      <img src={imgSrc(m.img)} alt={m.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                    {m.source && <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>{m.source} ↗</div>}
                  </a>
                ) : null,
                i
              ))}
            </div>
          )}
        </div>
      )}

      {/* VARIANTS WORTH SEEING */}
      {node.variants?.length > 0 && (
        <div style={{ marginTop: isMobile ? 22 : 28 }}>
          {wrapStrip(stripHead("Variants worth seeing", "secondary"))}
          {wrapStrip(<CardStrip items={node.variants} isMobile={isMobile} background="var(--border)" renderCard={(v) => (
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
          )} />)}
        </div>
      )}

      {/* HOW TO LOOK */}
      {node.howToLook && (
        <div style={{ ...prose, marginTop: gap }}>
          <Eyebrow style={{ marginBottom: 12 }}>Look at real examples</Eyebrow>
          <p style={{ fontFamily: SERIF, fontSize: isMobile ? 16 : 18, lineHeight: 1.6, color: "var(--text1)", marginTop: 0 }}>{node.howToLook.intro}</p>
          <ul style={{ listStyle: "none", padding: 0, margin: "4px 0 0" }}>
            {node.howToLook.checks.map((c, i) => (
              <li key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: "0.5px solid var(--border)", fontSize: 14, lineHeight: 1.5, color: "var(--text2)" }}>
                <span style={{ color: "var(--brand-olive-text)", flex: "0 0 auto" }}>·</span>{c}
              </li>
            ))}
          </ul>
          {node.howToLook.outro && <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: isMobile ? 15 : 16, color: "var(--text2)", marginTop: 14 }}>{node.howToLook.outro}</p>}
        </div>
      )}

      {/* THE MARKET — one segmented strip */}
      <div style={{ marginTop: gap }}>
        {wrapStrip(
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: isMobile ? "0 16px 12px" : "0 20px 14px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {[{ k: "live", label: "Available" }, { k: "auctions", label: "At auction" }, { k: "sold", label: "Sold" }].map(({ k, label }) => {
                const active = segment === k;
                return (
                  <button key={k} onClick={() => setSegment(k)} style={{ border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: active ? "var(--brand-olive)" : "var(--surface)", color: active ? "#fff" : "var(--text2)" }}>
                    {label} <span style={{ opacity: 0.7, fontWeight: 500 }}>{market[k].length}</span>
                  </button>
                );
              })}
            </div>
            {market[segment].length > 0 && onViewAll && (
              <button onClick={() => onViewAll(node.market.refs, segment)} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, color: "var(--brand)", fontSize: 12, fontWeight: 600, fontFamily: "inherit", whiteSpace: "nowrap" }}>View all →</button>
            )}
          </div>
        )}
        {market[segment].length > 0
          ? wrapStrip(<CardStrip items={market[segment]} isMobile={isMobile} max={12} background="var(--border)" renderCard={renderListingCard} />)
          : wrapStrip(<div style={{ padding: isMobile ? "0 16px" : "0 20px", fontSize: 13, color: "var(--text3)" }}>Nothing here right now — this refreshes as the scrape runs.</div>)}
      </div>

      {/* WHERE TO EXPLORE NEXT — the rabbit hole */}
      {node.connections?.length > 0 && (
        <div style={{ marginTop: gap }}>
          {wrapStrip(
            <div style={{ padding: isMobile ? "0 16px 6px" : "0 20px 8px" }}>
              <Eyebrow>Where to explore next</Eyebrow>
              {node.whereNext && <p style={{ fontFamily: SERIF, fontSize: isMobile ? 16 : 18, lineHeight: 1.6, color: "var(--text1)", marginTop: 12, marginBottom: 10, maxWidth: 720 }}>{node.whereNext}</p>}
              <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.5, maxWidth: 560 }}>
                An AI map across thousands of listings and write-ups — part machine, part human, and still learning. Something look off?{" "}
                <a href="mailto:mark@mutter.co.uk?subject=Reference%20suggestion%3A%205512%2F5513" style={{ color: "var(--brand)", textDecoration: "none" }}>Suggest a fix</a>.
              </div>
            </div>
          )}
          {wrapStrip(
            <div style={{ marginTop: 8 }}>
              {node.connections.map((conn, i) => {
                const ex = items.filter((it) => matchItem(it, conn.match));
                ex.sort((a, b) => (a.sold === b.sold ? 0 : a.sold ? 1 : -1));
                const d = DIST[conn.distance] || DIST.adjacent;
                const open = openConn === i;
                const chip = <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: d.fg, background: d.bg, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{d.label}</span>;
                if (open) {
                  return (
                    <div key={i} style={{ borderTop: "0.5px solid var(--border)", padding: isMobile ? "14px 0" : "16px 0" }}>
                      <div style={{ padding: isMobile ? "0 16px" : "0 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
                          <button onClick={() => setOpenConn(null)} style={{ border: "none", background: "var(--surface)", color: "var(--text2)", cursor: "pointer", fontFamily: "inherit", fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 999 }}>✕ Close</button>
                          {chip}<span style={{ fontFamily: SERIF, fontSize: isMobile ? 17 : 19, fontWeight: 600, color: "var(--text1)" }}>{conn.label}</span>
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
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>{chip}<span style={{ fontFamily: SERIF, fontSize: isMobile ? 16 : 18, fontWeight: 600, color: "var(--text1)" }}>{conn.label}</span></div>
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

      {/* STORIES & IMAGES */}
      {node.storiesAndImages?.length > 0 && (
        <div style={{ marginTop: gap }}>
          {wrapStrip(stripHead("Stories & images", "secondary"))}
          {wrapStrip(<CardStrip items={node.storiesAndImages} isMobile={isMobile} background="var(--border)" renderCard={renderEditorialCard} />)}
        </div>
      )}

      {/* COLLECTOR'S LIBRARY */}
      {node.books?.length > 0 && (
        <div style={{ ...prose, marginTop: gap }}>
          <Eyebrow style={{ marginBottom: 4 }}>Books worth having nearby</Eyebrow>
          <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 12 }}>Credited links, no affiliations.</div>
          {node.books.map((b, i) => (
            <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", color: "inherit", padding: "12px 0", borderTop: "0.5px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline" }}>
                <span style={{ fontFamily: SERIF, fontSize: isMobile ? 16 : 17, color: "var(--text1)", lineHeight: 1.3 }}>{b.title}</span>
                <span style={{ fontSize: 11, color: "var(--text3)", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>{b.author} ↗</span>
              </div>
              {b.note && <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 4, lineHeight: 1.45 }}>{b.note}</div>}
            </a>
          ))}
        </div>
      )}

      {/* SCOPE & SOURCING */}
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
