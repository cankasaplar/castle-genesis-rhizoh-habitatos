/**
 * Causal Graph Compression v0 — pruning + clustering against graph complexity explosion.
 * Prevents temporal/causal/replay edge growth from overwhelming observability.
 * Read-only — never influences execution.
 */

import { TRUTH_TRACE_KIND_V0 } from "./rhizohTruthTraceLayerV0.js";

/** Inline — avoid circular import with rhizohCausalMapLayerV0. */
const CAUSAL_EDGE_RELATION_V0 = Object.freeze({
  ENABLES: "enables",
  CAUSES: "causes",
  PROJECTS_TO: "projects_to",
  TRAILS: "trails",
  EXPLAINS: "explains"
});

export const RHIZOH_CAUSAL_GRAPH_COMPRESSION_SCHEMA_V0 = "rhizoh.causal_graph_compression.v0";

export const CAUSAL_COMPRESSION_POLICY_V0 = Object.freeze({
  maxNodes: 32,
  maxEdges: 48,
  maxTemporalTrailMembersPerCluster: 12,
  collapseReplayBranches: true,
  pruneStaleMs: 30 * 60 * 1000,
  keepCriticalPath: true,
  edgeWeightPruneThreshold: 2
});

/** B-axis: minimum causal density per domain (semantic preservation budget). */
export const SEMANTIC_PRESERVATION_BUDGET_V0 = Object.freeze({
  minDomainTransition: 1,
  minTensorWhenSpatial: 1,
  minSpineEdges: 1
});

const CRITICAL_KINDS_V0 = new Set([
  TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION,
  TRUTH_TRACE_KIND_V0.TENSOR_DECISION,
  TRUTH_TRACE_KIND_V0.SPATIAL_NODE,
  TRUTH_TRACE_KIND_V0.CONTROL_PLANE,
  TRUTH_TRACE_KIND_V0.FALLBACK
]);

const COMPRESSIBLE_KINDS_V0 = new Set(["temporal_trail", TRUTH_TRACE_KIND_V0.TENSOR_REPLAY]);

const SPINE_EDGE_RELATIONS_V0 = new Set([
  CAUSAL_EDGE_RELATION_V0.ENABLES,
  CAUSAL_EDGE_RELATION_V0.PROJECTS_TO,
  CAUSAL_EDGE_RELATION_V0.CAUSES
]);

const SPINE_NODE_KINDS_V0 = new Set([
  TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION,
  TRUTH_TRACE_KIND_V0.TENSOR_DECISION,
  TRUTH_TRACE_KIND_V0.SPATIAL_NODE
]);

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
 * A-rule: domain → tensor → spatial spine nodes never collapse.
 * @param {object[]} nodes
 * @param {object[]} edges
 */
function resolveSemanticSpineV0(nodes, edges) {
  const spineNodeIds = new Set();
  const spineEdgeSigs = new Set();

  for (const n of nodes) {
    if (SPINE_NODE_KINDS_V0.has(n.kind)) spineNodeIds.add(n.id);
  }
  for (const e of edges) {
    if (!SPINE_EDGE_RELATIONS_V0.has(e.relation)) continue;
    const sig = `${e.from}|${e.to}|${e.relation}`;
    spineEdgeSigs.add(sig);
    spineNodeIds.add(e.from);
    spineNodeIds.add(e.to);
  }
  return { spineNodeIds, spineEdgeSigs };
}

/**
 * @param {object} edge
 * @param {Map<string, object>} nodeById
 * @param {number} now
 */
function edgeWeightV0(edge, nodeById, now) {
  const relationScore =
    edge.relation === CAUSAL_EDGE_RELATION_V0.ENABLES
      ? 40
      : edge.relation === CAUSAL_EDGE_RELATION_V0.PROJECTS_TO
        ? 40
        : edge.relation === CAUSAL_EDGE_RELATION_V0.CAUSES
          ? 30
          : edge.relation === CAUSAL_EDGE_RELATION_V0.EXPLAINS
            ? 15
            : edge.relation === CAUSAL_EDGE_RELATION_V0.TRAILS
              ? 8
              : 2;

  const from = nodeById.get(edge.from);
  const to = nodeById.get(edge.to);
  const recencyMs = Math.max(from?.atMs || 0, to?.atMs || 0, edge.atMs || 0);
  const recency =
    recencyMs > 0 ? Math.min(20, Math.round((recencyMs / Math.max(now, 1)) * 10)) : 0;
  const frequency = Number(edge.frequency || edge.hitCount || 1);
  const causalDependency =
    SPINE_EDGE_RELATIONS_V0.has(edge.relation) &&
    (SPINE_NODE_KINDS_V0.has(from?.kind) || SPINE_NODE_KINDS_V0.has(to?.kind))
      ? 50
      : 0;

  return relationScore + recency + frequency + causalDependency;
}

