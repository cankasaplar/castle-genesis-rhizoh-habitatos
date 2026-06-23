/**
 * Chess cluster learning throughput — game completion + teacher league + drift SSOT.
 * RESEARCH-ONLY — closes the observation loop (DATA STARVATION fix).
 * @see docs/RHIZOH_TRACE_GRAPH_INDEX_OPTIMIZER_V1.md
 */

import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "./chessLearningMonitorV0.js";

export const CHESS_CLUSTER_LEARNING_THROUGHPUT_SCHEMA_V0 =
  "castle.rhizoh.chess_cluster_learning_throughput.v0";

/** Grid B-roll — games must end for terminal reward / corpus growth. */
export const CHESS_CLUSTER_LEARNING_GRID_MAX_PLY_V0 = 36;
/** Featured LIVE — shorter than cinematic 120ply cap. */
export const CHESS_CLUSTER_LEARNING_FEATURED_MAX_PLY_V0 = 48;

/** Diverse teacher depths per slot (Stockfish depth ladder + styles). */
export const CHESS_CLUSTER_TEACHER_LEAGUE_V0 = Object.freeze([
  Object.freeze({ slotId: 0, depth: 10, movetimeMs: 900, label: "featured_rhizoh_vs_sf" }),
  Object.freeze({ slotId: 1, depth: 4, movetimeMs: 520, label: "teacher_depth_4" }),
  Object.freeze({ slotId: 2, depth: 6, movetimeMs: 580, label: "teacher_depth_6" }),
  Object.freeze({ slotId: 3, depth: 8, movetimeMs: 640, label: "teacher_depth_8" }),
  Object.freeze({ slotId: 4, depth: 10, movetimeMs: 700, label: "teacher_depth_10" }),
  Object.freeze({ slotId: 5, depth: 12, movetimeMs: 760, label: "teacher_depth_12" }),
  Object.freeze({ slotId: 6, depth: 14, movetimeMs: 820, label: "teacher_depth_14" }),
  Object.freeze({ slotId: 7, depth: 16, movetimeMs: 880, label: "teacher_depth_16" })
]);

/**
 * Learning throughput is always on while cluster runs — broadcast UI must not block game ends.
 */
export function isChessClusterLearningThroughputModeV0() {
  if (typeof window === "undefined") return true;
  return Boolean(window.__rhizoh?.chessGameCluster?.running);
}

/**
 * @param {number} slotId
 */
export function resolveChessClusterLearningMaxPlyV0(slotId) {
  return Number(slotId) === CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0
    ? CHESS_CLUSTER_LEARNING_FEATURED_MAX_PLY_V0
    : CHESS_CLUSTER_LEARNING_GRID_MAX_PLY_V0;
}

/**
 * @param {number} slotId
 */
export function resolveChessClusterTeacherLeagueRowV0(slotId) {
  const id = Number(slotId);
  return (
    CHESS_CLUSTER_TEACHER_LEAGUE_V0.find((r) => r.slotId === id) ||
    CHESS_CLUSTER_TEACHER_LEAGUE_V0[1]
  );
}

/**
 * Merge teacher league depth/movetime into Stockfish opts for cluster slot.
 * @param {number} slotId
 * @param {object} baseOpts
 */
export function applyTeacherLeagueToStockfishOptsV0(slotId, baseOpts = {}) {
  const league = resolveChessClusterTeacherLeagueRowV0(slotId);
  return Object.freeze({
    ...baseOpts,
    depth: Math.max(Number(baseOpts.depth) || 0, league.depth),
    movetimeMs: Math.max(Number(baseOpts.movetimeMs) || 0, league.movetimeMs),
    teacherLeague: league.label
  });
}

export function getChessClusterLearningThroughputSnapshotV0() {
  return Object.freeze({
    schema: CHESS_CLUSTER_LEARNING_THROUGHPUT_SCHEMA_V0,
    learningThroughput: isChessClusterLearningThroughputModeV0(),
    gridMaxPly: CHESS_CLUSTER_LEARNING_GRID_MAX_PLY_V0,
    featuredMaxPly: CHESS_CLUSTER_LEARNING_FEATURED_MAX_PLY_V0,
    teacherLeague: CHESS_CLUSTER_TEACHER_LEAGUE_V0,
    /** Learning sessions use ply cap — not wall-clock timeout (prevents 45s starvation). */
    clocksDisabled: isChessClusterLearningThroughputModeV0(),
    atMs: Date.now()
  });
}

/**
 * During learning throughput, sim clocks must not kill games before ply cap.
 */
export function shouldTickChessClusterClockForLearningV0(slot) {
  if (isChessClusterLearningThroughputModeV0()) return false;
  return true;
}
