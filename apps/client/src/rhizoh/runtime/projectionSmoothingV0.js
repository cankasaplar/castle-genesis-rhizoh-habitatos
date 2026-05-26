/**
 * Projection smoothing (v0) — temporal continuity for visual hints only.
 *
 * **Perceptual stability layer (v0):** see `docs/PERCEPTUAL_STABILITY_LAYER_V0.md` — UI jitter / smoothness
 *   without touching identity or world truth; this file is **hint EMA only**.
 * @see docs/PERCEPTUAL_STABILITY_LAYER_V0.md — perceptual stability (jitter, smoothness, Cesium feel)
 * @see docs/TEMPORAL_LAYER_BOUNDARY_V0.md — temporal ≠ projection math; bu dosya görsel EMA only
 * @see docs/RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md (Yol A — perceptual stability)
 */

/**
 * @typedef {import("./sceneProjectionAdapterV0.js").ProjectionHintsV0} ProjectionHintsV0
 */

/**
 * @param {ProjectionHintsV0} h
 * @returns {ProjectionHintsV0}
 */
function cloneProjectionHintsV0(h) {
  return {
    fogDensity: h.fogDensity,
    castleAuraIntensity: h.castleAuraIntensity,
    castleMetabolicPulse: h.castleMetabolicPulse,
    ambientTint: {
      r: h.ambientTint.r,
      g: h.ambientTint.g,
      b: h.ambientTint.b
    }
  };
}

/**
 * @param {ProjectionHintsV0 | null} prev
 * @param {ProjectionHintsV0} next
 * @param {{ fogEmaAlpha?: number, auraInertiaAlpha?: number, tintLerpAlpha?: number, metabolicAlpha?: number }} [opts]
 * @returns {ProjectionHintsV0}
 */
export function smoothProjectionHintsV0(prev, next, opts = {}) {
  const aFog = typeof opts.fogEmaAlpha === "number" ? opts.fogEmaAlpha : 0.22;
  const aAura = typeof opts.auraInertiaAlpha === "number" ? opts.auraInertiaAlpha : 0.14;
  const aTint = typeof opts.tintLerpAlpha === "number" ? opts.tintLerpAlpha : 0.16;
  const aMeta = typeof opts.metabolicAlpha === "number" ? opts.metabolicAlpha : 0.12;

  if (!prev) return cloneProjectionHintsV0(next);

  const fogDensity = prev.fogDensity * (1 - aFog) + next.fogDensity * aFog;
  const castleAuraIntensity = prev.castleAuraIntensity * (1 - aAura) + next.castleAuraIntensity * aAura;
  const castleMetabolicPulse =
    prev.castleMetabolicPulse * (1 - aMeta) + next.castleMetabolicPulse * aMeta;
  const ambientTint = {
    r: prev.ambientTint.r * (1 - aTint) + next.ambientTint.r * aTint,
    g: prev.ambientTint.g * (1 - aTint) + next.ambientTint.g * aTint,
    b: prev.ambientTint.b * (1 - aTint) + next.ambientTint.b * aTint
  };

  return {
    fogDensity: Math.min(1, Math.max(0, fogDensity)),
    castleAuraIntensity: Math.min(1, Math.max(0, castleAuraIntensity)),
    castleMetabolicPulse: Math.min(1, Math.max(0, castleMetabolicPulse)),
    ambientTint: {
      r: Math.min(1, Math.max(0, ambientTint.r)),
      g: Math.min(1, Math.max(0, ambientTint.g)),
      b: Math.min(1, Math.max(0, ambientTint.b))
    }
  };
}
