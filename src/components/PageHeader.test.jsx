import React from "react";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "./PageHeader";

// Smoke tests for the one bleed-bar page header (Lists / Searches /
// Reference guides / auction-catalog drill-in). Shell tests render mocks
// of the tab content, so PageHeader's slot rendering (eyebrow / title /
// meta / actions / count / exit link / trailing) never executes in CI.
// These cover each slot once.

describe("PageHeader", () => {
  test("renders the title", () => {
    render(<PageHeader title="My List" />);
    expect(screen.getByText("My List")).toBeInTheDocument();
  });

  test("renders eyebrow + title + meta together", () => {
    render(<PageHeader eyebrow="LIST" title="5512 collection" meta="Shared by Mark" />);
    expect(screen.getByText("LIST")).toBeInTheDocument();
    expect(screen.getByText("5512 collection")).toBeInTheDocument();
    expect(screen.getByText("Shared by Mark")).toBeInTheDocument();
  });

  test("renders the back/exit link when onExit is provided", () => {
    render(<PageHeader title="Catalog" onExit={() => {}} exitLabel="All sales" />);
    expect(screen.getByRole("button", { name: /All sales/ })).toBeInTheDocument();
  });

  test("renders action pills as buttons", () => {
    render(
      <PageHeader
        title="Catalog"
        actions={[
          { label: "Save", onClick: () => {} },
          { label: "Share", onClick: () => {} },
        ]}
      />
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share" })).toBeInTheDocument();
  });

  test("renders a count in the right slot", () => {
    render(<PageHeader title="Searches" count="3 saved" />);
    expect(screen.getByText("3 saved")).toBeInTheDocument();
  });

  test("renders an href action as a link", () => {
    render(
      <PageHeader
        title="Catalog"
        actions={[{ label: "Auction house", href: "https://example.com", external: true }]}
      />
    );
    const link = screen.getByRole("link", { name: /Auction house/ });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
