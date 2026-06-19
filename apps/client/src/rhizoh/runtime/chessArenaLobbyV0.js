/**
 * Chess Arena lobby — seasons, fixtures, quick match presets, learning feed.
 * RESEARCH-ONLY presentation layer (localStorage + __rhizoh probes).
 */

import { CHESS_GAME_MODE_V0 } from "./chessArenaEngineV0.js";
import { listChessArenaArchiveV0 } from "./chessArenaMatchArchiveV0.js";
import { getChessLearningMonitorSnapshotV0 } from "./chessLearningMonitorV0.js";
import { readChessCivilizationV0 } from "./chessCivilizationV0.js";
import { formatClusterEndReasonLabelV0 } from "./chessClusterObservatoryCopyV0.js";

export const CHESS_ARENA_LOBBY_SCHEMA_V0 = "castle.rhizoh.chess_arena_lobby.v0";

export const CHESS_ARENA_QUICK_MATCH_V0 = Object.freeze([
  Object.freeze({
    id: "human_vs_stockfish",
    mode: CHESS_GAME_MODE_V0.AI_HUMAN,
    labelTr: "Sen vs Stockfish",
    labelEn: "You vs Stockfish",
    descTr: "Klasik arena — beyaz sensin",
    descEn: "Classic arena — you play white",
    defaultOpponentPresetId: "TEACHER_BACKUP"
  }),
  Object.freeze({
    id: "rhizoh_learning",
    mode: CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH,
    labelTr: "Rhizoh öğrenme maçı",
    labelEn: "Rhizoh learning match",
    descTr: "Maç sonrası öğrenme döngüsü",
    descEn: "Post-match learning loop",
    defaultOpponentPresetId: "ARENA"
  }),
  Object.freeze({
    id: "ai_spectator",
    mode: CHESS_GAME_MODE_V0.AI_AI,
    labelTr: "Stockfish gözlem",
    labelEn: "Stockfish spectator",
    descTr: "AI vs AI — izle",
    descEn: "AI vs AI — watch",
    defaultOpponentPresetId: "STRONG"
  }),
  Object.freeze({
    id: "team_pets",
    mode: CHESS_GAME_MODE_V0.TEAM_PET_VS_RHIZOH,
    labelTr: "Fox + Octo vs Rhizoh",
    labelEn: "Fox + Octo vs Rhizoh",
    descTr: "Takım varyantı",
    descEn: "Team variant",
    defaultOpponentPresetId: "ARENA"
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
    status: "playable",
    defaultOpponentPresetId: "TEACHER_BACKUP"
  }),
  Object.freeze({
    id: "fx_w24_r4_rhizoh",
    round: 4,
    whiteTr: "Rhizoh AI",
    whiteEn: "Rhizoh AI",
    blackTr: "Fox + Octo",
    blackEn: "Fox + Octo",
    mode: CHESS_GAME_MODE_V0.TEAM_PET_VS_RHIZOH,
    status: "playable",
    defaultOpponentPresetId: "ARENA"
  }),
  Object.freeze({
    id: "fx_w24_r5_cluster",
    round: 5,
    whiteTr: "Rhizoh 8 stile karşı",
    whiteEn: "Rhizoh vs 8 styles",
    blackTr: "Canlı yayın + iz kameraları",
    blackEn: "Live broadcast + trace cameras",
    mode: "cluster",
    status: "playable"
  })
]);

/**
 * @param {number} [limit]
 */
export function listChessArenaArchivePreviewV0(limit = 5) {
  return listChessArenaArchiveV0(limit);
}

/** Live lobby presence — castles online, active cluster boards, invites scaffold. */
export function getChessArenaLobbyPresenceV0() {
  if (typeof window === "undefined") {
    return Object.freeze({
      onlineCastles: 0,
      liveBoards: 0,
      clusterRunning: false,
      invitePending: 0
    });
  }
  const cluster = window.__rhizoh?.chessGameCluster;
  const presence = window.__rhizoh?.worldPresence || window.__rhizoh?.liveMonitor;
  const liveBoards =
    cluster?.slots?.filter((s) => s?.status === "active" && (s.ply || 0) > 0).length ?? 0;
  const onlineCastles = Math.max(
    1,
    Number(presence?.peerCount) || Number(presence?.activeNodes) || (cluster?.running ? 1 : 0)
  );
  return Object.freeze({
    onlineCastles,
    liveBoards,
    clusterRunning: Boolean(cluster?.running),
    clusterTick: cluster?.tickCount ?? 0,
    invitePending: 0
  });
}

export function getChessArenaLearningFeedV0() {
  if (typeof window === "undefined") {
    return Object.freeze({
      policyDiffs: [],
      clusterTick: 0,
      engineStatus: "unknown",
      movesMeasured: 0,
      stockfishMovesMeasured: 0,
      policyDiffsMeasured: 0,
      alignmentRate: null
    });
  }
  const mem = window.__rhizoh?.chessClusterMemory;
  const cluster = window.__rhizoh?.chessGameCluster;
  const engine = window.__rhizoh?.chessStockfishEngine;
  const monitor = getChessLearningMonitorSnapshotV0("lobby");
  const policyDiffs = (mem?.recent || [])
    .filter((n) => n.kind === "policy_diff")
    .concat(monitor.recentPolicyDiffs || [])
    .slice(-4);
  const spectator = monitor.spectator;
  const measurement = monitor.measurement || {};
  const civilization = readChessCivilizationV0();
  const lastEnd = cluster?.lastGameEnd || null;
  const sessionGamesEnded = Number(cluster?.sessionGamesEnded) || 0;
  const tr = typeof window !== "undefined" && window.__rhizoh?.uiLocale === "tr";
  return Object.freeze({
    policyDiffs,
    clusterTick: cluster?.tickCount ?? monitor.clusterTick ?? 0,
    clusterRunning: Boolean(cluster?.running ?? monitor.clusterRunning),
    engineStatus: engine?.status || monitor.engineStatus || "not_started",
    spawnPolicy: engine?.spawnPolicy || monitor.spawnPolicy || null,
    spectatorMode: spectator?.modeLabel || null,
    spectatorPly: spectator?.ply ?? null,
    spectatorClock: spectator?.clock
      ? `${spectator.clock.whiteClock} / ${spectator.clock.blackClock}`
      : null,
    recentMoveCount: monitor.recentMoves?.length ?? 0,
    measurementActive: Boolean(measurement.active),
    movesMeasured: measurement.movesMeasured ?? 0,
    stockfishMovesMeasured: measurement.stockfishMovesMeasured ?? 0,
    policyDiffsMeasured: measurement.policyDiffsMeasured ?? 0,
    alignmentRate: measurement.alignmentRate ?? null,
    rhizohElo: civilization?.elo ?? null,
    sessionGamesEnded,
    lastGameEndLabel: lastEnd
      ? formatClusterEndReasonLabelV0(lastEnd.endReason, lastEnd.ply, tr !== false)
      : null,
    lastGameEnd: lastEnd
  });
}

export function getChessArenaLobbySnapshotV0() {
  return Object.freeze({
    schema: CHESS_ARENA_LOBBY_SCHEMA_V0,
    season: CHESS_ARENA_CURRENT_SEASON_V0,
    fixtures: CHESS_ARENA_FIXTURES_V0,
    quickMatches: CHESS_ARENA_QUICK_MATCH_V0,
    archivePreview: listChessArenaArchivePreviewV0(4),
    presence: getChessArenaLobbyPresenceV0(),
    learningFeed: getChessArenaLearningFeedV0(),
    atMs: Date.now()
  });
}
