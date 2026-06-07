import React from "react";
import { render, screen } from "@testing-library/react";
import { MarkAsSoldModal } from "./MarkAsSoldModal";

// Smoke tests for the Move-to-Sold modal. Gated by `open`. The title
// interpolation (brand + model fallback chain) is exactly the kind of
// thing that quietly errors when an item shape drifts — covered with
// a few input variants.

describe("MarkAsSoldModal", () => {
  test("returns null when closed", () => {
    const { container } = render(
      <MarkAsSoldModal open={false} onClose={() => {}} item={{}} onConfirm={async () => ({})} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders the form with the item's brand + model in the description", () => {
    render(
      <MarkAsSoldModal
        open={true} onClose={() => {}}
        item={{ brand: "Rolex", model: "Submariner" }}
        onConfirm={async () => ({})}
      />
    );
    expect(screen.getByText("Mark as sold")).toBeInTheDocument();
    // Description div ends with "from Owned to Sold" — anchor on that so the
    // matcher doesn't also collide with the "Move to Sold" button below.
    expect(screen.getByText(/from Owned to Sold/)).toHaveTextContent("Rolex Submariner");
    expect(screen.getByRole("button", { name: /Move to Sold/ })).toBeInTheDocument();
  });

  test("falls back to a generic title when item has no brand/model/title", () => {
    render(
      <MarkAsSoldModal open={true} onClose={() => {}} item={{}} onConfirm={async () => ({})} />
    );
    expect(screen.getByText(/from Owned to Sold/)).toHaveTextContent("this watch");
  });
});
