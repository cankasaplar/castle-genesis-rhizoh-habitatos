/**
 * Castle Implicit Bias Learning v1.8 — adaptation without explicit stability commands.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_8.md
 */

import { appendLearningTraceV1_8, LEARNING_TRACE_KIND_V1_8 } from "./castleStabilityLearningTraceV1_8.js";
import { MODALITY_V1_7, updatePhysicsProfileV1_7 } from "./castleStabilityMemoryGraphV1_7.js";

export const CASTLE_IMPLICIT_BIAS_SCHEMA_V1_8 = "castle.implicit_bias_learning.v1.8";

const RAPID_INTERRUPT_MS_V1_8 = 3200;
const IMPLICIT_LEARNING_RATE_V1_8 = 0.06;

/** @type {Map<string, number>} */
const lastMicIngressAtMsV1_8 = new Map();

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

function emaV1_8(prior, next) {
  return Number(clamp01(prior * (1 - IMPLICIT_LEARNING_RATE_V1_8) + next * IMPLICIT_LEARNING_RATE_V1_8).toFixed(4));
}

export function observeImplicitBiasV1_8(ownerId, input = {}) {
  const atMs = Number(input.atMs) || Date.now();
  const modality = input.modality || MODALITY_V1_7.GENERAL;
  const key = String(ownerId);

  if (!input.userInitiated || input.explicitStabilitySignal) {
    return Object.freeze({
      schema: CASTLE_IMPLICIT_BIAS_SCHEMA_V1_8,
      applied: false,
      reason: "no_implicit_signal"
    });
  }

  const priorMicAt = lastMicIngressAtMsV1_8.get(key) || 0;
  lastMicIngressAtMsV1_8.set(key, atMs);
  const rapidInterrupt = priorMicAt > 0 && atMs - priorMicAt <= RAPID_INTERRUPT_MS_V1_8;

  const salience = clamp01(input.spikeSalience ?? input.intentWeight ?? 0.5);
  const userInitiatedBoost = salience > 0.62 ? 0.08 : 0.03;

  let speechDelta = 0;
  let toleranceDelta = 0;
  let reason = "passive_engagement";

  if (rapidInterrupt) {
    toleranceDelta = -0.06;
    speechDelta = 0.04;
    reason = "rapid_interrupt_pattern";
  } else if (salience >= 0.72) {
    speechDelta = userInitiatedBoost;
    reason = "high_salience_implicit_steering";
  } else {
    speechDelta = userInitiatedBoost * 0.5;
    reason = "ambient_voice_engagement";
  }

  const updated = updatePhysicsProfileV1_7(key, (profile) => {
    const modalityBias = profile.modalityBiasGraph[modality] || profile.modalityBiasGraph[MODALITY_V1_7.GENERAL];
    const nextModalityBias = Object.freeze({
      ...modalityBias,
      speechPriority: emaV1_8(modalityBias.speechPriority, modalityBias.speechPriority + speechDelta)
    });
    const nextTolerance = emaV1_8(
      profile.interruptionToleranceMap[modality] ?? 0.55,
      (profile.interruptionToleranceMap[modality] ?? 0.55) + toleranceDelta
    );
    return Object.freeze({
      ...profile,
      modalityBiasGraph: Object.freeze({
        ...profile.modalityBiasGraph,
        [modality]: nextModalityBias
      }),
      interruptionToleranceMap: Object.freeze({
        ...profile.interruptionToleranceMap,
        [modality]: nextTolerance
      }),
      lastImplicitBiasAtMs: atMs
    });
  });

  const trace = appendLearningTraceV1_8(key, {
    atMs,
    kind: LEARNING_TRACE_KIND_V1_8.IMPLICIT_BIAS,
    reason,
    modality,
    timeBucket: input.timeBucket,
    source: "implicit_ingress",
    deltas: Object.freeze({
      speechPriority: speechDelta,
      interruptionTolerance: toleranceDelta,
      rapidInterrupt
    }),
    correlationId: input.correlationId
  });

  return Object.freeze({
    schema: CASTLE_IMPLICIT_BIAS_SCHEMA_V1_8,
    applied: true,
    reason,
    rapidInterrupt,
    trace,
    profile: updated
  });
}

/** @internal vitest */
export function __resetImplicitBiasForTestV1_8() {
  lastMicIngressAtMsV1_8.clear();
}
