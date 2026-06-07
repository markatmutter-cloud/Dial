import React from "react";
import { render, screen } from "@testing-library/react";
import { NotePickerModal } from "./NotePickerModal";

// Smoke tests for Lumé's save-note picker. Gated by `noteText != null`.
// Mirrors CollectionPickerModal's structure but commits a
// collection_blocks note instead of an item membership.

describe("NotePickerModal", () => {
  const handlers = {
    setNoteText: () => {},
    createCollection: async () => ({}),
    addNote: async () => ({}),
  };

  test("returns null when noteText is null", () => {
    const { container } = render(
      <NotePickerModal noteText={null} collections={[]} itemsByCollection={{}} {...handlers} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders the title, the note body, and the visible lists when open", () => {
    render(
      <NotePickerModal
        noteText="A note about the 5512"
        collections={[
          { id: "c1", name: "Vintage Subs", createdAt: "2026-01-01" },
          { id: "sys", name: "Wishlist", isSystem: true },
        ]}
        itemsByCollection={{}}
        {...handlers}
      />
    );
    expect(screen.getByText("Save note to a list")).toBeInTheDocument();
    expect(screen.getByText("A note about the 5512")).toBeInTheDocument();
    expect(screen.getByText("Vintage Subs")).toBeInTheDocument();
    // System collection filtered out.
    expect(screen.queryByText("Wishlist")).not.toBeInTheDocument();
  });

  test("renders the empty-state copy when no visible lists exist", () => {
    render(
      <NotePickerModal
        noteText="Note"
        collections={[{ id: "sys", name: "Owned", isSystem: true }]}
        itemsByCollection={{}}
        {...handlers}
      />
    );
    expect(screen.getByText(/No lists yet/)).toBeInTheDocument();
  });
});
