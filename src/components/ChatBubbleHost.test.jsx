import React from "react";
import { render, screen } from "@testing-library/react";
import { ChatBubbleHost, renderInline } from "./ChatBubbleHost";
import { resolveItemByUrl } from "./ActionBus";

// Render-without-crash smoke tests for the concierge bubble (Epic 9).
// The launcher shows for everyone now (B-43) — signed-out taps prompt sign-in.
// We mock ../supabase the same way App.test.jsx mocks ./supabase.

let mockUser = null;

jest.mock("../supabase", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
  useAuth: () => ({ user: mockUser, ready: true, signInWithGoogle: () => {} }),
}));

jest.mock("./ActionBus", () => ({
  dispatchAction: jest.fn(async () => ({ ok: true })),
  resolveItemByUrl: jest.fn(() => null),
}));

describe("ChatBubbleHost", () => {
  test("renders the launcher when signed out (sign-in entry point)", () => {
    mockUser = null;
    render(<ChatBubbleHost />);
    expect(screen.getByLabelText("Open Lumé")).toBeInTheDocument();
  });

  test("renders the launcher when signed in", () => {
    mockUser = { id: "user-123" };
    render(<ChatBubbleHost />);
    expect(screen.getByLabelText("Open Lumé")).toBeInTheDocument();
  });
});

describe("renderInline — reply-body links", () => {
  test("a resolvable watch link opens IN-APP (onClick handler, no external target)", () => {
    resolveItemByUrl.mockReturnValueOnce({ id: "abc" }); // pretend it's a live watch
    const openInApp = jest.fn();
    const { container } = render(<div>{renderInline("see [the 5513](https://dealer.com/5513)", "k", openInApp)}</div>);
    const a = container.querySelector("a");
    expect(a).toHaveTextContent("the 5513");
    expect(a).not.toHaveAttribute("target", "_blank");
    a.click();
    expect(openInApp).toHaveBeenCalledWith("https://dealer.com/5513");
  });

  test("a non-resolvable link stays a normal external link", () => {
    resolveItemByUrl.mockReturnValueOnce(null); // article / citation / gone
    const openInApp = jest.fn();
    const { container } = render(<div>{renderInline("read [this](https://magazine.com/x)", "k", openInApp)}</div>);
    const a = container.querySelector("a");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("href", "https://magazine.com/x");
    expect(openInApp).not.toHaveBeenCalled(); // render alone must not open anything
  });
});
