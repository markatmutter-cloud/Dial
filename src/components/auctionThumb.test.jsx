import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AuctionThumb, houseTint, houseLogoSlug } from "./auctionThumb";

// Direct render coverage for the shared followed-auction tile (Mark
// 2026-06-15) — HomeTab renders it but shell/tab tests mock grids, so the
// component itself needs a direct test (CLAUDE.md blind-edit rule).

describe("AuctionThumb", () => {
  const sale = {
    url: "https://example.com/a/1", house: "Sotheby's",
    title: "Important Watches", dateStart: "2026-06-15", dateEnd: "2026-06-15",
    _lotCount: 210,
  };

  test("renders house + title; placeholder logo when no cover image", () => {
    render(<AuctionThumb sale={sale} onOpen={() => {}} />);
    expect(screen.getByText("Important Watches")).toBeInTheDocument();
    // No cover → HouseLogo renders (img alt = house, with text-mark fallback).
    expect(screen.getAllByText(/Sotheby's/i).length).toBeGreaterThanOrEqual(1);
  });

  test("calls onOpen with the sale when tapped", () => {
    let opened = null;
    render(<AuctionThumb sale={sale} onOpen={(s) => { opened = s; }} />);
    fireEvent.click(screen.getByText("Important Watches"));
    expect(opened).toBe(sale);
  });

  test("returns null for a missing sale", () => {
    const { container } = render(<AuctionThumb sale={null} onOpen={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  test("houseTint is deterministic + houseLogoSlug normalizes", () => {
    expect(houseTint("Sotheby's")).toEqual(houseTint("Sotheby's"));
    expect(houseLogoSlug("Marteau & Co")).toBe("marteau-and-co");
  });
});
