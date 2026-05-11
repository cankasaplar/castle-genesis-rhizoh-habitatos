/**
 * Core confidence step: C_{t+1} = clamp(C_t + αP − βK + γD + δR)
 */

import { clamp01 } from "./constitutionalState.js";

export const DEFAULT_ALPHA = 0.35;
export const DEFAULT_BETA = 0.42;
export const DEFAULT_GAMMA = 0.28;
export const DEFAULT_DELTA = 0.22;

/**
 * Verified proof pressure P from proof vector components [0..1].
 * @param {{ confidence: number, legality: number, provenance: number, contradiction: number }} proof
 */
export function proofPressure(proof) {
  const base = proof.confidence * 0.46 + proof.legality * 0.31 + proof.provenance * 0.23;
  return clamp01(base * (1 - proof.contradiction * 0.35));
}

/**
 * @param {number} prevConfidence
 * @param {number} P
 * @param {number} K contradiction penalty
 * @param {number} D discomfort
 * @param {number} R resonance contribution
 * @param {{ alpha?: number, beta?: number, gamma?: number, delta?: number }} [coef]
 */
export function stepConfidence(prevConfidence, P, K, D, R, coef = {}) {
  const α = coef.alpha ?? DEFAULT_ALPHA;
  const β = coef.beta ?? DEFAULT_BETA;
  const γ = coef.gamma ?? DEFAULT_GAMMA;
  const δ = coef.delta ?? DEFAULT_DELTA;
  return clamp01(prevConfidence + α * P - β * K + γ * D + δ * R);
}
