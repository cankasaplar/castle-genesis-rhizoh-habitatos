/**
 * Epistemic Memory Graph v0 — persistent cross-linked observation topology.
 * Projects shadow ledger rows into durable nodes (stressRunId, causalChainId, lenses).
 * RESEARCH-ONLY — never feeds drift detection or move selection.
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "./continuity/walHashChainV0.js";
import { isRhizohLegalPendingHoldV0 } from "./rhizohLegalPendingWaitLoopV0.js";
import { resolveIngressRouteV0 } from "../ingress/ingress_router.js";
import {
  buildEpistemicGraphLifecyclePlanV0,
  getLastEpistemicGraphLifecyclePassV0,
  recordEpistemicGraphLifecyclePassV0
} from "./rhizohEpistemicGraphLifecycleV0.js";
import { assessEpistemicGraphInflationRiskV0 } from "./rhizohEpistemicGraphInflationGuardV0.js";

export const EPISTEMIC_MEMORY_GRAPH_SCHEMA_V0 = "castle.rhizoh.epistemic_memory_graph.v0";
export const EPISTEMIC_MEMORY_GRAPH_EVENT_V0 = "rhizoh:epistemic-memory-graph-v0";

export const EPISTEMIC_MEMORY_NODE_KIND_V0 = Object.freeze({
  SHADOW_PROJECTION: "shadow_projection",
  STRESS_RUN_HUB: "stress_run_hub",
  STRESS_LENS: "stress_lens",
  COUNCIL_ANNOTATION: "council_annotation"
});

export const EPISTEMIC_MEMORY_LINK_KIND_V0 = Object.freeze({
  CAUSAL_CHAIN: "causal_chain",
  STRESS_RUN: "stress_run",
  COUNCIL_SESSION: "council_session",
  CONFLICT_GRAPH: "conflict_graph",
  MATCH_SEQUENCE: "match_sequence"
});

/** Memory graph must not close feedback loops into drift/policy/move paths. */
export const EPISTEMIC_MEMORY_GOVERNANCE_V0 = Object.freeze({
  feedsDriftDetection: false,
  feedsMoveSelection: false,
  feedsPolicyDiff: false,
  executionEffect: false,
  uiEffect: false,
  epistemicRole: "epistemic_memory_graph"
});

const MAX_NODES_V0 = 1024;
const MAX_EDGES_V0 = 2048;

/** @type {object[]} */
const nodesV0 = [];
/** @type {object[]} */
const edgesV0 = [];

/** @type {Map<string, string>} stressRunId → hub nodeId */
const stressHubByRunIdV0 = new Map();
/** @type {Map<string, string>} matchId → last anchor nodeId */
const lastAnchorByMatchIdV0 = new Map();
/** @type {Map<string, string>} shadowRecordId → nodeId */
const nodeByShadowRecordIdV0 = new Map();

let nodeSeqV0 = 0;
let edgeSeqV0 = 0;

function resolveShadowModeForMemoryGraphV0() {
  if (typeof window !== "undefined" && window.__rhizoh?.shadowMode?.force === true) return true;
  if (typeof window !== "undefined" && window.__rhizoh?.shadowTraceLedger?.shadowMode === true) {
    return true;
  }
  try {
    if (isRhizohLegalPendingHoldV0()) return true;
    const ingress = resolveIngressRouteV0();
    if (ingress?.route === "legal_preamble") return true;
    if (ingress?.required && !ingress?.acked) return true;
  } catch {
    /* noop */
  }
  if (typeof window !== "undefined" && window.__rhizoh?.chessGameCluster?.running) return true;
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_SHADOW_MODE === "1") {
    return true;
  }
  return false;
}

/**
 * @param {string|null|undefined} causalChainId
 * @returns {string|null}
 */
