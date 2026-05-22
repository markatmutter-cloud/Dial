import React from "react";
import { actionButton } from "../styles";

// Collecting > Screening — landing surface for the screening
// journey. Mark spec 2026-05-22: screening is a fun collector
// activity, not an action buried in lists. Restructured as a
// destination under Collecting where the user picks WHICH pool to
// review (auction catalogs, lists, shared lists, etc.), parallel
// to how Challenges lives there now.
//
// Each pool surfaces as a section of cards. Tapping a card hands
// off to the existing screener entry: for auction catalogs we call
// onReviewAuction (same wire as the calendar Review button — bulk-
// adds + drills in + auto-opens); for lists we set
// pendingReviewListId + navigate to Watchlists > Lists, which
// CollectionsTab already routes to a drill-in with auto-Review.
//
// v1 pools: Auction catalogs, Your lists, Shared with you.
// v2: "New since last visit" (needs feed-mode mount re-introduction).

export function ScreeningView({
  auctions,
  lotCounts,
  collections,
  itemsByCollection,
  userId,
  onReviewAuction,
  onReviewList,
  isMobile,
}) {
  // ── Pool data preparation ──────────────────────────────────────
  // Auction catalogs — only those with lots (lotCounts > 0). Past
  // sales filtered out by default. Sort by closing-soonest.
  const auctionPool = (auctions || [])
    .filter(a => a && a.url && (lotCounts || {})[a.url] > 0)
    .filter(a => {
      // Skip clearly-ended sales (date_end > 1 day ago). Keep
      // upcoming + active.
      const end = a.dateEnd ? new Date(a.dateEnd).getTime() : 0;
      if (!end) return true;
      return end > Date.now() - 86400000;
    })
    .sort((a, b) => {
      const da = a.dateEnd ? new Date(a.dateEnd).getTime() : 0;
      const db = b.dateEnd ? new Date(b.dateEnd).getTime() : 0;
      return da - db;
    });

  // Your lists — user-created lists (not system-hard lists like
  // Owned/Sold/Wishlist, not auction-catalog auto-lists), with items.
  const yourLists = (collections || [])
    .filter(c => c && c.userId === userId)
    .filter(c => !c.isSystem)
    .filter(c => c.type !== 'auction')
    .filter(c => ((itemsByCollection || {})[c.id] || []).length > 0);

  // Shared with you — lists where the user is a collaborator but
  // not the owner. Same shape as Your lists; the userId match flips.
  const sharedLists = (collections || [])
    .filter(c => c && c.userId && c.userId !== userId)
    .filter(c => !c.isSharedInbox)
    .filter(c => ((itemsByCollection || {})[c.id] || []).length > 0);

  const sections = [
    {
      key: "auctions",
      heading: "Auction catalogs",
      blurb: "Walk a sale's lots one at a time. Yes / Pass; hearted lots persist.",
      items: auctionPool,
      kind: "auction",
    },
    {
      key: "yours",
      heading: "Your lists",
      blurb: "Review the lists you've built.",
      items: yourLists,
      kind: "list",
    },
    {
      key: "shared",
      heading: "Shared with you",
      blurb: "Rate items on lists collaborators shared. Your reactions are visible to the owner.",
      items: sharedLists,
      kind: "list",
    },
  ];

  const anyContent = sections.some(s => s.items.length > 0);

  return (
    <div style={{
      padding: isMobile ? "4px 16px 32px" : "8px 20px 48px",
      maxWidth: 1200,
      margin: "0 auto",
    }}>
      {/* Intro — Mark spec: framing as a fun collector activity. */}
      <div style={{
        padding: isMobile ? "16px 0 20px" : "24px 0 28px",
        textAlign: "center",
      }}>
        <h1 style={{
          margin: "0 0 8px",
          fontFamily: "'Hoefler Text', 'Garamond', 'Georgia', 'Times New Roman', serif",
          fontSize: isMobile ? 28 : 40,
          fontWeight: 500,
          color: "var(--text1)",
          letterSpacing: "-0.005em",
          lineHeight: 1.1,
        }}>
          Screening
        </h1>
        <p style={{
          margin: 0,
          fontSize: isMobile ? 14 : 15,
          color: "var(--text2)",
          maxWidth: 520, marginLeft: "auto", marginRight: "auto",
          lineHeight: 1.5,
        }}>
          Pick a list, sale, or catalog to walk through one watch at a time.
          Yes saves to your watchlist; Pass moves on.
        </p>
      </div>

      {!anyContent && (
        <div style={{
          padding: 32, color: "var(--text2)", textAlign: "center",
          border: "0.5px dashed var(--border)", borderRadius: 10,
          marginTop: 16,
        }}>
          Nothing to screen yet — heart items into a list, take a Watch Challenge,
          or wait for the next auction to open.
        </div>
      )}

      {sections.map(section => section.items.length === 0 ? null : (
        <PoolSection key={section.key}
          heading={section.heading}
          blurb={section.blurb}
          items={section.items}
          kind={section.kind}
          lotCounts={lotCounts}
          itemsByCollection={itemsByCollection}
          onReviewAuction={onReviewAuction}
          onReviewList={onReviewList}
          isMobile={isMobile}
        />
      ))}
    </div>
  );
}

