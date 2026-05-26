/**
 * RESEARCH-ONLY: Phase 9.2 — Epistemic Topology Compiler
 *
 * Transforms epistemic runtime state into render-ready geometry:
 * - stress field → visual mesh
 * - disagreement → navigable graph
 * - identity drift → vector flow map
 * - execution axis → convergence line (NOT truth collapse)
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md §13
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "../walHashChainV0.js";
import { propagateEpistemicStressV0, computeEpistemicSplitBrainScoreV0 } from "./epistemicStressPropagationV0.js";
import {
  reconcileCrossNodeIdentityV0,
  stabilizeWithoutTruthCollapseV0
} from "./crossNodeIdentityReconciliationV0.js";

export const EPISTEMIC_TOPOLOGY_COMPILER_SCHEMA_V0 =
  "castle.rhizoh.epistemic_topology_compiler.research.v0.2";

/**
 * @typedef {Object} TopologyVec2V0
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} StressMeshVertexV0
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {number} z
 * @property {number} stress
 * @property {number} coherence
 */

/**
 * @typedef {Object} EpistemicTopologyArtifactV0
 * @property {string} schema
 * @property {string} topologyId
 * @property {boolean} truthCollapsed
 * @property {object} layers
 * @property {object} meta
 */

function hashAngleV0(seed) {
  const h = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, { seed: String(seed) });
  const n = parseInt(h.slice(1, 7), 16) || 0;
  return (n % 360) * (Math.PI / 180);
}

/**
 * Deterministic 2D layout for topology nodes.
 *
 * @param {string} nodeId
 * @param {number} index
 * @param {number} total
 */
export function layoutTopologyNodeV0(nodeId, index, total) {
  const t = Math.max(1, total);
  const baseAngle = (2 * Math.PI * index) / t;
  const jitter = (hashAngleV0(nodeId) - Math.PI) * 0.08;
  const r = 0.42;
  return {
    x: Math.cos(baseAngle + jitter) * r,
    y: Math.sin(baseAngle + jitter) * r
  };
}

/**
 * @param {import('./epistemicStressPropagationV0.js').EpistemicStressNodeV0[]} stressField
 * @param {string[]} nodeIds
 */
export function compileStressMeshV0(stressField, nodeIds) {
  const ids = nodeIds.length ? nodeIds : stressField.map((n) => n.nodeId);
  const stressMap = new Map(stressField.map((n) => [n.nodeId, n]));

  const vertices = ids.map((id, i) => {
    const pos = layoutTopologyNodeV0(id, i, ids.length);
    const row = stressMap.get(id);
    const stress = row ? Math.max(0, Math.min(1, row.localStress + row.propagatedStress * 0.5)) : 0;
    const coherence = row?.coherenceGradient ?? 1 - stress;
    return {
      id,
      x: pos.x,
      y: pos.y,
      z: stress,
      stress,
      coherence
    };
  });

  const faces = [];
  if (vertices.length >= 2) {
    const hub = {
      id: "__stress_hub__",
      x: 0,
      y: 0,
      z: vertices.reduce((s, v) => s + v.stress, 0) / vertices.length,
      stress: vertices.reduce((s, v) => s + v.stress, 0) / vertices.length,
      coherence: vertices.reduce((s, v) => s + v.coherence, 0) / vertices.length
    };
    const hubIndex = vertices.length;
    vertices.push(hub);
    for (let i = 0; i < ids.length; i++) {
      const j = (i + 1) % ids.length;
      faces.push([i, j, hubIndex]);
    }
  }

  return {
    kind: "stress_mesh",
    vertices,
    faces,
    colorScale: "stress_to_coherence",
    statement: "Stress field as elevating mesh — height = epistemic tension."
  };
}

/**
 * @param {ReturnType<typeof reconcileCrossNodeIdentityV0>} reconciliation
 */
