/**
 * RESEARCH-ONLY: Cross-node identity reconciliation without single-truth collapse.
 *
 * Classical distributed systems → consensus (one winner).
 * Rhizoh Phase 9 target → coherent disagreement runtime (parallel valid readings).
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md §9
 */

import { foldWalSegmentHashV0, WAL_HASH_CHAIN_GENESIS_V0 } from "../walHashChainV0.js";
import {
  IDENTITY_CONTINUITY_VERDICT_V0,
  computeIdentityConfidenceV0
} from "./epistemicIdentityContinuityV0.js";
import {
  assertExecutionConvergenceGuardV0,
  deriveAllowConcurrentExecutionV0
} from "./epistemicExecutionInvariantsV0.js";
import { computeEpistemicSplitBrainScoreV0 } from "./epistemicStressPropagationV0.js";

export const CROSS_NODE_IDENTITY_RECONCILIATION_SCHEMA_V0 =
  "castle.rhizoh.cross_node_identity_reconciliation.research.v0";

/**
 * Stabilization modes — none imply "global truth fingerprint".
 * @readonly
 */
export const COHERENT_DISAGREEMENT_MODE_V0 = Object.freeze({
  /** Multiple node-local readings held in parallel; no merge. */
  PARALLEL_HOLD: "parallel_hold",
  /** Nodes agree on verdict class + low confidence band (e.g. both same_subject_low_confidence). */
  DEGRADED_ENSEMBLE: "degraded_ensemble",
  /** Compatible disagreement — lineage ok, identity projections differ per jurisdiction. */
  JURISDICTIONAL_SPLIT: "jurisdictional_split",
  /** Structural incompatibility — recommend quarantine to arbitration, not execution hard gate. */
  RECOMMEND_QUARANTINE: "recommend_quarantine"
});

/**
 * @typedef {Object} NodeIdentityObservationV0
 * @property {string} nodeId
 * @property {string} verdict
 * @property {number} confidence
 * @property {import('./epistemicIdentityContinuityV0.js').EpistemicFingerprintV0} [fingerprint]
 * @property {boolean} [lineageEquivalent]
 * @property {number} [bootSealVersion]
 */

/**
 * @typedef {Object} CoherentDisagreementBundleV0
 * @property {string} schema
 * @property {string} bundleId
 * @property {NodeIdentityObservationV0[]} observations
 * @property {string} ensembleVerdict
 * @property {number} ensembleConfidence
 * @property {boolean} truthCollapsed
 */

/**
 * @param {NodeIdentityObservationV0[]} observations
 */
export function computeIdentityDisagreementFieldV0(observations) {
  const nodes = Array.isArray(observations) ? observations : [];
  if (nodes.length === 0) {
    return {
      nodeCount: 0,
      verdictSpread: 0,
      confidenceMean: 0,
      confidenceMin: 0,
      confidenceMax: 0,
      unanimous: true,
      lowConfidenceBand: false
    };
  }

  const verdicts = new Set(nodes.map((n) => String(n.verdict || "")));
  const confidences = nodes.map((n) => Math.max(0, Math.min(1, Number(n.confidence) || 0)));
  const confidenceMean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  const confidenceMin = Math.min(...confidences);
  const confidenceMax = Math.max(...confidences);

  return {
    nodeCount: nodes.length,
    verdictSpread: verdicts.size,
    confidenceMean,
    confidenceMin,
    confidenceMax,
    unanimous: verdicts.size === 1,
    lowConfidenceBand: confidenceMax < 0.92 && confidenceMean >= 0.4
  };
}

/**
 * Pairwise fingerprint relation without picking a global winner.
 *
 * @param {NodeIdentityObservationV0[]} observations
 */
export function pairwiseIdentityRelationsV0(observations) {
  const nodes = Array.isArray(observations) ? observations : [];
  const pairs = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const { confidence } = computeIdentityConfidenceV0(a.fingerprint, b.fingerprint);
      pairs.push({
        nodeA: a.nodeId,
        nodeB: b.nodeId,
        crossConfidence: confidence,
        sameFingerprint:
          a.fingerprint?.epistemicFingerprintId === b.fingerprint?.epistemicFingerprintId
      });
    }
  }
  return pairs;
}

/**
 * @param {NodeIdentityObservationV0[]} observations
 */
function deriveEnsembleVerdictV0(observations, field) {
  if (field.nodeCount === 0) return IDENTITY_CONTINUITY_VERDICT_V0.UNRELATED;

  const verdictCounts = new Map();
  for (const n of observations) {
    const v = String(n.verdict || IDENTITY_CONTINUITY_VERDICT_V0.UNRELATED);
    verdictCounts.set(v, (verdictCounts.get(v) || 0) + 1);
  }

  const sorted = [...verdictCounts.entries()].sort((a, b) => b[1] - a[1]);
  const topVerdict = sorted[0]?.[0];
  const topCount = sorted[0]?.[1] ?? 0;

  if (field.unanimous) return topVerdict;
  if (topCount >= 2 && field.verdictSpread === 2) {
    return `ensemble_mixed_${topVerdict}`;
  }
  return `ensemble_plural_${field.verdictSpread}`;
}

