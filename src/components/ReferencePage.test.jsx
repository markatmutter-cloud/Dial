import React from "react";
import { render } from "@testing-library/react";
import { ReferencePage } from "./ReferencePage";
import { DEFAULT_REFERENCE_NODE, REFERENCE_NODES } from "../data/referencePages";

// Render-without-crash smoke test for the reference-guide page (Collecting ▸
// References). Rendered with empty `items` so the live/auction/sold and
// connection sliders take their empty paths — no Card dependency surface. The
// assert is deliberately weak: did it throw or not.

const noop = () => {};

test("ReferencePage renders the anchor node without crashing", () => {
  const { container } = render(
    <ReferencePage
      node={DEFAULT_REFERENCE_NODE}
      items={[]}
      isMobile={false}
      watchlist={{}}
      handleWish={noop}
      openCollectionPicker={noop}
      handleShare={noop}
      hidden={{}}
      primaryCurrency="USD"
      onClickListing={noop}
      compact={false}
      user={null}
      onViewAll={noop}
    />
  );
  expect(container.textContent).toMatch(/5512/);
});

test("ReferencePage renders nothing when no node is supplied", () => {
  const { container } = render(<ReferencePage node={null} items={[]} isMobile={false} />);
  expect(container.firstChild).toBeNull();
});

// Coming-soon stubs render through ReferencePage under the frosted overlay
// (ReferenceBrowse, since #846). Stubs carry no `market`, `story`, `guides`,
// etc. — this guards the optional-field paths (the unguarded node.market read
// white-screened prod on 2026-06-07, fixed in #847). Items NON-empty on
// purpose: the crash was in the items.filter over the missing market spec.
test("ReferencePage renders a coming-soon stub (no market/story/guides) without crashing", () => {
  const stub = REFERENCE_NODES.find((n) => n.status === "coming_soon");
  expect(stub).toBeTruthy();
  const items = [{ id: "x1", ref: "165.024", brand: "Omega", title: "test item", img: "", sold: false }];
  const { container } = render(
    <ReferencePage node={stub} items={items} isMobile={false} primaryCurrency="USD" compact={false} />
  );
  expect(container.textContent).toMatch(new RegExp(stub.group.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});
