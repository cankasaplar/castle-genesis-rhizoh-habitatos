/**
 * Sprint C — fine-grained nav invalidation (cell-level patch + path reuse hints).
 *
 * Complements `obstacleNavInvalidationV0.js` full-mask computation.
 */

import { buildBlockedGridV0, cellCenterV0 } from "../../studio/lib/realSimulation/minimalPathGridNavV0.ts";
import { DEFAULT_NAV_SPEC_V0 } from "./obstacleNavInvalidationV0.js";

export const NAV_INVALIDATION_INCREMENTAL_SCHEMA_V0 =
  "castle.rhizoh.nav_invalidation_incremental.v0";

/**
 * Patch only invalidated cells on an existing blocked grid (or allocate if null).
 *
 * @param {Uint8Array | null} blockedGrid
 * @param {number[]} cellKeys flat indices (iz * resolution + ix)
 * @param {{ halfExtent: number, resolution: number }} navSpec
 * @param {{ x: number, z: number, r: number }[]} obstacles
 * @returns {{ grid: Uint8Array, patchedCells: number }}
 */
export function applyNavInvalidationCellsV0(
  blockedGrid,
  cellKeys,
  navSpec = DEFAULT_NAV_SPEC_V0,
  obstacles = []
) {
  const res = navSpec.resolution;
  const n = res * res;
  const grid = blockedGrid && blockedGrid.length === n ? blockedGrid : new Uint8Array(n);
  const keys = Array.isArray(cellKeys) ? cellKeys : [];
  const cell = (2 * navSpec.halfExtent) / res;
  const margin = cell * 0.55;

  let patched = 0;
  for (const flat of keys) {
    const idx = Number(flat);
    if (!Number.isFinite(idx) || idx < 0 || idx >= n) continue;
    const ix = idx % res;
    const iz = (idx / res) | 0;
    const { x, z } = cellCenterV0(ix, iz, navSpec);
    let blocked = 0;
    for (const o of obstacles) {
      const dx = x - o.x;
      const dz = z - o.z;
      if (dx * dx + dz * dz < (o.r + margin) * (o.r + margin)) {
        blocked = 1;
        break;
      }
    }
    if (grid[idx] !== blocked) {
      grid[idx] = blocked;
      patched += 1;
    }
  }
  return { grid, patchedCells: patched };
}

/**
 * Whether an existing BFS path crosses any invalidated cell (flat index).
 *
 * @param {{ ix: number, iz: number }[] | null} path
 * @param {number[]} cellKeys
 * @param {number} resolution
 */
export function pathTouchesInvalidatedCellsV0(path, cellKeys, resolution) {
  if (!path?.length || !cellKeys?.length) return false;
  const set = new Set(cellKeys);
  for (const p of path) {
    const flat = p.iz * resolution + p.ix;
    if (set.has(flat)) return true;
  }
  return false;
}

/**
 * Decide incremental patch vs full rebuild.
 *
 * @param {number} invalidationCellCount
 * @param {number} gridCellCount
 * @param {{ incrementalRatioMax?: number }} [opts]
 */
export function shouldUseIncrementalNavPatchV0(
  invalidationCellCount,
  gridCellCount,
  opts = {}
) {
  const maxRatio = Number(opts.incrementalRatioMax) || 0.35;
  if (!invalidationCellCount || !gridCellCount) return false;
  return invalidationCellCount / gridCellCount <= maxRatio;
}

/**
 * Apply sealed obstacle authority with incremental patch when beneficial.
 *
 * @param {Uint8Array | null} blockedGrid
 * @param {{ discs: { x: number, z: number, r: number }[], invalidationCellKeys: number[] }} authority
 * @param {{ halfExtent: number, resolution: number }} [navSpec]
 */
export function rebuildNavGridWithIncrementalInvalidationV0(blockedGrid, authority, navSpec = DEFAULT_NAV_SPEC_V0) {
  const discs = authority?.discs ?? [];
  const keys = authority?.invalidationCellKeys ?? [];
  const gridN = navSpec.resolution * navSpec.resolution;
  const useIncremental =
    blockedGrid &&
    blockedGrid.length === gridN &&
    shouldUseIncrementalNavPatchV0(keys.length, gridN);

  if (useIncremental) {
    const patched = applyNavInvalidationCellsV0(blockedGrid, keys, navSpec, discs);
    return { grid: patched.grid, mode: "incremental", patchedCells: patched.patchedCells };
  }
  return {
    grid: buildBlockedGridV0(navSpec, discs),
    mode: "full",
    patchedCells: gridN
  };
}
