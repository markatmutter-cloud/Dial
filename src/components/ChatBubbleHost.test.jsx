import React from "react";
import { render, screen } from "@testing-library/react";
import { ChatBubbleHost } from "./ChatBubbleHost";

// Render-without-crash smoke tests for the concierge bubble (Epic 9).
// The launcher shows for everyone now (B-43) — signed-out taps prompt sign-in.
// We mock ../supabase the same way App.test.jsx mocks ./supabase.

let mockUser = null;

jest.mock("../supabase", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
  useAuth: () => ({ user: mockUser, ready: true, signInWithGoogle: () => {} }),
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