function PoolSection({ heading, blurb, items, kind, lotCounts, itemsByCollection, onReviewAuction, onReviewList, isMobile }) {
  return (
    <section style={{ marginTop: isMobile ? 20 : 28 }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: 10,
        marginBottom: isMobile ? 10 : 14,
      }}>
        <h2 style={{
          margin: 0,
          fontSize: isMobile ? 16 : 18,
          fontWeight: 600,
          color: "var(--text1)",
          letterSpacing: "0.01em",
        }}>
          {heading}
        </h2>
        <span style={{
          fontSize: 12, color: "var(--text3)",
          fontVariantNumeric: "tabular-nums",
        }}>
          {items.length}
        </span>
      </div>
      {blurb && (
        <p style={{
          margin: "0 0 12px",
          fontSize: 13, color: "var(--text2)", maxWidth: 640,
          lineHeight: 1.5,
        }}>
          {blurb}
        </p>
      )}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
        gap: isMobile ? 10 : 14,
      }}>
        {items.map(item => (
          <PoolCard key={item.id || item.url}
            item={item}
            kind={kind}
            lotCount={kind === "auction" ? (lotCounts || {})[item.url] || 0 : null}
            itemCount={kind === "list" ? ((itemsByCollection || {})[item.id] || []).length : null}
            onClick={() => {
              if (kind === "auction" && onReviewAuction) onReviewAuction(item);
              else if (kind === "list" && onReviewList) onReviewList(item.id);
            }}
          />
        ))}
      </div>
    </section>
  );
}

function PoolCard({ item, kind, lotCount, itemCount, onClick }) {
  const title = kind === "auction" ? (item.title || "Untitled sale") : (item.name || "Untitled list");
  const subtitle = kind === "auction"
    ? `${item.house || ""}${item.dateLabel ? " · " + item.dateLabel : ""}`.trim()
    : item.description || null;
  const countLabel = kind === "auction"
    ? `${lotCount} lot${lotCount === 1 ? "" : "s"}`
    : `${itemCount} item${itemCount === 1 ? "" : "s"}`;
  return (
    <button onClick={onClick} style={{
      textAlign: "left",
      background: "var(--surface)",
      border: "0.5px solid var(--border)",
      borderRadius: 10,
      padding: 16,
      cursor: "pointer",
      fontFamily: "inherit",
      display: "flex", flexDirection: "column", gap: 6,
      transition: "transform 80ms ease, box-shadow 80ms ease",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
        textTransform: "uppercase", color: "var(--text3)",
      }}>
        {countLabel}
      </div>
      <div style={{
        fontSize: 16, fontWeight: 600, color: "var(--text1)",
        lineHeight: 1.25, letterSpacing: "-0.005em",
        overflow: "hidden", textOverflow: "ellipsis",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {title}
      </div>
      {subtitle && (
        <div style={{
          fontSize: 13, color: "var(--text2)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {subtitle}
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <span style={{
          ...actionButton({ variant: "primary" }),
          display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          Start review
          <span aria-hidden style={{ fontSize: 13 }}>→</span>
        </span>
      </div>
    </button>
  );
}
