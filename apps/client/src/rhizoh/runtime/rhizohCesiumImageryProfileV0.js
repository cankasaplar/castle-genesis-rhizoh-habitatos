/**
 * Cesium imagery profiles — REAL_MAP sub-layers (streets · satellite · terrain · 3D city).
 */

import { normalizeRhizohWorldMapToolIdV0 } from "./rhizohWorldMapToolV0.js";

export const RHIZOH_CESIUM_IMAGERY_PROFILES_V0 = Object.freeze([
  "streets",
  "satellite",
  "city_3d",
  "terrain"
]);

/**
 * @param {string} toolId
 * @returns {'streets'|'satellite'|'city_3d'|'terrain'}
 */
export function resolveCesiumImageryProfileForMapToolV0(toolId) {
  const id = normalizeRhizohWorldMapToolIdV0(toolId);
  if (id === "city_map" || id === "anchor_map") return "city_3d";
  if (id === "satellite") return "satellite";
  if (id === "terrain") return "terrain";
  return "streets";
}

/**
 * @param {string} profile
 */
function tryApplyImageryProfileV0(profile) {
  const c = typeof window !== "undefined" ? window.__CASTLE_CESIUM__ : null;
  if (c?.ready && typeof c.setImageryProfile === "function") {
    void c.setImageryProfile(profile);
    return true;
  }
  return false;
}

/**
 * @param {string} toolId
 * @param {{ maxAttempts?: number }} [opts]
 */
export function applyCesiumImageryForMapToolV0(toolId, opts = {}) {
  const profile = resolveCesiumImageryProfileForMapToolV0(toolId);
  if (typeof window === "undefined") return;
  const maxAttempts = opts.maxAttempts ?? 48;
  let attempts = 0;
  const tick = () => {
    if (tryApplyImageryProfileV0(profile)) return;
    attempts += 1;
    if (attempts < maxAttempts) {
      window.setTimeout(tick, 250);
    }
  };
  window.setTimeout(tick, 80);
}
