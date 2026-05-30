/**
 * B0 — Anchor-local atmosphere projection hints (v0).
 *
 * Pure: reads `worldPresenceState` only; does not mutate.
 * Output is numeric hint bundle for later binding (CSS / Cesium / Three) — not scene objects.
 *
 * @see geographicAnchorsV0.js
 * @see docs/RHIZOH_PROJECTION_DISCIPLINE_V0.md
 */

/**
 * @typedef {{
 *   localFog: number,
 *   localAura: number,
 *   localExposure: number,
 *   resonanceDrift: number
 * }} AnchorAtmosphereProjectionV0
 */

/**
 * @typedef {import("./geographicAnchorsV0.js").GeographicSemanticAnchorV0} GeographicSemanticAnchorV0
 */

/** @param {number} x */
function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

/**
 * @param {unknown} worldPresenceState
 * @returns {{ fogDiff: number, drift: number, vis: number, aura: number, lum: number }}
 */
function readPresenceAtmosphereSliceV0(worldPresenceState) {
  if (!worldPresenceState || typeof worldPresenceState !== "object") {
    return { fogDiff: 0.35, drift: 0.2, vis: 0.7, aura: 0.45, lum: 0.5 };
  }
  const s = /** @type {Record<string, unknown>} */ (worldPresenceState);
  const atm = s.atmosphere && typeof s.atmosphere === "object" ? /** @type {Record<string, unknown>} */ (s.atmosphere) : {};
  const amb = s.ambient && typeof s.ambient === "object" ? /** @type {Record<string, unknown>} */ (s.ambient) : {};
  return {
    fogDiff: typeof atm.fogDiffusion === "number" ? atm.fogDiffusion : 0.35,
    drift: typeof atm.driftBloom === "number" ? atm.driftBloom : 0.2,
    vis: typeof atm.visibilityBudget === "number" ? atm.visibilityBudget : 0.7,
    aura: typeof atm.auraIntensity === "number" ? atm.auraIntensity : 0.45,
    lum: typeof amb.luminosity === "number" ? amb.luminosity : 0.5
  };
}

/**
 * City-wide baseline fog (aligned with sceneProjectionAdapterV0 fog composition).
 * @param {{ fogDiff: number, drift: number, vis: number }} slice
 */
function cityBaselineFogV0(slice) {
  return clamp01(slice.fogDiff * 0.72 + slice.drift * 0.18 + (1 - slice.vis) * 0.12);
}

/**
 * @param {GeographicSemanticAnchorV0} anchor
 * @param {unknown} worldPresenceState
 * @returns {AnchorAtmosphereProjectionV0}
 */
export function deriveAnchorAtmosphereProjectionV0(anchor, worldPresenceState) {
  if (!anchor || typeof anchor !== "object") {
    return { localFog: 0.22, localAura: 0.45, localExposure: 0.55, resonanceDrift: 0.18 };
  }

  const slice = readPresenceAtmosphereSliceV0(worldPresenceState);
  const p = anchor.epistemicProfile;
  const aff = anchor.atmosphericAffinity;
  const driftSens = typeof aff.driftSensitivity === "number" ? aff.driftSensitivity : 0.28;

  const stability = typeof p.stability === "number" ? p.stability : 0.5;
  const divergence = typeof p.divergence === "number" ? p.divergence : 0.2;
  const interaction = typeof p.interaction === "number" ? p.interaction : 0.35;
  const continuity = typeof p.continuity === "number" ? p.continuity : 0.55;
  const archival = typeof p.archivalDensity === "number" ? p.archivalDensity : 0.3;

  const cityFog = cityBaselineFogV0(slice);
  const localFog = clamp01(
    cityFog * (1 - stability * 0.1 + archival * 0.08) + driftSens * 0.07 * divergence
  );

  const baseAura = clamp01(slice.aura * (0.92 - cityFog * 0.18));
  const localAura = clamp01(baseAura + divergence * 0.14 - stability * 0.04 + interaction * 0.05);

  const localExposure = clamp01(slice.vis * (0.82 + continuity * 0.14) * (0.72 + slice.lum * 0.28) * (1 - archival * 0.07));

  const resonanceDrift = clamp01(slice.drift * (0.48 + divergence * 0.36 + interaction * 0.16) * driftSens);

  return { localFog, localAura, localExposure, resonanceDrift };
}
