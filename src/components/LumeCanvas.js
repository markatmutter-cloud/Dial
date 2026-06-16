import React, { useState, useMemo, useEffect } from "react";
import LumeHome from "./LumeHome";
import LumeResultPanel from "./LumeResultPanel";
import LumeResultGrid from "./LumeResultGrid";
import LumeComposer from "./LumeComposer";
import { LumeConversation } from "./LumeConversation";
import { JOURNEYS } from "./LumeJourneyGrid";
import { renderLumeListingCard, renderLumeArticleCard } from "./lumeCards";
import { selectMissed, deriveTasteSets, urlKey } from "../lumeMissed";
import { recordVisit, recordJourney, lumeColdOpen, rankJourneys } from "../lumeColdOpen";

// LumeCanvas — the host-agnostic morphing surface. Owns the view router
// (home / result / chat) and computes each journey's panel from data already
// in app memory (no /api/chat round-trip for the catch-up journeys). The
// always-present composer weaves typed questions into the conversation view.
//
// Mounted in LumeTab today (the proving ground); the same component graduates
// into the full-screen launcher takeover later (Phase 3) unchanged.

const VOICE = {
  latest: "Freshest first. Here's what's just been listed.",
  missed_live: "In your taste, still live, and not yet saved.",
  got_away: "These sold before you saved them. Fastest sellers first.",
  saved_sold: "Watches you'd hearted that have since sold.",
  auctions_soon: "Auction lots closing soonest.",
  articles: "New reading from the journals.",
};

const titleFor = (key) => (JOURNEYS.find((j) => j.key === key) || {}).label || "";

