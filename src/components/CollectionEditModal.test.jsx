import React from "react";
import { render, screen } from "@testing-library/react";
import { CollectionEditModal } from "./CollectionEditModal";

// Smoke tests for the create-or-rename collection modal. Driven by the
// `editing` object (null = closed, { id: 'new' } = create, { id: <uuid> }
// = rename). Each branch needs a road test — the create vs rename title
// swap is exactly the kind of conditional that compiles fine but blows
// up at render if the prop shape drifts.

describe("CollectionEditModal", () => {
  const handlers = {
    setEditing: () => {},
    createCollection: async () => ({ id: "new-id" }),
    renameCollection: async () => ({}),
  };

  test("returns null when editing is null", () => {
    const { container } = render(<CollectionEditModal editing={null} {...handlers} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("renders 'New list' title for the create flow", () => {
    render(<CollectionEditModal editing={{ id: "new", name: "" }} {...handlers} />);
    expect(screen.getByText("New list")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  test("renders 'Rename list' title and existing name for the rename flow", () => {
    render(<CollectionEditModal editing={{ id: "c1", name: "Vintage Subs" }} {...handlers} />);
    expect(screen.getByText("Rename list")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Vintage Subs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
