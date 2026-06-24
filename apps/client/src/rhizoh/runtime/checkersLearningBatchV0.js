/**
 * Batch Checkers learning — spacetime envelope on samples. RESEARCH-ONLY
 */

import { buildCheckersSpacetimeObservationEnvelopeV0 } from "./checkersSpacetimeObservationEnvelopeV0.js";
import { getCheckersLearningAgreementGateSnapshotV0 } from "./checkersLearningAgreementGateV0.js";

export const CHECKERS_LEARNING_BATCH_SCHEMA_V0 = "castle.rhizoh.checkers_learning_batch.v0";
export const CHECKERS_LEARNING_BATCH_SIZE_V0 = 32;
export const CHECKERS_LEARNING_BATCH_MINI_SIZE_V0 = 16;
export const CHECKERS_LEARNING_BATCH_MINI_AGE_MS_V0 = 180_000;
export const CHECKERS_LEARNING_BATCH_EVENT_V0 = "rhizoh:checkers-learning-batch-v0";

/** @type {object[]} */
const pendingBatchV0 = [];
let batchesFlushedV0 = 0;
let lastFlushAtMsV0 = 0;

/**
 * @param {{ boardHash?: string, move?: string, confidence?: number, gate?: object, spacetime?: object }} sample
 */
export function enqueueCheckersLearningBatchSampleV0(sample) {
  if (!sample?.gate?.learningEligible) {
    return Object.freeze({ enqueued: false, reason: "gate_rejected", pending: pendingBatchV0.length });
  }

  const spacetime = sample.spacetime || buildCheckersSpacetimeObservationEnvelopeV0();

  pendingBatchV0.push(
    Object.freeze({
      schema: CHECKERS_LEARNING_BATCH_SCHEMA_V0,
      ...sample,
      spacetime,
      atMs: Date.now()
    })
  );

  if (pendingBatchV0.length >= CHECKERS_LEARNING_BATCH_SIZE_V0) {
    return flushCheckersLearningBatchV0("batch_full");
  }

  const mini = maybeFlushCheckersLearningMiniBatchV0();
  if (mini?.flushed) return mini;

  return Object.freeze({
    enqueued: true,
    flushed: false,
    pending: pendingBatchV0.length,
    batchSize: CHECKERS_LEARNING_BATCH_SIZE_V0
  });
}

export function maybeFlushCheckersLearningMiniBatchV0() {
  if (pendingBatchV0.length < CHECKERS_LEARNING_BATCH_MINI_SIZE_V0) {
    return Object.freeze({ flushed: false, reason: "below_mini_threshold", pending: pendingBatchV0.length });
  }
  const oldestAt = Number(pendingBatchV0[0]?.atMs) || 0;
  const ageMs = Date.now() - oldestAt;
  if (ageMs < CHECKERS_LEARNING_BATCH_MINI_AGE_MS_V0) {
    return Object.freeze({ flushed: false, reason: "mini_age_not_met", pending: pendingBatchV0.length, ageMs });
  }
  return flushCheckersLearningBatchV0("batch_mini_16");
}

/**
 * @param {string} [reason]
 */
export function flushCheckersLearningBatchV0(reason = "manual") {
  if (pendingBatchV0.length === 0) {
    return Object.freeze({ flushed: false, reason: "empty", pending: 0 });
  }

  const batch = pendingBatchV0.splice(0, pendingBatchV0.length);
  batchesFlushedV0 += 1;
  lastFlushAtMsV0 = Date.now();

  const detail = Object.freeze({
    schema: CHECKERS_LEARNING_BATCH_SCHEMA_V0,
    reason,
    sampleCount: batch.length,
    batchesFlushed: batchesFlushedV0,
    gate: getCheckersLearningAgreementGateSnapshotV0(),
    spacetimeAnchors: Object.freeze(
      batch.map((s) => s.spacetime?.worldAnchor?.nodeId).filter(Boolean)
    ),
    atMs: lastFlushAtMsV0,
    interpretationOnly: true
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CHECKERS_LEARNING_BATCH_EVENT_V0, { detail }));
  }

  return Object.freeze({
    flushed: true,
    reason,
    sampleCount: batch.length,
    pending: pendingBatchV0.length,
    batchesFlushed: batchesFlushedV0,
    detail
  });
}

export function getCheckersLearningBatchSnapshotV0() {
  return Object.freeze({
    schema: `${CHECKERS_LEARNING_BATCH_SCHEMA_V0}.snapshot`,
    pending: pendingBatchV0.length,
    batchesFlushed: batchesFlushedV0,
    lastFlushAtMs: lastFlushAtMsV0 || null,
    batchSize: CHECKERS_LEARNING_BATCH_SIZE_V0,
    gate: getCheckersLearningAgreementGateSnapshotV0(),
    atMs: Date.now()
  });
}

/** @internal vitest */
export function resetCheckersLearningBatchForTestV0() {
  pendingBatchV0.length = 0;
  batchesFlushedV0 = 0;
  lastFlushAtMsV0 = 0;
}
