import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  moonAgeDays,
  moonPhaseImageUrl,
  moonPhaseName,
  moonIllumination,
  SYNODIC_MONTH_DAYS,
} from "../utils/moonPhase";

// Moon-phase indicator (2026-05-21). Inspired by the Hodinkee
// top-left date+moonphase widget Mark referenced. Small clickable
// glyph in the top bar; click → modal with the larger phase image +
// name + UTC time + lunar-day context.
//
// Refreshes via a useEffect timer every minute — coarse enough to
// not cost anything, fine enough that the modal's UTC clock ticks
// while open and the indicator advances if the user leaves the tab
// open across a phase boundary.

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function formatDateLabel(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatUTCTime(d) {
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function nextLeapYear(year) {
  let y = year;
  while (!isLeapYear(y)) y++;
  return y;
}

export function MoonPhaseIndicator({ size = 22, showDate = true, dark = false }) {
  const [now, setNow] = useState(() => new Date());
  const [open, setOpen] = useState(false);

  // One-minute tick. Cheap; only mounted once in the shell.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Escape closes modal.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const phaseUrl = moonPhaseImageUrl(now);
  const phaseName = moonPhaseName(now);
  const ageDays = moonAgeDays(now);
  const illum = moonIllumination(now);
  const dateLabel = formatDateLabel(now);

  const labelColor = dark ? "rgba(255,255,255,0.85)" : "var(--text2)";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={`${phaseName} · day ${ageDays.toFixed(1)} of ${SYNODIC_MONTH_DAYS.toFixed(1)}`}
        aria-label={`Moon phase: ${phaseName}`}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "transparent", border: "none", cursor: "pointer",
          padding: "4px 8px", fontFamily: "inherit",
          color: labelColor, fontSize: 11,
          letterSpacing: "0.08em",
        }}>
        <img src={phaseUrl} alt="" aria-hidden="true"
          style={{ width: size, height: size, display: "block" }} />
        {showDate && (
          <span style={{ fontWeight: 500 }}>{dateLabel}</span>
        )}
      </button>

      {open && createPortal(
        <div onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24,
          }}>
          <div onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--bg)",
              border: "0.5px solid var(--border)",
              borderRadius: 16,
              padding: "32px 28px",
              width: "100%", maxWidth: 480,
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 18,
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            }}>
            {/* Close X — top-right, doesn't compete with the phase artwork. */}
            <button onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                position: "absolute", top: 20, right: 20,
                background: "transparent", border: "none", cursor: "pointer",
                fontSize: 24, color: "var(--text3)", fontFamily: "inherit",
                padding: 4, lineHeight: 1,
              }}>×</button>

            <div style={{
              fontSize: 14, fontWeight: 600, fontStyle: "italic",
              color: "var(--text1)", letterSpacing: "0.01em",
              marginTop: 4,
            }}>
              {phaseName}
            </div>

            <img src={phaseUrl} alt={phaseName}
              style={{
                width: "min(320px, 65vw)",
                height: "min(320px, 65vw)",
                display: "block",
              }} />

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 0,
              width: "100%",
              borderTop: "0.5px solid var(--border)",
              paddingTop: 18,
            }}>
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4,
                borderRight: "0.5px solid var(--border)",
                padding: "4px 12px",
              }}>
                <div style={{ fontSize: 28, fontWeight: 300, color: "var(--text1)", letterSpacing: "-0.01em" }}>
                  {nextLeapYear(now.getFullYear())}
                </div>
                <div style={{
                  fontSize: 10, color: "var(--text3)",
                  textTransform: "uppercase", letterSpacing: "0.12em",
                }}>NEXT LEAP YEAR</div>
              </div>
              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4,
                padding: "4px 12px",
              }}>
                <div style={{ fontSize: 28, fontWeight: 300, color: "var(--text1)", letterSpacing: "-0.01em" }}>
                  {formatUTCTime(now)}
                </div>
                <div style={{
                  fontSize: 10, color: "var(--text3)",
                  textTransform: "uppercase", letterSpacing: "0.12em",
                }}>UTC</div>
              </div>
            </div>

            <div style={{
              fontSize: 11, color: "var(--text3)",
              letterSpacing: "0.04em",
              textAlign: "center",
            }}>
              Lunar day {ageDays.toFixed(1)} of {SYNODIC_MONTH_DAYS.toFixed(1)} ·
              {" "}{Math.round(illum * 100)}% illuminated
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
