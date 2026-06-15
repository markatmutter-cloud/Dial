import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { LumeTab } from "./LumeTab";

// LumeTab is the full-page Lumé surface. Shell tests render a mock for it, so
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
  test("signed-out: shows a sign-in prompt", () => {
    const onSignIn = jest.fn();
    render(<LumeTab chat={mkChat()} user={null} onSignIn={onSignIn} />);
    const btn = screen.getByText("Sign in to chat");
    fireEvent.click(btn);
    expect(onSignIn).toHaveBeenCalled();
  });

  test("signed-in: renders journey launchers + composer", () => {
    render(<LumeTab chat={mkChat()} user={{ id: "u1" }} />);
    expect(screen.getByText("What I missed")).toBeInTheDocument();
    expect(screen.getByText("The ones that got away")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ask about a watch…")).toBeInTheDocument();
  });

  test("tapping a journey launcher sends its prompt", () => {
    const chat = mkChat();
    render(<LumeTab chat={chat} user={{ id: "u1" }} />);
    fireEvent.click(screen.getByText("Latest listed"));
    expect(chat.send).toHaveBeenCalledWith("Show me the latest watches listed.");
  });
});
