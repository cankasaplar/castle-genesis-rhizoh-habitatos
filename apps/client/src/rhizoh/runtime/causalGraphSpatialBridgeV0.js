/**
 * Causal Graph → Spatial Bridge v0
 * Every causal node MUST produce a spatial vector projection (graph→space reconnect).
 * RESEARCH-ONLY — observation registry; does not grant execution authority.
 */

import { RHIZOH_DOMAIN_ID_V0 } from "./rhizohDomainCoreStoreV0.js";
import { SPATIAL_NODE_TIER_V0, listSpatialNodesV0 } from "./rhizohSpatialNodeLayerV0.js";
import { emitSpatialEventFromDomainV0, stageSpatialProjectionV0 } from "./rhizohSpatialEventEmitterV0.js";
import { normalizeSpatialVectorV0 } from "./worldSpaceReattachmentV0.js";
import { getTruthTraceLogV0 } from "./rhizohTruthTraceLayerV0.js";
import {
  validateSpatialProjectionCandidateV0,
  SPATIAL_TRUTH_VERDICT_V0
} from "./spatialTruthValidatorV0.js";

export const CAUSAL_GRAPH_SPATIAL_BRIDGE_SCHEMA_V0 = "castle.rhizoh.causal_graph_spatial_bridge.v0";

/** @type {Set<string>} */
const projectedCausalNodeIdsV0 = new Set();

/** @type {Map<string, number>} */
const lastConsumedCausalAtMsV0 = new Map();

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
 * @param {object} causalNode
 * @param {object} map
 * @param {{ lat: number, lon: number }} anchor
 * @param {Set<string>} existingIds
 * @param {number} seq
 * @param {{ force?: boolean, stage?: boolean }} opts
 */
function projectSingleCausalNodeV0(causalNode, map, anchor, existingIds, seq, opts = {}) {
  const causalId = String(causalNode.id || "");
  if (!causalId) {
    return Object.freeze({ ok: false, reason: "missing_causal_id" });
  }
  if (!opts.force && projectedCausalNodeIdsV0.has(causalId)) {
    return Object.freeze({ ok: true, skipped: true, reason: "already_projected" });
  }

  const nodeId = spatialNodeIdForCausalV0(causalNode, anchor);
  if (existingIds.has(nodeId) && !opts.force) {
    projectedCausalNodeIdsV0.add(causalId);
    return Object.freeze({ ok: true, skipped: true, reason: "spatial_exists" });
  }

  const vector = normalizeSpatialVectorV0(anchor, {
    dtMs: Date.now() - (Number(causalNode.atMs) || Date.now()),
    seq
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
    return Object.freeze({
      ok: false,
      skipped: true,
      quarantined: validation.verdict === SPATIAL_TRUTH_VERDICT_V0.QUARANTINE,
      optimistic: validation.verdict === SPATIAL_TRUTH_VERDICT_V0.OPTIMISTIC_PASS,
      validation
    });
  }

  const event = {
    tier: SPATIAL_NODE_TIER_V0.TEMPORAL,
    nodeId,
    kind: "causal_projection",
    trigger: opts.stage ? "graph_to_space_stage" : "graph_to_space_bridge",
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
  };

  const result = opts.stage
    ? stageSpatialProjectionV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, event)
    : emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, event);

  if (result.ok) {
    projectedCausalNodeIdsV0.add(causalId);
    existingIds.add(nodeId);
    return Object.freeze({
      ok: true,
      staged: opts.stage === true,
      projected: opts.stage !== true,
      optimistic: validation.verdict === SPATIAL_TRUTH_VERDICT_V0.OPTIMISTIC_PASS,
      nodeId,
      causalId
    });
  }

  return Object.freeze({ ok: false, skipped: true, reason: result.reason || "emit_failed" });
}

/**
 * Compute causal graph diff since last consume (new or atMs-changed nodes).
 * @param {object} [causalMap]
 */
