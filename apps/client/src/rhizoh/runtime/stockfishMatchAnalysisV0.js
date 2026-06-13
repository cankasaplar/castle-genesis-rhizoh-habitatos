/**
 * Stockfish match analysis v0 — observe, analyze, lesson generation (no LLM).
 */

import { detectChessOpeningV0, detectChessPhaseV0 } from "./chessOpeningDetectV0.js";
import { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";
import { analyzePlayedMoveV0 } from "./chessStockfishEngineV0.js";

export const STOCKFISH_MATCH_ANALYSIS_SCHEMA_V0 = "castle.stockfish_match_analysis.v0";

function uciToSanV0(fen, uci) {
  const move = String(uci || "").trim();
  if (!move) return "";
  try {
    const chess = new Chess(fen);
    const result = chess.move({
      from: move.slice(0, 2),
      to: move.slice(2, 4),
      promotion: move[4] || undefined
    });
    return result?.san || move;
  } catch {
    return move;
  }
}

function formatAlternativeV0(fen, uci) {
  const san = uciToSanV0(fen, uci);
  return san || String(uci || "");
}

/**
 * @param {{
 *   moves: ReadonlyArray<{ san?: string, before?: string, color?: string }>,
 *   localColor?: 'w' | 'b',
 *   opponentCastleId?: string,
 *   matchId?: string,
 *   outcome?: string,
 *   won?: boolean,
 *   draw?: boolean
 * }} opts
 */
export async function analyzeChessMatchV0(opts = {}) {
  const moves = [...(opts.moves || [])];
  const localColor = opts.localColor === "b" ? "b" : "w";
  const opening = detectChessOpeningV0(moves);
  const finalFen = moves.length ? moves[moves.length - 1]?.after : null;
  const phase = finalFen ? detectChessPhaseV0(finalFen) : "middlegame";

  /** @type {object[]} */
  const criticalMoves = [];
  const sampleIndices =
    moves.length <= 12
      ? moves.map((_, i) => i)
      : [2, 4, 6, 8, 10, moves.length - 3, moves.length - 2, moves.length - 1].filter(
          (i) => i >= 0 && i < moves.length
        );

  for (const idx of sampleIndices) {
    const row = moves[idx];
    if (!row?.before || !row?.san) continue;
    if (row.color && row.color !== localColor) continue;
    const analysis = await analyzePlayedMoveV0(row.before, row.san, { depth: 8, movetimeMs: 220 });
    if (!analysis || analysis.swingCp == null) continue;
    criticalMoves.push(
      Object.freeze({
        moveNumber: idx + 1,
        san: row.san,
        swingCp: analysis.swingCp,
        alternative: formatAlternativeV0(row.before, analysis.alternative),
        bestMove: analysis.bestMove,
        fen: row.before
      })
    );
  }

  criticalMoves.sort((a, b) => Math.abs(b.swingCp) - Math.abs(a.swingCp));
  const top = criticalMoves[0] || null;
  const isBlunder = top && top.swingCp <= -120;

  const lessonTitle = isBlunder
    ? `Move ${top.moveNumber} critical error`
    : phase === "endgame"
      ? "Endgame pattern recorded"
      : `Opening study: ${opening.name}`;

  const lessonBody = isBlunder
    ? `Move ${top.moveNumber} (${top.san}) lost ~${Math.abs(Math.round(top.swingCp / 10) / 10)} pawns of eval. Alternative: ${top.alternative || top.bestMove || "—"}.`
    : `This match used ${opening.name}. Phase: ${phase}. Rhizoh Opening Book updated.`;

  const summary = Object.freeze({
    schema: STOCKFISH_MATCH_ANALYSIS_SCHEMA_V0,
    matchId: opts.matchId || null,
    opponentCastleId: opts.opponentCastleId || null,
    opening,
    phase,
    outcome: opts.outcome || null,
    won: opts.won === true,
    draw: opts.draw === true,
    moveCount: moves.length,
    criticalMove: top,
    isBlunder,
    lesson: Object.freeze({
      title: lessonTitle,
      body: lessonBody,
      opening: opening.name,
      eco: opening.eco,
      alternative: top?.alternative || null,
      moveNumber: top?.moveNumber || null
    }),
    observedAt: new Date().toISOString()
  });

  return summary;
}

export { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";
