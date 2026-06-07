import React from "react";
import { render } from "@testing-library/react";
import { CatalogReceiver } from "./CatalogReceiver";

// Smoke test for the auction-catalog share-receive adapter. Same shape
// as ShareReceiver: parses ?catalog=&shared=1 from window.location on
// mount; with no URL params it must early-return null without crashing.
// Active-catalog render path (?catalog=... in URL) is uncovered — worth
// adding if a bug surfaces.

describe("CatalogReceiver", () => {
  test("returns null (no crash) when no catalog share intent is in the URL", () => {
    const { container } = render(
      <CatalogReceiver
        user={null}
        isAuthConfigured={false}
        signInWithGoogle={() => {}}
        salesByUrl={new Map()}
        lotsByAuctionUrl={new Map()}
        savedAuctionUrlSet={new Set()}
        toggleSavedAuction={() => {}}
        onOpenCatalog={() => {}}
        setCatalogShareActive={() => {}}
        setTab={() => {}}
        resetTick={0}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
