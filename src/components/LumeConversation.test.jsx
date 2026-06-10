import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LumeConversation } from "./LumeConversation";

// LumeConversation is the shared chat core (bubble + inline tab). The bubble
// renders inside a portal in shell mocks, so give the core its own direct
// render test — a ReferenceError in here would otherwise ship green.
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

describe("LumeConversation", () => {
  test("renders the composer and the greeting cold-open", () => {
    render(<LumeConversation chat={mkChat()} greeting="Hello from Lumé" suggestions={[]} />);
    expect(screen.getByPlaceholderText("Ask about a watch…")).toBeInTheDocument();
    expect(screen.getByText("Hello from Lumé")).toBeInTheDocument();
  });

  test("renders an assistant message body", () => {
    const chat = mkChat({ messages: [{ role: "assistant", content: "The 5513 is a no-date Submariner." }] });
    render(<LumeConversation chat={chat} greeting="" suggestions={[]} />);
    expect(screen.getByText(/no-date Submariner/)).toBeInTheDocument();
  });

  test("a suggestion chip calls send", () => {
    const chat = mkChat();
    render(<LumeConversation chat={chat} greeting="" suggestions={["Surprise me"]} />);
    fireEvent.click(screen.getByText("Surprise me"));
    expect(chat.send).toHaveBeenCalledWith("Surprise me");
  });

  test("hides the composer when capped", () => {
    render(<LumeConversation chat={mkChat({ capped: true })} greeting="" suggestions={[]} />);
    expect(screen.queryByPlaceholderText("Ask about a watch…")).not.toBeInTheDocument();
    expect(screen.getByText(/today's messages/)).toBeInTheDocument();
  });
});
