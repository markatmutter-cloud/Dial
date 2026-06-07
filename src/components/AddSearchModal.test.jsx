import React from "react";
import { render, screen } from "@testing-library/react";
import { AddSearchModal } from "./AddSearchModal";

// Smoke tests for the +Add search modal (Saved → Searches paste flow).
// Closed-path + open-path road tests — shell tests pass this modal as a
// JSX slot, so neither its early-return nor its form rendering ever
// execute in CI. Same shape as the CardShell crash that prompted the
// road-test rule.

describe("AddSearchModal", () => {
  test("returns null when closed", () => {
    const { container } = render(
      <AddSearchModal
        open={false} onClose={() => {}}
        searchEditor={{ label: "", query: "" }}
        setSearchEditor={() => {}} commitSearch={() => {}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders the form when open", () => {
    render(
      <AddSearchModal
        open={true} onClose={() => {}}
        searchEditor={{ label: "Speedmaster Pro", query: "145.022", minPrice: "", maxPrice: "" }}
        setSearchEditor={() => {}} commitSearch={() => {}}
      />
    );
    expect(screen.getByText("Add search")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search terms/i)).toBeInTheDocument();
  });

  test("Save is disabled when label or query is empty", () => {
    render(
      <AddSearchModal
        open={true} onClose={() => {}}
        searchEditor={{ label: "", query: "" }}
        setSearchEditor={() => {}} commitSearch={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  test("Save is enabled when both label and query are non-empty", () => {
    render(
      <AddSearchModal
        open={true} onClose={() => {}}
        searchEditor={{ label: "X", query: "Y" }}
        setSearchEditor={() => {}} commitSearch={() => {}}
      />
    );
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });
});
