/**
 * Chess board display — Kanagawa neon accents, FIDE cburnett pieces, last-move glow.
 * RESEARCH-ONLY presentation layer.
 */

import { SPIRAL_MMO_COLOR_HEX_V0 } from "./spiralMMOAwakeningPaletteV0.js";

export const CHESS_ARENA_BOARD_DISPLAY_SCHEMA_V0 = "castle.rhizoh.chess_arena_board_display.v0";
export const CHESS_FIDE_PIECE_BASE_V0 = "/chess/pieces/cburnett";

export const RHIZOH_CHESS_MOVE_GLOW_V0 = Object.freeze({
  from: SPIRAL_MMO_COLOR_HEX_V0.cyan,
  to: SPIRAL_MMO_COLOR_HEX_V0.green,
  ring: SPIRAL_MMO_COLOR_HEX_V0.blue
});

/**
 * @param {string} color - 'w' | 'b'
 * @param {string} type - 'k' | 'q' | 'r' | 'b' | 'n' | 'p'
 */
export function resolveChessFidePieceSrcV0(color, type) {
  const c = color === "b" ? "b" : "w";
  const t = String(type || "p").toUpperCase();
  const map = { K: "K", Q: "Q", R: "R", B: "B", N: "N", P: "P" };
  const key = map[t] || "P";
  return `${CHESS_FIDE_PIECE_BASE_V0}/${c}${key}.svg`;
}

/**
 * @param {string} uci - e.g. e2e4
 */
export function parseChessUciSquaresV0(uci) {
  const raw = String(uci || "").trim();
  if (raw.length < 4) return null;
  const from = raw.slice(0, 2);
  const to = raw.slice(2, 4);
  if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) return null;
  return Object.freeze({ from, to });
}

/**
 * @param {{ uci?: string, san?: string }} move
 */
export function resolveChessLastMoveSquaresV0(move) {
  if (!move) return null;
  if (move.from && move.to) {
    return Object.freeze({ from: move.from, to: move.to });
  }
  return parseChessUciSquaresV0(move.uci);
}

/**
 * @param {string} square
 * @param {{ from?: string, to?: string }} lastMove
 */
export function resolveChessSquareGlowStyleV0(square, lastMove) {
  if (!square || !lastMove) return undefined;
  if (square === lastMove.from) {
    return {
      boxShadow: `inset 0 0 0 2px ${RHIZOH_CHESS_MOVE_GLOW_V0.from}, 0 0 14px ${RHIZOH_CHESS_MOVE_GLOW_V0.from}88`
    };
  }
  if (square === lastMove.to) {
    return {
      boxShadow: `inset 0 0 0 2px ${RHIZOH_CHESS_MOVE_GLOW_V0.to}, 0 0 18px ${RHIZOH_CHESS_MOVE_GLOW_V0.to}aa`
    };
  }
  return undefined;
}
