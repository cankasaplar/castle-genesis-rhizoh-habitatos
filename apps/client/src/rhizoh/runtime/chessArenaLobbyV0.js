/**
 * Chess Arena lobby — seasons, fixtures, quick match presets, learning feed.
 * RESEARCH-ONLY presentation layer (localStorage + __rhizoh probes).
 */

import { CHESS_GAME_MODE_V0 } from "./chessArenaEngineV0.js";
import { listChessArenaArchiveV0 } from "./chessArenaMatchArchiveV0.js";

export const CHESS_ARENA_LOBBY_SCHEMA_V0 = "castle.rhizoh.chess_arena_lobby.v0";

export const CHESS_ARENA_QUICK_MATCH_V0 = Object.freeze([
  Object.freeze({
    id: "human_vs_stockfish",
    mode: CHESS_GAME_MODE_V0.AI_HUMAN,
    labelTr: "Sen vs Stockfish",
    labelEn: "You vs Stockfish",
    descTr: "Klasik arena — beyaz sensin",
    descEn: "Classic arena — you play white"
  }),
  Object.freeze({
    id: "rhizoh_learning",
    mode: CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH,
    labelTr: "Rhizoh öğrenme maçı",
    labelEn: "Rhizoh learning match",
    descTr: "Maç sonrası öğrenme döngüsü",
    descEn: "Post-match learning loop"
  }),
  Object.freeze({
    id: "ai_spectator",
    mode: CHESS_GAME_MODE_V0.AI_AI,
    labelTr: "Stockfish gözlem",
    labelEn: "Stockfish spectator",
    descTr: "AI vs AI — izle",
    descEn: "AI vs AI — watch"
  }),
  Object.freeze({
    id: "team_pets",
    mode: CHESS_GAME_MODE_V0.TEAM_PET_VS_RHIZOH,
    labelTr: "Fox + Octo vs Rhizoh",
    labelEn: "Fox + Octo vs Rhizoh",
    descTr: "Takım varyantı",
    descEn: "Team variant"
  })
]);

export const CHESS_ARENA_CURRENT_SEASON_V0 = Object.freeze({
  id: "season_2026_w24",
  labelTr: "Sezon 2026 · Hafta 24",
  labelEn: "Season 2026 · Week 24",
  round: 3,
  totalRounds: 8
});

export const CHESS_ARENA_FIXTURES_V0 = Object.freeze([
  Object.freeze({
    id: "fx_w24_r3_you",
    round: 3,
    whiteTr: "Sen",
    whiteEn: "You",
    blackTr: "Stockfish",
    blackEn: "Stockfish",
    mode: CHESS_GAME_MODE_V0.AI_HUMAN,
    status: "next"
  }),
  Object.freeze({
    id: "fx_w24_r4_rhizoh",
    round: 4,
    whiteTr: "Rhizoh AI",
    whiteEn: "Rhizoh AI",
    blackTr: "Fox + Octo",
    blackEn: "Fox + Octo",
    mode: CHESS_GAME_MODE_V0.TEAM_PET_VS_RHIZOH,
    status: "scheduled"
  }),
  Object.freeze({
    id: "fx_w24_r5_cluster",
    round: 5,
    whiteTr: "8 Board Observatory",
    whiteEn: "8 Board Observatory",
    blackTr: "MultiPV trace",
    blackEn: "MultiPV trace",
    mode: "cluster",
    status: "scheduled"
  })
]);

/**
 * @param {number} [limit]
 */
export function listChessArenaArchivePreviewV0(limit = 5) {
  return listChessArenaArchiveV0(limit);
}

export function getChessArenaLearningFeedV0() {
  if (typeof window === "undefined") {
    return Object.freeze({ policyDiffs: [], clusterTick: 0, engineStatus: "unknown" });
  }
  const mem = window.__rhizoh?.chessClusterMemory;
  const cluster = window.__rhizoh?.chessGameCluster;
  const engine = window.__rhizoh?.chessStockfishEngine;
  const policyDiffs = (mem?.recent || []).filter((n) => n.kind === "policy_diff").slice(-4);
  return Object.freeze({
    policyDiffs,
    clusterTick: cluster?.tickCount ?? 0,
    clusterRunning: Boolean(cluster?.running),
    engineStatus: engine?.status || "not_started",
    spawnPolicy: engine?.spawnPolicy || null
  });
}

export function getChessArenaLobbySnapshotV0() {
  return Object.freeze({
    schema: CHESS_ARENA_LOBBY_SCHEMA_V0,
    season: CHESS_ARENA_CURRENT_SEASON_V0,
    fixtures: CHESS_ARENA_FIXTURES_V0,
    quickMatches: CHESS_ARENA_QUICK_MATCH_V0,
    archivePreview: listChessArenaArchivePreviewV0(4),
    learningFeed: getChessArenaLearningFeedV0(),
    atMs: Date.now()
  });
}
