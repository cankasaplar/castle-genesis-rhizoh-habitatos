/**
 * Chess Teacher Interface v0 — SSOT for StockfishTeacher + HeuristicTeacher (NullTeacher).
 * Observers and Arena use this facade; Stockfish worker remains implementation detail.
 */

import {
  analyzeChessPositionV0,
  analyzePlayedMoveV0,
  getChessStockfishEngineDetailV0,
  getChessStockfishEngineStatusV0,
  getStockfishArenaMoveV0,
  pickChessArenaEngineMoveV0,
  resetChessStockfishEngineV0,
  CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0
} from "./chessStockfishEngineV0.js";

export const CHESS_TEACHER_INTERFACE_SCHEMA_V0 = "rhizoh.chess_teacher_interface.v0";
export const CHESS_TEACHER_STATUS_EVENT_V0 = CHESS_STOCKFISH_ENGINE_STATUS_EVENT_V0;

export const CHESS_TEACHER_STATUS_V0 = Object.freeze({
  STOCKFISH_WASM: "stockfish_wasm",
  HEURISTIC_FALLBACK: "heuristic_fallback",
  STOCKFISH_INITIALIZING: "stockfish_initializing",
  NOT_STARTED: "not_started"
});

export const CHESS_TEACHER_ID_V0 = Object.freeze({
  STOCKFISH: "stockfish_teacher",
  HEURISTIC: "heuristic_teacher"
});

/**
 * @returns {string}
 */
export function getChessTeacherStatusV0() {
  return getChessStockfishEngineStatusV0();
}

/**
 * @returns {boolean}
 */
export function isChessTeacherOfflineV0() {
  return getChessTeacherStatusV0() === CHESS_TEACHER_STATUS_V0.HEURISTIC_FALLBACK;
}

/**
 * Active teacher id for telemetry / UGE skip reasons.
 * @returns {string}
 */
export function getActiveChessTeacherIdV0() {
  const status = getChessTeacherStatusV0();
  if (status === CHESS_TEACHER_STATUS_V0.STOCKFISH_WASM) {
    return CHESS_TEACHER_ID_V0.STOCKFISH;
  }
  if (status === CHESS_TEACHER_STATUS_V0.HEURISTIC_FALLBACK) {
    return CHESS_TEACHER_ID_V0.HEURISTIC;
  }
  return CHESS_TEACHER_ID_V0.STOCKFISH;
}

/**
 * @returns {object}
 */
export function getChessTeacherDetailV0() {
  const detail = getChessStockfishEngineDetailV0();
  const status = detail.status;
  const teacherId =
    status === CHESS_TEACHER_STATUS_V0.HEURISTIC_FALLBACK
      ? CHESS_TEACHER_ID_V0.HEURISTIC
      : CHESS_TEACHER_ID_V0.STOCKFISH;
  return Object.freeze({
    schema: CHESS_TEACHER_INTERFACE_SCHEMA_V0,
    status,
    teacherId,
    teacherOffline: status === CHESS_TEACHER_STATUS_V0.HEURISTIC_FALLBACK,
    influencesExecution: false,
    engine: detail
  });
}

/**
 * @param {string} fen
 * @param {object} [opts]
 */
export async function analyzeChessPositionViaTeacherV0(fen, opts = {}) {
  const out = await analyzeChessPositionV0(fen, opts);
  return Object.freeze({
    ...out,
    teacherId: getActiveChessTeacherIdV0(),
    teacherStatus: getChessTeacherStatusV0()
  });
}

/**
 * @param {string} fenBefore
 * @param {string} playedMove
 * @param {object} [opts]
 */
export async function analyzePlayedMoveViaTeacherV0(fenBefore, playedMove, opts = {}) {
  const out = await analyzePlayedMoveV0(fenBefore, playedMove, opts);
  return Object.freeze({
    ...out,
    teacherId: getActiveChessTeacherIdV0(),
    teacherStatus: getChessTeacherStatusV0()
  });
}

/**
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 * @param {object} [opts]
 */
export async function pickChessArenaMoveViaTeacherV0(game, opts = {}) {
  const out = await pickChessArenaEngineMoveV0(game, opts);
  const teacherId =
    out.engine === CHESS_TEACHER_STATUS_V0.HEURISTIC_FALLBACK
      ? CHESS_TEACHER_ID_V0.HEURISTIC
      : CHESS_TEACHER_ID_V0.STOCKFISH;
  return Object.freeze({
    ...out,
    teacherId,
    teacherStatus: out.engine
  });
}

/**
 * @param {string} fen
 * @param {object} [opts]
 */
export async function getArenaMoveViaTeacherV0(fen, opts = {}) {
  const move = await getStockfishArenaMoveV0(fen, opts);
  const status = getChessTeacherStatusV0();
  return Object.freeze({
    move,
    engine: status === CHESS_TEACHER_STATUS_V0.HEURISTIC_FALLBACK ? null : move,
    teacherId: getActiveChessTeacherIdV0(),
    teacherStatus: status
  });
}

export function resetChessTeacherV0() {
  resetChessStockfishEngineV0();
  publishChessTeacherRegistryV0();
}

export function publishChessTeacherRegistryV0() {
  if (typeof window === "undefined") return getChessTeacherDetailV0();
  window.__rhizoh = window.__rhizoh || {};
  const detail = getChessTeacherDetailV0();
  window.__rhizoh.chessTeacher = detail;
  return detail;
}
