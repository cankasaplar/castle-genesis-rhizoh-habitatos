/**
 * Causal Graph Compression v0 — pruning + clustering against graph complexity explosion.
 * Prevents temporal/causal/replay edge growth from overwhelming observability.
 * Read-only — never influences execution.
 */

import { TRUTH_TRACE_KIND_V0 } from "./rhizohTruthTraceLayerV0.js";
import { CAUSAL_EDGE_RELATION_V0 } from "./rhizohCausalMapLayerV0.js";

export const RHIZOH_CAUSAL_GRAPH_COMPRESSION_SCHEMA_V0 = "rhizoh.causal_graph_compression.v0";

export const CAUSAL_COMPRESSION_POLICY_V0 = Object.freeze({
  maxNodes: 32,
  maxEdges: 48,
  maxTemporalTrailMembersPerCluster: 12,
  collapseReplayBranches: true,
  pruneStaleMs: 30 * 60 * 1000,
  keepCriticalPath: true
});

const CRITICAL_KINDS_V0 = new Set([
  TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION,
  TRUTH_TRACE_KIND_V0.TENSOR_DECISION,
  TRUTH_TRACE_KIND_V0.SPATIAL_NODE,
  TRUTH_TRACE_KIND_V0.CONTROL_PLANE,
  TRUTH_TRACE_KIND_V0.FALLBACK
]);

const COMPRESSIBLE_KINDS_V0 = new Set(["temporal_trail", TRUTH_TRACE_KIND_V0.TENSOR_REPLAY]);

/**
 * @param {object} node
 */
function nodePriorityV0(node) {
  if (CRITICAL_KINDS_V0.has(node.kind)) return 3;
  if (node.kind === "spatial_origin") return 2;
  if (COMPRESSIBLE_KINDS_V0.has(node.kind)) return 0;
  return 1;
}

/**
 * @param {object[]} nodes
 */
/**
 * @param {object} node
 */
function tensorIntentKeyV0(node) {
  const intent =
    node.intent ||
    String(node.label || "")
      .split(" → ")[0]
      ?.trim();
  return intent ? `${node.domain || "?"}:${intent}` : null;
}

/**
 * @param {object} node
 */
function replayIntentKeyV0(node) {
  const m = String(node.label || "").match(/^replay:(.+)$/);
  return m ? `${node.domain || "?"}:${m[1].trim()}` : tensorIntentKeyV0(node);
}

function collapseReplayBranchesV0(nodes) {
  if (!CAUSAL_COMPRESSION_POLICY_V0.collapseReplayBranches) return { nodes, dropped: 0 };
  const tensorKeys = new Set(
    nodes
      .filter((n) => n.kind === TRUTH_TRACE_KIND_V0.TENSOR_DECISION)
      .map(tensorIntentKeyV0)
      .filter(Boolean)
  );
  const kept = [];
  let dropped = 0;
  for (const n of nodes) {
    if (n.kind === TRUTH_TRACE_KIND_V0.TENSOR_REPLAY) {
      const key = replayIntentKeyV0(n);
      if (key && tensorKeys.has(key)) {
        dropped += 1;
        continue;
      }
    }
    kept.push(n);
  }
  return { nodes: kept, dropped };
}

/**
 * Cluster temporal_trail nodes by domain+kind label prefix.
 * @param {object[]} nodes
 */
function clusterTemporalTrailsV0(nodes) {
  /** @type {Map<string, object[]>} */
  const buckets = new Map();
  const kept = [];

  for (const n of nodes) {
    if (n.kind !== "temporal_trail") {
      kept.push(n);
      continue;
    }
    const key = `${n.domain || "?"}:${String(n.label || "").split(":")[0]}`;
    const arr = buckets.get(key) || [];
    arr.push(n);
    buckets.set(key, arr);
  }

  let clustered = 0;
  for (const [key, members] of buckets) {
    if (members.length <= 2) {
      kept.push(...members);
      continue;
    }
    const sorted = [...members].sort((a, b) => (b.atMs || 0) - (a.atMs || 0));
    const head = sorted.slice(0, 2);
    const tail = sorted.slice(2);
    kept.push(...head);
    if (tail.length) {
      const [domain, kindPrefix] = key.split(":");
      kept.push(
        Object.freeze({
          id: `cluster_trail_${key}_${sorted[0]?.atMs || Date.now()}`,
          kind: "temporal_trail_cluster",
          atMs: sorted[0]?.atMs || Date.now(),
          domain,
          label: `${kindPrefix}:* (${tail.length} compressed)`,
          source: "compression",
          compressed: true,
          memberCount: tail.length,
          memberIds: Object.freeze(tail.map((m) => m.id).slice(0, CAUSAL_COMPRESSION_POLICY_V0.maxTemporalTrailMembersPerCluster))
        })
      );
      clustered += tail.length;
    }
  }

  return { nodes: kept, clustered };
}

/**
 * @param {object[]} nodes
 * @param {number} max
 */
