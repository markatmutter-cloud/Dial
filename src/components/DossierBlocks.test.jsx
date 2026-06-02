import React from "react";
import { render } from "@testing-library/react";
import { DossierBlocks } from "./DossierBlocks";

// Render-without-crash smoke tests for the dossier composition layer. With no
// user / null supabase client the block + search hooks return empty, so this
// exercises the empty-state render paths (read-only with no blocks → null;
// editable with no blocks → the add-block bar).
describe("DossierBlocks", () => {
  test("read-only with no blocks renders nothing without crashing", () => {
    const { container } = render(
      <DossierBlocks collectionId="c1" user={null} allListings={[]} canEdit={false} />
    );
    expect(container).toBeTruthy();
  });

  test("editable with no blocks renders the add-block bar without crashing", () => {
    const { getByText } = render(
      <DossierBlocks collectionId="c1" user={null} allListings={[]} canEdit={true} />
    );
    expect(getByText("Add a note")).toBeInTheDocument();
  });
});
