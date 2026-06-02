// HeartedView — the default landing of the Lists tab (sub-tab "hearted").
//
// The #1 usability fix (2026-06-01): getting back to your hearted things used
// to be two steps (open Lists → "See all"). Now it IS the landing.
//
// A TYPE filter sits at the top — Watches · Articles · Guides (only types you
// actually have; Watches default):
//   • Watches — the standard Watches grid (same Card + gridStyle), the shared
//     filter bar (Clear-all / Save-search — closes B-48 for Lists), newest-
//     added default, plus a group-by control: None · Dealer · Brand. Grouped
//     view orders groups by size (Other last), items newest-first within, with
//     a sticky quick-jump chip row when ≥2 groups.
//   • Articles / Guides — hearted editorial + reference guides, via CardShell.
//   (Saved auction sales moved to a "Saved sales" section on the Lists sub-tab.)
//
// Self-contained ON PURPOSE: its type/group-by/scroll-spy hooks live here, not
// in CollectionsTab/ListsView, so they can't shift that component's hook
// order (React #310). All hooks sit above the first early return.

import React, { useState, useEffect, useMemo } from "react";
import { Card } from "./Card";
import CardShell from "./CardShell";
import { EmptyState } from "./EmptyState";
import SubTabBar from "./SubTabBar";
import { PageHeader } from "./PageHeader";
import { innerToggleButton } from "../styles";

const GROUP_BY_KEY = "dial_hearted_group_by";
const GROUP_OPTS = [
  { key: "none", label: "None" },
  { key: "dealer", label: "Dealer" },
  { key: "brand", label: "Brand" },
];

const slugify = (s) =>
  "hg-" + String(s || "other").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function buildGroups(items, groupBy) {
  if (groupBy === "none") return null;
  const keyOf = groupBy === "dealer"
    ? (it) => (it.source && it.source !== "—" ? it.source : "Other")
    : (it) => (it.brand ? it.brand : "Other");
  const map = new Map();
  for (const it of items) {
    const k = keyOf(it);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it); // insertion order preserves the incoming savedAt-desc order
  }
  const groups = [...map.entries()].map(([label, list]) => ({
    id: slugify(label), label, items: list,
  }));
  // size desc; "Other" bucket always last regardless of size; alpha tiebreak.
  groups.sort((a, b) => {
    const aOther = a.label === "Other", bOther = b.label === "Other";
    if (aOther !== bOther) return aOther ? 1 : -1;
    if (b.items.length !== a.items.length) return b.items.length - a.items.length;
    return a.label.localeCompare(b.label);
  });
  return groups;
}

