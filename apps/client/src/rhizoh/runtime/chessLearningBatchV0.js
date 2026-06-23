/**
 * Batch chess learning — accumulate consensus-approved samples → single weight update.
 * RESEARCH-ONLY
 */

import { applyChessBatchLearningCorrectionV0, readChessLearningWeightsV0 } from "./chessLearningWeightsV0.js";
import { getChessLearningAgreementGateSnapshotV0 } from "./chessLearningAgreementGateV0.js";
import { feedOpeningBookFromLearningBatchV0 } from "./chessLearningBatchOpeningFeedV0.js";

export const CHESS_LEARNING_BATCH_SCHEMA_V0 = "castle.rhizoh.chess_learning_batch.v0";
export const CHESS_LEARNING_BATCH_SIZE_V0 = 32;
/** Partial flush when truth backlog grows during long cluster sessions. */
export const CHESS_LEARNING_BATCH_MINI_SIZE_V0 = 16;
export const CHESS_LEARNING_BATCH_MINI_AGE_MS_V0 = 180_000;
export const CHESS_LEARNING_BATCH_EVENT_V0 = "rhizoh:chess-learning-batch-v0";

/** @type {object[]} */
const pendingBatchV0 = [];
let batchesFlushedV0 = 0;
let lastFlushAtMsV0 = 0;

/**
 * @param {{
 *   position?: string | null,
 *   playedMove?: string,
 *   bestMove?: string | null,
 *   drifted?: boolean,
 *   matchedRank?: number | null,
 *   fusion?: object,
 *   gate?: object,
 *   clusterId?: string | null,
 *   sanMoves?: string[]
 * }} sample
 */
export function enqueueChessLearningBatchSampleV0(sample) {
  if (!sample?.gate?.learningEligible) {
    return Object.freeze({ enqueued: false, reason: "gate_rejected", pending: pendingBatchV0.length });
  }

  pendingBatchV0.push(
    Object.freeze({
      schema: CHESS_LEARNING_BATCH_SCHEMA_V0,
      ...sample,
      atMs: Date.now()
    })
  );

  if (pendingBatchV0.length >= CHESS_LEARNING_BATCH_SIZE_V0) {
    return flushChessLearningBatchV0("batch_full");
  }

  const mini = maybeFlushChessLearningMiniBatchV0();
  if (mini?.flushed) return mini;

  return Object.freeze({
    enqueued: true,
    flushed: false,
    pending: pendingBatchV0.length,
    batchSize: CHESS_LEARNING_BATCH_SIZE_V0
  });
}

/**
 * @param {string} [reason]
 */
export function maybeFlushChessLearningMiniBatchV0() {
  if (pendingBatchV0.length < CHESS_LEARNING_BATCH_MINI_SIZE_V0) {
    return Object.freeze({ flushed: false, reason: "below_mini_threshold", pending: pendingBatchV0.length });
  }
  const oldestAt = Number(pendingBatchV0[0]?.atMs) || 0;
  const ageMs = Date.now() - oldestAt;
  if (ageMs < CHESS_LEARNING_BATCH_MINI_AGE_MS_V0) {
    return Object.freeze({
      flushed: false,
      reason: "mini_age_not_met",
      pending: pendingBatchV0.length,
      ageMs
    });
  }
  return flushChessLearningBatchV0("batch_mini_16");
}

/**
 * @param {string} [reason]
 */
export function flushChessLearningBatchV0(reason = "manual") {
  if (pendingBatchV0.length === 0) {
    return Object.freeze({ flushed: false, reason: "empty", pending: 0 });
  }

  const batch = pendingBatchV0.splice(0, pendingBatchV0.length);
  const drifted = batch.filter((s) => s.drifted).length;
  const aligned = batch.length - drifted;
  const forcedWinRatio = batch.length ? drifted / batch.length : 0;
  const lossAvoidanceRatio = batch.length ? aligned / batch.length : 0;

  const weightsBefore = readChessLearningWeightsV0();
  const weightsAfter = applyChessBatchLearningCorrectionV0(
    {
      forcedWinIgnored: forcedWinRatio >= 0.25,
      lossAvoidanceBias: lossAvoidanceRatio >= 0.6 && forcedWinRatio < 0.15,
      forcedWinRatio,
      lossAvoidanceRatio
    },
    { gamesTrained: batch.length }
  );

  const openingFeed = feedOpeningBookFromLearningBatchV0(batch);

  batchesFlushedV0 += 1;
  lastFlushAtMsV0 = Date.now();

  const result = Object.freeze({
    schema: CHESS_LEARNING_BATCH_SCHEMA_V0,
    flushed: true,
    reason,
    sampleCount: batch.length,
    drifted,
    aligned,
    forcedWinRatio: Number(forcedWinRatio.toFixed(3)),
    weightsBefore: Object.freeze({ ...weightsBefore }),
    weightsAfter: Object.freeze({ ...weightsAfter }),
    openingFeed,
    agreementGate: getChessLearningAgreementGateSnapshotV0(),
    atMs: lastFlushAtMsV0
  });

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(CHESS_LEARNING_BATCH_EVENT_V0, { detail: result }));
    } catch {
      /* noop */
    }
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.chessLearningBatch = result;
  }

  return result;
}

export function getChessLearningBatchSnapshotV0() {
  return Object.freeze({
    schema: CHESS_LEARNING_BATCH_SCHEMA_V0,
    pending: pendingBatchV0.length,
    batchSize: CHESS_LEARNING_BATCH_SIZE_V0,
    miniBatchSize: CHESS_LEARNING_BATCH_MINI_SIZE_V0,
    batchesFlushed: batchesFlushedV0,
    lastFlushAtMs: lastFlushAtMsV0 || null,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetChessLearningBatchForTestV0() {
  pendingBatchV0.length = 0;
  batchesFlushedV0 = 0;
  lastFlushAtMsV0 = 0;
}
