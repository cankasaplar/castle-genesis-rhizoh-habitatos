/**
 * PR-3.1 — Deterministic epistemic → discrete key (ambient handshake).
 * SPECFLOW: **RESEARCH-ONLY** (embodiment / physics-kernel design surface; not frozen phase graph).
 *
 * Registry alone is insufficient: this module defines the **state → key derivation rule**
 * over luminosity (ambient), driftBloom + visibility (epistemic atmosphere).
 *
 * @see `deriveEpistemicAtmosphereV0` in `worldPresenceRuntimeV0.js`
 */

/** @typedef {"HIGH_INTERACTION" | "DRIFT_BLOOM" | "DIVERGENCE" | "STABILITY"} EpistemicAmbientKeyV0 */

function clamp01(n) {
  const x = typeof n === "number" && Number.isFinite(n) ? n : 0;
  return Math.min(1, Math.max(0, x));
}

/**
 * Canonical numeric slice for key derivation (all in [0,1]).
 * `visibility` maps from `atmosphere.visibilityBudget` when composing from world presence.
 *
 * @param {Partial<{ luminosity: number, driftBloom: number, visibility: number }>} atmosphere
 * @returns {EpistemicAmbientKeyV0}
 */
export function deriveEpistemicKeyV0(atmosphere) {
  const luminosity = clamp01(atmosphere?.luminosity);
  const driftBloom = clamp01(atmosphere?.driftBloom);
  const visibility = clamp01(atmosphere?.visibility);

  if (luminosity > 0.8) return "HIGH_INTERACTION";
  if (driftBloom > 0.6) return "DRIFT_BLOOM";
  if (visibility < 0.4) return "DIVERGENCE";
  return "STABILITY";
}

/**
 * @param {{ ambient?: { luminosity?: number }, atmosphere?: { driftBloom?: number, visibilityBudget?: number, visibility?: number } }} slice
 * @returns {{ luminosity: number, driftBloom: number, visibility: number }}
 */
export function composeEpistemicKeyInputV0(slice = {}) {
  const amb = slice.ambient || {};
  const atm = slice.atmosphere || {};
  const visibilityRaw =
    typeof atm.visibility === "number" ? atm.visibility : atm.visibilityBudget;
  return {
    luminosity: clamp01(amb.luminosity),
    driftBloom: clamp01(atm.driftBloom),
    visibility: clamp01(visibilityRaw)
  };
}

/**
 * Istanbul / feed → world presence row → single discrete key (deterministic).
 *
 * @param {{ ambient?: object, atmosphere?: object }} worldPresenceSlice
 * @returns {EpistemicAmbientKeyV0}
 */
export function deriveEpistemicKeyFromWorldPresenceSliceV0(worldPresenceSlice) {
  return deriveEpistemicKeyV0(composeEpistemicKeyInputV0(worldPresenceSlice));
}

/** Ordinal registry (lookup metadata); derivation rule remains `deriveEpistemicKeyV0`. */
export const epistemicAmbientKeyRegistryV0 = Object.freeze({
  HIGH_INTERACTION: Object.freeze({ ordinal: 0 }),
  DRIFT_BLOOM: Object.freeze({ ordinal: 1 }),
  DIVERGENCE: Object.freeze({ ordinal: 2 }),
  STABILITY: Object.freeze({ ordinal: 3 })
});
