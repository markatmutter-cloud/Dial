import React from "react";
import { render } from "@testing-library/react";
import { ShareReceiver } from "./ShareReceiver";

// Smoke test for the single-listing share-receive adapter. The component
// parses ?shared=1&listing=<id> from window.location on mount. In jsdom
// (no query string by default) it must early-return null without
// crashing — that's the road test. A ReferenceError or undefined
// destructure here would have been the next CardShell-shape regression.
// The active-share render path (?shared=1 in URL) is not covered yet —
// add a second test if a bug shows up there.

describe("ShareReceiver", () => {
  test("returns null (no crash) when no share intent is in the URL", () => {
    const { container } = render(
      <ShareReceiver
        items={[]}
        user={null}
        watchlist={{}}
        toggleWatchlist={() => {}}
        addToSharedInbox={async () => {}}
        isAuthConfigured={false}
        signInWithGoogle={() => {}}
        primaryCurrency="USD"
        setShareActive={() => {}}
        onClickListing={() => {}}
        setTab={() => {}}
        resetTick={0}
        openTick={0}
        openListingId={null}
        openCollectionPicker={null}
        handleShare={null}
        onSeedItem={() => {}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
