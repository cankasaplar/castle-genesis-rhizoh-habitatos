/**
 * PR-4-B — Presence field runtime (aura / intensity / focus weights — not a character).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Expresses **ambient epistemic embodiment** as numeric field weights only.
 * Does not emit identity, continuity, governance, or human-intent semantics.
 */

function clamp01(x) {
  const n = typeof x === "number" && Number.isFinite(x) ? x : 0;
  return Math.min(1, Math.max(0, n));
}

const SCHEMA = "presenceFieldRuntime.v0";

/**
 * @param {{
 *   auraBase01?: number,
 *   projectionDeskGlowBorrow01?: number,
 *   atmosphericLift01?: number,
 *   focusHint01?: number
 * }} io
 */
export function derivePresenceFieldV0(io = {}) {
  const auraBase = clamp01(io.auraBase01 ?? 0.42);
  const deskGlow = clamp01(io.projectionDeskGlowBorrow01 ?? 0);
  const lift = clamp01(io.atmosphericLift01 ?? 0);
  const focus = clamp01(io.focusHint01 ?? 0.38);

  const fieldIntensity01 = clamp01(auraBase * (0.72 + deskGlow * 0.28) + lift * 0.12);
  const volumetricWeight01 = clamp01(0.12 + deskGlow * 0.35 + lift * 0.22);
  const ambientFocus01 = clamp01(focus * (0.55 + deskGlow * 0.45));

  return Object.freeze({
    schema: SCHEMA,
    fieldIntensity01,
    volumetricWeight01,
    ambientFocus01
  });
}
