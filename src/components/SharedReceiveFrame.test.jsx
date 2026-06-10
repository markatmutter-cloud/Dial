import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SharedReceiveFrame } from "./SharedReceiveFrame";

// SharedReceiveFrame owns the chrome for every "shared with you" surface.
// These pin the Close control (Mark: a top-right × where the eye expects close,
// not a top-left Back) and a render-without-crash baseline so a chrome edit
// can't ship a ReferenceError.

const base = {
  typeLabel: "watch",
  hero: <div>hero</div>,
  identity: <h2>A Watch</h2>,
  primaryCTA: { label: "View on dealer", href: "https://dealer.com/x" },
  signedIn: true,
};

describe("SharedReceiveFrame", () => {
  test("renders without crashing", () => {
    render(<SharedReceiveFrame {...base} />);
    expect(screen.getByText("A Watch")).toBeInTheDocument();
  });

  test("shows a Close control that calls onClose", () => {
    const onClose = jest.fn();
    render(<SharedReceiveFrame {...base} onClose={onClose} />);
    const close = screen.getByLabelText("Close");
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("no Close control when onClose is not wired (backward compatible)", () => {
    render(<SharedReceiveFrame {...base} />);
    expect(screen.queryByLabelText("Close")).not.toBeInTheDocument();
  });
});
