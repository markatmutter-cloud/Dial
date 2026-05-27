import React, { useEffect, useRef, memo } from "react";
import { fmt, imgSrc, fmtCountdown, fmtLotPrice, fmtSoldDate, priceIn, daysOnSale, daysOnSaleLabel, CURRENCY_SYM, FX_RATES_USD_PER } from "../utils";
import CardShell from "./CardShell";

// Card system (2026-05-24): Card renders into the shared CardShell — it keeps
// ALL its price/FX/auction logic and computes the slot nodes (imageOverlay /
// L1 title / L2 source / L3 price), while CardShell owns the frame + the action
// stack + the single portal menu. The menu impl + menuItemStyle moved to
// CardShell (one source of truth, was duplicated in EditorialView too).

// Wrapped in React.memo so an unrelated state change in App (heart toggle
// on a different card, scroll-triggered page bump, filter tweak) doesn't
// re-render every card in the grid. Default shallow-compare works because
// onWish/onHide are useCallback-stable and item identity is preserved
// across renders for the listings feed. Watchlist tab spreads item to
// override snapshot fields, so its cards still re-render — that's fine,
// re-render ≠ image remount.
export const Card = memo(function Card({
  item, wished, onWish, compact, onHide, isHidden,
  // Optional: opens the collection picker for this item. When omitted
  // (e.g. signed-out browsing), the menu omits the "Add to collection"
  // entry and falls back to just Hide. When the menu has zero items,
  // the trigger button itself doesn't render.
  onAddToCollection,
  // Optional: override the default Hide menu label. The collection
  // drill-in view passes "Remove from collection" + an onHide that
  // actually calls removeItemFromCollection — single menu surface,
  // different action wiring per context.
  hideLabel,
  // User's primary display currency (USD/GBP/EUR). Falls back to
  // 'USD' for signed-out browsing or before useUserSettings has
  // loaded — matches the pre-2026-05-01 hardcoded behaviour.
  primaryCurrency = "USD",
  // Share — every Card surface in v1. Handler builds the share URL
  // and routes through Web Share API or clipboard fallback. Returns
  // { copied: bool } so we can show a brief "Copied!" hint after the
  // clipboard path. Optional — when omitted the menu omits the row.
  onShare,
  // Telemetry hooks (Epic 8 — Site analytics). When provided:
  //   onView      — registers this card with the App-level
  //                 IntersectionObserver via observeCard; fires once
  //                 per session when the card crosses 50% visibility.
  //   onClickListing — fires when the user follows the dealer link.
  // Both optional so signed-out browsing or non-Supabase environments
  // skip telemetry without per-Card guards.
  onView,
  onClickListing,
  // Optional: extra "..." menu actions injected by the surface.
  // Each entry is { label, onClick } — Card just renders them
  // as menu rows below the built-in Add/Hide/Share entries.
  // Used by Collections > Owned drill-in to add "Mark as sold"
  // (PR #88, 2026-05-06). Keeps Card unaware of collection
  // semantics — the surface owns the action wiring.
  extraMenuItems,
  // Optional: small overlay button at top-left for a one-tap
  // gesture (e.g. Plan > Keeping "↑ flag for sale"). Shape:
  // { icon, label, onClick, active }. Active flips the bg to red.
  // 2026-05-10 — Mark spec: replicate the pool's ↑ pattern on
  // owned cards so flagging for sale doesn't require the menu.
  quickAction,
  // Image-loading priority (PR 2026-05-21). When `priority` is truthy
  // we set fetchpriority="high" on the <img>, telling the browser to
  // queue this image ahead of the lazy backlog. Callers should set it
  // on the first ~4-6 cards above the fold and leave the rest as
  // default (auto + loading="lazy"). Cheap perceived-perf win.
  priority = false,
}) {
  // View-event observer registration. When onView is supplied, hand
  // the card's outer node to the App-level IntersectionObserver so it
  // can fire a `view` once the card crosses 50% visibility. Returns a
  // cleanup function from the effect for clean unobserve on unmount.
  const cardRef = useRef(null);
  useEffect(() => {
    if (!onView || !cardRef.current) return undefined;
    return onView(cardRef.current, item);
  }, [onView, item]);
  // (Previously had a NEW chip on cards <= 1 day old. Removed
  // 2026-04-30 — was firing inconsistently due to the backfill rule
  // and the date-order sort already conveys recency. Less chrome on
  // the image surface lets the image itself read.)
  // priceOnRequest items have price=0 — show "Price on request" instead
  // of "$0". Set by the WV scraper for INQUIRE / ON HOLD-no-price pages.
  // Currency display rule (2026-05-01): user's primary currency
  // (set in Settings; defaults to USD) is the primary line; if that
  // differs from the listing's native currency, the native price
  // shows on the secondary line. The conversion uses priceUSD as the
  // bridge via priceIn() in utils — exact native when match, ~approx
  // otherwise.
  // Sold-without-price-history fallback: a listing that disappears
  // from the dealer's site as priceOnRequest reads "Price on request"
  // even when sold — misleading because the dealer never showed a
  // price OR sold the item silently. If sold AND price is missing
  // AND there's no historic price record, show "—" instead.
  // Last non-zero ask, used as "last asking price" for sold items
  // whose current price has dropped to 0 (dealer hid it post-sale).
  // 40% of sold dealer items hit this — most dealers replace the
  // price label with "SOLD" so the next scrape captures price=0 +
  // priceOnRequest. Prefer the backend-emitted `lastMeaningfulPrice`
  // (added in merge.py 2026-05-05) and fall back to walking
  // priceHistory locally so older state.json snapshots — and any
  // surface that doesn't go through merge.py — keep working.
  const lastKnownPrice = (
    (typeof item.lastMeaningfulPrice === "number" && item.lastMeaningfulPrice > 0)
      ? item.lastMeaningfulPrice
      : (item.priceHistory || [])
          .map(h => h && h.price)
          .filter(p => typeof p === "number" && p > 0)
          .pop()
  );
  const hasHistoricPrice = !!lastKnownPrice || (item.price && item.price > 0);
  const itemCurrency = (item.currency || "USD").toUpperCase();
  const matchesPrimary = itemCurrency === primaryCurrency;
  // Compute the primary-currency display value. Exact when listing
  // is already in user's primary currency; ~approx otherwise.
  const primaryAmount = priceIn(item, primaryCurrency);
  const primarySym = CURRENCY_SYM[primaryCurrency] || "$";
  // Sold-with-historic-price: use the last non-zero asking price as the
  // display value (the "Sold" badge already conveys that this isn't a
  // current ask). Beats "Price on request" for items that DID have a
  // price visible while live but went dark after sale.
  const useHistoricForSold = !!(item.sold && item.priceOnRequest && lastKnownPrice);
  const displayPrice = (item.sold && item.priceOnRequest && !hasHistoricPrice)
    ? "—"
    : useHistoricForSold
      ? fmt(lastKnownPrice, itemCurrency)
      : item.priceOnRequest
        ? "Price on request"
        : matchesPrimary
          ? fmt(item.price, primaryCurrency)
          : (primaryAmount != null
              // Drop the `~` prefix on converted amounts (Mark
              // 2026-05-11): the tilde was misaligning the price
              // column when some rows had it and others didn't.
              // The fact that this is a conversion is already
              // signalled by the native-currency line below.
              ? `${primarySym}${primaryAmount.toLocaleString()}`
              // No conversion possible (no priceUSD bridge): fall back
              // to native so the user still sees a price rather than "—".
              : fmt(item.price, itemCurrency));
  // Show the native price on the secondary line whenever it's not
  // already the primary line and we have a real price.
  const showNative = !matchesPrimary && !item.priceOnRequest && item.price;
  // Show CUMULATIVE drop from peak (priceDropTotal) — so two
  // consecutive $400 cuts read as "↓ $800" rather than just the
  // latest step. Falls back to the last-step `priceChange` for items
  // scraped before priceDropTotal was introduced.
  const cumulativeDrop = (item.priceDropTotal && item.priceDropTotal > 0)
    ? item.priceDropTotal
    : ((item.priceChange || 0) < 0 ? -item.priceChange : 0);
  const priceDropped = !item.priceOnRequest && cumulativeDrop > 0;
  const peakPrice = item.pricePeak || (item.price + cumulativeDrop);

  // Tracked-lot render switch. When the item is projected from
  // `tracked_lots` (auction-house lot, eBay item, future marketplace
  // URL), the Card surfaces auction-specific data: bid label, current
  // bid OR hammer, estimate range, and a countdown chip on the image.
  // Dealer items take the existing render path.
  const isLot = !!item._isTrackedLot;
  const isAuctionLot = isLot && item._isAuctionFormat;
  const isBinLot = isLot && !item._isAuctionFormat;
  const lotLabel = !isLot ? null
    : isBinLot ? (item.sold ? "SOLD" : "BUY NOW")
    : (item.sold ? "HAMMER" : "CURRENT");
  const lotNativeValue = !isLot ? null
    : item.sold
        ? (item.sold_price ?? item.price)
        : (item.current_bid ?? item.starting_price ?? item.price);
  // Fallback chain: pre-auction lots have null current_bid /
  // current_bid_usd; previously this fell straight through to
  // `lotNativeValue` (the native CHF/HKD/etc. amount), which then
  // got rendered with a `~$` prefix — Mark's "CHF doesn't actually
  // convert 1:1 to USD" report 2026-05-07. Walk every USD field
  // we have (sold/bid/starting/estimate-low USD), then `priceUSD`
  // (already FX-converted at projection time in App.js's
  // auctionLotItems memo), and only fall back to the native value
  // as a last resort.
  const lotUsdValue = !isLot ? null
    : item.sold ? (item.sold_price_usd ?? item.priceUSD ?? lotNativeValue)
    : (item.current_bid_usd ?? item.starting_price_usd ?? item.estimate_low_usd ?? item.priceUSD ?? lotNativeValue);
  // Same currency rule as dealer cards: lot's native shows as primary
  // when it matches user's primaryCurrency; otherwise convert via
  // lotUsdValue → primaryCurrency (FX rates in utils). Native price
  // moves to the secondary line when it differs from primary.
  const lotPrimaryAmount = (() => {
    if (!isLot) return null;
    if (matchesPrimary) return lotNativeValue;
    if (primaryCurrency === "USD") return lotUsdValue;
    if (lotUsdValue == null) return null;
    const rate = FX_RATES_USD_PER[primaryCurrency];
    if (!rate) return null;
    return Math.round(lotUsdValue / rate);
  })();
  const lotPrimaryDisplay = !isLot ? null
    : lotPrimaryAmount != null
      ? (matchesPrimary
          ? fmtLotPrice(lotPrimaryAmount, primaryCurrency) || "—"
          // Drop the `~` prefix on converted amounts (Mark
          // 2026-05-11) — see the dealer-card branch above for the
          // alignment reason.
          : `${primarySym}${Math.round(lotPrimaryAmount).toLocaleString()}`)
      : fmtLotPrice(lotNativeValue, item.currency) || "—";
  const lotShowNative = isLot && !matchesPrimary && lotNativeValue;
  // Estimate line — only shows on active auction-format lots when
  // both bounds are known. Drops once hammered (the HAMMER price
  // tells the story by then).
  const estimateLine = (isAuctionLot && !item.sold
    && item.estimate_low && item.estimate_high)
    ? `Est. ${fmtLotPrice(item.estimate_low, item.currency)}–${
        fmtLotPrice(item.estimate_high, "")?.trim() || ""
      }`
    : null;
  const countdownLabel = (isAuctionLot && !item.sold && item.auction_end)
    ? fmtCountdown(item.auction_end)
    : null;
  const countdownIsPast = countdownLabel && countdownLabel.startsWith("ended");
  // ⚠️ Never put a {/* */} JSX comment between `return (` and the root element — CRA parses it as a stray object literal and CI=true turns it into a failed build. Comments go inside the JSX tree or above the return.
  // Card-system fold (2026-05-24): render into the shared CardShell. ALL the
  // price/FX/auction logic above is untouched — here we hand the computed
  // pieces to the shell's slots (imageOverlay / L2 source / L1 title / L3
  // price) and the action config (heart / menu / quickAction). CardShell owns
  // the frame, the action stack, and the single portal menu.
  return (
    <CardShell
      innerRef={cardRef}
      href={item.url}
      onClickLink={onClickListing ? () => onClickListing(item) : undefined}
      image={item.img ? { src: imgSrc(item.img), alt: item.ref } : null}
      priority={priority}
      aspect="square"
      size={compact ? "compact" : "full"}
      bodyPadding={compact ? "5px 7px 8px" : "7px 9px 10px"}
      imageOverlay={item.sold ? (() => {
        const dur = (!item._isAuctionFormat && !item._isTrackedLot)
          ? daysOnSale(item) : null;
        const durLabel = dur != null ? daysOnSaleLabel(dur) : null;
        return (
          <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 8, letterSpacing: "0.06em" }}
            title={durLabel ? `On sale for ${durLabel} before going sold` : undefined}>
            SOLD{durLabel ? ` · ${durLabel}` : ""}
          </div>
        );
      })() : isHidden ? (
        <div style={{ position: "absolute", top: 6, left: 6, background: "rgba(120,120,120,0.85)", color: "#fff", fontSize: 10, padding: "2px 8px", borderRadius: 8, letterSpacing: "0.06em" }}>HIDDEN</div>
      ) : countdownLabel ? (
        <div style={{
          position: "absolute", top: 6, left: 6,
          background: countdownIsPast ? "rgba(0,0,0,0.55)" : "rgba(59,74,54,0.92)",
          color: "#fff", fontSize: 10,
          padding: "2px 8px", borderRadius: 8,
          letterSpacing: "0.04em", fontWeight: 600,
          textTransform: "uppercase",
        }}>{countdownLabel}</div>
      ) : isAuctionLot ? (
        <div style={{
          position: "absolute", top: 6, left: 6,
          background: "rgba(59,74,54,0.92)", color: "#fff",
          fontSize: 10, padding: "2px 8px", borderRadius: 8,
          letterSpacing: "0.06em", fontWeight: 600,
        }}>AUCTION</div>
      ) : null}
      level2={<div style={{ fontSize: compact ? 8 : 9, color: "var(--text3)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.source}</div>}
      level1={(() => {
        const title = item.ref || " ";
        const brand = item.brand;
        const model = item.model;
        const lowerTitle = title.toLowerCase();
        const showBrand = brand
          && brand !== "Other"
          && !lowerTitle.includes(brand.toLowerCase());
        const showModel = model
          && !lowerTitle.includes(model.toLowerCase())
          && !(brand && brand.toLowerCase().includes(model.toLowerCase()));
        const prefix = [showBrand && brand, showModel && model].filter(Boolean).join(" ");
        return (
          <div style={{ fontSize: compact ? 10 : 12, fontWeight: 500, lineHeight: 1.3, marginBottom: 4, color: "var(--text1)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: compact ? 26 : 32 }}>
            {prefix ? <><b style={{ fontWeight: 700 }}>{prefix}</b> {title}</> : title}
          </div>
        );
      })()}
      level3={<>
        {isLot ? (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 10, color: "var(--text3)", letterSpacing: "0.05em", fontWeight: 600 }}>
              {lotLabel}
            </span>
            <span style={{ fontSize: compact ? 11 : 13, fontWeight: 500, color: item.sold ? "var(--accent-positive)" : "var(--text1)" }}>
              {lotPrimaryDisplay}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <div style={{ fontSize: compact ? 11 : 13, fontWeight: 500, color: item.sold ? "var(--text2)" : "var(--text1)" }}>{displayPrice}</div>
            {priceDropped && (
              <span title={`Peak ${fmt(peakPrice, item.currency || "USD")} → ${fmt(item.price, item.currency || "USD")}`}
                style={{ fontSize: 10, color: "var(--accent-positive)", fontWeight: 600 }}>
                ↓ {fmt(cumulativeDrop, item.currency || "USD")}
              </span>
            )}
          </div>
        )}
        <div style={{ fontSize: 10, color: "var(--text3)", minHeight: 12 }}>
          {(() => {
            if (item.sold) {
              const soldDateStr = item.soldAt || item.lastSeen
                || (isLot ? item.auction_end : null);
              const label = fmtSoldDate(soldDateStr);
              if (label) return label;
            }
            if (isLot) {
              if (lotShowNative) return fmtLotPrice(lotNativeValue, item.currency);
              return estimateLine || " ";
            }
            if (compact) return " ";
            return showNative ? fmt(item.price, item.currency) : " ";
          })()}
        </div>
      </>}
      quickAction={quickAction ? {
        label: quickAction.label, icon: quickAction.icon,
        active: quickAction.active, onClick: () => quickAction.onClick(item),
      } : null}
      heart={{ wished, onToggle: () => onWish(item) }}
      menu={{
        onShare: onShare ? () => onShare(item) : null,
        onAddToCollection: onAddToCollection ? () => onAddToCollection(item) : null,
        onHide: onHide ? () => onHide(item) : null,
        hideLabel,
        isHidden,
        extraMenuItems: (extraMenuItems || []).map(entry => ({
          label: entry.label, onClick: () => entry.onClick(item),
        })),
      }}
    />
  );
});
