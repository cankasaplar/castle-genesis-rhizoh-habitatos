/**
 * Causal Graph → Spatial Bridge v0
 * Every causal node MUST produce a spatial vector projection (graph→space reconnect).
 * RESEARCH-ONLY — observation registry; does not grant execution authority.
 */

import { RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainCoreStoreV0.js";
import { SPATIAL_NODE_TIER_V0, listSpatialNodesV0 } from "./rhizohSpatialNodeLayerV0.js";
import { emitSpatialEventFromDomainV0 } from "./rhizohSpatialEventEmitterV0.js";
import { normalizeSpatialVectorV0 } from "./worldSpaceReattachmentV0.js";
import { getTruthTraceLogV0 } from "./rhizohTruthTraceLayerV0.js";
import {
  validateSpatialProjectionCandidateV0,
  SPATIAL_TRUTH_VERDICT_V0
} from "./spatialTruthValidatorV0.js";

export const CAUSAL_GRAPH_SPATIAL_BRIDGE_SCHEMA_V0 = "castle.rhizoh.causal_graph_spatial_bridge.v0";

/** @type {Set<string>} */
const projectedCausalNodeIdsV0 = new Set();

/**
 * Shannon-style entropy proxy from node/edge distribution (0..1).
 * @param {object} causalMap
 */
export function computeCausalMapEntropyV0(causalMap) {
  const nodes = Array.isArray(causalMap?.nodes) ? causalMap.nodes : [];
  const edges = Array.isArray(causalMap?.edges) ? causalMap.edges : [];
  if (nodes.length === 0) return 0;

  const kindCounts = new Map();
  for (const n of nodes) {
    const k = String(n.kind || "unknown");
    kindCounts.set(k, (kindCounts.get(k) || 0) + 1);
  }

  let entropy = 0;
  for (const count of kindCounts.values()) {
    const p = count / nodes.length;
    if (p > 0) entropy -= p * Math.log2(p);
  }

  const edgeDensity = edges.length / Math.max(1, nodes.length);
  const normalized = Math.min(1, entropy / 3 + edgeDensity * 0.08);
  return Number(normalized.toFixed(4));
}

/**
 * @returns {{ lat: number, lon: number } | null}
 */
function readWorldAnchorV0() {
  if (typeof window === "undefined") return null;
  const geo = window.__CASTLE_NEXUS_GEO__;
  const lat = Number(geo?.lat);
  const lon = Number(geo?.lon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return Object.freeze({ lat, lon });
  }
  return Object.freeze({ lat: 41.045, lon: 29.006 });
}

/**
 * @param {object} causalNode
 * @param {{ lat: number, lon: number }} anchor
 */
function spatialNodeIdForCausalV0(causalNode, anchor) {
  const base = String(causalNode.id || causalNode.label || "causal").slice(0, 64);
  return `causal_${base.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

/**
 * Project causal map nodes into spatial registry (OBSERVER domain — bypasses WORLD gate).
 * @param {object} [causalMap]
 * @param {{ force?: boolean }} [opts]
 */
export function projectCausalNodesToSpatialV0(causalMap, opts = {}) {
  const map = causalMap || (typeof window !== "undefined" ? window.__rhizoh?.causalMap : null);
  const nodes = Array.isArray(map?.nodes) ? map.nodes : [];
  if (!nodes.length) {
    return Object.freeze({ ok: true, projected: 0, skipped: 0, reason: "empty_causal_map" });
  }

  const anchor = readWorldAnchorV0();
  const existingIds = new Set(listSpatialNodesV0().map((n) => n.id));
  let projected = 0;
  let skipped = 0;
  let quarantined = 0;
  let optimistic = 0;

  for (const causalNode of nodes) {
    const causalId = String(causalNode.id || "");
    if (!causalId) continue;
    if (!opts.force && projectedCausalNodeIdsV0.has(causalId)) {
      skipped += 1;
      continue;
    }

    const nodeId = spatialNodeIdForCausalV0(causalNode, anchor);
    if (existingIds.has(nodeId) && !opts.force) {
      projectedCausalNodeIdsV0.add(causalId);
      skipped += 1;
      continue;
    }

    const vector = normalizeSpatialVectorV0(anchor, {
      dtMs: Date.now() - (Number(causalNode.atMs) || Date.now()),
      seq: projected
    });

    const validation = validateSpatialProjectionCandidateV0({
      causalNode,
      causalNodeId: causalId,
      spatialVector: vector.ok ? vector.spatial_vector : null,
      atMs: Number(causalNode.atMs) || Date.now(),
      force: opts.force === true,
      causalMap: map
    });

    if (!validation.allowWrite) {
      if (validation.verdict === SPATIAL_TRUTH_VERDICT_V0.QUARANTINE) quarantined += 1;
      else skipped += 1;
      continue;
    }
    if (validation.verdict === SPATIAL_TRUTH_VERDICT_V0.OPTIMISTIC_PASS) optimistic += 1;

    const result = emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, {
      tier: SPATIAL_NODE_TIER_V0.TEMPORAL,
      nodeId,
      kind: "causal_projection",
      trigger: "graph_to_space_bridge",
      payload: {
        causalNodeId: causalId,
        causalKind: causalNode.kind,
        label: causalNode.label,
        spatial_vector: vector.ok ? vector.spatial_vector : null,
        atMs: Number(causalNode.atMs) || Date.now(),
        truthValidation: Object.freeze({
          verdict: validation.verdict,
          confidence: validation.confidence,
          issues: validation.issues
        })
      }
    });

    if (result.ok) {
      projectedCausalNodeIdsV0.add(causalId);
      existingIds.add(nodeId);
      projected += 1;
    } else {
      skipped += 1;
    }
  }

  const snap = Object.freeze({
    schema: CAUSAL_GRAPH_SPATIAL_BRIDGE_SCHEMA_V0,
    atMs: Date.now(),
    influencesExecution: false,
    causalNodeCount: nodes.length,
    projected,
    skipped,
    quarantined,
    optimistic,
    spatialNodeCount: listSpatialNodesV0().length,
    entropy: computeCausalMapEntropyV0(map)
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.causalGraphSpatialBridge = snap;
  }

  return snap;
}

/**
 * Detect orphan graph: causal nodes exist but spatial registry empty.
 */
export function detectOrphanCausalGraphV0() {
  const causalCount =
    typeof window !== "undefined" && window.__rhizoh?.causalMap?.nodeCount != null
      ? Number(window.__rhizoh.causalMap.nodeCount)
      : 0;
  const spatialCount = listSpatialNodesV0().length;
  const orphan = causalCount > 0 && spatialCount === 0;
  return Object.freeze({
    orphan,
    causalNodeCount: causalCount,
    spatialNodeCount: spatialCount,
    issue: orphan ? "logically_consistent_physically_unbound" : null
  });
}

/**
 * Bootstrap internal semantic mass from causal entropy + truth trace when mass is zero.
 * @param {{ causalMap?: object, currentMass?: number }} [opts]
 */
export function bootstrapInternalSemanticMassV0(opts = {}) {
  const map = opts.causalMap || (typeof window !== "undefined" ? window.__rhizoh?.causalMap : null);
  const current = Number(opts.currentMass ?? 0);
  if (current > 0) {
    return Object.freeze({
      mass: current,
      bootstrapped: false,
      source: "existing"
    });
  }

  const entropy = computeCausalMapEntropyV0(map);
  const traceCount = getTruthTraceLogV0().length;
  const traceBoost = Math.min(0.4, traceCount * 0.04);
  const mass = Number(Math.min(2.5, entropy * 1.2 + traceBoost).toFixed(3));

  return Object.freeze({
    mass,
    bootstrapped: mass > 0,
    source: "causal_entropy_truth_trace",
    entropy,
    traceCount
  });
}

/** @internal vitest */
export function __resetCausalGraphSpatialBridgeForTestV0() {
  projectedCausalNodeIdsV0.clear();
}
