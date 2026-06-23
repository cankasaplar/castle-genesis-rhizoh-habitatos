/**
 * Chess learning epistemic camera — single OBS / DevTools / investor snapshot.
 * Observation only; no execution authority.
 * RESEARCH-ONLY
 */

import { getChessLearningAgreementGateSnapshotV0 } from "./chessLearningAgreementGateV0.js";
import { getChessLearningBatchSnapshotV0 } from "./chessLearningBatchV0.js";
import { getChessLearningBatchOpeningFeedSnapshotV0 } from "./chessLearningBatchOpeningFeedV0.js";
import { getChessLearningMonitorSnapshotV0 } from "./chessLearningMonitorV0.js";
import { listChessEngineBackendsV0 } from "./chessEngineRegistryV0.js";
import { getChessLc0BridgeSnapshotV0 } from "./chessLc0UciBridgeV0.js";
import { getChessStockfishEngineStatusV0 } from "./chessStockfishEngineV0.js";
import {
  CHESS_LEARN_BUFFER_MAX_V0,
  getUglLearnBufferSnapshotV0,
  resolveLearnDrainBurstLimitV0,
  resolveLearnDrainIntervalMsV0
} from "./rhizohUglLearnBufferSinkV0.js";
import { buildRhizohChessLearningReportV0 } from "./rhizohChessLearningReportV0.js";

export const RHIZOH_CHESS_LEARNING_CAMERA_SCHEMA_V0 =
  "castle.rhizoh.chess_learning_camera.v0";

/**
 * @param {number} buffered
 */
export function resolveChessLearnBacklogHealthV0(buffered) {
  const n = Number(buffered) || 0;
  if (n >= CHESS_LEARN_BUFFER_MAX_V0 - 8) return "critical";
  if (n >= Math.floor(CHESS_LEARN_BUFFER_MAX_V0 * 0.5)) return "warn";
  return "healthy";
}

export function buildRhizohChessLearningCameraV0() {
  const learnBuffer = getUglLearnBufferSnapshotV0();
  const batch = getChessLearningBatchSnapshotV0();
  const gate = getChessLearningAgreementGateSnapshotV0();
  const openingFeed = getChessLearningBatchOpeningFeedSnapshotV0();
  const monitor = getChessLearningMonitorSnapshotV0();
  const report = buildRhizohChessLearningReportV0();
  const backlogHealth = resolveChessLearnBacklogHealthV0(learnBuffer.buffered);

  const enrichHitRate =
    learnBuffer.enrichAttempts > 0
      ? Number((learnBuffer.enrichSuccess / learnBuffer.enrichAttempts).toFixed(3))
      : null;

  const truthRatio =
    report.truthPolicyChanges + report.previewPolicyChanges > 0
      ? Number(
          (
            report.truthPolicyChanges /
            (report.truthPolicyChanges + report.previewPolicyChanges)
          ).toFixed(3)
        )
      : null;

  return Object.freeze({
    schema: RHIZOH_CHESS_LEARNING_CAMERA_SCHEMA_V0,
    interpretationOnly: true,
    backlogHealth,
    pipeline: Object.freeze({
      buffered: learnBuffer.buffered,
      bufferMax: CHESS_LEARN_BUFFER_MAX_V0,
      drainIntervalMs: resolveLearnDrainIntervalMsV0(learnBuffer.buffered),
      drainBurstLimit: resolveLearnDrainBurstLimitV0(learnBuffer.buffered),
      enrichAttempts: learnBuffer.enrichAttempts,
      enrichSuccess: learnBuffer.enrichSuccess,
      enrichThrottleSkips: learnBuffer.enrichThrottleSkips,
      enrichTimeoutSkips: learnBuffer.enrichTimeoutSkips,
      enrichDrainRecoveries: learnBuffer.enrichDrainRecoveries,
      drainStuckMs: learnBuffer.drainStuckMs,
      draining: learnBuffer.draining,
      enrichHitRate,
      engineIdle: learnBuffer.engineIdle,
      gateAccepted: gate.accepted,
      gateRejected: gate.rejected,
      batchPending: batch.pending,
      batchesFlushed: batch.batchesFlushed,
      openingLinesFed: openingFeed.linesFed,
      truthPolicyChanges: report.truthPolicyChanges,
      previewPolicyChanges: report.previewPolicyChanges,
      truthRatio,
      stockfishAgreement: report.stockfishAgreement,
      clusterMovesSeen: report.clusterMovesSeen
    }),
    engines: Object.freeze({
      stockfish: getChessStockfishEngineStatusV0(),
      registry: listChessEngineBackendsV0(),
      lc0: getChessLc0BridgeSnapshotV0()
    }),
    cluster: Object.freeze({
      running: Boolean(monitor.clusterRunning),
      engineStatus: monitor.engineStatus,
      gamesCompleted: report.gamesCompleted,
      sessionGamesEnded: report.clusterSession?.gamesEnded ?? 0
    }),
    lastBatchFlush: report.lastBatchFlush,
    atMs: Date.now()
  });
}

export function ensureRhizohChessLearningCameraV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  if (!window.__rhizoh.chessLearningCamera) {
    window.__rhizoh.chessLearningCamera = () => buildRhizohChessLearningCameraV0();
  }
  return window.__rhizoh.chessLearningCamera;
}

/** @internal vitest */
export function __resetRhizohChessLearningCameraForTestV0() {
  if (typeof window !== "undefined" && window.__rhizoh) {
    delete window.__rhizoh.chessLearningCamera;
  }
}
