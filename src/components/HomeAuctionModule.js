// HomeAuctionModule — the auction section on Home, as a dated ruled list
// rather than a fifth row of photo tiles.
//
// Why this shape (Epic 9 step 3, 2026-08-30). Mark's complaint about the
// landing page was that it is "just a series of scrollable lines" and that
// "it's not clear what's going on", while ruling out a paragraph of site
// description at the top. The review panel's answer, and its highest-leverage
// single change:
//
//   - Four identical photo rails is the boredom. Variety has to come from row
//     SHAPE, not row scale. Hairlines and numbers next to three rows of
//     photographs is a genuinely different texture, and it is the only block
//     on the page that isn't a strip.
//   - It explains the site faster than a sentence could. Six auction-house
//     names a visitor already trusts, each with a real date, IS the
//     explanation, and it costs no space at the top of the page.
//   - It makes the data more legible, not less. "17 HOURS LEFT" and "CURRENT
//     BID USD 3,400" were 10px badges printed over photographs, then hidden
//     behind horizontal scroll. In a ruled list they read straight down a
//     column.
//   - It cannot rot. It is ordered by a clock. The two things that died on
//     this page before (LiveCounts, the cycling banner) died because someone
//     had to keep them true. Nothing here is hand-maintained, and the whole
//     block unmounts when nothing is closing.
//
// It also lands the standing "pull auctions closing soon out of a strip"
// thread from the Saved-tab restructure. Built once, here.

import React from "react";
import SectionHeader from "./SectionHeader";
import { HOME_SECTIONS } from "../homeSections";
import { imgSrc, fmtCountdown, fmtLotPrice, fmtSaleDateRange, FX_RATES_USD_PER, CURRENCY_SYM } from "../utils";

// Sales are the context line, not the content: four is enough to show the
// calendar is real and broad without turning the block into a second list.
const MAX_SALES = 4;
const MAX_LOTS_DESKTOP = 8;
const MAX_LOTS_MOBILE = 6;

// A lot closing further out than this isn't "closing soon" in any useful
// sense, and a block titled "ending next" pointing at something three weeks
// away is the kind of small lie that erodes trust in the rest of the page.
const HORIZON_MS = 30 * 24 * 3600 * 1000;

// Same fallback chain as Card.js: pre-auction lots carry no current_bid, and
// falling straight through to the native amount then labelling it USD is the
// bug Mark caught in May 2026 ("CHF doesn't convert 1:1 to USD").
function lotPriceDisplay(item, primaryCurrency) {
  const native = item.current_bid ?? item.starting_price ?? item.price;
  const usd = item.current_bid_usd ?? item.starting_price_usd ?? item.estimate_low_usd ?? item.priceUSD ?? native;
  const matchesPrimary = item.currency && item.currency === primaryCurrency;
  if (matchesPrimary) return fmtLotPrice(native, primaryCurrency);
  if (primaryCurrency === "USD") return fmtLotPrice(usd, "USD");
  const rate = FX_RATES_USD_PER[primaryCurrency];
  if (usd == null || !rate) return fmtLotPrice(native, item.currency);
  return `${CURRENCY_SYM[primaryCurrency] || ""}${Math.round(usd / rate).toLocaleString()}`;
}

// "17 hours left" -> "17h". The column is scanned vertically, so it wants a
// token, not a sentence; the header already says these are closing.
function shortCountdown(endIso) {
  const label = fmtCountdown(endIso);
  if (!label || label.startsWith("ended")) return null;
  const m = /^(\d+)\s+(day|hour|min)/.exec(label);
  if (!m) return label;
  return `${m[1]}${m[2] === "day" ? "d" : m[2] === "hour" ? "h" : "m"}`;
}

