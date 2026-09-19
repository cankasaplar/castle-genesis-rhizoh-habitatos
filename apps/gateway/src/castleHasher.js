import { Chess } from "chess.js";

// Deterministic PRNG matching Castle engine's src/zobrist.rs
const MASK64 = (1n << 64n) - 1n;
let seed = 1070372n;
function nextRand() {
  seed = (seed ^ ((seed << 13n) & MASK64)) & MASK64;
  seed = (seed ^ (seed >> 7n)) & MASK64;
  seed = (seed ^ ((seed << 17n) & MASK64)) & MASK64;
  return seed;
}

const pieces = Array.from({ length: 2 }, () =>
  Array.from({ length: 6 }, () =>
    Array.from({ length: 64 }, () => nextRand())
  )
);

const sideToMoveKey = nextRand();
const castlingKeys = Array.from({ length: 16 }, () => nextRand());

const PIECE_MAP = {
  p: 0,
  n: 1,
  b: 2,
  r: 3,
  q: 4,
  k: 5
};

/**
 * Computes the exact 64-bit internal Zobrist hash matching castle.exe
 * @param {string} fen
 * @returns {bigint} 64-bit unsigned hash
 */
export function computeCastleZobristHash(fen) {
  const c = new Chess(fen);
  let hash = 0n;

  // Board pieces
  const board = c.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (piece) {
        const colorIdx = piece.color === "w" ? 0 : 1;
        const pieceIdx = PIECE_MAP[piece.type];
        const sq = (7 - r) * 8 + f; // a1=0, h8=63
        hash = (hash ^ pieces[colorIdx][pieceIdx][sq]) & MASK64;
      }
    }
  }

  // Side to move (Castle flips sideToMoveKey only for Black)
  if (c.turn() === "b") {
    hash = (hash ^ sideToMoveKey) & MASK64;
  }

  // Castling rights: K=1, Q=2, k=4, q=8
  const fenParts = fen.trim().split(/\s+/);
  const castlingStr = fenParts[2] || "-";
  let rights = 0;
  if (castlingStr.includes("K")) rights |= 0b0001;
  if (castlingStr.includes("Q")) rights |= 0b0010;
  if (castlingStr.includes("k")) rights |= 0b0100;
  if (castlingStr.includes("q")) rights |= 0b1000;

  hash = (hash ^ castlingKeys[rights]) & MASK64;
  return hash;
}
