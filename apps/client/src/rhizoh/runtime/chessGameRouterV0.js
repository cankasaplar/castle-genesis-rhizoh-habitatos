/**
 * Chess Game Router v0 — explicit multi-game routing over a single Stockfish instance.
 * 8 isolated board states · round-robin move queue · engine mutex (not 8 workers).
 * RESEARCH-ONLY
 */

import { getChessClusterEngineSchedulerSnapshotV0 } from "./chessClusterEngineSchedulerV0.js";
import { getChessClusterPatternCountsV0 } from "./chessClusterObserverV0.js";
import { getChessClusterMemoryGraphSnapshotV0 } from "./chessClusterMemoryGraphV0.js";
import {
  CHESS_CLUSTER_SLOT_COUNT_V0,
  CHESS_GAME_CLUSTER_SCHEMA_V0,
  getChessClusterRouterMetaV0,
  isChessGameClusterRunningV0,
  listChessClusterSlotsV0
} from "./chessGameClusterV0.js";
import { getChessStockfishEngineStatusV0 } from "./chessStockfishEngineV0.js";

export const CHESS_GAME_ROUTER_SCHEMA_V0 = "castle.rhizoh.chess_game_router.v0";
export const CHESS_GAME_ROUTER_ARCHITECTURE_V0 = "single_engine_multi_game_router";

/**
 * Snapshot of the 8-game router (viewer-safe; no engine mutation).
 * @param {string} [reason]
 */
export function getChessGameRouterSnapshotV0(reason = "poll") {
  const meta = getChessClusterRouterMetaV0();
  const scheduler = getChessClusterEngineSchedulerSnapshotV0();
  const slots = listChessClusterSlotsV0();
  const activeGames = slots.filter((s) => s?.status === "active").length;
  const distinctFens = new Set(slots.map((s) => s?.fen).filter(Boolean)).size;

  return Object.freeze({
    schema: CHESS_GAME_ROUTER_SCHEMA_V0,
    architecture: CHESS_GAME_ROUTER_ARCHITECTURE_V0,
    reason,
    clusterSchema: CHESS_GAME_CLUSTER_SCHEMA_V0,
    gameCount: CHESS_CLUSTER_SLOT_COUNT_V0,
    activeGames,
    boardStateSeparation: distinctFens > 1 || activeGames <= 1,
    distinctFenCount: distinctFens,
    running: isChessGameClusterRunningV0(),
    roundRobinIndex: meta.roundRobinIndex,
    tickCount: meta.tickCount,
    busy: meta.busy,
    engineStatus: getChessStockfishEngineStatusV0(),
    engineInstances: scheduler.engineInstances,
    queuedOps: scheduler.queuedOps,
    totalMovesScheduled: scheduler.totalMovesScheduled,
    multiPvCapacity: scheduler.multiPvCapacity,
    slots: Object.freeze(slots),
    atMs: Date.now()
  });
}

export function getChessLearningGraphSnapshotV0(reason = "poll") {
  const memory = getChessClusterMemoryGraphSnapshotV0();
  const patterns = getChessClusterPatternCountsV0();
  const learning =
    typeof window !== "undefined" ? window.__rhizoh?.chessClusterLearning || null : null;

  return Object.freeze({
    schema: "castle.rhizoh.chess_learning_graph.v0",
    reason,
    memoryNodeCount: memory.nodeCount,
    recentNodes: memory.recent,
    patternTags: patterns,
    lastGameCompression: learning?.compression || null,
    atMs: Date.now()
  });
}

export function publishChessGameRouterV0(reason = "publish") {
  if (typeof window === "undefined") return null;
  const router = getChessGameRouterSnapshotV0(reason);
  const learningGraph = getChessLearningGraphSnapshotV0(reason);
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessGameRouter = router;
  window.__rhizoh.chessLearningGraph = learningGraph;
  return router;
}
