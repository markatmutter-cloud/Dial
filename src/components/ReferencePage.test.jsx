import React from "react";
import { render } from "@testing-library/react";
import { ReferencePage } from "./ReferencePage";
import { DEFAULT_REFERENCE_NODE } from "../data/referencePages";

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