function extractStressRunIdFromCausalChainV0(causalChainId) {
  if (!causalChainId) return null;
  const match = String(causalChainId).match(/^(stress_\d+_[a-z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * @param {object} record — shadow trace ledger row
 * @returns {string|null}
 */
function resolveStressRunIdFromRecordV0(record) {
  const payloadRun = record?.payload?.stressRunId;
  if (payloadRun) return String(payloadRun);
  return extractStressRunIdFromCausalChainV0(record?.causalChainId);
}

/**
 * @param {string} stressRunId
 * @param {{ matchId?: string|null, slotId?: number|null, profile?: string|null }} ctx
 */
function ensureStressRunHubNodeV0(stressRunId, ctx = {}) {
  const existing = stressHubByRunIdV0.get(stressRunId);
  if (existing) return nodesV0.find((n) => n.nodeId === existing) || null;

  nodeSeqV0 += 1;
  const node = Object.freeze({
    schema: EPISTEMIC_MEMORY_GRAPH_SCHEMA_V0,
    nodeId: `emg_hub_${nodeSeqV0}_${Date.now().toString(36)}`,
    kind: EPISTEMIC_MEMORY_NODE_KIND_V0.STRESS_RUN_HUB,
    stressRunId,
    causalChainId: stressRunId,
    parentNodeId: null,
    lensStance: null,
    eventType: "STRESS_RUN_HUB",
    sourceSystem: "compliance",
    entropyScore: null,
    matchId: ctx.matchId || null,
    slotId: ctx.slotId ?? null,
    shadowRecordId: null,
    profile: ctx.profile || null,
    governance: EPISTEMIC_MEMORY_GOVERNANCE_V0,
    atMs: Date.now()
  });
  nodesV0.push(node);
  stressHubByRunIdV0.set(stressRunId, node.nodeId);
  trimGraphV0();
  publishEpistemicMemoryGraphV0(node);
  maybeAutoLifecyclePassV0();
  return node;
}

/**
 * @param {{ fromNodeId: string, toNodeId: string, linkKind: string, stressRunId?: string|null }} row
 */
function appendMemoryEdgeV0(row) {
  if (!row.fromNodeId || !row.toNodeId || row.fromNodeId === row.toNodeId) return null;
  edgeSeqV0 += 1;
  const edge = Object.freeze({
    schema: EPISTEMIC_MEMORY_GRAPH_SCHEMA_V0,
    edgeId: `emg_edge_${edgeSeqV0}_${Date.now().toString(36)}`,
    fromNodeId: row.fromNodeId,
    toNodeId: row.toNodeId,
    linkKind: row.linkKind || EPISTEMIC_MEMORY_LINK_KIND_V0.CAUSAL_CHAIN,
    stressRunId: row.stressRunId || null,
    crossSource:
      row.linkKind === EPISTEMIC_MEMORY_LINK_KIND_V0.COUNCIL_SESSION ||
      row.linkKind === EPISTEMIC_MEMORY_LINK_KIND_V0.CONFLICT_GRAPH,
    atMs: Date.now()
  });
  edgesV0.push(edge);
  while (edgesV0.length > MAX_EDGES_V0) edgesV0.shift();
  return edge;
}

function maybeAutoLifecyclePassV0() {
  try {
    const inflation = assessEpistemicGraphInflationRiskV0();
    if (inflation.shouldRunLifecyclePass) runEpistemicMemoryGraphLifecycleV0();
  } catch {
    /* noop */
  }
}

/**
 * Apply node TTL + edge decay prune pass.
 */
export function runEpistemicMemoryGraphLifecycleV0() {
  const plan = buildEpistemicGraphLifecyclePlanV0({
    nodes: nodesV0,
    edges: edgesV0
  });

  if (plan.expiredNodeIds.length) {
    const expired = new Set(plan.expiredNodeIds);
    for (let i = nodesV0.length - 1; i >= 0; i -= 1) {
      const node = nodesV0[i];
      if (!expired.has(node.nodeId)) continue;
      nodesV0.splice(i, 1);
      if (node.shadowRecordId) nodeByShadowRecordIdV0.delete(node.shadowRecordId);
      if (node.kind === EPISTEMIC_MEMORY_NODE_KIND_V0.STRESS_RUN_HUB && node.stressRunId) {
        stressHubByRunIdV0.delete(node.stressRunId);
      }
    }
  }

  if (plan.prunedEdgeIds.length) {
    const prune = new Set(plan.prunedEdgeIds);
    for (let i = edgesV0.length - 1; i >= 0; i -= 1) {
      if (prune.has(edgesV0[i].edgeId)) edgesV0.splice(i, 1);
    }
  }

  recordEpistemicGraphLifecyclePassV0(
    Object.freeze({
      ...plan,
      nodeCountAfter: nodesV0.length,
      edgeCountAfter: edgesV0.length
    })
  );
  publishEpistemicMemoryGraphV0(null);
  return getLastEpistemicGraphLifecyclePassV0();
}

function trimGraphV0() {
  while (nodesV0.length > MAX_NODES_V0) {
    const removed = nodesV0.shift();
    if (removed?.shadowRecordId) nodeByShadowRecordIdV0.delete(removed.shadowRecordId);
    if (removed?.kind === EPISTEMIC_MEMORY_NODE_KIND_V0.STRESS_RUN_HUB && removed.stressRunId) {
      stressHubByRunIdV0.delete(removed.stressRunId);
    }
  }
}

/**
 * @param {object} record — shadow trace ledger row
 * @param {{ trustedCaller?: boolean }} [opts]
 */
export function projectShadowTraceToEpistemicMemoryV0(record, opts = {}) {
  if (!record) return null;
  if (!opts.trustedCaller && !resolveShadowModeForMemoryGraphV0()) return null;
  if (nodeByShadowRecordIdV0.has(record.recordId)) {
    return nodesV0.find((n) => n.nodeId === nodeByShadowRecordIdV0.get(record.recordId)) || null;
  }

  const stressRunId = resolveStressRunIdFromRecordV0(record);
  let parentNodeId = null;

  if (stressRunId) {
    const hub = ensureStressRunHubNodeV0(stressRunId, {
      matchId: record.matchId,
      slotId: record.slotId,
      profile: record.payload?.profile || record.policyContext?.profile || null
    });
    parentNodeId = hub?.nodeId || null;
  } else if (record.eventType === "CHESS_MOVE_ANCHOR" && record.matchId) {
    parentNodeId = lastAnchorByMatchIdV0.get(record.matchId) || null;
  } else if (record.sourceSystem === "council") {
    const recent = [...nodesV0]
      .reverse()
      .find(
        (n) =>
          n.matchId === record.matchId &&
          n.kind === EPISTEMIC_MEMORY_NODE_KIND_V0.SHADOW_PROJECTION &&
          n.atMs >= Date.now() - 120_000
      );
    parentNodeId = recent?.nodeId || null;
  }

  nodeSeqV0 += 1;
  const kind =
    record.sourceSystem === "council"
      ? EPISTEMIC_MEMORY_NODE_KIND_V0.COUNCIL_ANNOTATION
      : EPISTEMIC_MEMORY_NODE_KIND_V0.SHADOW_PROJECTION;

  const node = Object.freeze({
    schema: EPISTEMIC_MEMORY_GRAPH_SCHEMA_V0,
    nodeId: `emg_${nodeSeqV0}_${Date.now().toString(36)}`,
    kind,
    shadowRecordId: record.recordId,
    stressRunId,
    causalChainId: record.causalChainId || null,
    parentNodeId,
    lensStance: record.policyContext?.stance || null,
    eventType: record.eventType,
    sourceSystem: record.sourceSystem,
    entropyScore: record.entropyScore,
    matchId: record.matchId || null,
    slotId: record.slotId ?? null,
    trustClass: record.trustClass || null,
    governance: EPISTEMIC_MEMORY_GOVERNANCE_V0,
    atMs: Date.now()
  });

  nodesV0.push(node);
  nodeByShadowRecordIdV0.set(record.recordId, node.nodeId);
  trimGraphV0();

  if (parentNodeId) {
    appendMemoryEdgeV0({
      fromNodeId: parentNodeId,
      toNodeId: node.nodeId,
      linkKind: stressRunId
        ? EPISTEMIC_MEMORY_LINK_KIND_V0.STRESS_RUN
        : record.sourceSystem === "council"
          ? EPISTEMIC_MEMORY_LINK_KIND_V0.COUNCIL_SESSION
          : record.eventType === "CHESS_MOVE_ANCHOR"
            ? EPISTEMIC_MEMORY_LINK_KIND_V0.MATCH_SEQUENCE
            : EPISTEMIC_MEMORY_LINK_KIND_V0.CAUSAL_CHAIN,
      stressRunId
    });
  }

  if (record.eventType === "CHESS_MOVE_ANCHOR" && record.matchId) {
    lastAnchorByMatchIdV0.set(record.matchId, node.nodeId);
  }

  publishEpistemicMemoryGraphV0(node);
  maybeAutoLifecyclePassV0();
  return node;
}

/**
 * Project stress conflict-graph lenses onto memory graph.
 * @param {{ stressRunId: string, conflictGraph: object, councilObservation?: object|null, matchId?: string, slotId?: number }} input
 */
export function projectStressConflictGraphToEpistemicMemoryV0(input = {}, opts = {}) {
  if (!input.stressRunId || !input.conflictGraph?.nodes?.length) return Object.freeze([]);
  if (!opts.trustedCaller && !resolveShadowModeForMemoryGraphV0()) return Object.freeze([]);

  const hub = ensureStressRunHubNodeV0(input.stressRunId, {
    matchId: input.matchId,
    slotId: input.slotId,
    profile: input.conflictGraph.profile || null
  });

  let councilNodeId = null;
  if (input.councilObservation?.sessionId) {
    const councilNode = [...nodesV0]
      .reverse()
      .find(
        (n) =>
          n.kind === EPISTEMIC_MEMORY_NODE_KIND_V0.COUNCIL_ANNOTATION &&
          n.causalChainId === `council_${input.councilObservation.sessionId}`
      );
    councilNodeId = councilNode?.nodeId || null;
  }

  const projected = [];
  for (const lens of input.conflictGraph.nodes) {
    nodeSeqV0 += 1;
    const node = Object.freeze({
      schema: EPISTEMIC_MEMORY_GRAPH_SCHEMA_V0,
      nodeId: `emg_lens_${nodeSeqV0}_${Date.now().toString(36)}`,
      kind: EPISTEMIC_MEMORY_NODE_KIND_V0.STRESS_LENS,
      shadowRecordId: null,
      stressRunId: input.stressRunId,
      causalChainId: `${input.stressRunId}_lens_${lens.lensId}`,
      parentNodeId: councilNodeId || hub?.nodeId || null,
      lensStance: lens.stance,
      eventType: "STRESS_LENS",
      sourceSystem: "council",
      entropyScore: lens.confidence,
      matchId: input.matchId || null,
      slotId: input.slotId ?? null,
      lensId: lens.lensId,
      governance: EPISTEMIC_MEMORY_GOVERNANCE_V0,
      atMs: Date.now()
    });
    nodesV0.push(node);
    projected.push(node);

    if (node.parentNodeId) {
      appendMemoryEdgeV0({
        fromNodeId: node.parentNodeId,
        toNodeId: node.nodeId,
        linkKind: EPISTEMIC_MEMORY_LINK_KIND_V0.CONFLICT_GRAPH,
        stressRunId: input.stressRunId
      });
    }
  }

  for (const conflictEdge of input.conflictGraph.edges || []) {
    const fromNode = projected.find((n) => n.lensId === conflictEdge.from);
    const toNode = projected.find((n) => n.lensId === conflictEdge.to);
    if (!fromNode || !toNode) continue;
    appendMemoryEdgeV0({
      fromNodeId: fromNode.nodeId,
      toNodeId: toNode.nodeId,
      linkKind: EPISTEMIC_MEMORY_LINK_KIND_V0.CONFLICT_GRAPH,
      stressRunId: input.stressRunId
    });
  }

  trimGraphV0();
  publishEpistemicMemoryGraphV0(projected[projected.length - 1] || null);
  maybeAutoLifecyclePassV0();
  return Object.freeze(projected);
}

/**
 * @returns {string}
 */
export function computeEpistemicMemoryGraphDigestV0() {
  const payload = Object.freeze({
    nodes: nodesV0.map((n) =>
      Object.freeze({
        nodeId: n.nodeId,
        kind: n.kind,
        stressRunId: n.stressRunId,
        causalChainId: n.causalChainId,
        eventType: n.eventType
      })
    ),
    edges: edgesV0.map((e) =>
      Object.freeze({
        edgeId: e.edgeId,
        fromNodeId: e.fromNodeId,
        toNodeId: e.toNodeId,
        linkKind: e.linkKind
      })
    )
  });
  return foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, payload);
}

export function getEpistemicMemoryGraphComplianceSummaryV0() {
  const crossLinkCount = edgesV0.filter((e) => e.crossSource === true).length;
  const stressHubCount = nodesV0.filter(
    (n) => n.kind === EPISTEMIC_MEMORY_NODE_KIND_V0.STRESS_RUN_HUB
  ).length;
  const lensCount = nodesV0.filter((n) => n.kind === EPISTEMIC_MEMORY_NODE_KIND_V0.STRESS_LENS)
    .length;

  return Object.freeze({
    nodeCount: nodesV0.length,
    edgeCount: edgesV0.length,
    crossLinkCount,
    stressHubCount,
    lensCount,
    memoryGraphDigest: computeEpistemicMemoryGraphDigestV0()
  });
}

export function getEpistemicMemoryGraphSnapshotV0() {
  const recentNodes = Object.freeze(nodesV0.slice(-24));
  const recentEdges = Object.freeze(edgesV0.slice(-32));

  return Object.freeze({
    schema: EPISTEMIC_MEMORY_GRAPH_SCHEMA_V0,
    shadowMode: resolveShadowModeForMemoryGraphV0(),
    ...getEpistemicMemoryGraphComplianceSummaryV0(),
    recentNodes,
    recentEdges,
    atMs: Date.now()
  });
}

function publishEpistemicMemoryGraphV0(lastNode = null) {
  if (typeof window === "undefined") return;
  const snap = getEpistemicMemoryGraphSnapshotV0();
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.epistemicMemoryGraph = snap;
  if (lastNode) {
    try {
      window.dispatchEvent(
        new CustomEvent(EPISTEMIC_MEMORY_GRAPH_EVENT_V0, { detail: lastNode })
      );
    } catch {
      /* noop */
    }
  }
}

/** @internal vitest */
export function __resetEpistemicMemoryGraphForTestV0() {
  nodesV0.length = 0;
  edgesV0.length = 0;
  stressHubByRunIdV0.clear();
  lastAnchorByMatchIdV0.clear();
  nodeByShadowRecordIdV0.clear();
  nodeSeqV0 = 0;
  edgeSeqV0 = 0;
  if (typeof window !== "undefined") {
    delete window.__rhizoh?.epistemicMemoryGraph;
  }
}
