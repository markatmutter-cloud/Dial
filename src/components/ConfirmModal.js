import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { modalBackdrop, modalShell, actionButton } from "../styles";

// Imperative-API styled confirm dialog. Replaces window.confirm
// across the app so confirmations match the rest of the UI in light/
// dark mode and pick up the brand/danger tokens.
//
// Usage:
//   import { confirm } from "./ConfirmModal";
//   if (!(await confirm({ title: "Delete?", tone: "danger" }))) return;
//
// One <ConfirmHost/> mounts at the top of the app (both shells).
// confirm() pushes a request through a module-level setter; the host
// renders the modal and resolves the promise when the user picks.

let pushRequest = null;

export function confirm(opts) {
  return new Promise((resolve) => {
    if (typeof pushRequest !== "function") {
      // Fall back to window.confirm if the host hasn't mounted yet
      // (e.g. server-render or pre-hydration). Should never happen
      // in practice once App mounts.
      const ok = typeof window !== "undefined"
        ? window.confirm(opts?.message || opts?.title || "Are you sure?")
        : false;
      resolve(ok);
      return;
    }
    pushRequest({ ...opts, resolve });
  });
}

export function ConfirmHost() {
  const [req, setReq] = useState(null);

  useEffect(() => {
    pushRequest = setReq;
    return () => { pushRequest = null; };
  }, []);

  const handleCancel = useCallback(() => {
    if (!req) return;
    req.resolve(false);
    setReq(null);
  }, [req]);

  const handleConfirm = useCallback(() => {
    if (!req) return;
    req.resolve(true);
    setReq(null);
  }, [req]);

  useEffect(() => {
    if (!req) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") handleCancel();
      else if (e.key === "Enter") handleConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [req, handleCancel, handleConfirm]);

  if (typeof document === "undefined" || !req) return null;

  const {
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    tone = "default",
  } = req;

  // PR 2026-05-22 visual refresh (Mark feedback "modal could be
  // better"): bumped typography + filled CTA buttons. Danger gets
  // a solid red fill instead of red-on-transparent so destructive
  // actions read as visibly weighted; default tone uses the olive
  // primary (actionButton.primary is olive site-wide now).
  const cancelStyle = {
    ...actionButton({ variant: "subtle" }),
    padding: "10px 16px",
    fontSize: 13, fontWeight: 500,
  };
  const confirmStyle = tone === "danger"
    ? {
        padding: "10px 16px", borderRadius: 6,
        fontFamily: "inherit", fontSize: 13, fontWeight: 600,
        cursor: "pointer", whiteSpace: "nowrap",
        border: "none",
        background: "var(--danger)", color: "#fff",
      }
    : {
        ...actionButton({ variant: "primary" }),
        padding: "10px 18px",
        fontSize: 13, fontWeight: 600,
      };

  const overlay = (
    <div
      style={modalBackdrop}
      onMouseDown={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "confirm-modal-title" : undefined}
    >
      <div style={{ ...modalShell, maxWidth: 440 }}>
        {title && (
          <h2 id="confirm-modal-title" style={{
            margin: "0 0 10px",
            fontSize: 17, fontWeight: 600,
            color: "var(--text1)",
            letterSpacing: "-0.01em",
            lineHeight: 1.3,
          }}>
            {title}
          </h2>
        )}
        {message && (
          <p style={{
            margin: title ? "0 0 22px" : "0 0 22px",
            fontSize: 14, lineHeight: 1.5,
            color: "var(--text2)",
          }}>
            {message}
          </p>
        )}
        <div style={{
          display: "flex", justifyContent: "flex-end",
          gap: 8, marginTop: 4,
        }}>
          <button onClick={handleCancel} style={cancelStyle}>
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            autoFocus
            style={confirmStyle}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
