import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LumeTab } from "./LumeTab";

// LumeTab hosts the morphing LumeCanvas. Shell tests render a mock for it, so
// give it a direct render test (a ReferenceError here would otherwise ship green).
// The canvas has two layouts: mobile single-column (Search+Ask on one composer,
// chat as a switch-in view) and desktop two-pane (content + Search bar left,
// always-on Ask chat rail right).
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
    fireEvent.click(screen.getByText("Sign in to chat"));
    expect(onSignIn).toHaveBeenCalled();
  });

  describe("mobile (single column)", () => {
    test("renders the journey cards + the dual-action input", () => {
      render(<LumeTab chat={mkChat()} user={{ id: "u1" }} isMobile />);
      expect(screen.getByText("Just listed")).toBeInTheDocument();
      expect(screen.getByText("What I might have missed")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Search watches, or ask/i)).toBeInTheDocument();
      expect(screen.getByText("Search")).toBeInTheDocument();
      expect(screen.getByText("Ask")).toBeInTheDocument();
    });

    test("tapping a journey morphs into its result panel", () => {
      render(<LumeTab chat={mkChat()} user={{ id: "u1" }} isMobile watchlist={{}} liveItems={[]} />);
      fireEvent.click(screen.getByText("What I might have missed"));
      expect(screen.getByText("← Back")).toBeInTheDocument();
      expect(screen.getByText(/Heart a few watches/i)).toBeInTheDocument();
    });

    test("Ask hands the draft off to the chat send loop", () => {
      const chat = mkChat({ draft: "what's a tropical dial" });
      render(<LumeTab chat={chat} user={{ id: "u1" }} isMobile />);
      fireEvent.click(screen.getByText("Ask"));
      expect(chat.send).toHaveBeenCalledWith("what's a tropical dial");
    });

    test("Search (Enter) morphs into a results view", () => {
      const chat = mkChat({ draft: "submariner" });
      render(<LumeTab chat={chat} user={{ id: "u1" }} isMobile watchlist={{}} liveItems={[]} auctionLotItems={[]} />);
      fireEvent.keyDown(screen.getByPlaceholderText(/Search watches, or ask/i), { key: "Enter" });
      expect(screen.getByText(/Results for "submariner"/i)).toBeInTheDocument();
      expect(chat.send).not.toHaveBeenCalled();
    });
  });

  describe("desktop (two-pane)", () => {
    test("renders content left + an always-on chat rail right", () => {
      render(<LumeTab chat={mkChat()} user={{ id: "u1" }} />);
      // Left content
      expect(screen.getByText("Just listed")).toBeInTheDocument();
      // Left search bar
      expect(screen.getByPlaceholderText(/Search listings, sold/i)).toBeInTheDocument();
      // Right rail
      expect(screen.getByText(/Ask Lumé/)).toBeInTheDocument();
    });

    test("the left search bar morphs the content pane", () => {
      render(<LumeTab chat={mkChat()} user={{ id: "u1" }} watchlist={{}} liveItems={[]} auctionLotItems={[]} />);
      const input = screen.getByPlaceholderText(/Search listings, sold/i);
      fireEvent.change(input, { target: { value: "submariner" } });
      fireEvent.click(screen.getByText("Search"));
      expect(screen.getByText(/Results for "submariner"/i)).toBeInTheDocument();
    });
  });
});
