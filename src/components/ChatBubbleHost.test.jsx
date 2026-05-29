import React from "react";
import { render, screen } from "@testing-library/react";
import { ChatBubbleHost } from "./ChatBubbleHost";

// Render-without-crash smoke tests for the concierge bubble (Epic 9).
// Signed-in only: renders nothing without a user; shows the launcher with one.
// We mock ../supabase the same way App.test.jsx mocks ./supabase.

let mockUser = null;

jest.mock("../supabase", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
  useAuth: () => ({ user: mockUser, ready: true }),
}));

describe("ChatBubbleHost", () => {
  test("renders nothing when signed out (no crash)", () => {
    mockUser = null;
    const { container } = render(<ChatBubbleHost />);
    // Portal target is document.body; signed-out → no launcher anywhere.
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByLabelText("Open watch concierge")).toBeNull();
  });

  test("renders the launcher when signed in", () => {
    mockUser = { id: "user-123" };
    render(<ChatBubbleHost />);
    expect(screen.getByLabelText("Open watch concierge")).toBeInTheDocument();
  });
});
