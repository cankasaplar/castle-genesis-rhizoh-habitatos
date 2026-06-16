/**
 * Rhizoh Chess Player v0 — learns from Stockfish matches; plays via book + scaled engine.
 */

import { listRhizohOpeningBookV0 } from "./rhizohOpeningBookV0.js";
import { readChessCivilizationV0 } from "./chessCivilizationV0.js";
import { getStockfishArenaMoveV0 } from "./chessStockfishEngineV0.js";
import { stockfishSkillFromEloV0 } from "./chessStockfishPresetsV0.js";
import { pickChessArenaAiMoveV0, estimateChessMaterialBalanceV0 } from "./chessArenaEngineV0.js";
import { readChessPolicyModeV0, resolveRhizohChessEngineParamsV0 } from "./chessPolicyModeV0.js";
import {
  readChessLearningWeightsV0,
  resolveLearningWeightDeltasV0
} from "./chessLearningWeightsV0.js";
import {
  readChessHistoricalMindIdV0,
  resolveChessMindBlendV0
} from "./chessHistoricalMindV0.js";

export const RHIZOH_CHESS_PLAYER_SCHEMA_V0 = "rhizoh.chess_player.v0";

/**
 * Try learned opening line move (first 12 plies).
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 */
function pickBookMoveV0(game) {
  const ply = game.moveHistory?.length || 0;
  if (ply >= 12) return null;
  const book = listRhizohOpeningBookV0();
  if (!book.length) return null;
  const top = book[0];
  const moves = Array.isArray(top.moves) ? top.moves : [];
  const san = moves[ply];
  if (!san) return null;
  const legal = game.legalMoves().find((m) => m.san === san);
  return legal ? legal.san : null;
}

/**
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 * @param {{ policyMode?: string }} [opts]
 */
export async function pickRhizohChessMoveV0(game, opts = {}) {
  const bookMove = pickBookMoveV0(game);
  if (bookMove) {
    return Object.freeze({ move: bookMove, engine: "rhizoh_opening_book" });
  }

  const profile = readChessCivilizationV0();
  const baseSkill = stockfishSkillFromEloV0(profile?.elo || 1200);
  const materialLead = estimateChessMaterialBalanceV0(game, "w");
  const policyMode = opts.policyMode || readChessPolicyModeV0();
  const learningWeights = readChessLearningWeightsV0();
  const mindBlend = resolveChessMindBlendV0({
    mindId: opts.mindId || readChessHistoricalMindIdV0(),
    learningWeights
  });
  const engineParams = resolveRhizohChessEngineParamsV0({
    baseSkill,
    materialLead,
    isCheck: game.chess.isCheck(),
    policyMode,
    learningDeltas: resolveLearningWeightDeltasV0(learningWeights),
    mindBlend
  });

  try {
    const sf = await getStockfishArenaMoveV0(game.fen(), {
      skill: engineParams.skill,
      movetimeMs: engineParams.movetimeMs,
      depth: engineParams.depth,
      contempt: engineParams.contempt
    });
    if (sf) {
      return Object.freeze({
        move: sf,
        engine: "rhizoh_learned_stockfish",
        policyMode: engineParams.policyMode,
        mindId: engineParams.mindId,
        engineParams
      });
    }
  } catch {
    /* noop */
  }

  return Object.freeze({
    move: pickChessArenaAiMoveV0(game),
    engine: "rhizoh_heuristic_fallback",
    policyMode
  });
}