export default function HeartedView({
  items = [],          // hearted watches (no articles — App excludes kind==='article')
  articles = [],       // hearted articles (stored article-as-listing snapshots)
  guides = [],         // hearted reference guides (kind==='reference' snapshots)
  isMobile,
  gridStyle,
  compact,
  primaryCurrency,
  watchlist = {},
  handleWish,
  handleShare,
  openCollectionPicker,
  observeCard,
  onClickListing,
  user,
  activeFiltersStripJSX,
}) {
  const [groupBy, setGroupBy] = useState(() => {
    try {
      const v = localStorage.getItem(GROUP_BY_KEY);
      return GROUP_OPTS.some(o => o.key === v) ? v : "none";
    } catch { return "none"; }
  });
  const [activeType, setActiveType] = useState("watches");
  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    try { localStorage.setItem(GROUP_BY_KEY, groupBy); } catch {}
  }, [groupBy]);

  // Type options — only show a type you actually have (Watches always shows,
  // even at zero, since it's the surface's reason for being).
  const typeOptions = useMemo(() => ([
    { key: "watches", label: "Watches", n: items.length },
    { key: "articles", label: "Articles", n: articles.length },
    { key: "guides", label: "Guides", n: guides.length },
  ].filter(o => o.key === "watches" || o.n > 0)), [items.length, articles.length, guides.length]);
  const type = typeOptions.some(o => o.key === activeType) ? activeType : "watches";

  const groups = useMemo(
    () => (type === "watches" ? buildGroups(items, groupBy) : null),
    [type, items, groupBy]
  );
  const showQuickJump = !!groups && groups.length >= 2;

  // Scroll-spy for the grouped quick-jump (no-op when ungrouped).
  useEffect(() => {
    if (!showQuickJump || typeof IntersectionObserver === "undefined") return;
    const els = groups.map(g => document.getElementById(g.id)).filter(Boolean);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveGroup(visible[0].target.id);
      },
      { rootMargin: "-60px 0px -70% 0px", threshold: 0 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [showQuickJump, groups]);

  const jumpTo = (id) => {
    setActiveGroup(id);
    if (typeof document === "undefined") return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderCard = (item) => (
    <Card
      key={item.id}
      item={item}
      wished={!!watchlist[item.id]}
      onWish={handleWish}
      compact={compact}
      onAddToCollection={user ? openCollectionPicker : undefined}
      onShare={handleShare}
      primaryCurrency={primaryCurrency}
      onClickListing={onClickListing}
      observeCard={observeCard}
    />
  );

  // Hearted article (stored snapshot) → shared CardShell, matching the
  // saved-articles grid. The snapshot IS the stored listing-shaped item, so
  // heart/add-to-list act on it directly.
  const renderArticle = (snap) => (
    <CardShell
      key={snap.id}
      href={snap.url}
      aspect="square"
      image={snap.img ? { src: snap.img, alt: "" } : null}
      level2={<div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>
        {(snap.article && snap.article.source_label) || ""}
      </div>}
      level1={<div style={{ fontSize: 12, fontWeight: 500, color: "var(--text1)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {snap.title || snap.ref || ""}
      </div>}
      heart={handleWish ? { wished: !!watchlist[snap.id], onToggle: () => handleWish(snap) } : null}
      menu={{
        onAddToCollection: (openCollectionPicker && user) ? () => openCollectionPicker(snap) : null,
        onShare: handleShare ? () => handleShare(snap) : null,
      }}
    />
  );

  // Hearted reference guide → CardShell with the guide's hero + reference name.
  // href is the in-app deep link (?tab=references&ref=…), so it opens the guide.
  const renderGuide = (snap) => (
    <CardShell
      key={snap.id}
      href={snap.url}
      aspect="square"
      image={snap.img ? { src: snap.img, alt: "" } : null}
      level2={<div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>
        {[snap.brand, snap.model_line].filter(Boolean).join(" · ")}
      </div>}
      level1={<div style={{ fontSize: 12, fontWeight: 500, color: "var(--text1)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {(snap.reference && snap.reference.group) || snap.ref || snap.title || "Reference guide"}
      </div>}
      heart={handleWish ? { wished: !!watchlist[snap.id], onToggle: () => handleWish(snap) } : null}
      menu={{
        onAddToCollection: (openCollectionPicker && user) ? () => openCollectionPicker(snap) : null,
        onShare: handleShare ? () => handleShare(snap) : null,
      }}
    />
  );

  // (Hearted "Sales" type retired 2026-06-01 — saved auction catalogs now live
  // as a "Saved sales" section on the Lists sub-tab, not here.)

  const hasAnything = items.length || articles.length || guides.length;

  // ── render ── (all hooks above this line)
  const savedTotal = items.length + articles.length + guides.length;
  return (
    <div style={{ paddingTop: 0, paddingBottom: isMobile ? 220 : 160 }}>
      <PageHeader isMobile={isMobile} title="Saved"
        meta={savedTotal ? `${savedTotal} ${savedTotal === 1 ? "item" : "items"}` : null} />
      <div style={{ paddingTop: isMobile ? 14 : 18 }} />
      {/* Type filter — only when there's more than one type to switch between. */}
      {typeOptions.length > 1 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 0 12px" }}>
          {typeOptions.map(o => (
            <button key={o.key} onClick={() => setActiveType(o.key)}
              style={innerToggleButton(o.key === type)}>{o.label}{o.n ? ` ${o.n}` : ""}</button>
          ))}
        </div>
      )}

      {!hasAnything ? (
        <EmptyState
          icon="♡"
          heading="Nothing hearted yet"
          blurb="Tap the heart on any watch, article or sale as you browse — it lands here, with the price you saved at even after the dealer takes the listing down."
          size="compact"
        />
      ) : type === "articles" ? (
        articles.length === 0
          ? <EmptyState icon="📰" heading="No saved articles yet" size="compact"
              blurb="Heart an article on the Articles tab and it lands here." />
          : <div style={gridStyle}>{articles.map(renderArticle)}</div>
      ) : type === "guides" ? (
        guides.length === 0
          ? <EmptyState icon="📖" heading="No saved guides yet" size="compact"
              blurb="Heart a reference guide on the Collecting tab and it lands here." />
          : <div style={gridStyle}>{guides.map(renderGuide)}</div>
      ) : (
        // type === "watches"
        <>
          {activeFiltersStripJSX}
          {items.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, padding: "4px 0 12px" }}>
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
                textTransform: "uppercase", color: "var(--text3)", marginRight: 4,
              }}>Group</span>
              {GROUP_OPTS.map(o => (
                <button key={o.key} onClick={() => setGroupBy(o.key)}
                  style={innerToggleButton(groupBy === o.key)}>{o.label}</button>
              ))}
            </div>
          )}

          {showQuickJump && (
            <SubTabBar
              ariaLabel="Jump to group"
              tabs={groups.map(g => ({ key: g.id, label: `${g.label} ${g.items.length}` }))}
              activeKey={activeGroup}
              onSelect={jumpTo}
              isMobile={isMobile}
              containerStyle={{
                position: "sticky", top: 0, zIndex: 12,
                background: "var(--bg)", borderBottom: "0.5px solid var(--border)",
                margin: "0 -2px 12px", padding: "0 2px",
              }}
            />
          )}

          {items.length === 0 ? (
            <EmptyState icon="♡" heading="No hearted watches yet" size="compact"
              blurb="Tap the heart on any watch as you browse — it lands here." />
          ) : !groups ? (
            <div style={gridStyle}>{items.map(renderCard)}</div>
          ) : (
            groups.map(g => (
              <section key={g.id} id={g.id} style={{ scrollMarginTop: 70, marginTop: isMobile ? 22 : 28 }}>
                <div style={{
                  display: "flex", alignItems: "baseline", gap: 10,
                  borderTop: "0.5px solid var(--border)",
                  paddingTop: isMobile ? 12 : 14, marginBottom: isMobile ? 10 : 12,
                }}>
                  <span style={{
                    flex: 1, minWidth: 0, fontSize: isMobile ? 15 : 16, fontWeight: 700,
                    color: "var(--text1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>{g.label}</span>
                  <span style={{ flexShrink: 0, fontSize: 12.5, color: "var(--text3)", fontVariantNumeric: "tabular-nums" }}>
                    {g.items.length}
                  </span>
                </div>
                <div style={gridStyle}>{g.items.map(renderCard)}</div>
              </section>
            ))
          )}
        </>
      )}
    </div>
  );
}
