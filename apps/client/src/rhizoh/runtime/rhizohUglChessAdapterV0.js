/**
 * UGL Chess Game Adapter — first UGL plugin (ruleset plugin).
 * RESEARCH-ONLY
 */

import { createChessArenaGameV0 } from "./chessArenaEngineV0.js";
import { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";
import { encodeUglStateV0 } from "./rhizohUglStateEncoderV0.js";
import { encodeUglActionV0 } from "./rhizohUglActionSpaceV0.js";
import { computeUglRewardV0 } from "./rhizohUglRewardModelV0.js";
import { RHIZOH_UGL_GAME_TYPE_V0 } from "./rhizohUglSchemaV0.js";

export const RHIZOH_UGL_CHESS_ADAPTER_SCHEMA_V0 = "castle.rhizoh.ugl_chess_adapter.v0";
export const RHIZOH_UGL_CHESS_RULESET_ID_V0 = "chess.standard.fen.v0";

const START_FEN_V0 = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function initChessUglStateV0(fen = START_FEN_V0) {
  return encodeUglStateV0(RHIZOH_UGL_GAME_TYPE_V0.CHESS, {
    fen,
    rulesetId: RHIZOH_UGL_CHESS_RULESET_ID_V0
  });
}

/**
 * @param {string} fen
 * @returns {object[]}
 */
export function legalChessUglActionsV0(fen) {
  try {
    const game = createChessArenaGameV0({ fen });
    const moves = game.chess.moves({ verbose: true });
    return moves.map((m) =>
      encodeUglActionV0(RHIZOH_UGL_GAME_TYPE_V0.CHESS, {
        actorId: m.color === "w" ? "white" : "black",
        uci: `${m.from}${m.to}${m.promotion || ""}`,
        san: m.san,
        type: "move"
      })
    );
  } catch {
    return [];
  }
}

/**
 * @param {string} fen
 * @param {{ uci?: string, san?: string, actorId?: string }} action
 * @returns {{ state: object, terminal: boolean, outcome: string|null }}
 */
export function applyChessUglActionV0(fen, action = {}) {
  const game = createChessArenaGameV0({ fen });
  const uci = String(action.uci || action.payload?.uci || "").trim();
  const san = String(action.san || action.payload?.san || "").trim();
  let ok = false;
  if (uci) ok = Boolean(game.chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined }));
  else if (san) ok = Boolean(game.chess.move(san));
  const afterFen = game.fen();
  const terminal = game.chess.isGameOver();
  let outcome = null;
  if (terminal) {
    if (game.chess.isCheckmate()) outcome = game.chess.turn() === "w" ? "0-1" : "1-0";
    else if (game.chess.isDraw()) outcome = "1/2-1/2";
    else outcome = "*";
  }
  return Object.freeze({
    state: encodeUglStateV0(RHIZOH_UGL_GAME_TYPE_V0.CHESS, {
      fen: afterFen,
      rulesetId: RHIZOH_UGL_CHESS_RULESET_ID_V0
    }),
    terminal,
    outcome,
    fen: afterFen
  });
}

/**
 * Terminal reward from chess outcome.
 * @param {string|null} outcome
 */
export function chessTerminalRewardV0(outcome, actorId = "white") {
  if (!outcome || outcome === "*") return 0;
  if (outcome === "1/2-1/2") return 0;
  const actorIsWhite = String(actorId).toLowerCase().startsWith("w");
  if (outcome === "1-0") return actorIsWhite ? 1 : -1;
  if (outcome === "0-1") return actorIsWhite ? -1 : 1;
  return 0;
}

/**
 * @param {string} fenBefore
 * @param {object} action
 * @param {{ visitCount?: number }} [ctx]
 */
export function rewardChessUglTransitionV0(fenBefore, action, ctx = {}) {
  const applied = applyChessUglActionV0(fenBefore, action);
  const terminal = applied.terminal
    ? chessTerminalRewardV0(applied.outcome, action.actorId)
    : 0;
  return computeUglRewardV0({
    terminal,
    isNewPosition: ctx.visitCount != null ? ctx.visitCount <= 1 : false,
    visitCount: ctx.visitCount
  });
}

/**
 * Replay SAN list into UGL states (deterministic transition chain).
 * @param {readonly string[]} moves
 */
export function replayChessMovesToUglStatesV0(moves = []) {
  const trace = buildMatchMovesWithFenV0(moves);
  return Object.freeze(
    trace.map((row, i) =>
      Object.freeze({
        ply: i + 1,
        san: row.san,
        state: encodeUglStateV0(RHIZOH_UGL_GAME_TYPE_V0.CHESS, {
          fen: row.after,
          rulesetId: RHIZOH_UGL_CHESS_RULESET_ID_V0
        })
      })
    )
  );
}

export function isChessUglTerminalV0(fen) {
  try {
    const game = createChessArenaGameV0({ fen });
    return game.chess.isGameOver();
  } catch {
    return false;
  }
}

export function getChessUglAdapterV0() {
  return Object.freeze({
    schema: RHIZOH_UGL_CHESS_ADAPTER_SCHEMA_V0,
    rulesetId: RHIZOH_UGL_CHESS_RULESET_ID_V0,
    gameType: RHIZOH_UGL_GAME_TYPE_V0.CHESS,
    init: initChessUglStateV0,
    legalActions: legalChessUglActionsV0,
    apply: applyChessUglActionV0,
    terminal: isChessUglTerminalV0,
    reward: rewardChessUglTransitionV0
  });
}