/**
 * @param {NodeIdentityObservationV0[]} observations
 * @param {ReturnType<typeof computeIdentityDisagreementFieldV0>} field
 */
function deriveCoherentDisagreementModeV0(observations, field) {
  if (field.nodeCount === 0) {
    return COHERENT_DISAGREEMENT_MODE_V0.RECOMMEND_QUARANTINE;
  }

  const allUnrelated = observations.every(
    (n) => n.verdict === IDENTITY_CONTINUITY_VERDICT_V0.UNRELATED
  );
  if (allUnrelated) {
    return COHERENT_DISAGREEMENT_MODE_V0.RECOMMEND_QUARANTINE;
  }

  const allLowConfidenceSameSubject = observations.every(
    (n) => n.verdict === IDENTITY_CONTINUITY_VERDICT_V0.SAME_SUBJECT_LOW_CONFIDENCE
  );
  if (allLowConfidenceSameSubject && field.unanimous) {
    return COHERENT_DISAGREEMENT_MODE_V0.DEGRADED_ENSEMBLE;
  }

  const allLineageFork = observations.every(
    (n) => n.verdict === IDENTITY_CONTINUITY_VERDICT_V0.LINEAGE_OK_IDENTITY_FORK
  );
  if (allLineageFork && field.unanimous) {
    return COHERENT_DISAGREEMENT_MODE_V0.JURISDICTIONAL_SPLIT;
  }

  if (
    field.unanimous &&
    observations[0]?.verdict === IDENTITY_CONTINUITY_VERDICT_V0.SAME_SUBJECT
  ) {
    return COHERENT_DISAGREEMENT_MODE_V0.DEGRADED_ENSEMBLE;
  }

  const pairs = pairwiseIdentityRelationsV0(observations);
  const allProjectionsDiffer = pairs.length > 0 && pairs.every((p) => !p.sameFingerprint);
  const allLineageOk = observations.every((n) => n.lineageEquivalent !== false);
  if (allProjectionsDiffer && allLineageOk && field.lowConfidenceBand) {
    return COHERENT_DISAGREEMENT_MODE_V0.JURISDICTIONAL_SPLIT;
  }

  if (field.verdictSpread > 1) {
    return COHERENT_DISAGREEMENT_MODE_V0.PARALLEL_HOLD;
  }

  return COHERENT_DISAGREEMENT_MODE_V0.PARALLEL_HOLD;
}

/**
 * Build a bundle id that commits the *ensemble* without collapsing fingerprints.
 *
 * @param {NodeIdentityObservationV0[]} observations
 * @param {string} livingWorldId
 */
export function deriveCoherentDisagreementBundleIdV0(observations, livingWorldId) {
  const payload = {
    livingWorldId: String(livingWorldId || ""),
    nodes: observations
      .map((n) => ({
        nodeId: n.nodeId,
        verdict: n.verdict,
        confidence: Number(n.confidence) || 0,
        fingerprintId: n.fingerprint?.epistemicFingerprintId ?? null
      }))
      .sort((a, b) => String(a.nodeId).localeCompare(String(b.nodeId)))
  };
  return foldWalSegmentHashV0(WAL_HASH_CHAIN_GENESIS_V0, payload);
}

/**
 * Phase 9 critical threshold:
 * Barcelona + Istanbul both same_subject_low_confidence → degraded_ensemble, NOT merged truth.
 *
 * @param {{
 *   observations: NodeIdentityObservationV0[],
 *   livingWorldId?: string,
 *   versionAnchorNodeId?: string | null
 * }} input
 */
