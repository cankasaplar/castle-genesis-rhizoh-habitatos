/**
 * Cluster simulation policy — faster time controls + ply cap for learning game ends.
 * RESEARCH-ONLY
 */

import { CHESS_TIME_CONTROL_V0 } from "./chessArenaSessionV0.js";

export const CHESS_CLUSTER_SIMULATION_POLICY_SCHEMA_V0 =
  "castle.rhizoh.chess_cluster_simulation_policy.v0";

/** Default cluster TC — 45s for faster session game_end in shadow prod. */
export const CHESS_CLUSTER_DEFAULT_TIME_CONTROL_ID_V0 = "cluster_sim_45_0";

/** Force draw after this ply (~7s/board → ~9 min worst case; clock flags first). */
export const CHESS_CLUSTER_MAX_PLY_V0 = 80;

export const CHESS_CLUSTER_SIM_TIME_CONTROLS_V0 = Object.freeze({
  CLUSTER_SIM_45_0: Object.freeze({
    id: "cluster_sim_45_0",
    labelTr: "Cluster sim 45+0",
    labelEn: "Cluster sim 45+0",
    initialMs: 45_000,
    incrementMs: 0
  }),
  CLUSTER_SIM_1_0: Object.freeze({
    id: "cluster_sim_1_0",
    labelTr: "Cluster sim 1+0",
    labelEn: "Cluster sim 1+0",
    initialMs: 60_000,
    incrementMs: 0
  }),
  CLUSTER_SIM_2_1: Object.freeze({
    id: "cluster_sim_2_1",
    labelTr: "Cluster sim 2+1",
    labelEn: "Cluster sim 2+1",
    initialMs: 120_000,
    incrementMs: 1_000
  })
});

/**
 * Cluster sim TC ids — arena session TCs must not bleed into the learning cluster.
 * @param {string} [raw]
 */
export function isChessClusterSimulationTimeControlIdV0(raw) {
  return String(raw || "").startsWith("cluster_sim_");
}

/**
 * @param {string} [raw]
 */
export function resolveChessClusterTimeControlV0(raw) {
  const id = String(raw || CHESS_CLUSTER_DEFAULT_TIME_CONTROL_ID_V0);
  const cluster =
    CHESS_CLUSTER_SIM_TIME_CONTROLS_V0.CLUSTER_SIM_45_0.id === id
      ? CHESS_CLUSTER_SIM_TIME_CONTROLS_V0.CLUSTER_SIM_45_0
      : CHESS_CLUSTER_SIM_TIME_CONTROLS_V0.CLUSTER_SIM_1_0.id === id
        ? CHESS_CLUSTER_SIM_TIME_CONTROLS_V0.CLUSTER_SIM_1_0
        : CHESS_CLUSTER_SIM_TIME_CONTROLS_V0.CLUSTER_SIM_2_1.id === id
          ? CHESS_CLUSTER_SIM_TIME_CONTROLS_V0.CLUSTER_SIM_2_1
          : null;
  if (cluster) return cluster;
  const arena = Object.values(CHESS_TIME_CONTROL_V0).find((tc) => tc.id === id);
  return arena || CHESS_CLUSTER_SIM_TIME_CONTROLS_V0.CLUSTER_SIM_45_0;
}

export function resolveChessClusterBootOptsV0(opts = {}) {
  return Object.freeze({
    minIntervalMs: opts.minIntervalMs ?? 900,
    timeControlId: opts.timeControlId || CHESS_CLUSTER_DEFAULT_TIME_CONTROL_ID_V0,
    maxPly: opts.maxPly ?? CHESS_CLUSTER_MAX_PLY_V0
  });
}

/**
 * @param {number} ply
 * @param {number} [maxPly]
 */
export function shouldEndChessClusterGameByPlyCapV0(ply, maxPly = CHESS_CLUSTER_MAX_PLY_V0) {
  return Number(ply) >= Number(maxPly);
}
