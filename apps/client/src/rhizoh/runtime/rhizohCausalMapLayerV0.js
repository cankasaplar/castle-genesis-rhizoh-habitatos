/**
 * Causal Map Layer v0 — TEMPORAL trail → cause-effect graph (read-only).
 * Answers: "why did this spatial projection happen?"
 */

import {
  getTruthTraceLogV0,
  TRUTH_TRACE_KIND_V0
} from "./rhizohTruthTraceLayerV0.js";
import { getSpatialOriginLogV0 } from "./rhizohExplanationLayerV0.js";
import { getSpatialTemporalTrailSnapshotV0 } from "./rhizohSpatialTemporalTrailV0.js";
import { listSpatialNodesV0, SPATIAL_NODE_TIER_V0 } from "./rhizohSpatialNodeLayerV0.js";
import {
  compressCausalGraphV0,
  publishCausalGraphCompressionV0
} from "./rhizohCausalGraphCompressionV0.js";
import { publishTruthLossDetectorV2 } from "./rhizohTruthLossDetectorV2.js";

export const RHIZOH_CAUSAL_MAP_SCHEMA_V0 = "rhizoh.causal_map_layer.v0";

export const CAUSAL_EDGE_RELATION_V0 = Object.freeze({
  ENABLES: "enables",
  CAUSES: "causes",
  PROJECTS_TO: "projects_to",
  TRAILS: "trails",
  EXPLAINS: "explains"
});

/**
 * @param {object} entry
 */
function nodeFromTraceV0(entry) {
  const id = String(entry.traceId || `n_${entry.atMs}_${entry.kind}`);
  return Object.freeze({
    id,
    kind: entry.kind,
    atMs: entry.atMs,
    domain: entry.domain ?? entry.sourceDomain ?? null,
    label: causalLabelForTraceV0(entry),
    source: "truth_trace"
  });
}

/**
 * @param {object} entry
 */
function causalLabelForTraceV0(entry) {
  const k = entry.kind;
  if (k === TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION) {
    return `${entry.prevDomain || "?"} → ${entry.domain || "?"}`;
  }
  if (k === TRUTH_TRACE_KIND_V0.TENSOR_DECISION) {
    return `${entry.intent || "intent"} → ${entry.tensorAction?.action || entry.blocked ? "blocked" : "action"}`;
  }
  if (k === TRUTH_TRACE_KIND_V0.SPATIAL_NODE) {
    return `${entry.tier}:${entry.nodeId}`;
  }
  if (k === TRUTH_TRACE_KIND_V0.TENSOR_REPLAY) {
    return `replay:${entry.intent}`;
  }
  if (k === TRUTH_TRACE_KIND_V0.CODEX_GHOST) {
    const id = entry.ghostId || "?";
    return `${entry.phase || "spawn"}:${id}`;
  }
  if (k === TRUTH_TRACE_KIND_V0.RUNTIME_SUBSTRATE) {
    return `${entry.subtype || entry.source || "event"}`;
  }
  return k;
}

/**
 * @param {object[]} traces
 */