export function compileDisagreementGraphV0(reconciliation) {
  const observations = reconciliation.bundle?.observations || [];
  const pairs = reconciliation.pairwiseRelations || [];
  const nodeIds = observations.map((o) => o.nodeId);
  const positions = new Map(
    nodeIds.map((id, i) => [id, layoutTopologyNodeV0(id, i, nodeIds.length)])
  );

  const graphNodes = observations.map((o) => ({
    id: o.nodeId,
    label: o.nodeId.replace(/^node:/, ""),
    verdict: o.verdict,
    confidence: Number(o.confidence) || 0,
    position: positions.get(o.nodeId),
    navigable: true,
    meta: {
      bootSealVersion: o.bootSealVersion ?? null,
      lineageEquivalent: o.lineageEquivalent !== false
    }
  }));

  const graphEdges = pairs.map((p, idx) => ({
    id: `edge_${idx}`,
    from: p.nodeA,
    to: p.nodeB,
    weight: Number(p.crossConfidence) || 0,
    label: `cross:${(Number(p.crossConfidence) || 0).toFixed(2)}`,
    navigable: true,
    bidirectional: true
  }));

  for (const o of observations) {
    if (o.verdict !== reconciliation.ensembleVerdict) {
      graphEdges.push({
        id: `ensemble_${o.nodeId}`,
        from: o.nodeId,
        to: "__ensemble__",
        weight: reconciliation.ensembleConfidence,
        label: reconciliation.ensembleVerdict,
        navigable: true,
        bidirectional: false,
        virtual: true
      });
    }
  }

  return {
    kind: "disagreement_graph",
    nodes: graphNodes,
    edges: graphEdges,
    ensemble: {
      id: "__ensemble__",
      verdict: reconciliation.ensembleVerdict,
      confidence: reconciliation.ensembleConfidence,
      stabilizationMode: reconciliation.stabilizationMode
    },
    statement: "Disagreement as navigable graph — conflict preserved, not resolved."
  };
}

/**
 * @param {import('./crossNodeIdentityReconciliationV0.js').NodeIdentityObservationV0[]} observations
 * @param {ReturnType<typeof reconcileCrossNodeIdentityV0>} reconciliation
 */
export function compileDriftFlowMapV0(observations, reconciliation) {
  const nodeIds = observations.map((o) => o.nodeId);
  const vectors = observations.map((o, i) => {
    const pos = layoutTopologyNodeV0(o.nodeId, i, nodeIds.length);
    const fpId = o.fingerprint?.epistemicFingerprintId || o.nodeId;
    const angle = hashAngleV0(fpId);
    const magnitude = Math.max(
      0.05,
      Math.min(0.35, 1 - (Number(o.confidence) || 0) + reconciliation.epistemicSplitBrainScore * 0.2)
    );
    return {
      nodeId: o.nodeId,
      origin: pos,
      vector: {
        dx: Math.cos(angle) * magnitude,
        dy: Math.sin(angle) * magnitude
      },
      magnitude,
      verdict: o.verdict,
      driftClass:
        o.verdict === "identity_drift"
          ? "witness_decay_flow"
          : o.verdict === "lineage_ok_identity_fork"
            ? "identity_fork_flow"
            : "observability_flow"
    };
  });

  return {
    kind: "drift_flow_map",
    vectors,
    fieldTension: reconciliation.epistemicSplitBrainScore,
    statement: "Identity drift as vector flow — direction from fingerprint projection change."
  };
}

/**
 * Execution convergence axis visualization (single executor).
 * NOT truth collapse — geometric depiction of governance axis.
 *
 * @param {string|null} networkExecutorNodeId
 * @param {string[]} nodeIds
 */