export default function LumeCanvas({
  chat, user, isMobile = false, onOpenItem,
  liveItems = [], auctionLotItems = [], articles = [], watchlist = {},
  cardCtx = {},
}) {
  const listingCard = (it) => renderLumeListingCard(it, cardCtx);
  const articleCard = (a) => renderLumeArticleCard(a, cardCtx);
  const [view, setView] = useState({ kind: "home", intent: null });
  const [usage, setUsage] = useState(null);

  // Record the visit once on mount; drives the evolving cold open.
  useEffect(() => { setUsage(recordVisit()); }, []);

  const tasteSets = useMemo(() => deriveTasteSets(watchlist), [watchlist]);
  const heartedCount = useMemo(() => Object.keys(watchlist || {}).length, [watchlist]);

  // How many auction lots are actually closing within ~3 days — the signal that
  // bumps "under the hammer" to the lead (Mark's context-priority brief).
  const auctionsSoonCount = useMemo(() => {
    const now = Date.now();
    const horizon = now + 3 * 86400000;
    return auctionLotItems.filter((i) => {
      if (!i || i.sold || !i.auction_end) return false;
      const t = Date.parse(i.auction_end);
      return Number.isFinite(t) && t > now && t <= horizon;
    }).length;
  }, [auctionLotItems]);

  const coldOpen = useMemo(
    () => lumeColdOpen(usage || {}, { heartedCount, auctionsSoon: auctionsSoonCount > 0 }),
    [usage, heartedCount, auctionsSoonCount]
  );
  // Reorder the journey cards so the lead matches the user's likely intent.
  const orderedJourneys = useMemo(() => {
    const { order } = rankJourneys(usage || {}, { auctionsSoonCount, visitsLast24h: usage && usage.visitsLast24h });
    return order.map((k) => JOURNEYS.find((j) => j.key === k)).filter(Boolean);
  }, [usage, auctionsSoonCount]);

  // url/id index so selectMissed's projected results map back to the FULL
  // listing object (with image/price) for card render.
  const byId = useMemo(() => {
    const m = new Map();
    for (const it of liveItems) if (it && it.id) m.set(it.id, it);
    return m;
  }, [liveItems]);
  const byUrl = useMemo(() => {
    const m = new Map();
    for (const it of liveItems) if (it && it.url) m.set(urlKey(it.url), it);
    return m;
  }, [liveItems]);

  const panel = useMemo(() => {
    const key = view.intent;
    if (!key) return null;
    const hydrate = (res) => res.map((r) => byId.get(r.id) || byUrl.get(urlKey(r.url))).filter(Boolean);
    const hasTaste = tasteSets.tasteBrands.size > 0;
    let items = [];
    let kind = "listing";
    let emptyText = "Nothing to show here yet.";

    if (key === "latest") {
      items = liveItems
        .filter((i) => i && !i.sold && i.firstSeen)
        .sort((a, b) => (Date.parse(b.firstSeen) || 0) - (Date.parse(a.firstSeen) || 0))
        .slice(0, 15);
      emptyText = "Nothing new has landed just yet.";
    } else if (key === "missed_live") {
      items = hydrate(selectMissed(liveItems, { mode: "live_unsaved", ...tasteSets, limit: 15 }).results);
      emptyText = hasTaste ? "Nothing in your taste slipped past you this week." : "Heart a few watches and I'll start spotting what you missed.";
    } else if (key === "got_away") {
      items = hydrate(selectMissed(liveItems, { mode: "sold_unsaved", ...tasteSets, limit: 15 }).results);
      emptyText = hasTaste ? "Nothing notable got away this week." : "Heart a few watches and I'll flag the ones that get away.";
    } else if (key === "saved_sold") {
      items = hydrate(selectMissed(liveItems, { mode: "sold_saved", ...tasteSets, limit: 15 }).results);
      emptyText = "None of your saved watches have sold recently.";
    } else if (key === "auctions_soon") {
      const now = Date.now();
      items = auctionLotItems
        .filter((i) => i && !i.sold && i.auction_end && (Date.parse(i.auction_end) || 0) > now)
        .sort((a, b) => (Date.parse(a.auction_end) || 0) - (Date.parse(b.auction_end) || 0))
        .slice(0, 15);
      emptyText = auctionLotItems.length === 0 ? "Loading auction lots…" : "No lots are closing in the next while.";
    } else if (key === "articles") {
      items = (articles || []).slice(0, 15);
      kind = "article";
      emptyText = "No fresh articles right now.";
    }

    return {
      title: titleFor(key),
      voice: VOICE[key] || "",
      items,
      kind,
      isEmpty: !items.length,
      emptyText,
    };
  }, [view.intent, liveItems, auctionLotItems, articles, tasteSets, byId, byUrl]);

  const onSelectJourney = (key) => { recordJourney(key); setView({ kind: "result", intent: key }); };
  const goHome = () => setView({ kind: "home", intent: null });
  const submitText = (text) => { setView({ kind: "chat", intent: null }); chat.send(text); };

  const rootStyle = { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 };
  const scrollStyle = { flex: 1, overflowY: "auto", overscrollBehavior: "contain", padding: isMobile ? "16px 16px 8px" : "22px 20px 10px" };
  const innerStyle = { maxWidth: 880, margin: "0 auto", width: "100%" };

  if (view.kind === "chat") {
    return (
      <div style={rootStyle}>
        <div style={{ flexShrink: 0, padding: "10px 14px", borderBottom: "0.5px solid var(--border)" }}>
          <button onClick={goHome} aria-label="Back to journeys" style={{
            border: "0.5px solid var(--border)", background: "var(--surface)", color: "var(--text1)",
            borderRadius: 999, padding: "5px 12px", fontSize: 13, fontWeight: 500,
            cursor: "pointer", fontFamily: "inherit",
          }}>← Back to start</button>
        </div>
        <LumeConversation chat={chat} onOpenItem={onOpenItem} isMobile={isMobile} suggestions={[]} />
      </div>
    );
  }

  return (
    <div style={rootStyle}>
      <div style={scrollStyle}>
        <div style={innerStyle}>
          {view.kind === "result" && panel ? (
            <LumeResultPanel title={panel.title} voice={panel.voice} onBack={goHome}
              isEmpty={panel.isEmpty} emptyText={panel.emptyText}>
              <LumeResultGrid items={panel.items}
                renderCard={panel.kind === "article" ? articleCard : listingCard}
                isMobile={isMobile} />
            </LumeResultPanel>
          ) : (
            <LumeHome coldOpen={coldOpen} journeys={orderedJourneys} onSelect={onSelectJourney} isMobile={isMobile} />
          )}
        </div>
      </div>
      <LumeComposer chat={chat} onSend={submitText} isMobile={isMobile} />
    </div>
  );
}