function linkTraceChainV0(traces) {
  /** @type {object[]} */
  const nodes = [];
  /** @type {object[]} */
  const edges = [];
  const nodeById = new Map();

  let lastDomainId = null;
  let lastTensorId = null;
  /** @type {Map<string, string>} ghostId → spawn trace node id */
  const ghostSpawnNodeById = new Map();
  let lastRuntimeSubstrateId = null;

  for (const t of traces) {
    const node = nodeFromTraceV0(t);
    nodes.push(node);
    nodeById.set(node.id, node);

    if (t.kind === TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION && lastDomainId) {
      edges.push(
        Object.freeze({
          from: lastDomainId,
          to: node.id,
          relation: CAUSAL_EDGE_RELATION_V0.CAUSES,
          note: "domain_sequence"
        })
      );
    }
    if (t.kind === TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION) {
      lastDomainId = node.id;
      lastTensorId = null;
    }

    if (t.kind === TRUTH_TRACE_KIND_V0.TENSOR_DECISION) {
      if (lastDomainId) {
        edges.push(
          Object.freeze({
            from: lastDomainId,
            to: node.id,
            relation: CAUSAL_EDGE_RELATION_V0.ENABLES,
            note: "domain_enabled_tensor"
          })
        );
      }
      lastTensorId = node.id;
    }

    if (t.kind === TRUTH_TRACE_KIND_V0.SPATIAL_NODE && lastTensorId) {
      edges.push(
        Object.freeze({
          from: lastTensorId,
          to: node.id,
          relation: CAUSAL_EDGE_RELATION_V0.PROJECTS_TO,
          note: "tensor_to_spatial"
        })
      );
    }

    if (t.kind === TRUTH_TRACE_KIND_V0.CODEX_GHOST) {
      const ghostId = String(t.ghostId || "").trim();
      const phase = String(t.phase || "spawn");
      if (phase === "spawn" && ghostId) {
        ghostSpawnNodeById.set(ghostId, node.id);
        if (lastTensorId) {
          edges.push(
            Object.freeze({
              from: lastTensorId,
              to: node.id,
              relation: CAUSAL_EDGE_RELATION_V0.ENABLES,
              note: "tensor_to_codex_ghost_spawn"
            })
          );
        } else if (lastDomainId) {
          edges.push(
            Object.freeze({
              from: lastDomainId,
              to: node.id,
              relation: CAUSAL_EDGE_RELATION_V0.ENABLES,
              note: "domain_to_codex_ghost_spawn"
            })
          );
        }
      }
      if (phase === "death" && ghostId) {
        const spawnId = ghostSpawnNodeById.get(ghostId);
        if (spawnId) {
          edges.push(
            Object.freeze({
              from: spawnId,
              to: node.id,
              relation: CAUSAL_EDGE_RELATION_V0.CAUSES,
              note: "ghost_lifecycle_spawn_to_death"
            })
          );
        }
      }
    }

    if (t.kind === TRUTH_TRACE_KIND_V0.RUNTIME_SUBSTRATE) {
      if (lastRuntimeSubstrateId) {
        edges.push(
          Object.freeze({
            from: lastRuntimeSubstrateId,
            to: node.id,
            relation: CAUSAL_EDGE_RELATION_V0.CAUSES,
            note: "runtime_substrate_sequence"
          })
        );
      } else if (lastDomainId) {
        edges.push(
          Object.freeze({
            from: lastDomainId,
            to: node.id,
            relation: CAUSAL_EDGE_RELATION_V0.ENABLES,
            note: "domain_to_runtime_substrate"
          })
        );
      }
      lastRuntimeSubstrateId = node.id;
    }
  }

  return { nodes, edges, nodeById };
}

/**
 * Build full (uncompressed) causal graph — internal / debug.
 */
export function buildCausalMapLayerRawV0() {
  const traces = getTruthTraceLogV0();
  const { nodes, edges, nodeById } = linkTraceChainV0(traces);

  const trail = getSpatialTemporalTrailSnapshotV0();
  for (const row of trail.recent || []) {
    const id = `trail_${row.atMs}_${row.nodeId}`;
    const node = Object.freeze({
      id,
      kind: "temporal_trail",
      atMs: row.atMs,
      domain: row.domain,
      label: `${row.kind}:${row.nodeId}`,
      source: "temporal_trail"
    });
    nodes.push(node);
    nodeById.set(id, node);

    const spatialMatch = [...nodeById.values()].find(
      (n) => n.kind === TRUTH_TRACE_KIND_V0.SPATIAL_NODE && n.label?.includes(row.nodeId)
    );
    if (spatialMatch) {
      edges.push(
        Object.freeze({
          from: spatialMatch.id,
          to: id,
          relation: CAUSAL_EDGE_RELATION_V0.TRAILS,
          note: "spatial_history_marker"
        })
      );
    }
  }

  for (const origin of getSpatialOriginLogV0().slice(-16)) {
    const id = `origin_${origin.id || origin.atMs}`;
    const node = Object.freeze({
      id,
      kind: "spatial_origin",
      atMs: origin.atMs,
      domain: origin.domain,
      label: origin.action || "spatial_emit",
      source: "explanation"
    });
    nodes.push(node);
    const spatialAnchor = [...nodeById.values()]
      .reverse()
      .find((n) => n.domain === origin.domain && n.kind === TRUTH_TRACE_KIND_V0.SPATIAL_NODE);
    if (spatialAnchor) {
      edges.push(
        Object.freeze({
          from: spatialAnchor.id,
          to: id,
          relation: CAUSAL_EDGE_RELATION_V0.EXPLAINS,
          note: (origin.originChain || []).join(" → ")
        })
      );
    }
  }

  const temporalCount = listSpatialNodesV0(SPATIAL_NODE_TIER_V0.TEMPORAL).length;

  return Object.freeze({
    schema: RHIZOH_CAUSAL_MAP_SCHEMA_V0,
    evaluatedAtMs: Date.now(),
    influencesExecution: false,
    compressed: false,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    temporalNodeCount: temporalCount,
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    selfNarrative: buildCausalSelfNarrativeV0(nodes, edges)
  });
}

