/**
 * Chess Match Observer v0 — Layer 2: structured post-game snapshot (LLM-free).
 */

import { detectChessOpeningV0 } from "./chessOpeningDetectV0.js";
import { analyzeChessMatchV0 } from "./stockfishMatchAnalysisV0.js";
import { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";

export const CHESS_MATCH_OBSERVER_SCHEMA_V0 = "castle.chess_match_observation.v0";

/**
 * @param {{ won?: boolean, draw?: boolean, localColor?: 'w' | 'b', outcome?: string }} opts
 */
function resolveWinnerV0(opts = {}) {
  if (opts.draw === true || opts.outcome === "draw" || opts.outcome === "stalemate") {
    return "draw";
  }
  if (opts.won === true) return "local";
  if (opts.won === false) return "opponent";
  if (opts.outcome === "white_wins") return opts.localColor === "b" ? "opponent" : "local";
  if (opts.outcome === "black_wins") return opts.localColor === "b" ? "local" : "opponent";
  return null;
}

/**
 * Layer 2 + 3: observe game facts, run Stockfish analyze, emit structured observation.
 * @param {{
 *   gameId?: string,
 *   matchId?: string,
 *   moves?: ReadonlyArray<object|string>,
 *   localColor?: 'w' | 'b',
 *   opponentCastleId?: string,
 *   outcome?: string,
 *   won?: boolean,
 *   draw?: boolean
 * }} opts
 */
export async function observeChessMatchV0(opts = {}) {
  const rows = Array.isArray(opts.moves) && opts.moves[0]?.before
    ? opts.moves
    : buildMatchMovesWithFenV0(opts.moves || []);
  const opening = detectChessOpeningV0(rows);
  const analysis = await analyzeChessMatchV0({
    moves: rows,
    localColor: opts.localColor,
    opponentCastleId: opts.opponentCastleId,
    matchId: opts.matchId || opts.gameId,
    outcome: opts.outcome,
    won: opts.won,
    draw: opts.draw
  });

  const gameId = String(opts.gameId || opts.matchId || `game_${Date.now().toString(36)}`);

  return Object.freeze({
    schema: CHESS_MATCH_OBSERVER_SCHEMA_V0,
    gameId,
    eco: opening.eco || analysis.opening?.eco || null,
    openingName: opening.name || analysis.opening?.name || "Unknown Opening",
    winner: resolveWinnerV0(opts),
    opponentCastleId: opts.opponentCastleId || null,
    localColor: opts.localColor === "b" ? "b" : "w",
    moveCount: rows.length,
    phase: analysis.phase,
    outcome: opts.outcome || null,
    criticalMoves: Object.freeze([...(analysis.criticalMoves || [])]),
    mistakes: Object.freeze([...(analysis.mistakes || [])]),
    bestMoves: Object.freeze([...(analysis.bestMoves || [])]),
    observedAt: new Date().toISOString()
  });
}
