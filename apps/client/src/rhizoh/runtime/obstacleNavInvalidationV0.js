/**
 * Sprint B — obstacle delta → nav grid invalidation binding.
 */

import { buildBlockedGridV0 } from "../../studio/lib/realSimulation/minimalPathGridNavV0.ts";

export const OBSTACLE_NAV_INVALIDATION_SCHEMA_V0 = "castle.rhizoh.obstacle_nav_invalidation.v0";

export const DEFAULT_NAV_SPEC_V0 = Object.freeze({
  halfExtent: 14,
  resolution: 40
});

/**
 * @param {{ x: number, z: number, r: number }[]} prevDiscs
 * @param {{ x: number, z: number, r: number }[]} nextDiscs
 * @param {{ halfExtent: number, resolution: number }} [navSpec]
 * @returns {number[]} flat cell indices where blocked state changed
 */
export function computeNavInvalidationMaskV0(prevDiscs, nextDiscs, navSpec = DEFAULT_NAV_SPEC_V0) {
  const prev = Array.isArray(prevDiscs) ? prevDiscs : [];
  const next = Array.isArray(nextDiscs) ? nextDiscs : [];
  const prevGrid = buildBlockedGridV0(navSpec, prev);
  const nextGrid = buildBlockedGridV0(navSpec, next);
  const keys = [];
  for (let i = 0; i < nextGrid.length; i++) {
    if (prevGrid[i] !== nextGrid[i]) keys.push(i);
  }
  return keys;
}

/**
 * Normalize obstacle delta payload to disc list.
 *
 * @param {unknown} delta
 * @returns {{ x: number, z: number, r: number }[]}
 */
export function parseObstacleDiscsFromDeltaV0(delta) {
  if (!delta || typeof delta !== "object") return [];
  const d = /** @type {Record<string, unknown>} */ (delta);
  const discs = d.discs ?? d.obstacles ?? d.add;
  if (!Array.isArray(discs)) return [];
  return discs
    .map((o) => {
      const x = /** @type {Record<string, unknown>} */ (o);
      return {
        x: Number(x.x) || 0,
        z: Number(x.z) || 0,
        r: Math.max(0.1, Number(x.r) || 0.5)
      };
    })
    .filter((o) => Number.isFinite(o.x) && Number.isFinite(o.z));
}

/**
 * Merge prior sealed discs with delta (add/remove by id optional — v0: replace list if full set provided).
 *
 * @param {{ x: number, z: number, r: number }[]} prior
 * @param {unknown} delta
 */
export function mergeObstacleDiscsV0(prior, delta) {
  const parsed = parseObstacleDiscsFromDeltaV0(delta);
  if (parsed.length > 0) return parsed;
  return prior;
}