/**
 * @param {object[]} nodes
 * @param {object[]} edges
 */
function ensureSemanticBudgetV0(nodes, edges, rawNodes) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const domains = new Set(nodes.map((n) => n.domain).filter(Boolean));
  const restored = [...nodes];
  const restoredIds = new Set(nodes.map((n) => n.id));
  let budgetRestored = 0;

  for (const domain of domains) {
    const inDomain = restored.filter((n) => n.domain === domain);
    const hasSpatial = inDomain.some((n) => n.kind === TRUTH_TRACE_KIND_V0.SPATIAL_NODE);
    const domainTransitions = inDomain.filter(
      (n) => n.kind === TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION
    ).length;
    const tensors = inDomain.filter((n) => n.kind === TRUTH_TRACE_KIND_V0.TENSOR_DECISION).length;

    if (domainTransitions < SEMANTIC_PRESERVATION_BUDGET_V0.minDomainTransition) {
      const candidate = rawNodes.find(
        (n) => n.domain === domain && n.kind === TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION
      );
      if (candidate && !restoredIds.has(candidate.id)) {
        restored.push(candidate);
        restoredIds.add(candidate.id);
        nodeById.set(candidate.id, candidate);
        budgetRestored += 1;
      }
    }
    if (
      hasSpatial &&
      tensors < SEMANTIC_PRESERVATION_BUDGET_V0.minTensorWhenSpatial
    ) {
      const candidate = rawNodes.find(
        (n) => n.domain === domain && n.kind === TRUTH_TRACE_KIND_V0.TENSOR_DECISION
      );
      if (candidate && !restoredIds.has(candidate.id)) {
        restored.push(candidate);
        restoredIds.add(candidate.id);
        nodeById.set(candidate.id, candidate);
        budgetRestored += 1;
      }
    }
  }

  const spineEdges = edges.filter((e) => SPINE_EDGE_RELATIONS_V0.has(e.relation));
  return {
    nodes: restored,
    edges,
    spineEdgeCount: spineEdges.length,
    budgetRestored
  };
}

/**
 * @param {object[]} nodes
 * @param {number} max
 * @param {Set<string>} spineNodeIds
 */
