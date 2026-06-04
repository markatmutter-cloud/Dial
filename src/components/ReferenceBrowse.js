import React, { useEffect, useState, useCallback } from "react";
import { ReferencePage } from "./ReferencePage";
import { Breadcrumb } from "./Breadcrumb";
import { PageHeader } from "./PageHeader";
import { Chip } from "./Chip";
import { StandardFilterBar, standardSearchInputStyle } from "./StandardFilterBar";
import { editorialHeading, editorialProse, editorialTitle, inputBase, pillBase, clearAllPill, cardGridStyle } from "../styles";
import { imgSrc } from "../utils";
import {
  REFERENCE_NODES,
  REFERENCE_NODES_BY_ID,
  isLiveNode,
  referenceUpdatedAt,
  referenceAsListing,
} from "../data/referencePages";
import { askLumeAbout } from "./LumeBus";

// Reference browse surface (Collecting ▸ Reference guides).
//
// 2026-06-01 (Mark): while the corpus is small, the brand→model-line→reference
// TREE was over-built — three taps to reach four guides. Flattened to a single
// card grid (hero + reference name, like the Articles tab), newest-updated
// first, with a search box + brand filter on top. The hierarchy returns when
// the corpus grows. Live nodes open the full ReferencePage; coming_soon stubs
// open a teaser with a "subscribe to unlock" demand smoke test.
//
// Self-contained nav (its own ?ref URL param) so it adds NO hooks to App.js's
// top level (React #310 safety).

const comingBadge = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  color: "var(--text3)",
  border: "0.5px solid var(--border)",
  borderRadius: 999,
  padding: "1px 7px",
};

function viewFromSearch(search) {
  const p = new URLSearchParams(search || "");
  const ref = p.get("ref");
  if (ref) return { level: "node", nodeId: ref };
  return { level: "home" };
}

// Build a URL from the CURRENT location, replacing only the ?ref param —
// preserves the app's ?tab=/?sub= params so the sub-tab stays selected.
function urlForView(view) {
  const p = new URLSearchParams(window.location.search);
  ["ref", "rbrand", "rmodel"].forEach((k) => p.delete(k));
  if (view.level === "node") p.set("ref", view.nodeId);
  const qs = p.toString();
  return qs ? "?" + qs : window.location.pathname;
}

