/**
 * Batch Go learning — accumulate agreement-approved samples with spacetime envelope.
 * RESEARCH-ONLY
 */

import { buildGoSpacetimeObservationEnvelopeV0 } from "./goSpacetimeObservationEnvelopeV0.js";
import { getGoLearningAgreementGateSnapshotV0 } from "./goLearningAgreementGateV0.js";

export const GO_LEARNING_BATCH_SCHEMA_V0 = "castle.rhizoh.go_learning_batch.v0";
export const GO_LEARNING_BATCH_SIZE_V0 = 32;
export const GO_LEARNING_BATCH_MINI_SIZE_V0 = 16;
export const GO_LEARNING_BATCH_MINI_AGE_MS_V0 = 180_000;
export const GO_LEARNING_BATCH_EVENT_V0 = "rhizoh:go-learning-batch-v0";

/** @type {object[]} */
const pendingBatchV0 = [];
let batchesFlushedV0 = 0;
let lastFlushAtMsV0 = 0;

/**
 * @param {{
 *   boardHash?: string,
 *   move?: string,
 *   confidence?: number,
 *   gate?: object,
 *   clusterId?: string | null,
 *   spacetime?: object
 * }} sample
 */
export function enqueueGoLearningBatchSampleV0(sample) {
  if (!sample?.gate?.learningEligible) {
    return Object.freeze({ enqueued: false, reason: "gate_rejected", pending: pendingBatchV0.length });
  }

  const spacetime = sample.spacetime || buildGoSpacetimeObservationEnvelopeV0();

  pendingBatchV0.push(
    Object.freeze({
      schema: GO_LEARNING_BATCH_SCHEMA_V0,
      ...sample,
      spacetime,
      atMs: Date.now()
    })
  );

  if (pendingBatchV0.length >= GO_LEARNING_BATCH_SIZE_V0) {
    return flushGoLearningBatchV0("batch_full");
  }

  const mini = maybeFlushGoLearningMiniBatchV0();
  if (mini?.flushed) return mini;

  return Object.freeze({
    enqueued: true,
    flushed: false,
    pending: pendingBatchV0.length,
    batchSize: GO_LEARNING_BATCH_SIZE_V0
  });
}

export function maybeFlushGoLearningMiniBatchV0() {
  if (pendingBatchV0.length < GO_LEARNING_BATCH_MINI_SIZE_V0) {
    return Object.freeze({ flushed: false, reason: "below_mini_threshold", pending: pendingBatchV0.length });
  }
  const oldestAt = Number(pendingBatchV0[0]?.atMs) || 0;
  const ageMs = Date.now() - oldestAt;
  if (ageMs < GO_LEARNING_BATCH_MINI_AGE_MS_V0) {
    return Object.freeze({ flushed: false, reason: "mini_age_not_met", pending: pendingBatchV0.length, ageMs });
  }
  return flushGoLearningBatchV0("batch_mini_16");
}

/**
 * @param {string} [reason]
 */
export function flushGoLearningBatchV0(reason = "manual") {
  if (pendingBatchV0.length === 0) {
    return Object.freeze({ flushed: false, reason: "empty", pending: 0 });
  }

  const batch = pendingBatchV0.splice(0, pendingBatchV0.length);
  batchesFlushedV0 += 1;
  lastFlushAtMsV0 = Date.now();

  const detail = Object.freeze({
    schema: GO_LEARNING_BATCH_SCHEMA_V0,
    reason,
    sampleCount: batch.length,
    batchesFlushed: batchesFlushedV0,
    gate: getGoLearningAgreementGateSnapshotV0(),
    spacetimeAnchors: Object.freeze(
      batch.map((s) => s.spacetime?.worldAnchor?.nodeId).filter(Boolean)
    ),
    atMs: lastFlushAtMsV0,
    interpretationOnly: true
  });

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(GO_LEARNING_BATCH_EVENT_V0, { detail }));
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

export function getGoLearningBatchSnapshotV0() {
  return Object.freeze({
    schema: `${GO_LEARNING_BATCH_SCHEMA_V0}.snapshot`,
    pending: pendingBatchV0.length,
    batchesFlushed: batchesFlushedV0,
    lastFlushAtMs: lastFlushAtMsV0 || null,
    batchSize: GO_LEARNING_BATCH_SIZE_V0,
    gate: getGoLearningAgreementGateSnapshotV0(),
    atMs: Date.now()
  });
}

/** @internal vitest */
export function resetGoLearningBatchForTestV0() {
  pendingBatchV0.length = 0;
  batchesFlushedV0 = 0;
  lastFlushAtMsV0 = 0;
}
