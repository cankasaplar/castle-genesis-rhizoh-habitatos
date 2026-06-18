/**
 * Chess broadcast opponent matrix v0 — YT4 stream format reference.
 * Maps cluster slots + arena presets for OBS / unlisted YouTube test.
 * RESEARCH-ONLY
 */

import { CHESS_CLUSTER_SLOT_MODES_V0 } from "./chessClusterSlotModesV0.js";
import { CHESS_CLUSTER_AGENT_ID_V0, resolveChessClusterAgentPolicyV0 } from "./chessClusterAgentPolicyV0.js";
import { CHESS_STOCKFISH_PRESET_V0 } from "./chessStockfishPresetsV0.js";
import { CHESS_OPPONENT_PRESET_V0 } from "./chessArenaSessionV0.js";

export const CHESS_BROADCAST_OPPONENT_MATRIX_SCHEMA_V0 =
  "castle.rhizoh.chess_broadcast_opponent_matrix.v0";

export const CHESS_BROADCAST_FEATURED_MATCH_V0 = Object.freeze({
  slotId: 0,
  format: "RhizohAI vs Stockfish MAX",
  white: CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_AI,
  black: CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH,
  blackPreset: "MAX",
  timeControlId: "cluster_sim_45_0",
  streamLabel: "[TEST V0] Rhizoh Chess Cluster · Featured slot 0"
});

/** Arena human workspace tiers (separate from cluster background boards). */
export const CHESS_BROADCAST_ARENA_TIERS_V0 = Object.freeze(
  Object.values(CHESS_OPPONENT_PRESET_V0).map((row) =>
    Object.freeze({
      id: row.id,
      labelEn: row.labelEn,
      preset: row.preset,
      stockfish: CHESS_STOCKFISH_PRESET_V0[row.preset] || null
    })
  )
);

/**
 * @returns {object}
 */
export function getChessBroadcastOpponentMatrixV0() {
  const clusterSlots = CHESS_CLUSTER_SLOT_MODES_V0.map((mode) => {
    const white = resolveChessClusterAgentPolicyV0(mode.whiteAgent);
    const black = resolveChessClusterAgentPolicyV0(mode.blackAgent);
    return Object.freeze({
      slotId: mode.slotId,
      modeId: mode.modeId,
      label: mode.label,
      spectatorFeatured: Boolean(mode.spectatorFeatured),
      white: Object.freeze({ agentId: mode.whiteAgent, preset: white.preset, label: white.label }),
      black: Object.freeze({ agentId: mode.blackAgent, preset: black.preset, label: black.label }),
      learningTag: mode.learningTag
    });
  });

  return Object.freeze({
    schema: CHESS_BROADCAST_OPPONENT_MATRIX_SCHEMA_V0,
    interpretationOnly: true,
    featuredMatch: CHESS_BROADCAST_FEATURED_MATCH_V0,
    clusterSlots,
    arenaTiers: CHESS_BROADCAST_ARENA_TIERS_V0,
    heuristicAgents: Object.freeze(["octoai_agent", "fox_agent"]),
    stockfishTiers: Object.freeze(["TEACHER_BACKUP", "ARENA", "STRONG", "MAX"]),
    atMs: Date.now()
  });
}

export function ensureChessBroadcastOpponentMatrixDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.chessBroadcastOpponentMatrix = getChessBroadcastOpponentMatrixV0;
  return getChessBroadcastOpponentMatrixV0();
}
