/**
 * E2-creative cohort — interactive surface (Studio drawer, map stack) without core thaw.
 * @see apps/client/docs/DEPLOY_MATRIX_V1.0.md §7 (E2-X)
 * @see docs/RHIZOH_SURFACE_LAYER_OPERATING_MODEL_V0.md
 */

/**
 * Creative surface row: expression field ON; frozen core unchanged.
 * @returns {boolean}
 */
export function isRhizohCreativeSurfaceEnabledV0() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  const v = String(import.meta.env.VITE_RHIZOH_SURFACE_CREATIVE ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}

/**
 * When creative + world layer: bind map to L2 projection bundle (not bootstrap flyTo alone).
 * @returns {boolean}
 */
export function isRhizohEntityProjectionMapBindEnabledV0() {
  if (!isRhizohCreativeSurfaceEnabledV0()) return false;
  const v = String(import.meta.env.VITE_RHIZOH_ENTITY_PROJECTION_MAP ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}
