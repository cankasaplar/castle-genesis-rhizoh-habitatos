/**
 * Sahne grafiği patlamasına karşı sert tavanlar (PVS / Invalid array length riskini azaltır).
 */

export const CESIUM_SCENE_BUDGET = Object.freeze({
  MAX_PRIMITIVES: 1500,
  MAX_ENTITIES: 4000,
  /** Tüm trail polilinelerindeki toplam nokta üst sınırı */
  MAX_POLYLINE_POINTS_TOTAL: 120_000,
  /** İleride terrain önbellek / SSE ile eşleştirilebilir (MB hedefi: ~384) */
  TARGET_TILE_MEMORY_MB: 384
});

/**
 * @param {import("cesium").Viewer | null | undefined} viewer
 * @returns {{ primitiveCount: number, entityCount: number }}
 */
export function getCesiumSceneFootprint(viewer) {
  let primitiveCount = -1;
  let entityCount = -1;
  try {
    primitiveCount = viewer?.scene?.primitives?.length ?? -1;
  } catch {
    primitiveCount = -1;
  }
  try {
    entityCount = viewer?.entities?.values?.length ?? -1;
  } catch {
    entityCount = -1;
  }
  return { primitiveCount, entityCount };
}

/**
 * @param {import("cesium").Viewer | null | undefined} viewer
 * @param {typeof CESIUM_SCENE_BUDGET} [budget]
 */
export function cesiumSceneOverBudget(viewer, budget = CESIUM_SCENE_BUDGET) {
  const { primitiveCount, entityCount } = getCesiumSceneFootprint(viewer);
  if (primitiveCount >= 0 && primitiveCount > budget.MAX_PRIMITIVES) return true;
  if (entityCount >= 0 && entityCount > budget.MAX_ENTITIES) return true;
  return false;
}

/**
 * @param {Map<string, unknown[]>} trailsMap
 * @param {number} maxTotalPoints
 */
export function trimPolylineTrailBudget(trailsMap, maxTotalPoints) {
  if (!(trailsMap instanceof Map) || maxTotalPoints <= 0) return;
  let total = 0;
  for (const arr of trailsMap.values()) {
    if (Array.isArray(arr)) total += arr.length;
  }
  while (total > maxTotalPoints && trailsMap.size > 0) {
    let longestId = null;
    let longestLen = 0;
    for (const [id, arr] of trailsMap) {
      if (!Array.isArray(arr) || !arr.length) continue;
      if (arr.length > longestLen) {
        longestLen = arr.length;
        longestId = id;
      }
    }
    if (longestId == null || longestLen === 0) break;
    const arr = trailsMap.get(longestId);
    arr.shift();
    total--;
  }
}
