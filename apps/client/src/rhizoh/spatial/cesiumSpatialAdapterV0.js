/**
 * Cesium spatial adapter (v0) — epistemic projection hints → Cesium-friendly scalars.
 *
 * Pure numeric mapping; no Cesium import; no scene mutation.
 * `viewer` / `scene` burada yok — yalnızca adapter contract.
 *
 * @see cesiumEpistemicBootstrapV0.js
 * @see docs/RHIZOH_PROJECTION_DISCIPLINE_V0.md
 */

/**
 * @typedef {import("./deriveAnchorAtmosphereProjectionV0.js").AnchorAtmosphereProjectionV0} AnchorAtmosphereProjectionV0
 */

/**
 * @typedef {{
 *   fogDensity: number,
 *   fogMinimumBrightness: number,
 *   atmosphereLightIntensity: number
 * }} CesiumAtmosphereBindingParamsV0
 */

/**
 * @param {AnchorAtmosphereProjectionV0} projection
 * @returns {CesiumAtmosphereBindingParamsV0}
 */
export function anchorProjectionToCesiumAtmosphereParamsV0(projection) {
  if (!projection || typeof projection !== "object") {
    return {
      fogDensity: 2.2e-5,
      fogMinimumBrightness: 0.12,
      atmosphereLightIntensity: 0.72
    };
  }
  const localFog = Math.min(1, Math.max(0, Number(projection.localFog) || 0));
  const localExposure = Math.min(1, Math.max(0, Number(projection.localExposure) || 0));
  const resonanceDrift = Math.min(1, Math.max(0, Number(projection.resonanceDrift) || 0));

  const fogDensity = 1.1e-5 + localFog * 1.75e-4;
  const fogMinimumBrightness = 0.07 + localExposure * 0.24;
  const atmosphereLightIntensity = Math.min(1.25, 0.34 + localExposure * 0.58 + resonanceDrift * 0.14);

  return { fogDensity, fogMinimumBrightness, atmosphereLightIntensity };
}
