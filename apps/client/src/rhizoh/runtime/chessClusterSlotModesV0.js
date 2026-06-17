/**
 * Chess cluster slot modes — 8 parallel boards, distinct play styles.
 * Single shared Stockfish instance; modes differ by policy not worker count.
 * RESEARCH-ONLY
 */

import { CHESS_CLUSTER_AGENT_ID_V0 } from "./chessClusterAgentPolicyV0.js";

export const CHESS_CLUSTER_SLOT_MODE_SCHEMA_V0 = "castle.rhizoh.chess_cluster_slot_mode.v0";

export const CHESS_CLUSTER_SLOT_MODE_ID_V0 = Object.freeze({
  RHIZOH_VS_STOCKFISH: "rhizoh_vs_stockfish",
  STOCKFISH_BASELINE: "stockfish_baseline",
  AGGRESSIVE_ALPHA: "aggressive_alpha",
  DEFENSIVE_HEURISTIC: "defensive_heuristic",
  RANDOM_PERTURBATION: "random_perturbation",
  USER_REPLAY: "user_replay",
  SELF_PLAY: "self_play",
  OCTO_FOX_HYBRID: "octo_fox_hybrid",
  RL_TRACE: "rl_trace_experimental"
});

/** One mode per board (slot 0–7). */
export const CHESS_CLUSTER_SLOT_MODES_V0 = Object.freeze([
  Object.freeze({
    slotId: 0,
    modeId: CHESS_CLUSTER_SLOT_MODE_ID_V0.RHIZOH_VS_STOCKFISH,
    label: "Rhizoh AI vs Stockfish",
    moveStrategy: "rhizoh_vs_stockfish",
    spectatorFeatured: true,
    whiteAgent: "rhizoh_ai",
    blackAgent: CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH,
    learningTag: "rhizoh_vs_stockfish_learning"
  }),
  Object.freeze({
    slotId: 1,
    modeId: CHESS_CLUSTER_SLOT_MODE_ID_V0.AGGRESSIVE_ALPHA,
    label: "Alpha aggressive",
    moveStrategy: "stockfish_aggressive",
    whiteAgent: CHESS_CLUSTER_AGENT_ID_V0.OCTOAI,
    blackAgent: CHESS_CLUSTER_AGENT_ID_V0.OCTOAI,
    learningTag: "aggression_trace"
  }),
  Object.freeze({
    slotId: 2,
    modeId: CHESS_CLUSTER_SLOT_MODE_ID_V0.DEFENSIVE_HEURISTIC,
    label: "Fox defensive",
    moveStrategy: "stockfish",
    whiteAgent: CHESS_CLUSTER_AGENT_ID_V0.FOX,
    blackAgent: CHESS_CLUSTER_AGENT_ID_V0.FOX,
    learningTag: "defensive_fox"
  }),
  Object.freeze({
    slotId: 3,
    modeId: CHESS_CLUSTER_SLOT_MODE_ID_V0.RANDOM_PERTURBATION,
    label: "Random perturbation",
    moveStrategy: "random_perturb",
    whiteAgent: CHESS_CLUSTER_AGENT_ID_V0.FOX,
    blackAgent: CHESS_CLUSTER_AGENT_ID_V0.OCTOAI,
    learningTag: "exploration_noise"
  }),
  Object.freeze({
    slotId: 4,
    modeId: CHESS_CLUSTER_SLOT_MODE_ID_V0.USER_REPLAY,
    label: "User mirror",
    moveStrategy: "stockfish",
    whiteAgent: CHESS_CLUSTER_AGENT_ID_V0.USER,
    blackAgent: CHESS_CLUSTER_AGENT_ID_V0.USER,
    learningTag: "user_mirror"
  }),
  Object.freeze({
    slotId: 5,
    modeId: CHESS_CLUSTER_SLOT_MODE_ID_V0.SELF_PLAY,
    label: "Self-play",
    moveStrategy: "stockfish",
    whiteAgent: CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH,
    blackAgent: CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH,
    learningTag: "self_play"
  }),
  Object.freeze({
    slotId: 6,
    modeId: CHESS_CLUSTER_SLOT_MODE_ID_V0.OCTO_FOX_HYBRID,
    label: "OctoAI + Fox hybrid",
    moveStrategy: "stockfish_aggressive",
    whiteAgent: CHESS_CLUSTER_AGENT_ID_V0.OCTOAI,
    blackAgent: CHESS_CLUSTER_AGENT_ID_V0.FOX,
    learningTag: "octo_fox_style"
  }),
  Object.freeze({
    slotId: 7,
    modeId: CHESS_CLUSTER_SLOT_MODE_ID_V0.RL_TRACE,
    label: "Octo vs Fox RL",
    moveStrategy: "stockfish_aggressive",
    whiteAgent: CHESS_CLUSTER_AGENT_ID_V0.OCTOAI,
    blackAgent: CHESS_CLUSTER_AGENT_ID_V0.FOX,
    learningTag: "rl_trace"
  })
]);

/**
 * @param {number} slotId
 */
export function resolveChessClusterSlotModeV0(slotId) {
  const id = Number(slotId);
  const row =
    CHESS_CLUSTER_SLOT_MODES_V0[id] ||
    CHESS_CLUSTER_SLOT_MODES_V0[0];
  return Object.freeze({
    schema: CHESS_CLUSTER_SLOT_MODE_SCHEMA_V0,
    ...row
  });
}
