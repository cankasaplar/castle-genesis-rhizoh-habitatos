/**
 * Stockfish match analysis v0 — Layer 3: engine eval, mistakes, best moves (no LLM, no teaching).
 */

import { Chess } from "chess.js";
import { detectChessOpeningV0, detectChessPhaseV0 } from "./chessOpeningDetectV0.js";
import { analyzePlayedMoveV0 } from "./chessStockfishEngineV0.js";

export const STOCKFISH_MATCH_ANALYSIS_SCHEMA_V0 = "castle.stockfish_match_analysis.v0";

const MISTAKE_CP_V0 = -80;
const BEST_MOVE_CP_V0 = -25;

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

function classifyMoveV0(row, analysis) {
  const swingCp = analysis?.swingCp;
  if (swingCp == null) return null;
  const base = Object.freeze({
    moveNumber: row.moveNumber,
    san: row.san,
    swingCp,
    alternative: formatAlternativeV0(row.fen, analysis.alternative),
    bestMove: analysis.bestMove,
    fen: row.fen
  });
  if (swingCp <= MISTAKE_CP_V0) {
    return Object.freeze({ ...base, kind: "mistake" });
  }
  if (swingCp >= BEST_MOVE_CP_V0) {
    return Object.freeze({ ...base, kind: "best" });
  }
  return Object.freeze({ ...base, kind: "critical" });
}

/**
 * @param {{
 *   moves: ReadonlyArray<{ san?: string, before?: string, after?: string, color?: string }>,
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

  const sampleIndices =
    moves.length <= 12
      ? moves.map((_, i) => i)
      : [2, 4, 6, 8, 10, moves.length - 3, moves.length - 2, moves.length - 1].filter(
          (i) => i >= 0 && i < moves.length
        );

  /** @type {object[]} */
  const scored = [];
  for (const idx of sampleIndices) {
    const row = moves[idx];
    if (!row?.before || !row?.san) continue;
    if (row.color && row.color !== localColor) continue;
    const analysis = await analyzePlayedMoveV0(row.before, row.san, { depth: 8, movetimeMs: 220 });
    const classified = classifyMoveV0(
      Object.freeze({ moveNumber: idx + 1, san: row.san, fen: row.before }),
      analysis
    );
    if (classified) scored.push(classified);
  }

  scored.sort((a, b) => Math.abs(b.swingCp) - Math.abs(a.swingCp));
  const criticalMoves = scored.filter((m) => m.kind === "critical" || m.kind === "mistake");
  const mistakes = scored.filter((m) => m.kind === "mistake");
  const bestMoves = scored.filter((m) => m.kind === "best");

  return Object.freeze({
    schema: STOCKFISH_MATCH_ANALYSIS_SCHEMA_V0,
    matchId: opts.matchId || null,
    opponentCastleId: opts.opponentCastleId || null,
    opening,
    phase,
    outcome: opts.outcome || null,
    won: opts.won === true,
    draw: opts.draw === true,
    moveCount: moves.length,
    criticalMoves: Object.freeze(criticalMoves.map(({ kind, ...rest }) => Object.freeze(rest))),
    mistakes: Object.freeze(mistakes.map(({ kind, ...rest }) => Object.freeze(rest))),
    bestMoves: Object.freeze(bestMoves.map(({ kind, ...rest }) => Object.freeze(rest))),
    analyzedAt: new Date().toISOString()
  });
}

export { buildMatchMovesWithFenV0 } from "./chessMatchReplayV0.js";
