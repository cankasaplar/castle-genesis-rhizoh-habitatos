/**
 * Constitutional Feedback Injector — pure closure → field feedback.
 * Closes memory ↔ constitution causal loop without side effects.
 */

import { clamp01 } from "../constitutional/constitutionalState.js";

/**
 * @typedef {object} FeedbackInput
 * @property {import('../constitutional/constitutionalState.js').Seal | null} [seal]
 * @property {number} drift
 * @property {{ applied: boolean, deltaMax?: number, rejectedReason?: string | null }} policyMutation
 * @property {number} resonanceDelta
 * @property {number[]} pressureDelta
 * @property {import('../constitutional/constitutionalState.js').ConstitutionalState} state
 */

/**
 * @param {FeedbackInput} input
 */
export function injectConstitutionalFeedback(input) {
  const s = input.state;
  const drift = clamp01(input.drift ?? s.drift);
  const stability = clamp01(s.confidence * (1 - drift * 0.55) * (1 - s.sealEntropy * 0.45));
  const fragility = clamp01(s.contradiction * 0.42 + drift * 0.33 + s.sealEntropy * 0.25);
  const sealed = !!input.seal;
  const mutated = !!input.policyMutation?.applied;
  const rd = clamp01((input.resonanceDelta ?? 0) * 0.5 + 0.5);
  const pd = input.pressureDelta || [0, 0, 0, 0, 0];

  const memoryBiasShift = Object.freeze({
    salienceBoost: clamp01(0.06 + fragility * 0.14 - stability * 0.05 + (mutated ? 0.04 : 0)),
    coherenceTilt: clamp01(stability * 0.1 - fragility * 0.05),
    noveltyGate: clamp01(0.48 + fragility * 0.22 - stability * 0.08),
    sealEcho: sealed ? clamp01(0.08 + (1 - s.sealEntropy) * 0.06) : 0
  });

  const truthAdj = clamp01(stability * 0.06 - fragility * 0.04 + (rd - 0.5) * 0.04);
  const contraAdj = clamp01(fragility * 0.12 - stability * 0.05 + (pd[1] ?? 0) * 0.08);
  const legitAdj = clamp01(stability * 0.07 - fragility * 0.03 + (sealed ? 0.04 : 0));
  const memAdj = clamp01((pd[3] ?? 0) * 0.06 + fragility * 0.05 - stability * 0.02);
  const novAdj = clamp01((pd[4] ?? 0) * 0.05 - stability * 0.03 + fragility * 0.04);

  const pressureRebalance = Object.freeze([
    truthAdj,
    contraAdj,
    legitAdj,
    memAdj,
    novAdj
  ]);

  const topologyReinjection = Object.freeze({
    sovereignPull: clamp01(fragility * 0.22 + (mutated ? 0.12 : 0) + s.sovereignTier * 0.08),
    clusterTighten: clamp01(stability * 0.14 + (sealed ? 0.06 : 0)),
    wakeScale: clamp01(1 - fragility * 0.18 + stability * 0.12 - (mutated ? 0.04 : 0))
  });

  const schedulerReweight = Object.freeze({
    urgencyBias: clamp01(fragility * 0.28 + (mutated ? 0.1 : 0) + contraAdj),
    calmBias: clamp01(stability * 0.24 + legitAdj + (sealed ? 0.06 : 0))
  });

  const observationFilterUpdate = Object.freeze({
    coherenceLift: clamp01(stability * 0.08 - fragility * 0.04),
    uncertaintyDamp: clamp01(stability * 0.07 + legitAdj * 0.15),
    salienceBoost: memoryBiasShift.salienceBoost,
    noveltyDamp: clamp01(sealed ? 0.04 : fragility * 0.05),
    conflictDamp: clamp01(stability * 0.08 + legitAdj * 0.1)
  });

  return Object.freeze({
    memoryBiasShift,
    pressureRebalance,
    topologyReinjection,
    schedulerReweight,
    observationFilterUpdate
  });
}
