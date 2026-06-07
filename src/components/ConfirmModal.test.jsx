import React from "react";
import { render, screen } from "@testing-library/react";
import { confirm, ConfirmHost } from "./ConfirmModal";

// Smoke tests for the imperative confirm() API + its ConfirmHost. The
// host listens for setRequest pushes from confirm(); render-without-
// request is the closed branch, render-after-confirm() is the open one.
// Both branches were untested — and this primitive replaces every
// window.confirm in the app (dark-mode safe), so a regression here
// silently downgrades every destructive action to the browser default.
//
// The Promises returned by confirm() never resolve in these tests — that's
// fine; we're only verifying the modal renders.

describe("ConfirmModal", () => {
  test("renders nothing when no request is active", () => {
    const { container } = render(<ConfirmHost />);
    expect(container).toBeEmptyDOMElement();
  });

  test("renders the modal after confirm() pushes a request", async () => {
    render(<ConfirmHost />);
    confirm({ title: "Delete list?", message: "This cannot be undone.", confirmLabel: "Delete" });
    expect(await screen.findByText("Delete list?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  test("renders the danger-tone confirm button", async () => {
    render(<ConfirmHost />);
    confirm({ title: "Are you sure?", confirmLabel: "Yes", tone: "danger" });
    expect(await screen.findByRole("button", { name: "Yes" })).toBeInTheDocument();
  });
});
