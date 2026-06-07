import React from "react";
import { render, screen } from "@testing-library/react";
import { SignInPromptModal } from "./SignInPromptModal";

// Smoke tests for the sign-in explainer modal. Gated by `open`.
// The Escape-to-close useEffect sits above the early return — verifies
// the hook-ordering rule (no Rules-of-Hooks violation when toggled).

describe("SignInPromptModal", () => {
  test("returns null when closed", () => {
    const { container } = render(
      <SignInPromptModal open={false} onClose={() => {}} onSignIn={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("renders the title, explainer copy, and both CTAs when open", () => {
    render(<SignInPromptModal open={true} onClose={() => {}} onSignIn={() => {}} />);
    expect(screen.getByText("Sign in to Watchlist")).toBeInTheDocument();
    expect(screen.getByText("Why sign in")).toBeInTheDocument();
    expect(screen.getByText("What it doesn't do")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue with Google/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Keep browsing/ })).toBeInTheDocument();
  });
});
