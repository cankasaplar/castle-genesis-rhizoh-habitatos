/**
 * Chess cluster engine scheduler — single shared Stockfish instance.
 * All 8 boards serialize through priority task queue; MultiPV handles variation learning.
 * RESEARCH-ONLY
 */

import {
  getChessStockfishEngineStatusV0,
  pickChessArenaEngineMoveV0,
  CHESS_STOCKFISH_CLUSTER_MULTI_PV_V0
} from "./chessStockfishEngineV0.js";
import {
  CHESS_ENGINE_TASK_KIND_V0,
  CHESS_ENGINE_TASK_PRIORITY_V0,
  getChessEngineQueueSnapshotV0
} from "./chessEngineTaskQueueV0.js";
import { resolveAdaptiveClusterEngineOptsV0 } from "./chessEngineAdaptiveSliceV0.js";

export const CHESS_CLUSTER_ENGINE_SCHEDULER_SCHEMA_V0 =
  "castle.rhizoh.chess_cluster_engine_scheduler.v0";

let totalMovesScheduledV0 = 0;

/**
 * Schedule one move through the singleton engine (priority queue).
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 * @param {{ useStockfish?: boolean, preset?: string, skill?: number, movetimeMs?: number, depth?: number, contempt?: number, queueLabel?: string }} [opts]
 */
export async function scheduleClusterEngineMoveV0(game, opts = {}) {
  const stockfishReady = getChessStockfishEngineStatusV0() === "stockfish_wasm";
  const useStockfish = opts.useStockfish !== false && stockfishReady;
  const queue = getChessEngineQueueSnapshotV0();
  const pending = Number(queue.pendingCount) || 0;
  const tunedOpts = resolveAdaptiveClusterEngineOptsV0({ ...opts });
  if (pending > 1 && tunedOpts.movetimeMs) {
    tunedOpts.movetimeMs = Math.max(
      320,
      Math.round(Number(tunedOpts.movetimeMs) * (pending > 3 ? 0.55 : 0.75))
    );
    tunedOpts.timeoutBufferMs =
      (Number(tunedOpts.timeoutBufferMs) || 0) + Math.min(2400, pending * 350);
  }

  totalMovesScheduledV0 += 1;
  return pickChessArenaEngineMoveV0(game, {
    ...tunedOpts,
    useStockfish,
    queuePriority: CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
    queueKind: CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE,
    queueLabel: opts.queueLabel || "cluster_move"
  });
}

export function getChessClusterEngineSchedulerSnapshotV0() {
  const queue = getChessEngineQueueSnapshotV0();
  return Object.freeze({
    schema: CHESS_CLUSTER_ENGINE_SCHEDULER_SCHEMA_V0,
    engineInstances: 1,
    multiPvCapacity: CHESS_STOCKFISH_CLUSTER_MULTI_PV_V0,
    queuedOps: queue.pendingCount + (queue.active ? 1 : 0),
    queuePending: queue.pendingCount,
    queueActive: queue.active,
    queuePendingByPriority: queue.pendingByPriority,
    preemptCount: queue.preemptCount,
    totalMovesScheduled: totalMovesScheduledV0,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetChessClusterEngineSchedulerForTestV0() {
  totalMovesScheduledV0 = 0;
}