function pruneByPriorityAndRecencyV0(nodes, max) {
  if (nodes.length <= max) return { nodes, pruned: 0 };
  const now = Date.now();
  const staleBefore = now - CAUSAL_COMPRESSION_POLICY_V0.pruneStaleMs;

  const scored = nodes.map((n) => {
    let score = nodePriorityV0(n) * 1000;
    if (n.atMs && n.atMs >= staleBefore) score += 200;
    if (n.compressed) score += 50;
    return { n, score };
  });

  scored.sort((a, b) => b.score - a.score || (b.n.atMs || 0) - (a.n.atMs || 0));
  const kept = scored.slice(0, max).map((s) => s.n);
  return { nodes: kept, pruned: nodes.length - kept.length };
}

/**
 * @param {object[]} edges
 * @param {Set<string>} keptNodeIds
 */
function pruneOrphanEdgesV0(edges, keptNodeIds) {
  const seen = new Set();
  const kept = [];
  for (const e of edges) {
    if (!keptNodeIds.has(e.from) || !keptNodeIds.has(e.to)) continue;
    const sig = `${e.from}|${e.to}|${e.relation}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    kept.push(e);
  }
  return kept;
}

/**
 * @param {object[]} edges
 * @param {number} max
 */
function capEdgesV0(edges, max) {
  if (edges.length <= max) return { edges, pruned: 0 };
  const priority = (e) => {
    if (e.relation === CAUSAL_EDGE_RELATION_V0.ENABLES) return 4;
    if (e.relation === CAUSAL_EDGE_RELATION_V0.PROJECTS_TO) return 4;
    if (e.relation === CAUSAL_EDGE_RELATION_V0.CAUSES) return 3;
    if (e.relation === CAUSAL_EDGE_RELATION_V0.EXPLAINS) return 2;
    if (e.relation === CAUSAL_EDGE_RELATION_V0.TRAILS) return 1;
    return 0;
  };
  const sorted = [...edges].sort((a, b) => priority(b) - priority(a));
  return { edges: sorted.slice(0, max), pruned: edges.length - Math.min(max, edges.length) };
}

/**
 * Compress raw causal graph — pruning + clustering + dedupe.
 * @param {{ nodes: object[], edges: object[], nodeCount?: number, edgeCount?: number, [key: string]: unknown }} raw
 * @param {{ maxNodes?: number, maxEdges?: number }} [opts]
 */
export function compressCausalGraphV0(raw, opts = {}) {
  const maxNodes = opts.maxNodes ?? CAUSAL_COMPRESSION_POLICY_V0.maxNodes;
  const maxEdges = opts.maxEdges ?? CAUSAL_COMPRESSION_POLICY_V0.maxEdges;
  const inputNodes = Array.isArray(raw?.nodes) ? [...raw.nodes] : [];
  const inputEdges = Array.isArray(raw?.edges) ? [...raw.edges] : [];

  const replay = collapseReplayBranchesV0(inputNodes);
  const trail = clusterTemporalTrailsV0(replay.nodes);
  const nodePrune = pruneByPriorityAndRecencyV0(trail.nodes, maxNodes);

  const keptIds = new Set(nodePrune.nodes.map((n) => n.id));
  let edges = pruneOrphanEdgesV0(inputEdges, keptIds);
  const edgeCap = capEdgesV0(edges, maxEdges);
  edges = edgeCap.edges;

  const stats = Object.freeze({
    inputNodes: inputNodes.length,
    inputEdges: inputEdges.length,
    outputNodes: nodePrune.nodes.length,
    outputEdges: edges.length,
    replayBranchesDropped: replay.dropped,
    temporalTrailClustered: trail.clustered,
    nodesPruned: nodePrune.pruned,
    edgesPruned: edgeCap.pruned + (inputEdges.length - pruneOrphanEdgesV0(inputEdges, keptIds).length),
    compressionRatio:
      inputNodes.length + inputEdges.length > 0
        ? Math.round(
            ((1 - (nodePrune.nodes.length + edges.length) / (inputNodes.length + inputEdges.length)) * 1000)
          ) / 1000
        : 0
  });

  return Object.freeze({
    schema: RHIZOH_CAUSAL_GRAPH_COMPRESSION_SCHEMA_V0,
    evaluatedAtMs: Date.now(),
    influencesExecution: false,
    policy: CAUSAL_COMPRESSION_POLICY_V0,
    stats,
    nodes: Object.freeze(nodePrune.nodes),
    edges: Object.freeze(edges),
    selfNarrative: [
      `Compressed causal graph: ${stats.inputNodes}→${stats.outputNodes} nodes, ${stats.inputEdges}→${stats.outputEdges} edges.`,
      stats.replayBranchesDropped
        ? `Collapsed ${stats.replayBranchesDropped} duplicate replay branch(es).`
        : null,
      stats.temporalTrailClustered
        ? `Clustered ${stats.temporalTrailClustered} temporal trail marker(s).`
        : null,
      "Graph complexity bounded — observability without explosion."
    ]
      .filter(Boolean)
      .join(" ")
  });
}

export function publishCausalGraphCompressionV0(rawGraph) {
  const compressed = compressCausalGraphV0(rawGraph);
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.causalMapCompressed = compressed;
    window.__rhizoh.compressCausalGraphV0 = compressCausalGraphV0;
  }
  return compressed;
}
