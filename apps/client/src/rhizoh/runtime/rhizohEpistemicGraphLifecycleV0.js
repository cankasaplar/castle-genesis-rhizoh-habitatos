/**
 * Epistemic graph lifecycle v0 — node TTL, edge decay, prune plan (Phase 6).
 * RESEARCH-ONLY — observation topology hygiene, not execution.
 */

export const EPISTEMIC_GRAPH_LIFECYCLE_SCHEMA_V0 = "castle.rhizoh.epistemic_graph_lifecycle.v0";

export const NODE_TTL_MS_BY_KIND_V0 = Object.freeze({
  stress_lens: 15 * 60_000,
  shadow_projection: 45 * 60_000,
  council_annotation: 60 * 60_000,
  stress_run_hub: 90 * 60_000,
  CHESS_MOVE_ANCHOR: 120 * 60_000,
  default: 45 * 60_000
});

export const EDGE_DECAY_HORIZON_MS_V0 = Object.freeze({
  conflict_graph: 20 * 60_000,
  causal_chain: 40 * 60_000,
  stress_run: 60 * 60_000,
  council_session: 60 * 60_000,
  match_sequence: 90 * 60_000,
  default: 45 * 60_000
});

export const EDGE_DECAY_WEIGHT_FLOOR_V0 = 0.15;

/**
 * @param {object} node
 * @param {number} [now]
 */
export function resolveNodeTtlMsV0(node, now = Date.now()) {
  if (!node) return NODE_TTL_MS_BY_KIND_V0.default;
  if (node.eventType === "CHESS_MOVE_ANCHOR") return NODE_TTL_MS_BY_KIND_V0.CHESS_MOVE_ANCHOR;
  return NODE_TTL_MS_BY_KIND_V0[node.kind] || NODE_TTL_MS_BY_KIND_V0.default;
}

/**
 * @param {object} node
 * @param {number} [now]
 */
export function isNodeExpiredForLifecycleV0(node, now = Date.now()) {
  const ttl = resolveNodeTtlMsV0(node, now);
  return now - (node.atMs || 0) > ttl;
}

/**
 * @param {object} edge
 * @param {number} [now]
 */
export function computeEdgeDecayWeightV0(edge, now = Date.now()) {
  const horizon =
    EDGE_DECAY_HORIZON_MS_V0[edge.linkKind] || EDGE_DECAY_HORIZON_MS_V0.default;
  const ageMs = Math.max(0, now - (edge.atMs || 0));
  return Number(Math.max(0, 1 - ageMs / horizon).toFixed(4));
}

/**
 * @param {{ nodes?: object[], edges?: object[] }} graph
 * @param {number} [now]
 */
export function buildEpistemicGraphLifecyclePlanV0(graph = {}, now = Date.now()) {
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];

  const expiredNodeIds = new Set(
    nodes.filter((n) => isNodeExpiredForLifecycleV0(n, now)).map((n) => n.nodeId)
  );

  const decayedEdges = edges
    .map((edge) =>
      Object.freeze({
        edgeId: edge.edgeId,
        weight: computeEdgeDecayWeightV0(edge, now),
        prune: computeEdgeDecayWeightV0(edge, now) < EDGE_DECAY_WEIGHT_FLOOR_V0
      })
    )
    .filter((e) => e.prune);

  const prunedEdgeIds = new Set(decayedEdges.map((e) => e.edgeId));

  const orphanEdgeIds = new Set(
    edges
      .filter((e) => expiredNodeIds.has(e.fromNodeId) || expiredNodeIds.has(e.toNodeId))
      .map((e) => e.edgeId)
  );

  return Object.freeze({
    schema: EPISTEMIC_GRAPH_LIFECYCLE_SCHEMA_V0,
    atMs: now,
    expiredNodeIds: Object.freeze([...expiredNodeIds]),
    prunedEdgeIds: Object.freeze([...new Set([...prunedEdgeIds, ...orphanEdgeIds])]),
    expiredNodeCount: expiredNodeIds.size,
    prunedEdgeCount: prunedEdgeIds.size + orphanEdgeIds.size,
    edgeDecayFloor: EDGE_DECAY_WEIGHT_FLOOR_V0
  });
}

/** @type {object|null} */
let lastLifecyclePassV0 = null;

export function getLastEpistemicGraphLifecyclePassV0() {
  return lastLifecyclePassV0;
}

export function recordEpistemicGraphLifecyclePassV0(plan) {
  lastLifecyclePassV0 = plan ? Object.freeze({ ...plan }) : null;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.graphLifecycle = lastLifecyclePassV0;
  }
  return lastLifecyclePassV0;
}

/** @internal vitest */
export function __resetEpistemicGraphLifecycleForTestV0() {
  lastLifecyclePassV0 = null;
  if (typeof window !== "undefined") {
    delete window.__rhizoh?.graphLifecycle;
  }
}
