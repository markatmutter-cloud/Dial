import React from "react";
import { render, screen } from "@testing-library/react";
import { FavSearchModal } from "./FavSearchModal";

// Smoke tests for the heart-the-search prompt. Gated by `open`.
// The body interpolates the active query (+ optional price band) into
// the explainer copy — covers the bug shape where the prop renames out
// from under the modal.

describe("FavSearchModal", () => {
  const baseProps = {
    setOpen: () => {},
    search: "submariner",
    minPriceText: "",
    maxPriceText: "",
    label: "",
    setLabel: () => {},
    error: "",
    setError: () => {},
    submit: () => {},
  };

  test("returns null when closed", () => {
    const { container } = render(<FavSearchModal open={false} {...baseProps} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("renders the title and the active query in the body when open", () => {
    render(<FavSearchModal open={true} {...baseProps} />);
    expect(screen.getByText("Save search")).toBeInTheDocument();
    // "submariner" is wrapped in <b>; match the surrounding body line.
    expect(screen.getByText(/Saving/)).toHaveTextContent("submariner");
  });

  test("Save is disabled when label is empty", () => {
    render(<FavSearchModal open={true} {...baseProps} label="" />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  test("Save is enabled when label has content", () => {
    render(<FavSearchModal open={true} {...baseProps} label="Subs" />);
    expect(screen.getByRole("button", { name: "Save" })).not.toBeDisabled();
  });

  test("renders the error line when error is non-empty", () => {
    render(<FavSearchModal open={true} {...baseProps} error="Already saved" />);
    expect(screen.getByText("Already saved")).toBeInTheDocument();
  });
});
