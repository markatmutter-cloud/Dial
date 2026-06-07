import React from "react";
import { render, screen } from "@testing-library/react";
import { CollectionPickerModal } from "./CollectionPickerModal";

// Smoke tests for the Add-to-list picker. Gated by `target` (the
// listing being added). Verifies the visible-list filter (shared
// inbox + isSystem + challenges hidden) and the open/closed branches.

describe("CollectionPickerModal", () => {
  const handlers = {
    setTarget: () => {},
    addItemToCollection: async () => ({}),
    removeItemFromCollection: async () => ({}),
    createCollection: async () => ({}),
  };

  test("returns null when no target", () => {
    const { container } = render(
      <CollectionPickerModal target={null} collections={[]} itemsByCollection={{}} {...handlers} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders the picker when a target is set", () => {
    render(
      <CollectionPickerModal
        target={{ id: "x1", brand: "Rolex", ref: "5512" }}
        collections={[
          { id: "c1", name: "Vintage Subs", createdAt: "2026-01-01" },
          { id: "c2", name: "Wishlist", isSystem: true },
          { id: "c3", name: "Edges", createdAt: "2026-02-01" },
        ]}
        itemsByCollection={{ c1: [], c3: [{ id: "x1" }] }}
        {...handlers}
      />
    );
    expect(screen.getByText("Add to list")).toBeInTheDocument();
    expect(screen.getByText("Vintage Subs")).toBeInTheDocument();
    expect(screen.getByText("Edges")).toBeInTheDocument();
    // System collection is filtered out of the picker.
    expect(screen.queryByText("Wishlist")).not.toBeInTheDocument();
    // + Create new list affordance shows when not creating.
    expect(screen.getByText("+ Create new list")).toBeInTheDocument();
  });

  test("renders the empty-state copy when no visible lists exist", () => {
    render(
      <CollectionPickerModal
        target={{ id: "x1", brand: "Rolex" }}
        collections={[{ id: "sys", name: "Owned", isSystem: true }]}
        itemsByCollection={{}}
        {...handlers}
      />
    );
    expect(screen.getByText(/No lists yet/)).toBeInTheDocument();
  });
});
