import React from "react";
import { Card } from "./Card";
import CardShell from "./CardShell";
import { articleAsListing } from "./EditorialView";
import { imgSrc } from "../utils";
import { askLumeAbout } from "./LumeBus";
import LumeReasonChip from "./LumeReasonChip";

// lumeCards — card construction for the Lumé canvas, isolated here so the
// canvas/panel stay layout-only and App.js only has to hand over a `cardCtx`
// bag of its existing handlers (no new App render functions). The listing card
// mirrors the HeartedView Card invocation (App.js ~4061); the article card
// mirrors the Home article tile (HomeTab.js ~1021) so hearts/menu/Share-with-
// Lumé behave identically to the rest of the app.

export function renderLumeListingCard(item, ctx = {}, reason = "") {
  const {
    watchlist = {}, hidden = {}, handleWish, isAdmin, toggleHide, user,
    openCollectionPicker, primaryCurrency = "USD", handleShare, observeCard, onClickListing,
  } = ctx;
  const card = (
    <Card
      item={item}
      wished={!!watchlist[item.id]}
      onWish={handleWish}
      onHide={isAdmin ? toggleHide : undefined}
      isHidden={!!hidden[item.id]}
      onAddToCollection={user ? openCollectionPicker : undefined}
      primaryCurrency={primaryCurrency}
      onShare={handleShare}
      onView={observeCard}
      onClickListing={onClickListing}
    />
  );
  if (!reason) return card;
  // Reason chip above the card so every surfaced watch says why it's here.
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <LumeReasonChip label={reason} />
      {card}
    </div>
  );
}

export function renderLumeArticleCard(a, ctx = {}) {
  const { watchlist = {}, handleWish, openCollectionPicker, handleShare } = ctx;
  const al = articleAsListing(a);
  return (
    <CardShell
      href={a.url}
      aspect="square"
      bodyPadding="10px 12px 12px"
      image={a.image ? { src: imgSrc(a.image, 480), alt: "" } : null}
      level2={<div style={{ fontSize: 10, fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>{(a._source && a._source.label) || a.source || ""}</div>}
      level1={<div style={{ fontSize: 12, fontWeight: 500, color: "var(--text1)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.title}</div>}
      heart={al && handleWish ? { wished: !!(watchlist && watchlist[al.id]), onToggle: () => handleWish(al) } : null}
      menu={al ? {
        onAddToCollection: openCollectionPicker ? () => openCollectionPicker(al) : null,
        onShare: handleShare ? () => handleShare(al) : null,
        extraMenuItems: [{ label: "Share with Lumé", onClick: () => askLumeAbout(al) }],
      } : null}
    />
  );
}
