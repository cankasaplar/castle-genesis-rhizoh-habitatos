/**
 * Chess match replay v0 — rebuild FEN rows from SAN history (no Stockfish).
 */

import { Chess } from "chess.js";

/**
 * Build move rows with `before` FEN from SAN list (replay).
 * @param {ReadonlyArray<string|{ san?: string, before?: string, color?: string }>} moves
 */
export function buildMatchMovesWithFenV0(moves = []) {
  const chess = new Chess();
  const rows = [];
  for (const raw of moves) {
    const san = typeof raw === "string" ? raw : raw?.san;
    if (!san) continue;
    const before = chess.fen();
    const color = chess.turn();
    try {
      const result = chess.move(san);
      rows.push(
        Object.freeze({
          san: result.san,
          before,
          after: chess.fen(),
          color
        })
      );
    } catch {
      break;
    }
  }
  return Object.freeze(rows);
}
