/**
 * Chess cluster agent policies — multi-agent evaluation strategies.
 * RESEARCH-ONLY — Rhizoh observes; agents play via Stockfish/heuristic.
 */

import { CHESS_STOCKFISH_PRESET_V0 } from "./chessStockfishPresetsV0.js";

export const CHESS_CLUSTER_AGENT_SCHEMA_V0 = "castle.rhizoh.chess_cluster_agent.v0";

export const CHESS_CLUSTER_AGENT_ID_V0 = Object.freeze({
  RHIZOH_AI: "rhizoh_ai",
  RHIZOH_STOCKFISH: "rhizoh_stockfish_agent",
  OCTOAI: "octoai_agent",
  FOX: "fox_agent",
  USER: "user_agent"
});

const AGENT_TABLE_V0 = Object.freeze({
  [CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_AI]: Object.freeze({
    label: "Rhizoh AI",
    preset: "TEACHER_BACKUP",
    skill: 12,
    movetimeMs: 200,
    depth: 10,
    contempt: 6,
    explorationRate: 0.12,
    riskProfile: "learning"
  }),
  [CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH]: Object.freeze({
    label: "Rhizoh Stockfish",
    preset: "ARENA",
    skill: 16,
    movetimeMs: 180,
    depth: 12,
    contempt: 12,
    explorationRate: 0.08,
    riskProfile: "balanced"
  }),
  [CHESS_CLUSTER_AGENT_ID_V0.OCTOAI]: Object.freeze({
    label: "OctoAI",
    preset: "STRONG",
    skill: 18,
    movetimeMs: 280,
    depth: 14,
    contempt: 32,
    explorationRate: 0.1,
    riskProfile: "aggressive"
  }),
  [CHESS_CLUSTER_AGENT_ID_V0.FOX]: Object.freeze({
    label: "Fox",
    preset: "TEACHER_BACKUP",
    skill: 14,
    movetimeMs: 200,
    depth: 11,
    contempt: -8,
    explorationRate: 0.12,
    riskProfile: "defensive"
  }),
  [CHESS_CLUSTER_AGENT_ID_V0.USER]: Object.freeze({
    label: "User mirror",
    preset: "TEACHER_BACKUP",
    skill: 12,
    movetimeMs: 160,
    depth: 10,
    contempt: 0,
    explorationRate: 0.1,
    riskProfile: "human_like"
  })
});

/** Default 8-slot agent pairing (white, black) */
export const CHESS_CLUSTER_SLOT_AGENTS_V0 = Object.freeze([
  [CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH, CHESS_CLUSTER_AGENT_ID_V0.OCTOAI],
  [CHESS_CLUSTER_AGENT_ID_V0.OCTOAI, CHESS_CLUSTER_AGENT_ID_V0.FOX],
  [CHESS_CLUSTER_AGENT_ID_V0.FOX, CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH],
  [CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH, CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH],
  [CHESS_CLUSTER_AGENT_ID_V0.OCTOAI, CHESS_CLUSTER_AGENT_ID_V0.OCTOAI],
  [CHESS_CLUSTER_AGENT_ID_V0.FOX, CHESS_CLUSTER_AGENT_ID_V0.USER],
  [CHESS_CLUSTER_AGENT_ID_V0.USER, CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH],
  [CHESS_CLUSTER_AGENT_ID_V0.OCTOAI, CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH]
]);

/**
 * @param {string} agentId
 */
export function resolveChessClusterAgentPolicyV0(agentId) {
  const id = String(agentId || CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH);
  const row = AGENT_TABLE_V0[id] || AGENT_TABLE_V0[CHESS_CLUSTER_AGENT_ID_V0.RHIZOH_STOCKFISH];
  const preset =
    CHESS_STOCKFISH_PRESET_V0[row.preset] || CHESS_STOCKFISH_PRESET_V0.ARENA;
  return Object.freeze({
    schema: CHESS_CLUSTER_AGENT_SCHEMA_V0,
    agentId: id,
    ...row,
    presetSkill: preset.skill,
    presetMovetimeMs: preset.movetimeMs,
    presetDepth: preset.depth
  });
}

/**
 * Stockfish opts for pickChessArenaEngineMoveV0.
 * @param {string} agentId
 */
export function resolveChessClusterStockfishOptsV0(agentId) {
  const p = resolveChessClusterAgentPolicyV0(agentId);
  return Object.freeze({
    preset: p.preset,
    skill: p.skill,
    movetimeMs: p.movetimeMs,
    depth: p.depth,
    contempt: p.contempt
  });
}

/** Featured slot 0 — stronger opponent for broadcast / YouTube test observation. */
export function resolveFeaturedSlotStockfishOptsV0() {
  const strong = CHESS_STOCKFISH_PRESET_V0.STRONG || CHESS_STOCKFISH_PRESET_V0.ARENA;
  return Object.freeze({
    preset: "STRONG",
    skill: Math.max(strong.skill ?? 18, 18),
    movetimeMs: 1200,
    depth: Math.max(strong.depth ?? 14, 16),
    contempt: 18
  });
}
