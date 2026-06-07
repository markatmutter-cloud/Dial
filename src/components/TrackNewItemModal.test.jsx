import React from "react";
import { render, screen } from "@testing-library/react";
import { TrackNewItemModal } from "./TrackNewItemModal";

// Smoke tests for the +Track new item modal (eBay paste flow). Gated by
// `open`. The Track button gates on both `trackBusy` and a non-empty
// URL — covered with two variants.

describe("TrackNewItemModal", () => {
  const baseProps = {
    setOpen: () => {},
    trackUrl: "",
    setTrackUrl: () => {},
    trackError: "",
    setTrackError: () => {},
    submitTrack: () => {},
    trackBusy: false,
  };

  test("returns null when closed", () => {
    const { container } = render(<TrackNewItemModal open={false} {...baseProps} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("renders the title + URL input when open", () => {
    render(<TrackNewItemModal open={true} {...baseProps} />);
    expect(screen.getByText("Track eBay item")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("https://...")).toBeInTheDocument();
  });

  test("Track button is disabled with no URL", () => {
    render(<TrackNewItemModal open={true} {...baseProps} trackUrl="" />);
    expect(screen.getByRole("button", { name: "Track" })).toBeDisabled();
  });

  test("Track button is enabled when URL is present", () => {
    render(<TrackNewItemModal open={true} {...baseProps} trackUrl="https://ebay.com/itm/x" />);
    expect(screen.getByRole("button", { name: "Track" })).not.toBeDisabled();
  });

  test("renders the error line when trackError is non-empty", () => {
    render(<TrackNewItemModal open={true} {...baseProps} trackError="Unsupported URL" />);
    expect(screen.getByText("Unsupported URL")).toBeInTheDocument();
  });
});
