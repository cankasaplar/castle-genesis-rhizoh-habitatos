/**
 * SPECFLOW: RESEARCH-ONLY — **Governance evolution** (very slow meta-layer).
 *
 * Risk context: heavy static governance → **over-stabilized personality** (adaptation feels flat).
 * This module nudges effective weights / limits over long horizons using **coherence sensor hints**
 * (`youtubePipelineHint` shape from distributor), not per-tick noise.
 *
 * `resolveEffectiveCoherenceGovernanceV0` applies bounded deltas on top of a **base** governance profile
 * (typically `DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0` or a user merge).
 */

import {
  COHERENCE_FEEDBACK_GOVERNANCE_SCHEMA_V0,
  DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0
} from "./coherenceFeedbackGovernanceV0.js";

export const COHERENCE_GOVERNANCE_EVOLUTION_SCHEMA_V0 = "castle.rhizoh.coherence_governance_evolution.v0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** @returns {Record<string, unknown>} */
export function createInitialGovernanceEvolutionStateV0() {
  return {
    schema: COHERENCE_GOVERNANCE_EVOLUTION_SCHEMA_V0,
    /** Rises when the field feels emotionally / narratively flat — gently restores exploration. */
    explorationLift01: 0,
    /** Rises under sustained intensity — gently restores damping / runaway guards. */
    overloadLift01: 0,
    /** Last CSIL / network-pulse `rhizohRuntimeRole` key (normalized). */
    behaviorRoleKey: "",
    /** Consecutive ticks observing the same `behaviorRoleKey` (kernel behavior trace). */
    sameRoleStreak: 0
  };
}

function normalizeBehaviorRoleKeyV0(role) {
  const r = String(role || "").trim().toUpperCase();
  return r || "";
}

/**
 * @param {Record<string, unknown> | null | undefined} prev
 * @param {Record<string, unknown> | null | undefined} youtubeHint — `youtubePipelineHint` from distributor (optional)
 * @param {{ rhizohRuntimeRole?: string } | null} [opts] — prefer distributor / `networkPulse.socialPulse` trace every tick
 */
export function advanceGovernanceEvolutionV0(prev, youtubeHint, opts) {
  const s = {
    ...createInitialGovernanceEvolutionStateV0(),
    ...(prev && typeof prev === "object" ? prev : {})
  };
  const h = youtubeHint && typeof youtubeHint === "object" ? youtubeHint : null;
  const o = opts && typeof opts === "object" ? opts : {};
  const decay = 0.007;

  const roleKey = normalizeBehaviorRoleKeyV0(o.rhizohRuntimeRole || (h && h.rhizohRuntimeRole));
  let behaviorRoleKey = normalizeBehaviorRoleKeyV0(s.behaviorRoleKey);
  let sameRoleStreak = Math.max(0, Math.floor(Number(s.sameRoleStreak) || 0));
  if (roleKey) {
    if (roleKey === behaviorRoleKey) sameRoleStreak += 1;
    else {
      behaviorRoleKey = roleKey;
      sameRoleStreak = 1;
    }
  } else {
    sameRoleStreak = Math.max(0, Math.floor(sameRoleStreak * 0.96));
  }

  if (!h) {
    s.explorationLift01 = Math.max(0, Number(s.explorationLift01 || 0) * (1 - decay));
    s.overloadLift01 = Math.max(0, Number(s.overloadLift01 || 0) * (1 - decay));
    return {
      ...s,
      schema: COHERENCE_GOVERNANCE_EVOLUTION_SCHEMA_V0,
      behaviorRoleKey,
      sameRoleStreak
    };
  }

  const streak = sameRoleStreak;
  const ed = clamp01(h.emotionalDensity01);
  const pr = clamp01(h.publishRecommendationScore);
  const stagnation01 = clamp01((1 - ed) * 0.52 + (1 - pr) * 0.33 + Math.min(1, streak / 72) * 0.15);
  const role = String(h.rhizohRuntimeRole || "");
  const hotRole = role === "ARBITER" || role === "MEDIATOR" || role === "CONDUCTOR";
  const overloadSignal01 = clamp01(ed * 0.72 + (hotRole ? 0.22 : 0));

  const aExp = 0.011;
  const aOv = 0.009;
  s.explorationLift01 = (1 - aExp) * Number(s.explorationLift01 || 0) + aExp * stagnation01 * 0.19;
  s.overloadLift01 = (1 - aOv) * Number(s.overloadLift01 || 0) + aOv * overloadSignal01 * 0.15;
  s.explorationLift01 = Math.min(0.14, Math.max(0, s.explorationLift01));
  s.overloadLift01 = Math.min(0.12, Math.max(0, s.overloadLift01));
  return {
    ...s,
    schema: COHERENCE_GOVERNANCE_EVOLUTION_SCHEMA_V0,
    behaviorRoleKey,
    sameRoleStreak
  };
}

/**
 * @param {Record<string, unknown> | null} baseGovernance — full governance row; `null` uses default frozen profile
 * @param {Record<string, unknown> | null | undefined} evolutionState
 */
export function resolveEffectiveCoherenceGovernanceV0(baseGovernance, evolutionState) {
  const b =
    baseGovernance &&
    typeof baseGovernance === "object" &&
    baseGovernance.schema === COHERENCE_FEEDBACK_GOVERNANCE_SCHEMA_V0
      ? baseGovernance
      : DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0;
  const e = evolutionState && typeof evolutionState === "object" ? evolutionState : createInitialGovernanceEvolutionStateV0();
  const exp = Math.min(0.14, Math.max(0, Number(e.explorationLift01) || 0));
  const ov = Math.min(0.12, Math.max(0, Number(e.overloadLift01) || 0));

  const nextMaxBias = Math.min(0.068, Math.max(0.022, Number(b.maxBiasDeltaPerTick) + exp * 0.03 - ov * 0.02));
  const nextMaxPeer = Math.min(0.2, Math.max(0.1, Number(b.maxPeerEnergyBias01) + exp * 0.024 - ov * 0.016));
  const uiw = Math.min(0.14, Math.max(0.04, Number(b.weightUiOnEnergyBias) + exp * 0.24 - ov * 0.09));
  const ytw = Math.min(0.22, Math.max(0.06, Number(b.weightYoutubeOnEnergyBias) + exp * 0.065 - ov * 0.025));
  const llmw = Math.min(0.09, Math.max(0.02, Number(b.weightLlmOnEnergyBias) + exp * 0.055 - ov * 0.018));

  return {
    ...b,
    schema: COHERENCE_FEEDBACK_GOVERNANCE_SCHEMA_V0,
    weightUiOnEnergyBias: uiw,
    weightYoutubeOnEnergyBias: ytw,
    weightLlmOnEnergyBias: llmw,
    maxBiasDeltaPerTick: nextMaxBias,
    maxPeerEnergyBias01: nextMaxPeer
  };
}
