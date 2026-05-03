/**
 * Tek kaynak: REAL_MAP *niyeti* (uiStore.realityMode) ile Cesium yüzeyinin
 * gerçekten çalışıp çalışmayacağı (mapSurfaceActive) — gateway fazına göre.
 */

/**
 * @param {"GLOBE" | "REAL_MAP"} realityMode
 * @param {string} gatewayPhase
 * @returns {boolean}
 */
export function computeMapSurfaceActive(realityMode, gatewayPhase) {
  if (realityMode !== "REAL_MAP") return false;
  const g = String(gatewayPhase || "unknown");
  if (g === "initializing" || g === "connecting" || g === "reconnecting") return false;
  if (g === "offline" || g === "offline_dns" || g === "unconfigured" || g === "maintenance") return false;
  return true;
}
