import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HomeGuidesRow from "./HomeGuidesRow";
import { REFERENCE_NODES, isLiveNode } from "../data/referencePages";

// Direct render coverage (blind-edit rule). Reads the real registry on
// purpose: the row's whole job is to reflect what has actually been authored,
// so a test against a fixture would pass while the row lied.

describe("HomeGuidesRow", () => {
  it("lists every registered guide, live ones first", () => {
    render(<HomeGuidesRow isMobile={false} onOpenGuide={() => {}} />);
    const first = REFERENCE_NODES.filter(isLiveNode)[0];
    expect(screen.getByText(new RegExp(first.brand))).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links.length).toBe(REFERENCE_NODES.length);
  });

  it("marks coming-soon stubs so a reader isn't sent to a teaser unawares", () => {
    render(<HomeGuidesRow isMobile={false} onOpenGuide={() => {}} />);
    const stubs = REFERENCE_NODES.filter((n) => !isLiveNode(n));
    if (stubs.length === 0) return;
    expect(screen.getAllByText("(soon)").length).toBe(stubs.length);
  });

  it("shows the count of LIVE guides, not the registry length", () => {
    render(<HomeGuidesRow isMobile={false} onOpenGuide={() => {}} />);
    const liveCount = REFERENCE_NODES.filter(isLiveNode).length;
    expect(screen.getByText(String(liveCount))).toBeInTheDocument();
  });

  it("opens a guide by node id rather than following the href", () => {
    const opened = [];
    render(<HomeGuidesRow isMobile={false} onOpenGuide={(id) => opened.push(id)} />);
    fireEvent.click(screen.getAllByRole("link")[0]);
    expect(opened.length).toBe(1);
    expect(REFERENCE_NODES.some((n) => n.id === opened[0])).toBe(true);
  });
});