export function reconcileCrossNodeIdentityV0(input) {
  const observations = Array.isArray(input.observations) ? input.observations : [];
  const field = computeIdentityDisagreementFieldV0(observations);
  const stabilizationMode = deriveCoherentDisagreementModeV0(observations, field);
  const ensembleVerdict = deriveEnsembleVerdictV0(observations, field);
  const ensembleConfidence = field.confidenceMin;

  const bundleId = deriveCoherentDisagreementBundleIdV0(
    observations,
    input.livingWorldId || ""
  );

  /** @type {CoherentDisagreementBundleV0} */
  const bundle = {
    schema: CROSS_NODE_IDENTITY_RECONCILIATION_SCHEMA_V0,
    bundleId,
    observations,
    ensembleVerdict,
    ensembleConfidence,
    truthCollapsed: false
  };

  const versionAnchorNodeId = input.versionAnchorNodeId ?? null;
  const pairwiseRelations = pairwiseIdentityRelationsV0(observations);
  const splitBrain = computeEpistemicSplitBrainScoreV0({
    observations,
    disagreementField: field,
    pairwiseRelations
  });
  const statement = buildReconciliationStatementV0(stabilizationMode, field, observations);

  return {
    schema: CROSS_NODE_IDENTITY_RECONCILIATION_SCHEMA_V0,
    stabilizationMode,
    bundle,
    disagreementField: field,
    pairwiseRelations,
    ensembleVerdict,
    ensembleConfidence,
    epistemicSplitBrainScore: splitBrain.epistemicSplitBrainScore,
    coherenceGradient: splitBrain.coherenceGradient,
    splitBrainComponents: splitBrain.components,
    truthCollapsed: false,
    versionAnchorNodeId,
    hardGate: false,
    statement
  };
}

/**
 * Stabilize runtime interpretation without electing a single epistemic truth.
 * Time ownership / execution may still pick an executor; identity holds the ensemble.
 *
 * @param {ReturnType<typeof reconcileCrossNodeIdentityV0>} reconciliation
 */
export function stabilizeWithoutTruthCollapseV0(reconciliation, opts = {}) {
  const mode = reconciliation.stabilizationMode;
  const interpretationBranchCount =
    Number(opts.interpretationBranchCount) ||
    reconciliation.disagreementField?.verdictSpread ||
    reconciliation.pairwiseRelations?.length ||
    1;
  const networkExecutorNodeId = opts.networkExecutorNodeId ?? reconciliation.versionAnchorNodeId ?? null;

  const base = {
    schema: CROSS_NODE_IDENTITY_RECONCILIATION_SCHEMA_V0,
    epistemicSplitBrainScore: reconciliation.epistemicSplitBrainScore,
    coherenceGradient: reconciliation.coherenceGradient,
    truthCollapsed: false,
    executionUnified: networkExecutorNodeId != null,
    interpretationPluralized: interpretationBranchCount > 1
  };

  let stabilization;

  if (mode === COHERENT_DISAGREEMENT_MODE_V0.DEGRADED_ENSEMBLE) {
    stabilization = {
      ...base,
      stable: true,
      holdParallelReadings: false,
      ensembleActive: true,
      degradedObservability: true,
      statement:
        "Nodes agree: subject likely continuous under degraded observability — no truth collapse."
    };
  } else if (mode === COHERENT_DISAGREEMENT_MODE_V0.JURISDICTIONAL_SPLIT) {
    stabilization = {
      ...base,
      stable: true,
      holdParallelReadings: true,
      ensembleActive: false,
      degradedObservability: true,
      statement:
        "Lineage coherent; identity projections split by jurisdiction — parallel temporal identities."
    };
  } else if (mode === COHERENT_DISAGREEMENT_MODE_V0.PARALLEL_HOLD) {
    stabilization = {
      ...base,
      stable: true,
      holdParallelReadings: true,
      ensembleActive: false,
      degradedObservability: false,
      statement: "Verdict pluralism held — coherent disagreement without merge."
    };
  } else {
    stabilization = {
      ...base,
      stable: false,
      holdParallelReadings: false,
      ensembleActive: false,
      degradedObservability: false,
      statement: "No stabilizable identity ensemble — quarantine recommendation only."
    };
  }

  const concurrent = deriveAllowConcurrentExecutionV0(mode, stabilization.stable);
  const convergenceGuard = assertExecutionConvergenceGuardV0({
    networkExecutorNodeId,
    interpretationBranchCount,
    truthCollapsed: false,
    stable: stabilization.stable
  });

  return {
    ...stabilization,
    allowConcurrentExecution: concurrent.allowConcurrentExecution,
    allowConcurrentExecutionReason: concurrent.reason,
    executionConvergenceGuard: convergenceGuard
  };
}

function buildReconciliationStatementV0(mode, field, observations) {
  const nodeList = observations.map((n) => n.nodeId).join(", ");
  if (mode === COHERENT_DISAGREEMENT_MODE_V0.DEGRADED_ENSEMBLE) {
    return `Coherent disagreement resolved as degraded ensemble (${nodeList}); truthCollapsed=false.`;
  }
  if (mode === COHERENT_DISAGREEMENT_MODE_V0.JURISDICTIONAL_SPLIT) {
    return `Jurisdictional split across (${nodeList}); parallel identity projections retained.`;
  }
  if (mode === COHERENT_DISAGREEMENT_MODE_V0.PARALLEL_HOLD) {
    return `Parallel hold — ${field.verdictSpread} verdict classes across (${nodeList}).`;
  }
  return `Unstable identity field across (${nodeList}) — arbitration quarantine hint only.`;
}
