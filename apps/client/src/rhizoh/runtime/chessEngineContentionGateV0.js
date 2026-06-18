/**
 * Chess engine contention gate — cluster vs arena prewarm / learning trace.
 * RESEARCH-ONLY
 */

import { CHESS_ENGINE_TASK_KIND_V0 } from "./chessEngineTaskQueueV0.js";
import { getChessEngineQueueSnapshotV0 } from "./chessEngineTaskQueueV0.js";

export const CHESS_ENGINE_CONTENTION_GATE_SCHEMA_V0 = "castle.rhizoh.chess_engine_contention_gate.v0";

export function getChessEngineContentionSnapshotV0() {
  if (typeof window === "undefined") {
    return Object.freeze({
      schema: CHESS_ENGINE_CONTENTION_GATE_SCHEMA_V0,
      clusterRunning: false,
      chessLock: false,
      queuePending: 0,
      contended: false,
      atMs: Date.now()
    });
  }
  const cluster = window.__rhizoh?.chessGameCluster;
  const queue = window.__rhizoh?.chessEngineQueue;
  const scheduler = window.__rhizoh?.chessScheduler;
  const clusterRunning = Boolean(cluster?.running);
  const chessLock = Boolean(scheduler?.chessLock);
  const queuePending = Number(queue?.pendingCount) || 0;
  const contended = clusterRunning && (chessLock || queuePending > 1);

  return Object.freeze({
    schema: CHESS_ENGINE_CONTENTION_GATE_SCHEMA_V0,
    clusterRunning,
    chessLock,
    queuePending,
    queueActive: Boolean(queue?.active),
    contended,
    atMs: Date.now()
  });
}

export function isChessEngineContendedV0() {
  return getChessEngineContentionSnapshotV0().contended;
}

/** Defer arena map warmup while cluster holds the single WASM pipeline. */
export function shouldDeferArenaPrewarmV0() {
  const snap = getChessEngineContentionSnapshotV0();
  return snap.clusterRunning && (snap.chessLock || snap.queuePending > 0);
}

/**
 * @param {{ queueKind?: string }} [opts]
 */
export function resolveChessMoveTimeoutBufferMsV0(opts = {}) {
  const queue = getChessEngineQueueSnapshotV0();
  const queueExtra = Math.min(2400, (Number(queue.pendingCount) || 0) * 400);
  let base = 2000;
  if (opts.queueKind === CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE) base = 2800;
  if (opts.queueKind === CHESS_ENGINE_TASK_KIND_V0.PREWARM) base = 1500;
  return base + queueExtra;
}
