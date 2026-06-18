/**
 * Chess engine contention gate — cluster vs arena prewarm / learning trace.
 * RESEARCH-ONLY
 */

import { CHESS_ENGINE_TASK_KIND_V0 } from "./chessEngineTaskQueueV0.js";
import { getChessEngineQueueSnapshotV0 } from "./chessEngineTaskQueueV0.js";

export const CHESS_ENGINE_CONTENTION_GATE_SCHEMA_V0 = "castle.rhizoh.chess_engine_contention_gate.v0";
export const CHESS_CLUSTER_ARENA_REGISTRY_SCHEMA_V0 = "castle.rhizoh.chess_cluster_arena.v0";
export const CHESS_ARENA_WORKSPACE_REGISTRY_SCHEMA_V0 = "castle.rhizoh.chess_arena_workspace.v0";

/** @param {boolean} open */
export function publishChessArenaWorkspaceOpenV0(open) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessArenaWorkspace = Object.freeze({
    schema: CHESS_ARENA_WORKSPACE_REGISTRY_SCHEMA_V0,
    open: Boolean(open),
    atMs: Date.now()
  });
}

export function isChessArenaWorkspaceOpenV0() {
  if (typeof window === "undefined") return false;
  return Boolean(window.__rhizoh?.chessArenaWorkspace?.open);
}

/** Pause background cluster ticks while map arena match is active (8-camera broadcast wins). */
export function shouldPauseClusterTickForArenaV0() {
  if (isChessClusterArenaOpenV0()) return false;
  return isChessArenaWorkspaceOpenV0();
}

/** @param {boolean} open */
export function publishChessClusterArenaOpenV0(open) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessClusterArena = Object.freeze({
    schema: CHESS_CLUSTER_ARENA_REGISTRY_SCHEMA_V0,
    open: Boolean(open),
    atMs: Date.now()
  });
}

export function isChessClusterArenaOpenV0() {
  if (typeof window === "undefined") return false;
  return Boolean(window.__rhizoh?.chessClusterArena?.open);
}

export function getChessEngineContentionSnapshotV0() {
  if (typeof window === "undefined") {
    return Object.freeze({
      schema: CHESS_ENGINE_CONTENTION_GATE_SCHEMA_V0,
      clusterRunning: false,
      clusterArenaOpen: false,
      arenaWorkspaceOpen: false,
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
  const clusterArenaOpen = isChessClusterArenaOpenV0();
  const arenaWorkspaceOpen = isChessArenaWorkspaceOpenV0();
  const chessLock = Boolean(scheduler?.chessLock);
  const queuePending = Number(queue?.pendingCount) || 0;
  const contended = clusterRunning && (chessLock || queuePending > 1);

  return Object.freeze({
    schema: CHESS_ENGINE_CONTENTION_GATE_SCHEMA_V0,
    clusterRunning,
    clusterArenaOpen,
    arenaWorkspaceOpen,
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

/** Defer arena WASM warmup while cluster holds the single pipeline (background only). */
export function shouldDeferArenaPrewarmV0() {
  const snap = getChessEngineContentionSnapshotV0();
  return snap.clusterRunning && (snap.chessLock || snap.queuePending > 0);
}

/**
 * Defer arena Stockfish while the 8-camera cluster modal is open (broadcast).
 * Background cluster sim must not block map chess arena entry or play.
 */
export function shouldDeferArenaEngineWorkV0() {
  const snap = getChessEngineContentionSnapshotV0();
  if (!snap.clusterRunning) return false;
  return snap.clusterArenaOpen;
}

/** Block map chess arena only while 8-camera observation UI is open. */
export function shouldDeferMapChessArenaOpenV0() {
  return isChessClusterArenaOpenV0();
}

/**
 * @param {{ queueKind?: string }} [opts]
 */
export function resolveChessMoveTimeoutBufferMsV0(opts = {}) {
  const queue = getChessEngineQueueSnapshotV0();
  const queueExtra = Math.min(2400, (Number(queue.pendingCount) || 0) * 400);
  const snap = getChessEngineContentionSnapshotV0();
  let base = 2000;
  if (opts.queueKind === CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE) base = 2800;
  if (opts.queueKind === CHESS_ENGINE_TASK_KIND_V0.PREWARM) base = 1500;
  if (opts.queueKind === CHESS_ENGINE_TASK_KIND_V0.ARENA_MOVE) {
    base = snap.clusterRunning ? 5200 : 3200;
    if (snap.arenaWorkspaceOpen) base = Math.max(base, 6000);
  }
  return base + queueExtra;
}
