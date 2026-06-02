// HeartedView — the default landing of the Lists tab (sub-tab "hearted").
//
// The #1 usability fix (2026-06-01): getting back to your hearted things used
// to be two steps (open Lists → "See all"). Now it IS the landing.
//
// A TYPE filter sits at the top — Watches · Articles · Guides (only types you
// actually have; Watches default):
//   • Watches — the standard Watches grid (same Card + gridStyle), the shared
//     filter bar (Clear-all / Save-search — closes B-48 for Lists), newest-
//     added default. (Brand/Source grouping was retired 2026-06-02 — redundant
//     with the Source/Brand filters; Saved is a flat newest-first grid.)
//   • Articles / Guides — hearted editorial + reference guides, via CardShell.
//   (Saved auction sales moved to a "Saved sales" section on the Lists sub-tab.)
//
// Self-contained ON PURPOSE: its type-filter hook lives here, not in
// CollectionsTab/ListsView, so it can't shift that component's hook order
// (React #310). All hooks sit above the first early return.

import React, { useState, useMemo } from "react";
import { Card } from "./Card";
import CardShell from "./CardShell";
import { EmptyState } from "./EmptyState";
import { innerToggleButton } from "../styles";

// Grouping (by brand / source) was retired 2026-06-02 (Mark): it overlapped the
// existing Brand/Source filters and added clutter for marginal value. Saved is a
// flat newest-first grid + the shared filter bar (which already drills to any
// brand or source).

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
  const [activeType, setActiveType] = useState("watches");

  // Type options — only show a type you actually have (Watches always shows,
  // even at zero, since it's the surface's reason for being).
  const typeOptions = useMemo(() => ([
    { key: "watches", label: "Watches", n: items.length },
    { key: "articles", label: "Articles", n: articles.length },
    { key: "guides", label: "Guides", n: guides.length },
  ].filter(o => o.key === "watches" || o.n > 0)), [items.length, articles.length, guides.length]);
  const type = typeOptions.some(o => o.key === activeType) ? activeType : "watches";

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
  // The "Saved" title now lives in the shell's scrolling-header slot
  // (savedHeaderJSX) so it scrolls away above the pinned filter bar (Mark
  // 2026-06-02 collapsing header). HeartedView starts at the type filter.
  return (
    <div style={{ paddingTop: isMobile ? 6 : 8, paddingBottom: isMobile ? 220 : 160 }}>
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
          blurb="Tap the heart on any watch, article or auction as you browse — it lands here, with the price you saved at even after the dealer takes the listing down."
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
        // type === "watches" — flat, newest-first grid (filter via the shared bar).
        <>
          {activeFiltersStripJSX}
          {items.length === 0 ? (
            <EmptyState icon="♡" heading="No hearted watches yet" size="compact"
              blurb="Tap the heart on any watch as you browse — it lands here." />
          ) : (
            <div style={gridStyle}>{items.map(renderCard)}</div>
          )}
        </>
      )}
    </div>
  );
}
