import React, { useEffect } from "react";
import { SizeCompare } from "./SizeCompare";
import { Links } from "./Links";
import { EditorialView } from "./EditorialView";
import { ChallengesView } from "./ChallengesView";
import { ScreeningView } from "./ScreeningView";
import { ReferencePage } from "./ReferencePage";
import { DEFAULT_REFERENCE_NODE } from "../data/referencePages";

// Collecting tab (internal `tab="references"`, UI label "Collecting").
// Restructured 2026-05-18 (Mark spec) from a resource-button list
// landing into a Listings-pattern sub-tab strip:
//
//   editorial — Hairspring Finds + Bring a Loupe + more editorial
//               sources, card grid with filter/sort/search. Default.
//   size      — Watch size comparison (Calibrated 1:1 ruler).
//   links     — Outbound link clusters per dealer + reference.
//
// Sub-tab state is owned by App.js (`referencesSubTab` /
// `setReferencesSubTab`) so URL + localStorage persistence live in
// the same place as Listings / Watchlists sub-tab state. This
// component is now a thin dispatch.
//
// History:
// 2026-05-04: Watch Challenges moved here from a Watchlist sub-tab.
// 2026-05-06 (PR #86): Watch Challenges moved OUT of here into the
// new top-level Collections tab.
// 2026-05-18: Editorial sub-tab added (the editorial corpus surface);
// resource-list landing replaced by a real sub-tab strip.

export function ReferencesTab({
  user,
  isAuthConfigured,
  signInWithGoogle,
  allListings,
  tabResetTick,
  subTab,
  setSubTab,
  cols,
  compact,
  gridStyle,
  isMobile,
  // Heart-articles plumbing (PR_P, 2026-05-20).
  watchlist,
  handleWish,
  // Add-to-list + Share on articles (PR_R, 2026-05-20).
  openCollectionPicker,
  handleShare,
  // Global search lifted up (2026-05-21): the in-Editorial search
  // input was retired so the top-bar search slot fills the header
  // symmetry gap on Collecting. EditorialView now reads `search`
  // from props (shared with the global listings search).
  search,
  setSearch,
  // Challenges plumbing (PR 2026-05-22, moved from Watchlists →
  // Collecting). Same props ChallengesView consumed when it lived
  // in CollectionsTab.
  collectionsApi,
  hidden,
  primaryCurrency,
  pendingChallengeDrillId,
  clearPendingChallengeDrill,
  // Screening surface (PR 2026-05-22) — collector-leisure
  // destination that lists screening pools.
  auctions,
  lotCountsByAuctionUrl,
  onReviewAuctionCatalog,
  onScreeningOpenList,
  // Reference pages (2026-05-24): deep-link to Listings pre-filtered by
  // reference + click telemetry for the market/connection sliders.
  onViewAll,
  onClickListing,
}) {
  // Tab re-tap → return to default sub-tab. App.js bumps
  // `tabResetTick` whenever the user clicks the active main tab
  // pill. Mark feedback 2026-05-07: tapping the Collecting pill
  // while inside a tool should return to the landing — now expressed
  // as "return to the default sub-tab".
  useEffect(() => {
    if (tabResetTick && tabResetTick > 0 && typeof setSubTab === "function") {
      setSubTab("editorial");
    }
  }, [tabResetTick, setSubTab]);

  const current = subTab || "editorial";

  // Sub-tab strip retired here 2026-05-21 (PR_Y3) — lifted into App.js
  // as `referencesSubTabsJSX` so it renders in the shell's sticky
  // stack alongside listingsSubTabsJSX / watchSubTabsJSX. Consistent
  // chrome on every tab.

  // ── Sub-tab body dispatch ──────────────────────────────────────
  let body;
  if (current === "size") {
    body = (
      <div style={{ paddingTop: 4 }}>
        <SizeCompare onBack={null} />
      </div>
    );
  } else if (current === "links") {
    body = (
      <div style={{ paddingTop: 4 }}>
        <Links allListings={allListings || []} onBack={null} />
      </div>
    );
  } else if (current === "screening") {
    body = (
      <ScreeningView
        auctions={auctions}
        lotCounts={lotCountsByAuctionUrl}
        collections={collectionsApi?.collections}
        itemsByCollection={collectionsApi?.itemsByCollection}
        userId={user?.id || null}
        onReviewAuction={onReviewAuctionCatalog}
        onReviewList={onScreeningOpenList}
        isMobile={isMobile}
      />
    );
  } else if (current === "challenges") {
    // PR 2026-05-22: Challenges moved here from Watchlists tab.
    // Same component (ChallengesView) and same prop bag it
    // consumed under CollectionsTab — just a different mount point.
    body = (
      <ChallengesView
        user={user}
        isAuthConfigured={isAuthConfigured}
        signInWithGoogle={signInWithGoogle}
        collectionsApi={collectionsApi}
        allListings={allListings}
        watchlist={watchlist}
        hidden={hidden}
        primaryCurrency={primaryCurrency}
        handleShare={handleShare}
        pendingChallengeDrillId={pendingChallengeDrillId}
        clearPendingChallengeDrill={clearPendingChallengeDrill}
      />
    );
  } else if (current === "references") {
    // Reference pages (2026-05-24) — lands directly on the first anchor
    // node (5512/5513). Browse index over multiple nodes is Phase 2.
    body = (
      <ReferencePage
        node={DEFAULT_REFERENCE_NODE}
        items={allListings || []}
        isMobile={isMobile}
        watchlist={watchlist}
        handleWish={handleWish}
        openCollectionPicker={openCollectionPicker}
        handleShare={handleShare}
        hidden={hidden}
        primaryCurrency={primaryCurrency}
        compact={compact}
        user={user}
        onClickListing={onClickListing}
        onViewAll={onViewAll}
      />
    );
  } else {
    // editorial (default)
    body = (
      <EditorialView
        cols={cols}
        compact={compact}
        gridStyle={gridStyle}
        isMobile={isMobile}
        watchlist={watchlist}
        handleWish={handleWish}
        openCollectionPicker={openCollectionPicker}
        handleShare={handleShare}
        search={search}
        setSearch={setSearch}
      />
    );
  }

  return (
    <div>
      {/* subStrip retired here 2026-05-21 (PR_Y3) — the Collecting
          sub-tabs lifted into App.js as `referencesSubTabsJSX` so
          they render in the shell's sticky stack alongside the
          Listings + Watchlists sub-tabs. Same chrome position on
          every tab. */}
      {body}
    </div>
  );
}