/**
 * Production causal map — always compressed to prevent graph explosion.
 */
export function buildCausalMapLayerV0(opts = {}) {
  const raw = buildCausalMapLayerRawV0();
  const compressed = compressCausalGraphV0(raw);
  const truthLoss = publishTruthLossDetectorV2(raw, compressed, {
    probeIsolated: opts.probeIsolated === true
  });
  return Object.freeze({
    ...raw,
    compressed: true,
    nodeCount: compressed.stats.outputNodes,
    edgeCount: compressed.stats.outputEdges,
    nodes: compressed.nodes,
    edges: compressed.edges,
    compression: compressed.stats,
    compressionContext: compressed.compressionContext,
    semanticBudget: compressed.semanticBudget,
    truthLoss,
    causalMapRaw: raw,
    auditGraph: Object.freeze({
      normalized: true,
      source: "compressed_with_metadata",
      structuralPass: truthLoss.structuralPass
    }),
    selfNarrative: [compressed.selfNarrative, truthLoss.selfExplanation].filter(Boolean).join(" ")
  });
}

/**
 * @param {object[]} nodes
 * @param {object[]} edges
 */
function buildCausalSelfNarrativeV0(nodes, edges) {
  if (!nodes.length) {
    return "No causal chain yet — gate transitions and spatial events will populate the graph.";
  }
  const domains = nodes.filter((n) => n.kind === TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION);
  const tensors = nodes.filter((n) => n.kind === TRUTH_TRACE_KIND_V0.TENSOR_DECISION);
  const spatial = nodes.filter((n) => n.kind === TRUTH_TRACE_KIND_V0.SPATIAL_NODE);
  const trails = nodes.filter((n) => n.kind === "temporal_trail");
  const ghosts = nodes.filter((n) => n.kind === TRUTH_TRACE_KIND_V0.CODEX_GHOST);
  const substrate = nodes.filter((n) => n.kind === TRUTH_TRACE_KIND_V0.RUNTIME_SUBSTRATE);
  return [
    `Causal graph: ${nodes.length} nodes, ${edges.length} edges.`,
    `Domain transitions: ${domains.length}, tensor decisions: ${tensors.length}, spatial projections: ${spatial.length}, temporal trails: ${trails.length}, codex ghosts: ${ghosts.length}, runtime substrate: ${substrate.length}.`,
    "System explains itself through trace — not through LLM inference."
  ].join(" ");
}

export function publishCausalMapLayerV0() {
  const map = buildCausalMapLayerV0();
  if (map.causalMapRaw) publishCausalGraphCompressionV0(map.causalMapRaw);
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.causalMap = map;
    window.__rhizoh.causalMapRaw = map.causalMapRaw;
    window.__rhizoh.buildCausalMapLayerV0 = buildCausalMapLayerV0;
    window.__rhizoh.buildCausalMapLayerRawV0 = buildCausalMapLayerRawV0;
  }
  return map;
}
