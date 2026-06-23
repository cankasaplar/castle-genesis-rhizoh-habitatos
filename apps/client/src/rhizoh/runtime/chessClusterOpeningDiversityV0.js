/**
 * Cluster opening diversity — random book seed per new game (not always e4 e5).
 * RESEARCH-ONLY
 */

export const CHESS_CLUSTER_OPENING_DIVERSITY_SCHEMA_V0 =
  "castle.rhizoh.chess_cluster_opening_diversity.v0";

/** SAN plies applied at slot creation (both sides alternate). */
export const CHESS_CLUSTER_OPENING_SEEDS_V0 = Object.freeze([
  Object.freeze({ name: "Italian", bucket: "Italian", moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"] }),
  Object.freeze({ name: "Sicilian", bucket: "King's Pawn", moves: ["e4", "c5"] }),
  Object.freeze({ name: "French", bucket: "King's Pawn", moves: ["e4", "e6"] }),
  Object.freeze({ name: "Caro-Kann", bucket: "King's Pawn", moves: ["e4", "c6"] }),
  Object.freeze({ name: "Scandinavian", bucket: "King's Pawn", moves: ["e4", "d5"] }),
  Object.freeze({ name: "London", bucket: "Queen's Gambit", moves: ["d4", "d5", "Bf4"] }),
  Object.freeze({ name: "Queen's Gambit", bucket: "Queen's Gambit", moves: ["d4", "d5", "c4"] }),
  Object.freeze({ name: "King's Indian", bucket: "Other", moves: ["d4", "Nf6", "c4", "g6"] }),
  Object.freeze({ name: "English", bucket: "English", moves: ["c4", "e5"] }),
  Object.freeze({ name: "Scotch", bucket: "Scotch", moves: ["e4", "e5", "Nf3", "Nc6", "d4"] })
]);

let seedCursorV0 = 0;

/**
 * Deterministic variety per slot + session — not identical across 8 boards.
 * @param {number} slotId
 */
export function pickClusterOpeningSeedV0(slotId) {
  const id = Number(slotId) || 0;
  const idx = (id + seedCursorV0 + Date.now()) % CHESS_CLUSTER_OPENING_SEEDS_V0.length;
  return CHESS_CLUSTER_OPENING_SEEDS_V0[idx];
}

/**
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 * @param {{ moves?: string[] }} seed
 */
export function applyClusterOpeningSeedV0(game, seed) {
  const moves = Array.isArray(seed?.moves) ? seed.moves : [];
  const applied = [];
  for (const san of moves) {
    const result = game.tryMove(String(san || "").trim());
    if (!result?.ok) break;
    applied.push(String(san));
  }
  return Object.freeze({
    schema: CHESS_CLUSTER_OPENING_DIVERSITY_SCHEMA_V0,
    name: seed?.name || "Unknown",
    bucket: seed?.bucket || "Other",
    requested: moves.length,
    applied: applied.length,
    moves: Object.freeze(applied)
  });
}

/** Test helper — advance seed cursor. */
export function bumpClusterOpeningSeedCursorForTestV0(n = 1) {
  seedCursorV0 += n;
}
