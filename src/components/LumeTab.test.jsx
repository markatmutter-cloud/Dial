import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LumeTab } from "./LumeTab";

// LumeTab hosts the guided-session canvas. Shell tests render a mock for it, so
// give it direct coverage. Two layouts: desktop (content left + session-guide
// rail right) and mobile (single column + one chat composer; search is chat-driven).
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

  describe("desktop (content + session-guide rail)", () => {
    test("cold start: a lead, a session-guide rail (not onboarding), contextual prompts", () => {
      render(<LumeTab chat={mkChat()} user={{ id: "u1" }} watchlist={{}} liveItems={[]} auctionLotItems={[]} />);
      // One clear lead (cold-start headline) with the Start-here eyebrow
      expect(screen.getByText("START HERE")).toBeInTheDocument();
      expect(screen.getByText("Let's find your lane.")).toBeInTheDocument();
      // Rail is a session guide, not a generic intro, and offers contextual prompts
      expect(screen.getByText(/Ask Lumé about this view/)).toBeInTheDocument();
      expect(screen.getByText("Where should I start?")).toBeInTheDocument();
    });

    test("a curated shelf renders when there's live stock", () => {
      const live = [{ id: "a", url: "https://x/a", brand: "Rolex", ref: "Explorer 1016", sold: false, firstSeen: "2026-06-15", img: "https://x/a.jpg", priceUSD: 5000, price: 5000, currency: "USD", source: "Dealer" }];
      render(<LumeTab chat={mkChat()} user={{ id: "u1" }} watchlist={{}} liveItems={live} auctionLotItems={[]} />);
      // The "Worth your attention" shelf renders when there's live stock.
      expect(screen.getByText("WORTH YOUR ATTENTION")).toBeInTheDocument();
    });
  });

  describe("mobile (single column, chat-driven)", () => {
    test("renders the lead + a single chat composer (no separate search bar)", () => {
      render(<LumeTab chat={mkChat()} user={{ id: "u1" }} isMobile watchlist={{}} liveItems={[]} />);
      expect(screen.getByText("Let's find your lane.")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ask Lumé, or search/i)).toBeInTheDocument();
      expect(screen.queryByText("Search")).not.toBeInTheDocument();
    });

    test("sending hands off to the chat loop", () => {
      const chat = mkChat({ draft: "show me speedmasters" });
      render(<LumeTab chat={chat} user={{ id: "u1" }} isMobile watchlist={{}} liveItems={[]} />);
      fireEvent.click(screen.getByText("Send"));
      expect(chat.send).toHaveBeenCalledWith("show me speedmasters");
    });
  });
});
