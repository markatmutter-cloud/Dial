import React, { useState, useMemo, useEffect } from "react";
import LumeHome from "./LumeHome";
import LumeResultPanel from "./LumeResultPanel";
import LumeResultGrid from "./LumeResultGrid";
import LumeComposer from "./LumeComposer";
import { LumeConversation } from "./LumeConversation";
import LumeSearchBar from "./LumeSearchBar";
import { LumeIcon } from "./LumeIcon";
import { JOURNEYS, journeyLine } from "./LumeJourneyGrid";
import { renderLumeListingCard, renderLumeArticleCard } from "./lumeCards";
import { selectMissed, deriveTasteSets, urlKey } from "../lumeMissed";
import { recordVisit, recordJourney, rankJourneys, buildGreeting } from "../lumeColdOpen";
import { matchesSearch } from "../utils";

// LumeCanvas — the host-agnostic morphing surface. Owns the view router
// (home / result / search / chat) and computes each journey's results from data
// already in app memory (no /api/chat round-trip for the catch-up journeys).
// The landing is a warm, personal greeting + a promoted hero journey (with a
// content peek) + the rest as live-count cards. The always-present input weaves
// typed questions into the conversation, or runs a unified in-canvas search.

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

  // Record the visit once on mount; drives journey ranking + the greeting.
  useEffect(() => { setUsage(recordVisit()); }, []);

  const tasteSets = useMemo(() => deriveTasteSets(watchlist), [watchlist]);
  const hasTaste = tasteSets.tasteBrands.size > 0;

  // url/id index so selectMissed's projected results map back to the FULL
  // listing object (with image/price) for card render + hero thumbnails.
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

  // Compute every journey's results once (cheap O(n) passes over in-memory
  // feeds) so the landing can show live counts + hero thumbnails, and a tap
  // reuses the same computed set.
  const results = useMemo(() => {
    const hydrate = (res) => res.map((r) => byId.get(r.id) || byUrl.get(urlKey(r.url))).filter(Boolean);
    const now = Date.now();
    const out = {};

    const liveAll = liveItems
      .filter((i) => i && !i.sold && i.firstSeen)
      .sort((a, b) => (Date.parse(b.firstSeen) || 0) - (Date.parse(a.firstSeen) || 0));
    out.latest = { items: liveAll.slice(0, 24), count: liveAll.length, kind: "listing",
      empty: "Nothing new has landed just yet." };

    const ml = selectMissed(liveItems, { mode: "live_unsaved", ...tasteSets, limit: 15 });
    out.missed_live = { items: hydrate(ml.results), count: ml.count, kind: "listing",
      empty: hasTaste ? "Nothing in your taste slipped past you this week." : "Heart a few watches and I'll start spotting what you missed." };

    const ga = selectMissed(liveItems, { mode: "sold_unsaved", ...tasteSets, limit: 15 });
    out.got_away = { items: hydrate(ga.results), count: ga.count, kind: "listing",
      empty: hasTaste ? "Nothing notable got away this week." : "Heart a few watches and I'll flag the ones that get away." };

    const ss = selectMissed(liveItems, { mode: "sold_saved", ...tasteSets, limit: 15 });
    out.saved_sold = { items: hydrate(ss.results), count: ss.count, kind: "listing",
      empty: "None of your saved watches have sold recently." };

    const auctAll = auctionLotItems
      .filter((i) => i && !i.sold && i.auction_end && (Date.parse(i.auction_end) || 0) > now)
      .sort((a, b) => (Date.parse(a.auction_end) || 0) - (Date.parse(b.auction_end) || 0));
    out.auctions_soon = { items: auctAll.slice(0, 24), count: auctAll.length, kind: "listing",
      empty: auctionLotItems.length === 0 ? "Loading auction lots…" : "No lots are closing in the next while." };

    const arts = articles || [];
    out.articles = { items: arts.slice(0, 24), count: arts.length, kind: "article",
      empty: "No fresh articles right now." };

    return out;
  }, [liveItems, auctionLotItems, articles, tasteSets, hasTaste, byId, byUrl]);

  // Context-aware order, then enrich with live counts + the hero's content peek.
  const auctionsSoonCount = results.auctions_soon.count;
  const ordered = useMemo(() => {
    const { order } = rankJourneys(usage || {}, { auctionsSoonCount, visitsLast24h: usage && usage.visitsLast24h });
    return order
      .map((k) => JOURNEYS.find((j) => j.key === k))
      .filter(Boolean)
      .map((j) => {
        const r = results[j.key] || { items: [], count: 0 };
        return { ...j, count: r.count, line: journeyLine(j.key, r.count), thumbItems: r.items.slice(0, 4) };
      });
  }, [usage, auctionsSoonCount, results]);

  const hero = useMemo(() => ordered.find((j) => j.count > 0) || null, [ordered]);
  const secondary = useMemo(() => ordered.filter((j) => j !== hero), [ordered, hero]);

  // Warm, personal opener that names what's notable right now.
  const greeting = useMemo(() => {
    const firstName = String(user?.user_metadata?.name || user?.user_metadata?.full_name || "").trim().split(/\s+/)[0] || "";
    const notables = [];
    if (results.auctions_soon.count) notables.push(`${results.auctions_soon.count} lot${results.auctions_soon.count > 1 ? "s" : ""} closing soon`);
    if (results.missed_live.count) notables.push(`${results.missed_live.count} fresh in your taste`);
    if (results.articles.count) notables.push(`${results.articles.count} new to read`);
    if (notables.length < 2 && results.latest.count) notables.push(`${results.latest.count} just listed`);
    return buildGreeting({ firstName, hour: new Date().getHours(), notables });
  }, [user, results]);

  // Unified in-canvas search across the in-memory types (listings / sold /
  // auctions), reusing the app's shared matchesSearch. Articles + reference
  // guides are the queued follow-up.
  const searchGroups = useMemo(() => {
    if (view.kind !== "search") return null;
    const q = view.query || "";
    const live = liveItems.filter((i) => i && !i.sold && matchesSearch(i, q)).slice(0, 24);
    const sold = liveItems.filter((i) => i && i.sold && matchesSearch(i, q)).slice(0, 24);
    const auctions = auctionLotItems.filter((i) => i && matchesSearch(i, q)).slice(0, 24);
    return [
      { key: "listings", title: "Listings", items: live },
      { key: "sold", title: "Sold", items: sold },
      { key: "auctions", title: "Auctions", items: auctions },
    ].filter((g) => g.items.length);
  }, [view.kind, view.query, liveItems, auctionLotItems]);

  const panel = useMemo(() => {
    const key = view.intent;
    if (!key || !results[key]) return null;
    const r = results[key];
    return {
      title: titleFor(key), voice: VOICE[key] || "",
      items: r.items, kind: r.kind, isEmpty: !r.items.length, emptyText: r.empty,
    };
  }, [view.intent, results]);

  const onSelectJourney = (key) => { recordJourney(key); setView({ kind: "result", intent: key }); };
  const goHome = () => setView({ kind: "home", intent: null });
  const submitSearch = (text) => setView({ kind: "search", intent: null, query: text });
  const submitAsk = (text) => { setView({ kind: "chat", intent: null }); chat.send(text); };

  const rootStyle = { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 };
  const scrollStyle = { flex: 1, overflowY: "auto", overscrollBehavior: "contain", padding: isMobile ? "16px 16px 8px" : "22px 20px 10px" };
  const innerStyle = { maxWidth: 880, margin: "0 auto", width: "100%" };

  // The morphing content (home / result / search) — shared by both layouts.
  const content = (
    view.kind === "search" ? (
      <LumeResultPanel
        title={`Results for "${view.query}"`}
        onBack={goHome}
        isEmpty={!searchGroups || !searchGroups.length}
        emptyText={"No matches in our listings. Try fewer words, or ask Lumé to dig in."}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {(searchGroups || []).map((g) => (
            <div key={g.key}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 10 }}>
                {g.title} <span style={{ color: "var(--text3)" }}>{g.items.length}</span>
              </div>
              <LumeResultGrid items={g.items} renderCard={listingCard} isMobile={isMobile} />
            </div>
          ))}
        </div>
      </LumeResultPanel>
    ) : view.kind === "result" && panel ? (
      <LumeResultPanel title={panel.title} voice={panel.voice} onBack={goHome}
        isEmpty={panel.isEmpty} emptyText={panel.emptyText}>
        <LumeResultGrid items={panel.items}
          renderCard={panel.kind === "article" ? articleCard : listingCard}
          isMobile={isMobile} />
      </LumeResultPanel>
    ) : (
      <LumeHome greeting={greeting} hero={hero} journeys={secondary} onSelect={onSelectJourney} isMobile={isMobile} />
    )
  );

  // Mobile: single column. Search + Ask share one composer; chat is a view you
  // switch into (no room for a side rail).
  if (isMobile) {
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
          <LumeConversation chat={chat} onOpenItem={onOpenItem} isMobile suggestions={[]} />
        </div>
      );
    }
    return (
      <div style={rootStyle}>
        <div style={scrollStyle}><div style={innerStyle}>{content}</div></div>
        <LumeComposer chat={chat} onSearch={submitSearch} onAsk={submitAsk} isMobile />
      </div>
    );
  }

  // Desktop: two-pane. Content + a Search bar on the LEFT; an always-on chat
  // rail (Ask) on the RIGHT. Tapping a journey/card updates the left while the
  // conversation persists on the right.
  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={scrollStyle}><div style={{ width: "100%" }}>{content}</div></div>
        <LumeSearchBar onSearch={submitSearch} />
      </div>
      <aside style={{
        width: 380, flexShrink: 0, borderLeft: "0.5px solid var(--border)",
        display: "flex", flexDirection: "column", minHeight: 0, background: "var(--bg)",
      }}>
        <div style={{
          flexShrink: 0, padding: "12px 14px", borderBottom: "0.5px solid var(--border)",
          display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 14,
        }}>
          <LumeIcon size={18} /> Ask Lumé
        </div>
        <LumeConversation chat={chat} onOpenItem={onOpenItem} isMobile={false} />
      </aside>
    </div>
  );
}
