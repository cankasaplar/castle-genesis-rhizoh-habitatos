/**
 * Rhizoh Chess Player v0 — learns from Stockfish matches; plays via book + scaled engine.
 */

import { listRhizohOpeningBookV0 } from "./rhizohOpeningBookV0.js";
import { readChessCivilizationV0 } from "./chessCivilizationV0.js";
import { getStockfishArenaMoveV0 } from "./chessStockfishEngineV0.js";
import { stockfishSkillFromEloV0 } from "./chessStockfishPresetsV0.js";
import { pickChessArenaAiMoveV0 } from "./chessArenaEngineV0.js";

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
 */
export async function pickRhizohChessMoveV0(game) {
  const bookMove = pickBookMoveV0(game);
  if (bookMove) {
    return Object.freeze({ move: bookMove, engine: "rhizoh_opening_book" });
  }

  const profile = readChessCivilizationV0();
  const skill = stockfishSkillFromEloV0(profile?.elo || 1200);
  const movetimeMs = Math.min(2800, 900 + skill * 80);

  try {
    const sf = await getStockfishArenaMoveV0(game.fen(), { skill, movetimeMs, depth: 12 + Math.floor(skill / 2) });
    if (sf) return Object.freeze({ move: sf, engine: "rhizoh_learned_stockfish" });
  } catch {
    /* noop */
  }

  return Object.freeze({ move: pickChessArenaAiMoveV0(game), engine: "rhizoh_heuristic_fallback" });
}
