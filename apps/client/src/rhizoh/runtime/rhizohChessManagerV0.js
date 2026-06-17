/**
 * Rhizoh Chess Manager v0 — observability facade for the single-brain / multi-board architecture.
 * 1 Stockfish worker + mutex + round-robin cluster slots (8 UI projections).
 * RESEARCH-ONLY
 */

import { getChessClusterEngineSchedulerSnapshotV0 } from "./chessClusterEngineSchedulerV0.js";
import { getChessClusterMemoryGraphSnapshotV0 } from "./chessClusterMemoryGraphV0.js";
import { getChessLearningMonitorSnapshotV0 } from "./chessLearningMonitorV0.js";
import {
  CHESS_CLUSTER_SLOT_COUNT_V0,
  CHESS_GAME_CLUSTER_SCHEMA_V0
} from "./chessGameClusterV0.js";
import { getChessStockfishEngineDetailV0 } from "./chessStockfishEngineV0.js";

export const RHIZOH_CHESS_MANAGER_SCHEMA_V0 = "castle.rhizoh.chess_manager.v0";
export const RHIZOH_CHESS_MANAGER_ARCHITECTURE_V0 = "single_engine_multi_board_projection";

/**
 * Single snapshot: engine + scheduler + cluster + learning + memory.
 * @param {string} [reason]
 */
export function getRhizohChessManagerSnapshotV0(reason = "poll") {
  const engine = getChessStockfishEngineDetailV0();
  const scheduler = getChessClusterEngineSchedulerSnapshotV0();
  const cluster =
    typeof window !== "undefined" ? window.__rhizoh?.chessGameCluster || null : null;
  const learning = getChessLearningMonitorSnapshotV0(reason);
  const memory = getChessClusterMemoryGraphSnapshotV0();

  const engineReady = engine.status === "stockfish_wasm";
  const clusterRunning = Boolean(cluster?.running);
  const singleEngine = scheduler.engineInstances === 1;
  const healthy = engineReady && singleEngine && clusterRunning;

  return Object.freeze({
    schema: RHIZOH_CHESS_MANAGER_SCHEMA_V0,
    architecture: RHIZOH_CHESS_MANAGER_ARCHITECTURE_V0,
    reason,
    healthy,
    health: Object.freeze({
      engineReady,
      clusterRunning,
      singleEngine,
      blockedBy: !engineReady
        ? "engine_not_ready"
        : !clusterRunning
          ? "cluster_not_running"
          : !singleEngine
            ? "multiple_engines"
            : null
    }),
    brain: Object.freeze({
      engineInstances: scheduler.engineInstances,
      multiPvCapacity: scheduler.multiPvCapacity,
      engineStatus: engine.status,
      lastSpawnStrategy: engine.lastSpawnStrategy,
      spawnStrategies: engine.spawnStrategies,
      mainThreadCompileMs: engine.mainThreadCompileMs,
      compileElapsedMs: engine.compileElapsedMs,
      initError: engine.initError,
      deploymentLayer: engine.deploymentLayer
    }),
    arena: Object.freeze({
      slotCount: CHESS_CLUSTER_SLOT_COUNT_V0,
      clusterSchema: CHESS_GAME_CLUSTER_SCHEMA_V0,
      running: Boolean(cluster?.running),
      tickCount: cluster?.tickCount ?? 0,
      slots: cluster?.slots || []
    }),
    learning,
    memory,
    probes: Object.freeze({
      engine: "window.__rhizoh.chessStockfishEngine",
      cluster: "window.__rhizoh.chessGameCluster",
      manager: "window.__rhizoh.chessManager",
      learning: "window.__rhizoh.chessLearningMonitor",
      memory: "window.__rhizoh.chessClusterMemory"
    }),
    atMs: Date.now()
  });
}

export function publishRhizohChessManagerV0(reason = "publish") {
  if (typeof window === "undefined") return null;
  const snap = getRhizohChessManagerSnapshotV0(reason);
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessManager = snap;
  return snap;
}