function pruneByPriorityAndRecencyV0(nodes, max, spineNodeIds = new Set()) {
  if (nodes.length <= max) return { nodes, pruned: 0 };
  const now = Date.now();
  const staleBefore = now - CAUSAL_COMPRESSION_POLICY_V0.pruneStaleMs;

  const spine = nodes.filter((n) => spineNodeIds.has(n.id));
  const rest = nodes.filter((n) => !spineNodeIds.has(n.id));
  const restBudget = Math.max(0, max - spine.length);

  const scored = rest.map((n) => {
    let score = nodePriorityV0(n) * 1000;
    if (n.atMs && n.atMs >= staleBefore) score += 200;
    if (n.compressed) score += 50;
    return { n, score };
  });

  scored.sort((a, b) => b.score - a.score || (b.n.atMs || 0) - (a.n.atMs || 0));
  const keptRest = scored.slice(0, restBudget).map((s) => s.n);
  const kept = [...spine, ...keptRest];
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
 * B-rule: weight-based prune forbidden when path connectivity would break.
 * @param {object[]} edges
 * @param {number} max
 * @param {Set<string>} spineEdgeSigs
 * @param {Map<string, object>} nodeById
 */
function capEdgesV0(edges, max, spineEdgeSigs = new Set(), nodeById = new Map()) {
  if (edges.length <= max) return { edges, pruned: 0 };
  const now = Date.now();
  const threshold = CAUSAL_COMPRESSION_POLICY_V0.edgeWeightPruneThreshold;

  const spine = [];
  const rest = [];
  for (const e of edges) {
    const sig = `${e.from}|${e.to}|${e.relation}`;
    if (spineEdgeSigs.has(sig) || SPINE_EDGE_RELATIONS_V0.has(e.relation)) {
      spine.push(Object.freeze({ ...e, weight: edgeWeightV0(e, nodeById, now), spine: true }));
    } else {
      rest.push(Object.freeze({ ...e, weight: edgeWeightV0(e, nodeById, now), spine: false }));
    }
  }

  const sortedRest = [...rest].sort((a, b) => b.weight - a.weight);
  const keptRest = [];
  let pruned = 0;
  const restBudget = Math.max(0, max - spine.length);

  for (const e of sortedRest) {
    if (keptRest.length < restBudget && e.weight >= threshold) {
      keptRest.push(e);
    } else if (keptRest.length < restBudget) {
      keptRest.push(e);
    } else {
      pruned += 1;
    }
  }

  const kept = [...spine.slice(0, max), ...keptRest].slice(0, max);
  return {
    edges: kept.map(({ weight, spine: _s, ...e }) => Object.freeze(e)),
    pruned: edges.length - kept.length
  };
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

  const { spineNodeIds, spineEdgeSigs } = resolveSemanticSpineV0(inputNodes, inputEdges);

  const replay = collapseReplayBranchesV0(inputNodes);
  const trail = clusterTemporalTrailsV0(replay.nodes);
  const nodePrune = pruneByPriorityAndRecencyV0(trail.nodes, maxNodes, spineNodeIds);

  const budgetPass = ensureSemanticBudgetV0(nodePrune.nodes, inputEdges, inputNodes);
  const budgetNodes = budgetPass.nodes;

  const keptIds = new Set(budgetNodes.map((n) => n.id));
  const nodeById = new Map(budgetNodes.map((n) => [n.id, n]));
  let edges = pruneOrphanEdgesV0(inputEdges, keptIds);
  const edgeCap = capEdgesV0(edges, maxEdges, spineEdgeSigs, nodeById);
  edges = edgeCap.edges;

  const stats = Object.freeze({
    inputNodes: inputNodes.length,
    inputEdges: inputEdges.length,
    outputNodes: budgetNodes.length,
    outputEdges: edges.length,
    replayBranchesDropped: replay.dropped,
    temporalTrailClustered: trail.clustered,
    nodesPruned: nodePrune.pruned,
    semanticBudgetRestored: budgetPass.budgetRestored,
    spineNodeCount: spineNodeIds.size,
    spineEdgeCount: budgetPass.spineEdgeCount,
    edgesPruned: edgeCap.pruned + (inputEdges.length - pruneOrphanEdgesV0(inputEdges, keptIds).length),
    compressionRatio:
      inputNodes.length + inputEdges.length > 0
        ? Math.round(
            ((1 - (budgetNodes.length + edges.length) / (inputNodes.length + inputEdges.length)) * 1000)
          ) / 1000
        : 0
  });

  const compressionContext = Object.freeze({
    intentional: true,
    mode: "policy_bounded",
    structuralAxis: "node_edge_reduction",
    semanticAxis: "preservation_budget",
    skipTruthLossAsFailure: true,
    spineProtected: true
  });

  return Object.freeze({
    schema: RHIZOH_CAUSAL_GRAPH_COMPRESSION_SCHEMA_V0,
    evaluatedAtMs: Date.now(),
    influencesExecution: false,
    policy: CAUSAL_COMPRESSION_POLICY_V0,
    semanticBudget: SEMANTIC_PRESERVATION_BUDGET_V0,
    compressionContext,
    stats,
    nodes: Object.freeze(budgetNodes),
    edges: Object.freeze(edges),
    selfNarrative: [
      `Compressed causal graph: ${stats.inputNodes}→${stats.outputNodes} nodes, ${stats.inputEdges}→${stats.outputEdges} edges.`,
      stats.replayBranchesDropped
        ? `Collapsed ${stats.replayBranchesDropped} duplicate replay branch(es) — side branches only.`
        : null,
      stats.temporalTrailClustered
        ? `Clustered ${stats.temporalTrailClustered} temporal trail marker(s).`
        : null,
      stats.semanticBudgetRestored
        ? `Semantic budget restored ${stats.semanticBudgetRestored} spine node(s).`
        : null,
      "Spine protected: domain→tensor→spatial never collapsed."
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
