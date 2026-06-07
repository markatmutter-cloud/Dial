import React from "react";
import { render, screen } from "@testing-library/react";
import { StandardFilterBar, StandardSearchInput } from "./StandardFilterBar";

// Smoke tests for the standard filter bar + search input. Shell tests
// pass these surfaces as JSX slots (mocked) — so the three internal
// layout branches (mobile / narrow desktop / wide desktop) and the
// search-input's leading-icon + clear-button states never execute in
// CI. These are the road test.

describe("StandardFilterBar", () => {
  test("renders the wide-desktop grid layout", () => {
    window.innerWidth = 1440;
    render(
      <StandardFilterBar
        pills={<button>Brand</button>}
        search={<input data-testid="search" />}
        right={<button>Sort</button>}
        count="42 watches"
      />
    );
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByTestId("search")).toBeInTheDocument();
    expect(screen.getByText("Sort")).toBeInTheDocument();
    expect(screen.getByText("42 watches")).toBeInTheDocument();
  });

  test("renders the narrow-desktop stacked layout (<1250px)", () => {
    window.innerWidth = 1100;
    render(
      <StandardFilterBar
        pills={<button>Brand</button>}
        search={<input data-testid="search" />}
        right={<button>Sort</button>}
        count="42 watches"
      />
    );
    expect(screen.getByTestId("search")).toBeInTheDocument();
    expect(screen.getByText("Brand")).toBeInTheDocument();
  });

  test("renders the mobile layout (no internal search slot)", () => {
    render(
      <StandardFilterBar
        pills={<button>Brand</button>}
        right={<button>Sort</button>}
        count="42 watches"
        isMobile
      />
    );
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByText("Sort")).toBeInTheDocument();
    expect(screen.getByText("42 watches")).toBeInTheDocument();
  });

  test("renders without a count (empty right slot)", () => {
    render(<StandardFilterBar pills={<button>Brand</button>} isMobile />);
    expect(screen.getByText("Brand")).toBeInTheDocument();
  });
});

describe("StandardSearchInput", () => {
  test("renders the input with a placeholder", () => {
    render(<StandardSearchInput value="" onChange={() => {}} placeholder="Search watches" />);
    expect(screen.getByPlaceholderText("Search watches")).toBeInTheDocument();
  });

  test("renders the clear (×) button when value is non-empty", () => {
    render(<StandardSearchInput value="rolex" onChange={() => {}} placeholder="Search" />);
    expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
  });

  test("hides the clear button when value is empty", () => {
    render(<StandardSearchInput value="" onChange={() => {}} placeholder="Search" />);
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument();
  });

  test("renders the trailing slot (e.g. Save-search heart)", () => {
    render(
      <StandardSearchInput
        value=""
        onChange={() => {}}
        placeholder="Search"
        trailing={<button>♡</button>}
      />
    );
    expect(screen.getByText("♡")).toBeInTheDocument();
  });
});
