import React from "react";
import { render, screen } from "@testing-library/react";
import { ListingPickerModal } from "./ListingPickerModal";

// Smoke tests for the Owned/Sold/Wishlist picker. Source chips render
// from the active source set; verifies the open/closed branches + the
// default "Favorites" source. The empty-state branch (no candidates +
// no paste URL) was the most likely silent crash — covered with a third
// test.

describe("ListingPickerModal", () => {
  const handlers = { onClose: () => {}, onPick: async () => ({}) };
  const baseProps = {
    title: "Add to Owned",
    watchItems: [],
    collections: [],
    itemsByCollection: {},
    allListings: [],
    primaryCurrency: "USD",
  };

  test("returns null when closed", () => {
    const { container } = render(<ListingPickerModal open={false} {...handlers} {...baseProps} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("renders the title + source chips when open", () => {
    render(
      <ListingPickerModal
        open={true} {...handlers} {...baseProps}
        collections={[{ id: "c1", name: "Vintage" }]}
      />
    );
    expect(screen.getByText("Add to Owned")).toBeInTheDocument();
    expect(screen.getByText(/Favorites/)).toBeInTheDocument();
    expect(screen.getByText("All listings")).toBeInTheDocument();
    expect(screen.getByText("Vintage")).toBeInTheDocument();
    expect(screen.getByText("Paste link")).toBeInTheDocument();
  });

  test("renders the empty-state when the active source has no candidates", () => {
    render(<ListingPickerModal open={true} {...handlers} {...baseProps} />);
    // Default source is "favorites" + watchItems is [] → empty-state heading.
    expect(screen.getByText(/Nothing saved matches/)).toBeInTheDocument();
  });
});
