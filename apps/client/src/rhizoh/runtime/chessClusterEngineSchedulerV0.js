/**
 * Chess cluster engine scheduler — single shared Stockfish instance.
 * All 8 boards serialize through one worker; MultiPV handles variation learning.
 * RESEARCH-ONLY
 */

import {
  getChessStockfishEngineStatusV0,
  pickChessArenaEngineMoveV0,
  withChessStockfishEngineLockV0,
  CHESS_STOCKFISH_CLUSTER_MULTI_PV_V0
} from "./chessStockfishEngineV0.js";

export const CHESS_CLUSTER_ENGINE_SCHEDULER_SCHEMA_V0 =
  "castle.rhizoh.chess_cluster_engine_scheduler.v0";

let queuedOpsV0 = 0;
let totalMovesScheduledV0 = 0;

/**
 * Schedule one move through the singleton engine (mutex-serialized).
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 * @param {{ useStockfish?: boolean, preset?: string, skill?: number, movetimeMs?: number, depth?: number, contempt?: number }} [opts]
 */
export async function scheduleClusterEngineMoveV0(game, opts = {}) {
  return withChessStockfishEngineLockV0(async () => {
    queuedOpsV0 += 1;
    totalMovesScheduledV0 += 1;
    try {
      const stockfishReady = getChessStockfishEngineStatusV0() === "stockfish_wasm";
      const useStockfish = opts.useStockfish !== false && stockfishReady;
      return await pickChessArenaEngineMoveV0(game, { ...opts, useStockfish });
    } finally {
      queuedOpsV0 = Math.max(0, queuedOpsV0 - 1);
    }
  });
}

export function getChessClusterEngineSchedulerSnapshotV0() {
  return Object.freeze({
    schema: CHESS_CLUSTER_ENGINE_SCHEDULER_SCHEMA_V0,
    engineInstances: 1,
    multiPvCapacity: CHESS_STOCKFISH_CLUSTER_MULTI_PV_V0,
    queuedOps: queuedOpsV0,
    totalMovesScheduled: totalMovesScheduledV0,
    atMs: Date.now()
  });
}

/** @internal vitest */
export function __resetChessClusterEngineSchedulerForTestV0() {
  queuedOpsV0 = 0;
  totalMovesScheduledV0 = 0;
}
