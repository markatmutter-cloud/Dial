// HeartedView — the default landing of the Lists tab (sub-tab "hearted").
//
// The #1 usability fix (2026-06-01): getting back to your hearted watches
// used to be two steps (open Lists → "See all"). Now it IS the landing.
// This surface shows the user's hearted watches in the standard Watches
// grid (same Card + gridStyle), with the standard shared filter bar at the
// top (so Clear-all / Save-search live here too — closes B-48 for Lists),
// plus a group-by control: None · Dealer · Brand.
//
// Grouping rules (locked with Mark): groups ordered by size (largest first),
// the "Other" bucket always last; items within a group stay in the incoming
// order — `items` arrives already sorted savedAt-desc (newest hearted first)
// from the App `watchItems` memo. When grouped with ≥2 groups, a sticky
// quick-jump chip row (the shared SubTabBar, scroll-spy) rides at the top to
// orient the long scroll — orient, don't avoid-scroll.
//
// Self-contained ON PURPOSE: its group-by / scroll-spy hooks live here, not
// in CollectionsTab/ListsView, so they can't shift that component's hook
// order (React #310). All hooks sit above the empty-state early return.

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import SubTabBar from "./SubTabBar";
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
  items = [],
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
  const [activeGroup, setActiveGroup] = useState(null);
  const scrollRoot = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(GROUP_BY_KEY, groupBy); } catch {}
  }, [groupBy]);

  const groups = useMemo(() => buildGroups(items, groupBy), [items, groupBy]);
  const showQuickJump = !!groups && groups.length >= 2;

  // Scroll-spy: highlight the group whose header is nearest the top. The
  // observer is a no-op when ungrouped (no headers to observe).
  useEffect(() => {
    if (!showQuickJump || typeof IntersectionObserver === "undefined") return;
    const els = groups
      .map(g => document.getElementById(g.id))
      .filter(Boolean);
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

  // ── render ── (all hooks above this line)
  return (
    <div ref={scrollRoot} style={{ paddingTop: 0, paddingBottom: isMobile ? 220 : 160 }}>
      {activeFiltersStripJSX}

      {items.length > 0 && (
        <div style={{
          display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6,
          padding: "4px 0 12px",
        }}>
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
        <EmptyState
          icon="♡"
          heading="Nothing hearted yet"
          blurb="Tap the heart on any watch as you browse — it lands here with the price you saved at, even after the dealer takes the listing down."
          size="compact"
        />
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
    </div>
  );
}
