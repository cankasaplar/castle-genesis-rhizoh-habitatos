/**
 * Chess engine contention gate — cluster vs arena prewarm / learning trace.
 * RESEARCH-ONLY
 */

import { CHESS_ENGINE_TASK_KIND_V0, cancelPendingClusterEngineTasksV0, getChessEngineQueueSnapshotV0 } from "./chessEngineTaskQueueV0.js";
import { isWorldSpaceMapBootingV0 } from "./worldSpaceMapBootGateV0.js";

export const CHESS_ENGINE_CONTENTION_GATE_SCHEMA_V0 = "castle.rhizoh.chess_engine_contention_gate.v0";
export const CHESS_CLUSTER_ARENA_REGISTRY_SCHEMA_V0 = "castle.rhizoh.chess_cluster_arena.v0";
export const CHESS_ARENA_WORKSPACE_REGISTRY_SCHEMA_V0 = "castle.rhizoh.chess_arena_workspace.v0";
export const RHIZOH_CLOSE_CHESS_CLUSTER_ARENA_EVENT_V0 = "RHIZOH_CLOSE_CHESS_CLUSTER_ARENA";

function readClusterArenaRegistryV0() {
  if (typeof window === "undefined") return null;
  return window.__rhizoh?.chessClusterArena || null;
}

function writeClusterArenaRegistryV0(patch = {}) {
  if (typeof window === "undefined") return;
  const prev = readClusterArenaRegistryV0() || {};
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessClusterArena = Object.freeze({
    schema: CHESS_CLUSTER_ARENA_REGISTRY_SCHEMA_V0,
    uiOpen: patch.uiOpen ?? prev.uiOpen ?? false,
    broadcastActive: patch.broadcastActive ?? prev.broadcastActive ?? false,
    atMs: Date.now()
  });
}

/** Close 8-camera broadcast + free the single engine for map arena play. */
export function releaseBroadcastForArenaPlayV0() {
  publishChessClusterArenaUiOpenV0(false);
  publishChessClusterBroadcastActiveV0(false);
  cancelPendingClusterEngineTasksV0();
  void import("./chessStockfishEngineV0.js").then((mod) => {
    mod.abortChessStockfishInFlightSearchV0?.();
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(RHIZOH_CLOSE_CHESS_CLUSTER_ARENA_EVENT_V0));
  }
}

/** Arena move priority — clear cluster queue before Stockfish pick. */
export function prioritizeArenaEngineForMoveV0() {
  if (!isChessArenaWorkspaceOpenV0()) return false;
  releaseBroadcastForArenaPlayV0();
  return true;
}

/** @param {boolean} open */
export function publishChessArenaWorkspaceOpenV0(open) {
  if (typeof window === "undefined") return;
  const wasOpen = isChessArenaWorkspaceOpenV0();
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessArenaWorkspace = Object.freeze({
    schema: CHESS_ARENA_WORKSPACE_REGISTRY_SCHEMA_V0,
    open: Boolean(open),
    atMs: Date.now()
  });
  if (open) {
    releaseBroadcastForArenaPlayV0();
  }
}

export function isChessArenaWorkspaceOpenV0() {
  if (typeof window === "undefined") return false;
  return Boolean(window.__rhizoh?.chessArenaWorkspace?.open);
}

/** Pause background cluster ticks while map arena match is active or V11 map is still booting. */
export function shouldPauseClusterTickForArenaV0() {
  if (isWorldSpaceMapBootingV0()) return true;
  return isChessArenaWorkspaceOpenV0();
}

/** @param {boolean} open */
export function publishChessClusterArenaUiOpenV0(open) {
  writeClusterArenaRegistryV0({ uiOpen: Boolean(open) });
}

/** Keep cluster broadcast engine policy on while learning channel UI is dismissed. */
export function publishChessClusterBroadcastActiveV0(active) {
  writeClusterArenaRegistryV0({ broadcastActive: Boolean(active) });
}

/** UI visibility only — does not stop background broadcast ticks. */
export function publishChessClusterArenaOpenV0(open) {
  publishChessClusterArenaUiOpenV0(open);
}

export function isChessClusterArenaOpenV0() {
  if (typeof window === "undefined") return false;
  return Boolean(readClusterArenaRegistryV0()?.uiOpen);
}

export function isChessClusterBroadcastActiveV0() {
  if (typeof window === "undefined") return false;
  return Boolean(readClusterArenaRegistryV0()?.broadcastActive);
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
  const clusterBroadcastActive = isChessClusterBroadcastActiveV0();
  const arenaWorkspaceOpen = isChessArenaWorkspaceOpenV0();
  const chessLock = Boolean(scheduler?.chessLock);
  const queuePending = Number(queue?.pendingCount) || 0;
  const contended = clusterRunning && (chessLock || queuePending > 1);

  return Object.freeze({
    schema: CHESS_ENGINE_CONTENTION_GATE_SCHEMA_V0,
    clusterRunning,
    clusterArenaOpen,
    clusterBroadcastActive,
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
 * Defer arena Stockfish only while 8-camera broadcast is open and no map arena is playing.
 */
export function shouldDeferArenaEngineWorkV0() {
  if (isChessArenaWorkspaceOpenV0()) return false;
  const snap = getChessEngineContentionSnapshotV0();
  if (!snap.clusterRunning) return false;
  return snap.clusterBroadcastActive;
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
