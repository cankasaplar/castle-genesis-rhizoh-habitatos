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
