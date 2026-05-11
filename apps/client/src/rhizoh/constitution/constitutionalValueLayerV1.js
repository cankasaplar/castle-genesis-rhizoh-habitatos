/**
 * R1 — Constitutional value / ethics layer — normatif öncelik: “ne yapılmalı?” skoru.
 * Ontik doğruluk (topos/W) ile karıştırılmaz; policy-weighted utility benzeri saf fonksiyon.
 */

import { resolveRhizohThetaPhase } from "./thetaPhaseTransitionV1.js";

export const RHIZOH_CONSTITUTIONAL_VALUE_LAYER_VERSION = "1.0.0";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Eylemden zorlama / manipülasyon sinyali türetir [0,1].
 * @param {Record<string, unknown>} action
 */
export function deriveRhizohCoercionSignalFromAction(action = {}) {
  let c = 0;
  if (action.overrideUserPreference === true) c += 0.35;
  if (action.membraneFloorEscalation === true) c += 0.22;
  const kid = String(action.kernelActionId || "");
  if (/FORCE|LOCKDOWN|QUARANTINE|OVERRIDE/i.test(kid)) c += 0.28;
  if (action.directive === "NONE" && action.assertDominance === true) c += 0.15;
  return clamp01(c);
}

/**
 * @param {{
 *   theta?: number,
 *   stressIndex?: number,
 *   trust?: number,
 *   manipulationRisk?: number,
 *   deceptionRisk?: number,
 *   uncertainty?: number,
 *   organismThrottleFactor?: number,
 *   harmVelocity?: number,
 *   evidenceStrength?: number,
 *   llmHedgePressure?: number,
 *   coercionSignal?: number
 * }} state
 * @param {Record<string, unknown>} [action]
 */
export function evaluateRhizohConstitutionalEthicalPriority(state = {}, action = {}) {
  const stress = clamp01(state.stressIndex ?? 0);
  const dec = clamp01(state.deceptionRisk ?? 0);
  const manip = clamp01(state.manipulationRisk ?? 0);
  const unc = clamp01(state.uncertainty ?? 0);
  const throttle = clamp01(state.organismThrottleFactor ?? 1);

  /** Zarar eğimi — risk birikiminin normatif “yükü”. */
  const harmGradient = clamp01(
    0.28 * stress +
      0.24 * dec +
      0.2 * manip +
      0.18 * unc +
      0.1 * (1 - throttle) +
      (Number.isFinite(Number(state.harmVelocity)) ? 0.15 * clamp01(state.harmVelocity) : 0)
  );

  const trust = clamp01(state.trust ?? 0.55);
  const extCoercion =
    state.coercionSignal != null ? clamp01(Number(state.coercionSignal)) : deriveRhizohCoercionSignalFromAction(action);
  /** Özerklik koruma — güven ↓ veya zorlama ↑ ile düşer. */
  const autonomyPreservation = clamp01(trust * (1 - extCoercion * 0.95));

  const coercionPenalty = extCoercion;

  const claimCap = action.claimConfidence != null ? clamp01(Number(action.claimConfidence)) : null;
  const evid = clamp01(state.evidenceStrength ?? 0.55);
  const hedge = clamp01(state.llmHedgePressure ?? 0);
  let truthDistortionPenalty = hedge * 0.45;
  if (claimCap != null && claimCap > evid + 0.12) truthDistortionPenalty += clamp01(claimCap - evid) * 0.55;
  truthDistortionPenalty = clamp01(truthDistortionPenalty);

  const immunePhase =
    state.theta != null && resolveRhizohThetaPhase(clamp01(state.theta)).phase === "immune_aggression";
  if (immunePhase && claimCap != null && claimCap > 0.82) {
    truthDistortionPenalty = clamp01(truthDistortionPenalty + 0.08);
  }

  /** Birleşik etik skor [0,1] — yüksek = eylem önceliği daha savunulabilir. */
  const ethicalScore = clamp01(
    autonomyPreservation * 0.34 +
      (1 - harmGradient) * 0.28 +
      (1 - coercionPenalty) * 0.22 +
      (1 - truthDistortionPenalty) * 0.16
  );

  return {
    ethicalScore: Math.round(ethicalScore * 1000) / 1000,
    harmGradient: Math.round(harmGradient * 1000) / 1000,
    autonomyPreservation: Math.round(autonomyPreservation * 1000) / 1000,
    coercionPenalty: Math.round(coercionPenalty * 1000) / 1000,
    truthDistortionPenalty: Math.round(truthDistortionPenalty * 1000) / 1000,
    recommendProceed: ethicalScore >= 0.42,
    valueLayerVersion: RHIZOH_CONSTITUTIONAL_VALUE_LAYER_VERSION
  };
}

/**
 * ethical_weighting_function(state, action) → score için kısa takma ad.
 */
export const ethicalWeightingRhizohConstitutional = evaluateRhizohConstitutionalEthicalPriority;
