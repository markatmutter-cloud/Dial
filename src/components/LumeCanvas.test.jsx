import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LumeCanvas from "./LumeCanvas";

// LumeCanvas is the guided-session surface. It used to be reached via the
// standalone Lumé tab (removed 2026-06-18); it now mounts only inside the
// desktop expanded chat bubble, a path the shell tests mock — so it needs its
// own direct render coverage (blind-edit rule). Two layouts: desktop (content
// left + session-guide rail right) and mobile (single column + one composer).
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

describe("LumeCanvas", () => {
  beforeEach(() => { try { localStorage.clear(); } catch {} });

  describe("desktop (content + session-guide rail)", () => {
    test("cold start: a lead, a session-guide rail (not onboarding), contextual prompts", () => {
      render(<LumeCanvas chat={mkChat()} user={{ id: "u1" }} watchlist={{}} liveItems={[]} auctionLotItems={[]} />);
      expect(screen.getByText("START HERE")).toBeInTheDocument();
      expect(screen.getByText("Let's find your lane.")).toBeInTheDocument();
      expect(screen.getByText(/Ask Lumé about this view/)).toBeInTheDocument();
      expect(screen.getByText("Where should I start?")).toBeInTheDocument();
    });

    test("a curated shelf renders when there's live stock", () => {
      const live = [{ id: "a", url: "https://x/a", brand: "Rolex", ref: "Explorer 1016", sold: false, firstSeen: "2026-06-15", img: "https://x/a.jpg", priceUSD: 5000, price: 5000, currency: "USD", source: "Dealer" }];
      render(<LumeCanvas chat={mkChat()} user={{ id: "u1" }} watchlist={{}} liveItems={live} auctionLotItems={[]} />);
      expect(screen.getByText("WORTH YOUR ATTENTION")).toBeInTheDocument();
    });
  });

  describe("mobile (single column, chat-driven)", () => {
    test("renders the lead + a single chat composer (no separate search bar)", () => {
      render(<LumeCanvas chat={mkChat()} user={{ id: "u1" }} isMobile watchlist={{}} liveItems={[]} />);
      expect(screen.getByText("Let's find your lane.")).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Ask Lumé, or search/i)).toBeInTheDocument();
      expect(screen.queryByText("Search")).not.toBeInTheDocument();
    });

    test("sending hands off to the chat loop", () => {
      const chat = mkChat({ draft: "show me speedmasters" });
      render(<LumeCanvas chat={chat} user={{ id: "u1" }} isMobile watchlist={{}} liveItems={[]} />);
      fireEvent.click(screen.getByText("Send"));
      expect(chat.send).toHaveBeenCalledWith("show me speedmasters");
    });
  });
});