export function ReferenceBrowse(props) {
  const { isMobile } = props;
  const [view, setView] = useState(() => viewFromSearch(window.location.search));
  const [q, setQ] = useState("");
  // Brand filter — multi-select via a Brand pill + chip expansion panel
  // (P-4, 2026-06-03): the spelled-out brand row under the search didn't
  // match the Articles pattern; same pill + panel as every other surface.
  const [activeBrands, setActiveBrands] = useState([]);
  // ♥ Saved — filter to guides the user has saved (P-4; label never
  // "Hearted" — Mark's no-hearted-label rule).
  const [heartedOnly, setHeartedOnly] = useState(false);
  const [activeFilterPop, setActiveFilterPop] = useState(null);

  useEffect(() => {
    const onPop = () => setView(viewFromSearch(window.location.search));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Drill-in pushes (browser-back returns to the grid); see CLAUDE.md nav rules.
  const go = useCallback((next) => {
    window.history.pushState({}, "", urlForView(next));
    setView(next);
  }, []);

  // Re-tap of the active Reference Guides top pill → exit a drilled-in guide
  // back to the index (P-15, Mark 2026-06-03). The breadcrumb stays as the
  // second door. URL cleanup is a REPLACE (drops ?ref) per CLAUDE.md nav
  // rules — the drill-in itself was the pushState.
  useEffect(() => {
    if (!props.resetTick || props.resetTick <= 0) return;
    setView((v) => {
      if (v.level !== "node") return v;
      try { window.history.replaceState({}, "", urlForView({ level: "home" })); } catch {}
      return { level: "home" };
    });
  }, [props.resetTick]);

  // ── Reference leaf (full guide / coming-soon teaser) ────────────
  if (view.level === "node") {
    const node = REFERENCE_NODES_BY_ID[view.nodeId];
    if (!node) return <NotFound onHome={() => go({ level: "home" })} />;
    const crumbs = [
      { label: "Reference guides", onClick: () => go({ level: "home" }) },
      { label: node.group || (node.refs || []).join(" / ") },
    ];
    return (
      <div style={{ paddingTop: 4 }}>
        <Breadcrumb items={crumbs} />
        {isLiveNode(node) ? (
          <ReferencePage
            node={node}
            items={props.items || []}
            isMobile={isMobile}
            watchlist={props.watchlist}
            handleWish={props.handleWish}
            openCollectionPicker={props.openCollectionPicker}
            handleShare={props.handleShare}
            hidden={props.hidden}
            primaryCurrency={props.primaryCurrency}
            compact={props.compact}
            user={props.user}
            onClickListing={props.onClickListing}
            onViewAll={props.onViewAll}
          />
        ) : (
          <ComingSoon node={node} />
        )}
      </div>
    );
  }

  // ── Card landing (flat grid + standard filter bar) ──────────────
  const brandCounts = REFERENCE_NODES.reduce((acc, n) => {
    if (n.brand) acc[n.brand] = (acc[n.brand] || 0) + 1;
    return acc;
  }, {});
  const brands = Object.keys(brandCounts).sort((a, b) => brandCounts[b] - brandCounts[a] || a.localeCompare(b));
  const ql = q.trim().toLowerCase();
  const cards = REFERENCE_NODES
    .filter((n) => activeBrands.length === 0 || activeBrands.includes(n.brand))
    .filter((n) => {
      if (!heartedOnly) return true;
      const asListing = referenceAsListing(n);
      return !!(asListing && props.watchlist && props.watchlist[asListing.id]);
    })
    .filter((n) => {
      if (!ql) return true;
      const hay = [n.brand, n.modelLine, n.group, (n.refs || []).join(" "), n.definer]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(ql);
    })
    .sort((a, b) => {
      const al = isLiveNode(a), bl = isLiveNode(b);
      if (al !== bl) return al ? -1 : 1; // live guides first, coming-soon last
      return referenceUpdatedAt(b).localeCompare(referenceUpdatedAt(a)); // newest updated first
    });
  const hasFilters = !!ql || activeBrands.length > 0 || heartedOnly;
  const clearAll = () => { setQ(""); setActiveBrands([]); setHeartedOnly(false); setActiveFilterPop(null); };
  const toggleBrand = (b) =>
    setActiveBrands((prev) => prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]);

  return (
    <div style={{ paddingTop: 0 }}>
      {/* Collapsing header (Mark 2026-06-02), same pattern as Saved + catalog:
          the title scrolls away while the filter bar PINS. Count lives in the
          bar's reserved right slot, not under the title (P-8/P-16). The sticky
          wrapper offsets by --sticky-top so it pins BELOW the mobile chrome
          stack, not under it (same fix as the guide-page section nav, P-11). */}
      <PageHeader isMobile={isMobile} title="Reference guides" />
      <div style={{
        position: "sticky", top: "var(--sticky-top, 0px)", zIndex: 15, background: "var(--bg)",
        marginLeft: isMobile ? -16 : -20, marginRight: isMobile ? -16 : -20,
        paddingLeft: isMobile ? 16 : 20, paddingRight: isMobile ? 16 : 20,
        paddingTop: isMobile ? 8 : 10, marginBottom: 6,
      }}>
        {/* Mobile: the shell search row doesn't render on this sub-tab, so the
            guides search keeps its own full-width row above the pill bar (one
            input per surface — P-13). Desktop: the input sits in the bar's
            centered slot. */}
        {isMobile && (
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search guides — brand, model, reference…"
            autoCapitalize="none" autoCorrect="off" spellCheck={false}
            style={{ ...inputBase, fontSize: 14, marginBottom: 8 }}
          />
        )}
        <StandardFilterBar
          isMobile={isMobile}
          expanded={activeFilterPop !== null}
          count={`${cards.length} ${cards.length === 1 ? "guide" : "guides"}`}
          search={isMobile ? null : (
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search guides — brand, model, reference…"
              aria-label="Search guides"
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              style={standardSearchInputStyle}
            />
          )}
          pills={
            <>
              <button
                onClick={() => setActiveFilterPop((p) => p === "brand" ? null : "brand")}
                style={pillBase(activeBrands.length > 0 || activeFilterPop === "brand", { compact: true })}>
                Brand{activeBrands.length > 0 ? ` · ${activeBrands.length}` : ""}
              </button>
              <button
                onClick={() => setHeartedOnly((v) => !v)}
                aria-pressed={heartedOnly}
                title={heartedOnly ? "Showing saved guides only" : "Filter to saved guides"}
                style={pillBase(heartedOnly, { compact: true })}>
                ♥ Saved
              </button>
              {hasFilters && (
                <button onClick={clearAll} style={clearAllPill}>× Clear all</button>
              )}
            </>
          }
        />
        {activeFilterPop === "brand" && (
          <div style={{
            padding: "10px 0 18px", borderBottom: "0.5px solid var(--border)",
            display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-start",
          }}>
            {brands.map((b) => (
              <Chip key={b} label={b} count={brandCounts[b]}
                active={activeBrands.includes(b)} onClick={() => toggleBrand(b)} />
            ))}
          </div>
        )}
      </div>

      {cards.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--text3)" }}>No guides match your search.</p>
      ) : (
        <div style={cardGridStyle({ isMobile })}>
          {cards.map((n) => (
            <RefGuideCard key={n.id} node={n} isMobile={isMobile}
              onClick={() => go({ level: "node", nodeId: n.id })}
              watchlist={props.watchlist} handleWish={props.handleWish}
              openCollectionPicker={props.openCollectionPicker} handleShare={props.handleShare}
              user={props.user} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Presentational helpers ────────────────────────────────────────

// Article-style guide card: hero on top, brand·model kicker, serif reference
// name. Carries the same heart + ⋯ actions as article cards (Mark 2026-06-02)
// — save / add to list / share / Ask Lumé — via referenceAsListing(node).
function RefGuideCard({ node, isMobile, onClick, watchlist, handleWish, openCollectionPicker, handleShare, user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const coming = !isLiveNode(node);
  const title = node.group || (node.refs || []).join(" / ");
  const asListing = referenceAsListing(node);
  const wished = !!(watchlist && asListing && watchlist[asListing.id]);
  const onKey = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } };
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  const hasActions = asListing && (handleWish || (openCollectionPicker && user) || handleShare);
  const overlayBtn = {
    width: 28, height: 28, borderRadius: 999, border: "none", cursor: "pointer",
    background: "rgba(0,0,0,0.45)", color: "#fff", display: "flex", alignItems: "center",
    justifyContent: "center", fontFamily: "inherit", fontSize: 14, lineHeight: 1, padding: 0,
  };
  const menuItem = {
    display: "block", width: "100%", textAlign: "left", padding: "9px 13px",
    fontSize: 13, fontFamily: "inherit", border: "none", background: "transparent",
    color: "var(--text1)", cursor: "pointer", whiteSpace: "nowrap",
  };
  return (
    <div style={{ position: "relative" }}>
      <div role="button" tabIndex={0} onClick={onClick} onKeyDown={onKey} style={{
        textAlign: "left", cursor: "pointer", fontFamily: "inherit", display: "block",
      }}>
        <div style={{
          position: "relative", width: "100%", aspectRatio: "16 / 10",
          background: "var(--surface)", overflow: "hidden", marginBottom: 12,
        }}>
          {node.hero && node.hero.img && (
            <img src={imgSrc(node.hero.img)} alt="" loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
          )}
          {coming && (
            <span style={{
              position: "absolute", top: 8, left: 8,
              fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase",
              color: "#fff", background: "rgba(0,0,0,0.5)", borderRadius: 999, padding: "2px 8px",
            }}>Coming soon</span>
          )}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "var(--text3)", marginBottom: 4,
        }}>{[node.brand, node.modelLine].filter(Boolean).join(" · ")}</div>
        <div style={{ ...editorialTitle({ isMobile }), color: "var(--text1)" }}>{title}</div>
        {node.definer && (
          <div style={{
            fontSize: 12, color: "var(--text2)", lineHeight: 1.4, marginTop: 4,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>{node.definer}</div>
        )}
      </div>
      {hasActions && (
        <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
          {handleWish && (
            <button onClick={(e) => { stop(e); handleWish(asListing); }}
              aria-label={wished ? "Saved — tap to remove" : "Save guide"}
              style={{ ...overlayBtn, color: wished ? "var(--heart)" : "#fff" }}>{wished ? "♥" : "♡"}</button>
          )}
          {((openCollectionPicker && user) || handleShare) && (
            <button onClick={(e) => { stop(e); setMenuOpen(o => !o); }} aria-label="More" style={overlayBtn}>⋯</button>
          )}
        </div>
      )}
      {menuOpen && (
        <div onClick={stop} style={{
          position: "absolute", top: 40, right: 8, zIndex: 20, minWidth: 150,
          background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: 10,
          boxShadow: "0 6px 20px rgba(0,0,0,0.18)", overflow: "hidden",
        }}>
          {openCollectionPicker && user && (
            <button style={menuItem} onClick={(e) => { stop(e); setMenuOpen(false); openCollectionPicker(asListing); }}>Add to list…</button>
          )}
          {handleShare && (
            <button style={menuItem} onClick={(e) => { stop(e); setMenuOpen(false); handleShare(asListing); }}>Share</button>
          )}
          <button style={menuItem} onClick={(e) => { stop(e); setMenuOpen(false); askLumeAbout(asListing); }}>Ask Lumé</button>
        </div>
      )}
    </div>
  );
}

function ComingSoon({ node }) {
  // Demand smoke test. MVP records interest in local state only; persisting it
  // (a small reference_interest table) is the immediate follow-up.
  const [noted, setNoted] = useState(false);
  return (
    <div style={{ maxWidth: 560 }}>
      {/* Editorial register — this is a preview OF a serif reference node,
          so the title + teaser read as editorial content, not chrome. */}
      <h1 style={{ ...editorialHeading(), color: "var(--text1)", margin: "0 0 4px" }}>
        {node.brand} {node.modelLine}
      </h1>
      <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 12 }}>
        {node.group || (node.refs || []).join(" / ")}
        {node.definer ? ` · ${node.definer}` : ""}
      </div>
      {node.teaser && (
        <p style={{ ...editorialProse(), color: "var(--text2)" }}>{node.teaser}</p>
      )}
      <div style={{ marginTop: 16, padding: 16, border: "0.5px dashed var(--border)", borderRadius: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text1)", marginBottom: 6 }}>
          Full guide coming soon
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12 }}>
          Want this reference guide unlocked sooner? Let us know you're interested.
        </div>
        {noted ? (
          <div style={{ fontSize: 13, color: "var(--text1)", fontWeight: 600 }}>
            ✓ Thanks — we'll let you know when it's live.
          </div>
        ) : (
          <button onClick={() => setNoted(true)} style={{
            cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600,
            color: "#fff", background: "var(--brand-olive, #4a5240)", border: "none",
            borderRadius: 8, padding: "8px 14px",
          }}>Subscribe to unlock</button>
        )}
      </div>
    </div>
  );
}

function NotFound({ onHome }) {
  return (
    <div style={{ paddingTop: 4 }}>
      <p style={{ fontSize: 14, color: "var(--text2)" }}>That reference isn't available.</p>
      <button onClick={onHome} style={{
        cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--text2)",
        background: "none", border: "none", padding: 0,
      }}>← Back to reference guides</button>
    </div>
  );
}
