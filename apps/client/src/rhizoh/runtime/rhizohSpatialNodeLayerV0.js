/**
 * Map node layer — 3-tier spatial sync (STATIC · LIVE · TEMPORAL).
 * Nodes sync ONLY through spatial engine — never bound to Castle/Studio domain state.
 */

import { resolveVersionedEvolutionNodeIdV0 } from "./nodeTemporalFissionV0.js";

export const SPATIAL_NODE_TIER_V0 = Object.freeze({
  STATIC: "static",
  LIVE: "live",
  TEMPORAL: "temporal"
});

/** @type {Map<string, object>} */
const nodeRegistry = new Map();

/**
 * @param {string} tier
 * @param {string} nodeId
 * @param {object} payload
 */
export function registerSpatialNodeV0(tier, nodeId, payload = {}) {
  const t = String(tier || SPATIAL_NODE_TIER_V0.STATIC);
  const rawId = String(nodeId || "").trim();
  if (!rawId) return null;
  const atMs = Math.floor(Number(payload?.atMs) || Date.now());
  const evolved = resolveVersionedEvolutionNodeIdV0({
    baseNodeId: rawId,
    atMs,
    semanticSeed: String(payload?.kind || payload?.sourceDomain || t)
  });
  const id = evolved.nodeId || rawId;
  const key = `${t}:${id}`;
  const projectionOnly = t === SPATIAL_NODE_TIER_V0.LIVE;
  const row = Object.freeze({
    tier: t,
    id,
    payload,
    projectionOnly,
    atMs,
    evolutionLine: Object.freeze({
      baseNodeId: evolved.baseNodeId || rawId,
      version: evolved.version || 1,
      fissionApplied: evolved.evolved === true
    }),
    source: "spatial_engine"
  });
  nodeRegistry.set(key, row);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("rhizoh:spatial-node-v0", { detail: row })
    );
  }
  return row;
}

/**
 * @param {string} [tier]
 * @returns {object[]}
 */
export function listSpatialNodesV0(tier) {
  const rows = [...nodeRegistry.values()];
  if (!tier) return rows;
  return rows.filter((r) => r.tier === tier);
}

/**
 * Sync live/temporal nodes from spatial engine consumer — not from Castle/Studio stores.
 * @param {{ static?: object[], live?: object[], temporal?: object[] }} batch
 */
export function syncSpatialNodeBatchV0(batch = {}) {
  for (const row of batch.static || []) {
    if (row?.id) registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.STATIC, row.id, row);
  }
  for (const row of batch.live || []) {
    if (row?.id) registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.LIVE, row.id, row);
  }
  for (const row of batch.temporal || []) {
    if (row?.id) registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, row.id, row);
  }
  return Object.freeze({
    static: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.STATIC).length,
    live: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.LIVE).length,
    temporal: listSpatialNodesV0(SPATIAL_NODE_TIER_V0.TEMPORAL).length
  });
}

/** @internal vitest */
export function __resetSpatialNodeLayerForTestV0() {
  nodeRegistry.clear();
}
