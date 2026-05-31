/**
 * PR-1 — WORLD layer (Cesium / REAL_MAP / WebGL map stack) opt-out.
 * Genesis / continuity survival surface should set `VITE_WORLD_LAYER=0` or `false` (or `off`).
 * Unset → açık (mevcut dağıtımlar için geriye dönük varsayılan).
 *
 * @returns {boolean}
 */
export function isWorldLayerEnabled() {
  if (typeof import.meta === "undefined" || !import.meta.env) return true;
  const v = String(import.meta.env.VITE_WORLD_LAYER ?? "").trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off") return false;
  return true;
}

/**
 * Full-page spatial product shell (`RhizohSpatialWorldShell`) — map-first UX track.
 * rhizoh.com default product = T0 monolith (`AppRhizoh528T0`); enable only with explicit flag.
 *
 * @returns {boolean}
 */
export function isRhizohSpatialProductShellEnabled() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  const v = String(import.meta.env.VITE_RHIZOH_SPATIAL_SHELL ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}

/** @returns {boolean} */
export function isRhizohFastSpeechModeEnabled() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  const v = String(import.meta.env.VITE_RHIZOH_FAST_SPEECH_MODE ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on";
}