export function compileExecutionCollapseLineV0(networkExecutorNodeId, nodeIds) {
  const executor = networkExecutorNodeId ? String(networkExecutorNodeId) : null;
  const ids = nodeIds.length ? nodeIds : executor ? [executor] : [];
  const positions = new Map(ids.map((id, i) => [id, layoutTopologyNodeV0(id, i, ids.length)]));

  if (!executor || !positions.has(executor)) {
    return {
      kind: "execution_convergence_axis",
      executorNodeId: null,
      segments: [],
      statement: "No unified execution axis — plural interpretation without convergence."
    };
  }

  const target = positions.get(executor);
  const segments = ids
    .filter((id) => id !== executor)
    .map((id) => {
      const from = positions.get(id);
      return {
        from: { ...from, nodeId: id },
        to: { ...target, nodeId: executor },
        collapsePressure: Math.hypot(target.x - from.x, target.y - from.y),
        axis: "execution_convergence"
      };
    });

  return {
    kind: "execution_convergence_axis",
    executorNodeId: executor,
    segments,
    hub: { ...target, nodeId: executor },
    statement:
      "Execution axis convergence lines — governance pull toward single executor (not epistemic truth collapse)."
  };
}

/**
 * @param {{
 *   reconciliation: ReturnType<typeof reconcileCrossNodeIdentityV0>,
 *   stressPropagation: ReturnType<typeof propagateEpistemicStressV0>,
 *   stabilization?: ReturnType<typeof stabilizeWithoutTruthCollapseV0>,
 *   networkExecutorNodeId?: string | null
 * }} input
 */
export function compileEpistemicTopologyV0(input) {
  const reconciliation = input.reconciliation;
  const stressPropagation = input.stressPropagation;
  const observations = reconciliation.bundle?.observations || [];
  const nodeIds = observations.map((o) => o.nodeId);

  const stressMesh = compileStressMeshV0(stressPropagation.stressField, nodeIds);
  const disagreementGraph = compileDisagreementGraphV0(reconciliation);
  const driftFlowMap = compileDriftFlowMapV0(observations, reconciliation);
  const executionAxis = compileExecutionCollapseLineV0(
    input.networkExecutorNodeId ?? reconciliation.versionAnchorNodeId,
    nodeIds
  );

  const topologyId = foldWalSegmentHashV0(stressPropagation.fieldDigest, {
    ensemble: reconciliation.bundle?.bundleId,
    layer: "topology_v0.2"
  });

  return {
    schema: EPISTEMIC_TOPOLOGY_COMPILER_SCHEMA_V0,
    topologyId,
    truthCollapsed: false,
    layers: {
      stressMesh,
      disagreementGraph,
      driftFlowMap,
      executionAxis
    },
    meta: {
      epistemicSplitBrainScore: reconciliation.epistemicSplitBrainScore,
      coherenceGradient: reconciliation.coherenceGradient,
      stabilizationMode: reconciliation.stabilizationMode,
      allowConcurrentExecution: input.stabilization?.allowConcurrentExecution ?? null
    },
    statement:
      "Epistemic topology compiled — conflict as navigable physics field, not flattened truth."
  };
}

/**
 * End-to-end research pipeline: observations → reconciliation → stress → topology.
 *
 * @param {{
 *   livingWorldId: string,
 *   observations: import('./crossNodeIdentityReconciliationV0.js').NodeIdentityObservationV0[],
 *   topologyEdges?: import('./epistemicStressPropagationV0.js').TopologyEdgeV0[],
 *   networkExecutorNodeId?: string | null
 * }} input
 */
export function compileEpistemicTopologyFromObservationsV0(input) {
  const reconciliation = reconcileCrossNodeIdentityV0({
    livingWorldId: input.livingWorldId,
    observations: input.observations,
    versionAnchorNodeId: input.networkExecutorNodeId
  });

  const stressPropagation = propagateEpistemicStressV0({
    nodes: input.observations.map((o) => ({
      nodeId: o.nodeId,
      localStress: 1 - (Number(o.confidence) || 0)
    })),
    edges: input.topologyEdges || []
  });

  const stabilization = stabilizeWithoutTruthCollapseV0(reconciliation, {
    networkExecutorNodeId: input.networkExecutorNodeId,
    interpretationBranchCount: reconciliation.disagreementField?.verdictSpread
  });

  return compileEpistemicTopologyV0({
    reconciliation,
    stressPropagation,
    stabilization,
    networkExecutorNodeId: input.networkExecutorNodeId
  });
}
