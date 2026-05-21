// Moon-phase math + image lookup for the top-bar widget (2026-05-21).
//
// 30 phase frames live at /moonphase/01.png … /moonphase/30.png —
// these are Mark's Figma-rendered moonphase wheel rotated through
// the synodic cycle and exported. Frame 01 corresponds to lunar-day
// 0 (new moon); frame 30 corresponds to the final slice before the
// cycle wraps to new moon again.
//
// Synodic month = 29.530588853 days. We compute moon age in days
// since a known new-moon reference (2000-01-06 18:14 UTC, the
// canonical astronomical reference). Floor the result modulo the
// synodic cycle to get age-in-days; bucket into 30 frames.
//
// Phase names follow the standard 8-phase mapping (New, Waxing
// Crescent, First Quarter, Waxing Gibbous, Full, Waning Gibbous,
// Last Quarter, Waning Crescent). The pure-quarter labels (New /
// First / Full / Last) have narrow ±0.5-day windows centered on
// the exact astronomical alignment; everything else fills the
// surrounding crescent / gibbous bands.

export const SYNODIC_MONTH_DAYS = 29.530588853;

// Reference new moon: 2000-01-06 18:14:00 UTC.
const REF_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

const PHASE_COUNT = 30;

/** Moon age in days since the last new moon. Range [0, 29.53). */
export function moonAgeDays(date = new Date()) {
  const elapsedMs = date.getTime() - REF_NEW_MOON_MS;
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  const age = ((elapsedDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  return age;
}

/** Returns 1..PHASE_COUNT matching /moonphase/NN.png. */
export function moonPhaseImageIndex(date = new Date()) {
  const age = moonAgeDays(date);
  const idx = Math.floor((age / SYNODIC_MONTH_DAYS) * PHASE_COUNT) + 1;
  // Clamp to [1, PHASE_COUNT] defensively.
  return Math.min(Math.max(idx, 1), PHASE_COUNT);
}

/** Filename for the current phase (e.g. "/moonphase/14.png"). */
export function moonPhaseImageUrl(date = new Date()) {
  const n = moonPhaseImageIndex(date);
  return `/moonphase/${String(n).padStart(2, "0")}.png`;
}

/** Human-readable phase name. */
export function moonPhaseName(date = new Date()) {
  const age = moonAgeDays(date);
  // Narrow ±0.5-day windows on the exact-alignment phases.
  if (age < 0.5 || age > SYNODIC_MONTH_DAYS - 0.5) return "New Moon";
  if (age < 7.0)  return "Waxing Crescent";
  if (age < 8.0)  return "First Quarter";
  if (age < 14.25) return "Waxing Gibbous";
  if (age < 15.25) return "Full Moon";
  if (age < 21.5) return "Waning Gibbous";
  if (age < 22.5) return "Last Quarter";
  return "Waning Crescent";
}

/** Illumination fraction 0..1 (0 = new, 1 = full). Approximation via
    cosine of the phase angle; accurate to within ~1% for the small
    bookkeeping use case here. */
export function moonIllumination(date = new Date()) {
  const age = moonAgeDays(date);
  // Phase angle: 0 at new, π at full, 2π at new again.
  const angle = (age / SYNODIC_MONTH_DAYS) * 2 * Math.PI;
  return (1 - Math.cos(angle)) / 2;
}
