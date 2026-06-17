/**
 * Chess learning monitor — Rhizoh AI vs Stockfish spectator + policy_diff observability.
 * RESEARCH-ONLY
 */

import { CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 } from "./chessClusterLearningTraceV0.js";
import { CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0, getChessStockfishEngineStatusV0 } from "./chessStockfishEngineV0.js";
import { CHESS_CLUSTER_MOVE_EVENT_V0 } from "./chessGameClusterV0.js";
import { getChessClusterSlotV0 } from "./chessGameClusterV0.js";

export const CHESS_LEARNING_MONITOR_SCHEMA_V0 = "castle.rhizoh.chess_learning_monitor.v0";
export const CHESS_LEARNING_MONITOR_EVENT_V0 = "rhizoh:chess-learning-monitor-v0";
export const CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 = 0;

const MAX_RING_V0 = 24;
/** @type {object[]} */
const recentMovesV0 = [];
/** @type {object[]} */
const recentPolicyDiffsV0 = [];
let measurementStartedAtMsV0 = 0;
let movesMeasuredV0 = 0;
let stockfishMovesMeasuredV0 = 0;
let policyDiffsMeasuredV0 = 0;
let alignedPolicyDiffsV0 = 0;

export function startChessLearningMeasurementV0() {
  if (typeof window === "undefined") return getChessLearningMonitorSnapshotV0("already_off");
  ensureChessLearningMonitorListenersV0();
  if (!measurementStartedAtMsV0) measurementStartedAtMsV0 = Date.now();
  return publishChessLearningMonitorV0("measurement_start");
}

function isStockfishEngineMoveV0(engine) {
  const id = String(engine || "");
  return id === "stockfish_wasm" || id.includes("stockfish");
}

function pushRingV0(list, row) {
  list.push(Object.freeze({ ...row }));
  while (list.length > MAX_RING_V0) list.shift();
}

export function recordChessLearningMonitorMoveV0(detail) {
  if (!detail?.move) return;
  if (!measurementStartedAtMsV0) measurementStartedAtMsV0 = Date.now();
  movesMeasuredV0 += 1;
  if (isStockfishEngineMoveV0(detail.move.engine)) stockfishMovesMeasuredV0 += 1;
  pushRingV0(recentMovesV0, {
    kind: "move",
    slotId: detail.move.slotId,
    san: detail.move.san,
    engine: detail.move.engine,
    agentId: detail.move.agentId,
    critical: Boolean(detail.observation?.critical),
    atMs: detail.move.atMs || Date.now()
  });
  publishChessLearningMonitorV0("move");
}

export function recordChessLearningMonitorPolicyDiffV0(policyDiff) {
  if (!policyDiff) return;
  if (!measurementStartedAtMsV0) measurementStartedAtMsV0 = Date.now();
  policyDiffsMeasuredV0 += 1;
  if (!policyDiff.drifted) alignedPolicyDiffsV0 += 1;
  pushRingV0(recentPolicyDiffsV0, {
    kind: "policy_diff",
    ...policyDiff
  });
  publishChessLearningMonitorV0("policy_diff");
}

function publishChessLearningMonitorV0(reason = "update") {
  if (typeof window === "undefined") return null;
  const snap = getChessLearningMonitorSnapshotV0(reason);
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessLearningMonitor = snap;
  try {
    window.dispatchEvent(new CustomEvent(CHESS_LEARNING_MONITOR_EVENT_V0, { detail: snap }));
  } catch {
    /* noop */
  }
  return snap;
}

/**
 * @param {string} [reason]
 */
export function getChessLearningMonitorSnapshotV0(reason = "poll") {
  const cluster = typeof window !== "undefined" ? window.__rhizoh?.chessGameCluster : null;
  const memory = typeof window !== "undefined" ? window.__rhizoh?.chessClusterMemory : null;
  const learning = typeof window !== "undefined" ? window.__rhizoh?.chessClusterLearning : null;
  const spectator = getChessClusterSlotV0(CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0);
  const engineStatus = getChessStockfishEngineStatusV0();
  const alignmentRate =
    policyDiffsMeasuredV0 > 0
      ? Number((alignedPolicyDiffsV0 / policyDiffsMeasuredV0).toFixed(3))
      : null;

  return Object.freeze({
    schema: CHESS_LEARNING_MONITOR_SCHEMA_V0,
    reason,
    measurement: Object.freeze({
      active: Boolean(measurementStartedAtMsV0),
      startedAtMs: measurementStartedAtMsV0 || null,
      movesMeasured: movesMeasuredV0,
      stockfishMovesMeasured: stockfishMovesMeasuredV0,
      policyDiffsMeasured: policyDiffsMeasuredV0,
      alignedPolicyDiffs: alignedPolicyDiffsV0,
      alignmentRate
    }),
    spectatorSlotId: CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0,
    spectator,
    engineStatus,
    spawnPolicy:
      (typeof window !== "undefined" ? window.__rhizoh?.chessStockfishEngine?.spawnPolicy : null) ||
      null,
    clusterTick: cluster?.tickCount ?? 0,
    clusterRunning: Boolean(cluster?.running),
    memoryNodeCount: memory?.nodeCount ?? 0,
    lastLearning: learning?.last || learning || null,
    recentMoves: Object.freeze([...recentMovesV0]),
    recentPolicyDiffs: Object.freeze([...recentPolicyDiffsV0]),
    atMs: Date.now()
  });
}

let listenersInstalledV0 = false;

export function ensureChessLearningMonitorListenersV0() {
  if (typeof window === "undefined" || listenersInstalledV0) return;
  listenersInstalledV0 = true;
  if (!measurementStartedAtMsV0) measurementStartedAtMsV0 = Date.now();
  window.addEventListener(CHESS_CLUSTER_MOVE_EVENT_V0, (ev) => {
    recordChessLearningMonitorMoveV0(ev?.detail);
  });
  window.addEventListener(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, (ev) => {
    recordChessLearningMonitorPolicyDiffV0(ev?.detail);
  });
  window.addEventListener(CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0, () => {
    publishChessLearningMonitorV0("engine_status");
  });
  publishChessLearningMonitorV0("boot");
}

/** @internal vitest */
export function __resetChessLearningMonitorForTestV0() {
  recentMovesV0.length = 0;
  recentPolicyDiffsV0.length = 0;
  listenersInstalledV0 = false;
  measurementStartedAtMsV0 = 0;
  movesMeasuredV0 = 0;
  stockfishMovesMeasuredV0 = 0;
  policyDiffsMeasuredV0 = 0;
  alignedPolicyDiffsV0 = 0;
}