export function computeCausalGraphDiffV0(causalMap) {
  const map = causalMap || (typeof window !== "undefined" ? window.__rhizoh?.causalMap : null);
  const nodes = Array.isArray(map?.nodes) ? map.nodes : [];
  const added = [];
  const changed = [];

  for (const node of nodes) {
    const id = String(node.id || "");
    if (!id) continue;
    const atMs = Number(node.atMs) || 0;
    const prev = lastConsumedCausalAtMsV0.get(id);
    if (prev === undefined) added.push(node);
    else if (prev !== atMs) changed.push(node);
  }

  return Object.freeze({
    added,
    changed,
    nodes: Object.freeze([...added, ...changed]),
    total: nodes.length,
    diffCount: added.length + changed.length
  });
}

/**
 * Consume graph diff — transform + stage (no registry commit until emitter flush).
 * @param {{ causalMap?: object, force?: boolean, atMs?: number }} [opts]
 */
export function consumeCausalGraphDiffV0(opts = {}) {
  const map = opts.causalMap || (typeof window !== "undefined" ? window.__rhizoh?.causalMap : null);
  const diff = computeCausalGraphDiffV0(map);
  if (!diff.diffCount) {
    return Object.freeze({
      ok: true,
      consumed: 0,
      staged: 0,
      skipped: 0,
      quarantined: 0,
      optimistic: 0,
      diff
    });
  }

  const anchor = readWorldAnchorV0();
  const existingIds = new Set(listSpatialNodesV0().map((n) => n.id));
  let staged = 0;
  let skipped = 0;
  let quarantined = 0;
  let optimistic = 0;

  for (let i = 0; i < diff.nodes.length; i += 1) {
    const causalNode = diff.nodes[i];
    const causalId = String(causalNode.id || "");
    const result = projectSingleCausalNodeV0(causalNode, map, anchor, existingIds, i, {
      force: opts.force === true,
      stage: true
    });

    if (result.staged) staged += 1;
    else if (result.skipped) skipped += 1;
    if (result.quarantined) quarantined += 1;
    if (result.optimistic) optimistic += 1;

    if (causalId) {
      lastConsumedCausalAtMsV0.set(causalId, Number(causalNode.atMs) || 0);
    }
  }

  const snap = Object.freeze({
    ok: true,
    atMs: Number(opts.atMs) || Date.now(),
    consumed: diff.diffCount,
    staged,
    skipped,
    quarantined,
    optimistic,
    diff,
    spatialNodeCount: listSpatialNodesV0().length
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.causalGraphSpatialBridge = Object.freeze({
      schema: CAUSAL_GRAPH_SPATIAL_BRIDGE_SCHEMA_V0,
      ...snap,
      influencesExecution: false,
      entropy: computeCausalMapEntropyV0(map)
    });
  }

  return snap;
}

/**
 * Project causal map nodes into spatial registry (OBSERVER domain — bypasses WORLD gate).
 * @param {object} [causalMap]
 * @param {{ force?: boolean, stage?: boolean }} [opts]
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
  let staged = 0;
  let skipped = 0;
  let quarantined = 0;
  let optimistic = 0;

  for (let i = 0; i < nodes.length; i += 1) {
    const causalNode = nodes[i];
    const result = projectSingleCausalNodeV0(causalNode, map, anchor, existingIds, i, {
      force: opts.force === true,
      stage: opts.stage === true
    });

    if (result.staged) staged += 1;
    else if (result.projected) projected += 1;
    else if (result.skipped) skipped += 1;
    if (result.quarantined) quarantined += 1;
    if (result.optimistic) optimistic += 1;

    const causalId = String(causalNode.id || "");
    if (causalId) {
      lastConsumedCausalAtMsV0.set(causalId, Number(causalNode.atMs) || 0);
    }
  }

  const snap = Object.freeze({
    schema: CAUSAL_GRAPH_SPATIAL_BRIDGE_SCHEMA_V0,
    atMs: Date.now(),
    influencesExecution: false,
    causalNodeCount: nodes.length,
    projected,
    staged,
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
  lastConsumedCausalAtMsV0.clear();
}
