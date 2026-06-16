import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LumeTab } from "./LumeTab";

// LumeTab hosts the morphing LumeCanvas. Shell tests render a mock for it, so
// give it a direct render test (a ReferenceError here would otherwise ship green).
jest.mock("../supabase", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
}));
jest.mock("./ActionBus", () => ({
  dispatchAction: jest.fn(async () => ({ ok: true })),
  resolveItemByUrl: jest.fn(() => null),
}));

const mkChat = (over = {}) => ({
  messages: [], draft: "", setDraft: () => {}, loading: false, capped: false, error: "",
  actionState: {}, listening: false,
  send: jest.fn(), runAction: jest.fn(async () => ({ ok: true })), toggleMic: () => {}, reset: () => {},
  scrollRef: { current: null }, inputRef: { current: null },
  ...over,
});

describe("LumeTab", () => {
  beforeEach(() => { try { localStorage.clear(); } catch {} });

  test("signed-out: shows a sign-in prompt", () => {
    const onSignIn = jest.fn();
    render(<LumeTab chat={mkChat()} user={null} onSignIn={onSignIn} />);
    const btn = screen.getByText("Sign in to chat");
    fireEvent.click(btn);
    expect(onSignIn).toHaveBeenCalled();
  });

  test("signed-in: renders the journey cards + the unified input", () => {
    render(<LumeTab chat={mkChat()} user={{ id: "u1" }} />);
    expect(screen.getByText("Just listed")).toBeInTheDocument();
    expect(screen.getByText("What I might have missed")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask Lumé about any reference/i)).toBeInTheDocument();
  });

  test("tapping a journey morphs the canvas into its result panel", () => {
    render(<LumeTab chat={mkChat()} user={{ id: "u1" }} watchlist={{}} liveItems={[]} />);
    fireEvent.click(screen.getByText("What I might have missed"));
    // Empty taste (no hearts) -> the panel shows its guidance empty-state, with
    // a back affordance proving we left the landing grid.
    expect(screen.getByText("← Back")).toBeInTheDocument();
    expect(screen.getByText(/Heart a few watches/i)).toBeInTheDocument();
  });

  test("submitting a question hands off to the chat send loop", () => {
    // draft is owned by useLumeChat; preset it (the mock setDraft is a no-op,
    // so a controlled-input change wouldn't stick) and submit.
    const chat = mkChat({ draft: "what's a tropical dial" });
    render(<LumeTab chat={chat} user={{ id: "u1" }} />);
    const input = screen.getByPlaceholderText(/Ask Lumé about any reference/i);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(chat.send).toHaveBeenCalledWith("what's a tropical dial");
  });
});