function SaleRow({ sale, isMobile, onOpen }) {
  const chip = sale.status === "live" ? "Bidding open" : sale.hasCatalog ? "Catalogue live" : null;
  return (
    <a
      href={sale.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onOpen ? (e) => { e.preventDefault(); onOpen(sale); } : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: isMobile ? "10px 0" : "11px 0",
        borderTop: "0.5px solid var(--border)",
        textDecoration: "none", color: "inherit",
      }}
    >
      {/* The house NAME, not its logo. HouseLogo sizes off a fixed-height
          parent (maxHeight 55%), which a ruled list row doesn't have, and the
          point of this block is that a visitor reads Christie's / Phillips /
          Sotheby's and recognises them. A 22px logo does that worse than the
          word does. */}
      <div style={{
        width: isMobile ? 78 : 108, flexShrink: 0,
        fontSize: isMobile ? 11 : 12, fontWeight: 600, letterSpacing: "0.06em",
        textTransform: "uppercase", color: "var(--text1)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{sale.house}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: isMobile ? 13 : 14, fontWeight: 500, color: "var(--text1)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{sale.title}</div>
        {sale.location && (
          <div style={{
            fontSize: 12, color: "var(--text3)", marginTop: 2,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>{sale.location}</div>
        )}
      </div>
      {chip && !isMobile && (
        <span style={{
          flexShrink: 0, fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--brand-olive-text)",
          border: "0.5px solid var(--brand-olive-text)", borderRadius: 999,
          padding: "3px 8px",
        }}>{chip}</span>
      )}
      <div style={{
        flexShrink: 0, fontSize: 12, color: "var(--text2)",
        fontVariantNumeric: "tabular-nums", textAlign: "right",
        width: isMobile ? 96 : 150,
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{fmtSaleDateRange(sale)}</div>
    </a>
  );
}

function LotRow({ item, isMobile, primaryCurrency, onClickListing }) {
  const price = lotPriceDisplay(item, primaryCurrency);
  const left = shortCountdown(item.auction_end);
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClickListing ? () => onClickListing(item) : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "8px 0",
        borderTop: "0.5px solid var(--border)",
        textDecoration: "none", color: "inherit",
      }}
    >
      <div style={{
        width: 48, height: 48, flexShrink: 0, borderRadius: 3, overflow: "hidden",
        background: "var(--surface)",
      }}>
        {(item.img || item.image) && (
          <img src={imgSrc(item.img || item.image, 96)} alt="" loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        )}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--text3)", marginBottom: 2,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{item.source}</div>
        <div style={{
          fontSize: isMobile ? 13 : 14, color: "var(--text1)", lineHeight: 1.25,
          display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{item.ref || item.title}</div>
      </div>
      <div style={{
        flexShrink: 0, textAlign: "right", fontVariantNumeric: "tabular-nums",
        width: isMobile ? 96 : 150,
      }}>
        <div style={{ fontSize: isMobile ? 13 : 14, color: "var(--text1)", fontWeight: 500 }}>
          {price || "No bids"}
        </div>
        {left && (
          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{`${left} left`}</div>
        )}
      </div>
    </a>
  );
}

export default function HomeAuctionModule({
  sales = [],
  lots = [],
  isMobile,
  primaryCurrency = "USD",
  onClickListing,
  onOpenSale,
  onOpenCalendar,
  count,
  spacing,
}) {
  const now = Date.now();
  const closing = lots
    .filter((i) => {
      const end = i.auction_end ? Date.parse(i.auction_end) : NaN;
      return !Number.isNaN(end) && end > now && end - now < HORIZON_MS;
    })
    .slice(0, isMobile ? MAX_LOTS_MOBILE : MAX_LOTS_DESKTOP);

  // The whole block unmounts when nothing is closing. An "ending next" header
  // over an empty list is worse than no section, and this is what keeps the
  // module honest without anyone maintaining it.
  if (closing.length === 0) return null;

  // Sale selection has three rules, and all three exist because the first
  // version broke on real data:
  //
  // 1. A parseable FUTURE end date is required. Letting undated entries
  //    through (`Number.isNaN(end) || ...`) put two long-past Bonhams sales
  //    on the page dated "15 June, 18:00 CEST", which is B-78's un-pruned
  //    calendar rot rendered at full size on the landing page.
  // 2. Soonest-ending first. Sorting on dateStart surfaced whatever opened
  //    earliest, which for rolling weekly sales is the stalest row.
  // 3. One row per house, until we run out of houses. The entire point of
  //    this block is that a visitor reads several names they trust; four
  //    Bonhams rows, which is exactly what the un-deduped version rendered,
  //    says the opposite of what the block is for.
  const dated = sales
    .filter((s) => s.status === "live" || s.status === "upcoming")
    .map((s) => ({ sale: s, ends: Date.parse(s.dateEnd || s.dateStart || "") }))
    .filter((x) => !Number.isNaN(x.ends) && x.ends >= now)
    .sort((a, b) => a.ends - b.ends);
  const seenHouses = new Set();
  const upcoming = [];
  for (const { sale } of dated) {
    if (upcoming.length >= MAX_SALES) break;
    if (seenHouses.has(sale.house)) continue;
    seenHouses.add(sale.house);
    upcoming.push(sale);
  }
  for (const { sale } of dated) {
    if (upcoming.length >= MAX_SALES) break;
    if (!upcoming.includes(sale)) upcoming.push(sale);
  }

  return (
    <section style={{ marginBottom: spacing != null ? spacing : (isMobile ? 20 : 24) }}>
      <SectionHeader
        rule
        eyebrow={HOME_SECTIONS.endingNext.eyebrow}
        heading={HOME_SECTIONS.endingNext.heading}
        count={count}
        descriptor={HOME_SECTIONS.endingNext.descriptor}
        onViewAll={onOpenCalendar}
        viewAllLabel="Full calendar"
        isMobile={isMobile}
      />
      <div style={{ padding: isMobile ? "0 16px" : "0 20px" }}>
        {upcoming.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            {upcoming.map((s) => (
              <SaleRow key={s.id || s.url} sale={s} isMobile={isMobile} onOpen={onOpenSale} />
            ))}
          </div>
        )}
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase",
            color: "var(--text3)", marginBottom: 2,
          }}>Closing soonest</div>
          {closing.map((item) => (
            <LotRow key={item.id || item.url} item={item} isMobile={isMobile}
              primaryCurrency={primaryCurrency} onClickListing={onClickListing} />
          ))}
        </div>
      </div>
    </section>
  );
}
