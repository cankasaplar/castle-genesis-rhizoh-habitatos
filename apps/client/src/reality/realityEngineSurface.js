/**
 * Single source: REAL_MAP intent (uiStore.realityMode) vs Cesium surface (mapSurfaceActive).
 * Gateway phase gates live mesh; product WORLD map can run with WORLD_EXECUTION_MODE=active.
 */

/**
 * Product map stack may render without gateway (local dev / T0 preview).
 * @returns {boolean}
 */
export function isRhizohProductMapExecutionEnabledV0() {
  if (typeof import.meta === "undefined" || !import.meta.env) return false;
  const env = import.meta.env;
  const layer = String(env.VITE_WORLD_LAYER ?? "").trim().toLowerCase();
  if (layer === "0" || layer === "false" || layer === "off") return false;
  const exec = String(env.VITE_WORLD_EXECUTION_MODE ?? "").trim().toLowerCase();
  if (exec === "active") return true;
  const flag = String(env.VITE_RHIZOH_PRODUCT_MAP_V0 ?? "").trim().toLowerCase();
  return flag === "1" || flag === "true" || flag === "on";
}

/**
 * @param {"GLOBE" | "REAL_MAP"} realityMode
 * @param {string} gatewayPhase
 * @returns {boolean}
 */
export function computeMapSurfaceActive(realityMode, gatewayPhase) {
  if (realityMode !== "REAL_MAP") return false;
  if (isRhizohProductMapExecutionEnabledV0()) return true;
  const g = String(gatewayPhase || "unknown");
  if (g === "initializing" || g === "connecting" || g === "reconnecting") return false;
  if (g === "offline" || g === "offline_dns" || g === "unconfigured" || g === "maintenance") {
    return false;
  }
  return true;
}
