/**
 * SpiralMMO continent route mesh — cubes fly only along declared edges (v0 visual).
 */

import { SPIRAL_MMO_CONTINENT_IDS_V0 } from "./spiralMMOContinentPinsV0.js";

/** Undirected edges — full map connected graph (7 continents). */
export const SPIRAL_MMO_CONTINENT_ROUTE_EDGES_V0 = Object.freeze([
  Object.freeze(["europe", "africa"]),
  Object.freeze(["europe", "asia"]),
  Object.freeze(["europe", "north_america"]),
  Object.freeze(["africa", "south_america"]),
  Object.freeze(["africa", "antarctica"]),
  Object.freeze(["asia", "oceania"]),
  Object.freeze(["asia", "north_america"]),
  Object.freeze(["north_america", "south_america"]),
  Object.freeze(["south_america", "oceania"]),
  Object.freeze(["antarctica", "south_america"]),
  Object.freeze(["antarctica", "oceania"])
]);

/**
 * @returns {ReadonlyArray<readonly [string, string]>}
 */
export function listSpiralMMOContinentRouteEdgesV0() {
  return SPIRAL_MMO_CONTINENT_ROUTE_EDGES_V0;
}

/**
 * @param {number} pinIndex
 * @param {number} pinCount
 */
export function resolveSpiralMMOOrderPartnerIndexV0(pinIndex, pinCount = SPIRAL_MMO_CONTINENT_IDS_V0.length) {
  return (Number(pinIndex) + 3) % pinCount;
}

/**
 * All directed pairs along the continent route mesh (full map).
 * @param {number} _triggerPinIndex
 * @param {ReadonlyArray<{ continent: string }>} pins
 * @returns {ReadonlyArray<readonly [number, number]>}
 */
export function resolveSpiralMMOAwakeningRoutePairsV0(_triggerPinIndex, pins) {
  const continentByIdx = pins.map((p) => p.continent);
  /** @type {[number, number][]} */
  const pairs = [];
  const seen = new Set();

  for (const [a, b] of SPIRAL_MMO_CONTINENT_ROUTE_EDGES_V0) {
    const ai = continentByIdx.indexOf(a);
    const bi = continentByIdx.indexOf(b);
    if (ai < 0 || bi < 0) continue;
    for (const [srcIdx, destIdx] of [
      [ai, bi],
      [bi, ai]
    ]) {
      const key = `${srcIdx}->${destIdx}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push([srcIdx, destIdx]);
    }
  }

  return Object.freeze(pairs);
}

/**
 * Order-route pairs: trigger ↔ partner continent (dual pass), must be a graph edge.
 * @param {number} triggerPinIndex
 * @param {ReadonlyArray<{ continent: string }>} pins
 */
export function resolveSpiralMMOOrderRoutePairsV0(triggerPinIndex, pins) {
  const safe = Math.max(0, Math.min(pins.length - 1, Number(triggerPinIndex) || 0));
  const partner = resolveSpiralMMOOrderPartnerIndexV0(safe, pins.length);
  const all = resolveSpiralMMOAwakeningRoutePairsV0(safe, pins);
  return all.filter(([src, dest]) => {
    const touches =
      src === safe || dest === safe || src === partner || dest === partner;
    return touches;
  });
}
