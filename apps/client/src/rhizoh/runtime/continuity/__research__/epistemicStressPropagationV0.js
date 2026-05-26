/**
 * RESEARCH-ONLY: Phase 9.1 — Epistemic Stress Propagation Model (stub)
 *
 * Disagreement propagates across topology as shape change, not truth collapse.
 * Evolves toward: topology-based epistemic stress field / runtime coherence geometry.
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md §11
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "../walHashChainV0.js";

export const EPISTEMIC_STRESS_PROPAGATION_SCHEMA_V0 =
  "castle.rhizoh.epistemic_stress_propagation.research.v0.1";

/**
 * @typedef {Object} TopologyEdgeV0
 * @property {string} from
 * @property {string} to
 * @property {number} [latencyWeight]
 * @property {number} [trustWeight]
 */

/**
 * @typedef {Object} EpistemicStressNodeV0
 * @property {string} nodeId
 * @property {number} localStress
 * @property {number} propagatedStress
 * @property {number} coherenceGradient
 */

/**
 * System-wide coherence gradient component — NOT a simple pairwise delta.
 *
 * @param {{
 *   observations: import('./crossNodeIdentityReconciliationV0.js').NodeIdentityObservationV0[],
 *   disagreementField: ReturnType<import('./crossNodeIdentityReconciliationV0.js').computeIdentityDisagreementFieldV0>,
 *   pairwiseRelations: ReturnType<import('./crossNodeIdentityReconciliationV0.js').pairwiseIdentityRelationsV0>
 * }} input
 */
export function computeEpistemicSplitBrainScoreV0(input) {
  const field = input.disagreementField;
  const pairs = input.pairwiseRelations || [];
  const n = Math.max(1, field.nodeCount);

  const spreadFactor = field.verdictSpread <= 1 ? 0 : Math.min(1, (field.verdictSpread - 1) / n);
  const confidenceTension = Math.max(0, field.confidenceMax - field.confidenceMin);
  const meanCross =
    pairs.length === 0
      ? 1
      : pairs.reduce((s, p) => s + (Number(p.crossConfidence) || 0), 0) / pairs.length;
  const projectionTension = 1 - meanCross;

  const score = Math.max(
    0,
    Math.min(1, spreadFactor * 0.35 + confidenceTension * 0.25 + projectionTension * 0.4)
  );

  return {
    schema: EPISTEMIC_STRESS_PROPAGATION_SCHEMA_V0,
    epistemicSplitBrainScore: score,
    coherenceGradient: 1 - score,
    components: {
      spreadFactor,
      confidenceTension,
      projectionTension,
      meanCrossConfidence: meanCross
    },
    interpretation:
      score < 0.25
        ? "low_epistemic_tension"
        : score < 0.55
          ? "coherent_disagreement_band"
          : "high_reality_tension_field"
  };
}

/**
 * Propagate local stress along topology — shapes field, does not collapse truths.
 *
 * @param {{
 *   nodes: { nodeId: string, localStress: number }[],
 *   edges?: TopologyEdgeV0[],
 *   damping?: number
 * }} input
 */
export function propagateEpistemicStressV0(input) {
  const nodes = Array.isArray(input.nodes) ? input.nodes : [];
  const edges = Array.isArray(input.edges) ? input.edges : [];
  const damping = Number(input.damping) || 0.35;

  const stressByNode = new Map(nodes.map((n) => [n.nodeId, Number(n.localStress) || 0]));
  const out = new Map();

  for (const node of nodes) {
    let inbound = 0;
    let weightSum = 0;
    for (const edge of edges) {
      if (edge.to !== node.nodeId) continue;
      const w = Number(edge.trustWeight) || 1;
      inbound += (stressByNode.get(edge.from) || 0) * w;
      weightSum += w;
    }
    const propagated = weightSum > 0 ? inbound / weightSum : 0;
    const blended = node.localStress * (1 - damping) + propagated * damping;
    out.set(node.nodeId, {
      nodeId: node.nodeId,
      localStress: node.localStress,
      propagatedStress: propagated,
      coherenceGradient: Math.max(0, 1 - blended)
    });
  }

  const fieldDigest = foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, {
    nodes: [...out.values()].sort((a, b) => a.nodeId.localeCompare(b.nodeId))
  });

  return {
    schema: EPISTEMIC_STRESS_PROPAGATION_SCHEMA_V0,
    stressField: [...out.values()],
    fieldDigest,
    truthCollapsed: false,
    statement: "Stress propagated — topology shaped interpretation field, no truth reduction."
  };
}
