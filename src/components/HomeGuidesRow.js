// HomeGuidesRow — the reference-guides row on Home.
//
// Epic 9 step 5 (2026-08-30), in the slot "Recently hearted" vacated. It is
// deliberately TEXT ONLY: no images, no strip, about 64px of page.
//
// Two reasons for the shape:
//
// 1. The landing page surfaced a quarter of the product. Three of its four
//    rows landed in the same tab, and reference guides, the thing that most
//    separates this site from a dealer shop, were never mentioned below the
//    nav pill. This is the cheapest possible fix for that.
// 2. A fifth row of photo tiles would undo the variety the auction module was
//    built to create. A line of model names reads as an index, which is what
//    it is.
//
// It also seeds the model-line browsing the roadmap is built on: these names
// are the entry points to the Brand > Model line > Reference tree.
//
// The count is derived from the registry, never written down. Guides are
// authored one file at a time and any hardcoded number here would be wrong
// within a fortnight, which is how the LiveCounts strip died.

import React from "react";
import SectionHeader from "./SectionHeader";
import { HOME_SECTIONS } from "../homeSections";
import { REFERENCE_NODES, isLiveNode } from "../data/referencePages";

function nodeLabel(node) {
  const ref = (node.refs && node.refs[0]) || "";
  const line = node.modelLine || "";
  // "Rolex Submariner 5512/5513", not "rolex-submariner-5512-5513". The brand
  // leads because a reader scans for the brand first.
  return [node.brand, line, ref].filter(Boolean).join(" ");
}

export default function HomeGuidesRow({ isMobile, onOpenGuide, onViewAll }) {
  const live = REFERENCE_NODES.filter(isLiveNode);
  const soon = REFERENCE_NODES.filter((n) => !isLiveNode(n));
  if (live.length === 0) return null;

  // Live guides first: a reader who clicks the first name should land on a
  // real page, not a coming-soon stub.
  const ordered = [...live, ...soon];

  return (
    <section style={{ marginBottom: 28 }}>
      <SectionHeader
        eyebrow={HOME_SECTIONS.guides.eyebrow}
        heading={HOME_SECTIONS.guides.heading}
        count={live.length}
        descriptor={HOME_SECTIONS.guides.descriptor}
        onViewAll={onViewAll}
        viewAllLabel="Browse guides"
        isMobile={isMobile}
      />
      <div style={{
        padding: isMobile ? "0 16px" : "0 20px",
        display: "flex", flexWrap: "wrap",
        columnGap: 0, rowGap: 6,
        alignItems: "baseline",
      }}>
        {ordered.map((node, i) => (
          <React.Fragment key={node.id}>
            {i > 0 && (
              <span aria-hidden style={{ color: "var(--text3)", padding: "0 10px", fontSize: 13 }}>·</span>
            )}
            <a
              href={`?tab=learn&sub=references&ref=${encodeURIComponent(node.id)}`}
              onClick={onOpenGuide ? (e) => { e.preventDefault(); onOpenGuide(node.id); } : undefined}
              style={{
                fontSize: isMobile ? 14 : 15,
                color: isLiveNode(node) ? "var(--text1)" : "var(--text3)",
                textDecoration: "none",
                borderBottom: isLiveNode(node) ? "1px solid var(--border)" : "none",
                paddingBottom: 1,
              }}
            >
              {nodeLabel(node)}
              {!isLiveNode(node) && (
                <span style={{ fontSize: 11, color: "var(--text3)" }}> (soon)</span>
              )}
            </a>
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
