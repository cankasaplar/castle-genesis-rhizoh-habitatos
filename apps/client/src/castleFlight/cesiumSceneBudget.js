/**
 * Sahne grafiği patlamasına karşı sert tavanlar (PVS / Invalid array length riskini azaltır).
 */

export const CESIUM_SCENE_BUDGET = Object.freeze({
  MAX_PRIMITIVES: 1500,
  MAX_ENTITIES: 4000,
  /** Tüm trail polilinelerindeki toplam nokta üst sınırı */
  MAX_POLYLINE_POINTS_TOTAL: 120_000,
  /** İleride terrain önbellek / SSE ile eşleştirilebilir (MB hedefi: ~384) */
  TARGET_TILE_MEMORY_MB: 384,
  /** OSM footprint box entities on globe (PVS / Invalid array length guard) */
  MAX_FOOTPRINT_ENTITIES: 48,
  /** POI point entities on globe (labels add draw cost) */
  MAX_POI_ENTITIES: 64
});

/**
 * @template T
 * @param {T[]} rows
 * @param {number} cap
 * @returns {{ rows: T[], truncated: boolean, total: number }}
 */
/**
 * @param {{ lat?: unknown, lon?: unknown }} row
 * @returns {boolean}
 */
export function isValidCesiumGeoRowV0(row) {
  const lat = Number(row?.lat);
  const lon = Number(row?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  if (lat < -85 || lat > 85 || lon < -180 || lon > 180) return false;
  return true;
}

/**
 * Drop cached / legacy rows with NaN or out-of-range coordinates before Cesium entity creation.
 * @template T
 * @param {T[]} rows
 * @returns {{ rows: T[], dropped: number }}
 */
export function filterCesiumGeoRowsV0(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const kept = list.filter((r) => isValidCesiumGeoRowV0(r));
  return Object.freeze({ rows: kept, dropped: list.length - kept.length });
}

/**
 * @param {number} levels
 * @param {number} idx
 * @returns {number}
 */
export function finiteCesiumBuildingHeightV0(levels, idx = 0) {
  const fromLevels = Number(levels);
  const derived =
    Number.isFinite(fromLevels) && fromLevels > 0 ? fromLevels * 3.2 : 28 + (idx % 6) * 8;
  return Math.max(8, Math.min(420, derived));
}

export function capRowsForCesiumRenderV0(rows, cap) {
  const list = Array.isArray(rows) ? rows : [];
  const limit = Math.max(0, Math.floor(Number(cap) || 0));
  if (!limit || list.length <= limit) {
    return { rows: list, truncated: false, total: list.length };
  }
  return { rows: list.slice(0, limit), truncated: true, total: list.length };
}

/** Rendering stabilizer — 3D footprint boxes on globe. */
export function logCesiumFootprintRenderCapV0(details) {
  console.warn("[CASTLE_CESIUM_RENDER_BUDGET] footprint_cap", {
    stabilizer: "rendering",
    ...details
  });
}

/** UX stabilizer — POI labels/points on map (data may stay full in memory). */
export function logCesiumPoiUxCapV0(details) {
  console.warn("[CASTLE_CESIUM_UX_BUDGET] poi_cap", {
    stabilizer: "ux",
    ...details
  });
}

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
