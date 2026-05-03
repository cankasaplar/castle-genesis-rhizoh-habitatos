/**
 * Ghost Ecology v0 — shape only (mutable zone pre-wire).
 * No simulation coupling until Ghost Ecology Layer v1 lands.
 */

/** @returns {Record<string, unknown>} */
export function createGhostEcologyPlaceholder() {
  return {
    affinityEdges: [],
    rivalryEdges: [],
    coalitions: [],
    mimicChains: [],
    pollenTransfers: [],
    dormancyClusters: [],
    /** @type {Record<string, { id: string, affinity?: number, rivalry?: number, coalitionId?: string | null, dormancy?: number, pollenMemorySignature?: string | null }>} */
    threadEcology: {}
  };
}
