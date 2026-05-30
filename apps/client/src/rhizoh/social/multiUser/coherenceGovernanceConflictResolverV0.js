/**
 * SPECFLOW: RESEARCH-ONLY — **Feedback governance vs evolution**: two layers touch the same knobs
 * (`coherenceFeedbackGovernanceV0` short-loop weights vs `coherenceGovernanceEvolutionV0` slow lifts).
 *
 * Precedence (explicit):
 * - **EVOLUTION_WINS** — evolution output fully replaces the numeric fields that evolution mutates
 *   (current default; “slow meta” is allowed to move the operating point).
 * - **BASE_PRIORITY_BLEND** — user / feedback **base** profile dominates; evolution applies only a
 *   fractional pull toward its target (stability-first live rooms).
 */

import {
  COHERENCE_FEEDBACK_GOVERNANCE_SCHEMA_V0,
  DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0
} from "./coherenceFeedbackGovernanceV0.js";
import { resolveEffectiveCoherenceGovernanceV0 } from "./coherenceGovernanceEvolutionV0.js";

export const GOVERNANCE_CONFLICT_POLICY_V0 = Object.freeze({
  EVOLUTION_WINS: "EVOLUTION_WINS",
  BASE_PRIORITY_BLEND: "BASE_PRIORITY_BLEND"
});

/**
 * @param {number} base
 * @param {number} evolved
 * @param {number} t — evolution pull in [0,1]
 */
function blendScalar(base, evolved, t) {
  const b = Number(base);
  const e = Number(evolved);
  const u = Math.min(1, Math.max(0, Number(t)));
  if (!Number.isFinite(b) || !Number.isFinite(e)) return e;
  return Math.round((b + u * (e - b)) * 10_000) / 10_000;
}

/**
 * @param {string|null|undefined} policy
 * @returns {string}
 */
export function normalizeGovernanceConflictPolicyV0(policy) {
  const p = String(policy || "").toUpperCase();
  if (p === GOVERNANCE_CONFLICT_POLICY_V0.BASE_PRIORITY_BLEND) return GOVERNANCE_CONFLICT_POLICY_V0.BASE_PRIORITY_BLEND;
  return GOVERNANCE_CONFLICT_POLICY_V0.EVOLUTION_WINS;
}

/**
 * @param {string|null|undefined} policy
 */
export function governanceConflictPrecedenceLabelV0(policy) {
  const p = normalizeGovernanceConflictPolicyV0(policy);
  if (p === GOVERNANCE_CONFLICT_POLICY_V0.BASE_PRIORITY_BLEND) {
    return "BASE_FEEDBACK_DOMINANT_EVOLUTION_SOFT";
  }
  return "EVOLUTION_OVERLAY_ON_FEEDBACK_BASE";
}

/**
 * @param {Record<string, unknown>|null|undefined} baseGovernance
 * @param {Record<string, unknown>|null|undefined} evolutionState
 * @param {string|null|undefined} [policy]
 */
export function resolveGovernanceFeedbackVsEvolutionV0(baseGovernance, evolutionState, policy) {
  const b =
    baseGovernance &&
    typeof baseGovernance === "object" &&
    baseGovernance.schema === COHERENCE_FEEDBACK_GOVERNANCE_SCHEMA_V0
      ? baseGovernance
      : DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0;
  const evolved = resolveEffectiveCoherenceGovernanceV0(b, evolutionState);
  const p = normalizeGovernanceConflictPolicyV0(policy);
  if (p !== GOVERNANCE_CONFLICT_POLICY_V0.BASE_PRIORITY_BLEND) return evolved;

  /** Evolution tempered toward base (base “wins” most of the delta). */
  const t = 0.34;
  return {
    ...evolved,
    schema: COHERENCE_FEEDBACK_GOVERNANCE_SCHEMA_V0,
    weightYoutubeOnEnergyBias: blendScalar(b.weightYoutubeOnEnergyBias, evolved.weightYoutubeOnEnergyBias, t),
    weightWsMetricsOnEnergyBias: blendScalar(b.weightWsMetricsOnEnergyBias, evolved.weightWsMetricsOnEnergyBias, t),
    weightDistributorPulseOnEnergyBias: blendScalar(
      b.weightDistributorPulseOnEnergyBias,
      evolved.weightDistributorPulseOnEnergyBias,
      t
    ),
    weightDistributorDriftOnEnergyBias: blendScalar(
      b.weightDistributorDriftOnEnergyBias,
      evolved.weightDistributorDriftOnEnergyBias,
      t
    ),
    weightUiOnEnergyBias: blendScalar(b.weightUiOnEnergyBias, evolved.weightUiOnEnergyBias, t),
    weightStudioOnEnergyBias: blendScalar(b.weightStudioOnEnergyBias, evolved.weightStudioOnEnergyBias, t),
    weightLlmOnEnergyBias: blendScalar(b.weightLlmOnEnergyBias, evolved.weightLlmOnEnergyBias, t),
    maxPeerEnergyBias01: blendScalar(b.maxPeerEnergyBias01, evolved.maxPeerEnergyBias01, t),
    maxBiasDeltaPerTick: blendScalar(b.maxBiasDeltaPerTick, evolved.maxBiasDeltaPerTick, t)
  };
}
