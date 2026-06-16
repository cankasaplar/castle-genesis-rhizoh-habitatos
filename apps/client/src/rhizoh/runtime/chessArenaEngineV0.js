/**
 * Chess Arena engine v0 — real FIDE rules via chess.js.
 * Modes: blitz, daily, ai_human, human_human, ai_ai.
 */

import { Chess } from "chess.js";

export const CHESS_ARENA_ENGINE_SCHEMA_V0 = "castle.chess_arena_engine.v0";

export const CHESS_GAME_MODE_V0 = Object.freeze({
  BLITZ: "blitz",
  DAILY: "daily",
  AI_HUMAN: "ai_human",
  HUMAN_HUMAN: "human_human",
  AI_AI: "ai_ai",
  RHIZOH_STOCKFISH: "rhizoh_stockfish",
  TEAM_PET_VS_RHIZOH: "team_pet_vs_rhizoh"
});

export const CHESS_PLAYER_SIDE_V0 = Object.freeze({
  WHITE: "w",
  BLACK: "b"
});

function modeMeta(mode) {
  const m = String(mode || CHESS_GAME_MODE_V0.BLITZ);
  if (m === CHESS_GAME_MODE_V0.DAILY) {
    return Object.freeze({ label: "Daily", timeControlMs: 86_400_000 });
  }
  if (m === CHESS_GAME_MODE_V0.BLITZ) {
    return Object.freeze({ label: "Blitz", timeControlMs: 300_000 });
  }
  if (m === CHESS_GAME_MODE_V0.AI_HUMAN) {
    return Object.freeze({ label: "AI vs Human", timeControlMs: 600_000 });
  }
  if (m === CHESS_GAME_MODE_V0.HUMAN_HUMAN) {
    return Object.freeze({ label: "Human vs Human", timeControlMs: 900_000 });
  }
  if (m === CHESS_GAME_MODE_V0.AI_AI) {
    return Object.freeze({ label: "AI vs AI", timeControlMs: 120_000 });
  }
  if (m === CHESS_GAME_MODE_V0.RHIZOH_STOCKFISH) {
    return Object.freeze({ label: "Rhizoh vs Stockfish", timeControlMs: 900_000 });
  }
  if (m === CHESS_GAME_MODE_V0.TEAM_PET_VS_RHIZOH) {
    return Object.freeze({ label: "Fox+Octo vs Rhizoh AI", timeControlMs: 180_000 });
  }
  return Object.freeze({ label: "Standard", timeControlMs: 600_000 });
}

/**
 * @param {{ mode?: string, fen?: string }} [opts]
 */
export function createChessArenaGameV0(opts = {}) {
  const mode = String(opts.mode || CHESS_GAME_MODE_V0.BLITZ);
  const chess = opts.fen ? new Chess(String(opts.fen)) : new Chess();
  const meta = modeMeta(mode);

  return Object.freeze({
    schema: CHESS_ARENA_ENGINE_SCHEMA_V0,
    mode,
    meta,
    chess,
    moveHistory: [],
    createdAt: new Date().toISOString(),

    fen() {
      return chess.fen();
    },

    turn() {
      return chess.turn();
    },

    isGameOver() {
      return chess.isGameOver();
    },

    outcome() {
      if (chess.isCheckmate()) return chess.turn() === "w" ? "black_wins" : "white_wins";
      if (chess.isDraw()) return "draw";
      if (chess.isStalemate()) return "stalemate";
      return null;
    },

    legalMoves() {
      return chess.moves({ verbose: true });
    },

  /**
   * @param {string} move — SAN ("e4") or UCI ("e2e4")
   */
    tryMove(move) {
      const raw = String(move || "").trim();
      if (!raw) return Object.freeze({ ok: false, reason: "empty_move" });
      try {
        let result = null;
        if (/^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(raw)) {
          const from = raw.slice(0, 2);
          const to = raw.slice(2, 4);
          const promotion = raw.length > 4 ? raw[4].toLowerCase() : undefined;
          result = chess.move({ from, to, promotion });
        } else {
          result = chess.move(raw);
        }
        if (!result) return Object.freeze({ ok: false, reason: "illegal_move" });
        this.moveHistory.push(result);
        return Object.freeze({ ok: true, move: result, fen: chess.fen(), outcome: this.outcome() });
      } catch {
        return Object.freeze({ ok: false, reason: "illegal_move" });
      }
    },

    boardAscii() {
      return chess.ascii();
    }
  });
}

/**
 * Rough material balance from Rhizoh's color (positive = Rhizoh ahead).
 * @param {ReturnType<typeof createChessArenaGameV0>} game
 * @param {'w'|'b'} rhizohColor
 */
export function estimateChessMaterialBalanceV0(game, rhizohColor = "w") {
  const board = game.chess.board();
  const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let white = 0;
  let black = 0;
  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue;
      const v = values[cell.type] || 0;
      if (cell.color === "w") white += v;
      else black += v;
    }
  }
  const balance = white - black;
  return rhizohColor === "w" ? balance : -balance;
}

/**
 * @param {string|null} outcome
 * @param {boolean} [tr]
 */
export function formatChessOutcomeLabelV0(outcome, tr = false) {
  const id = String(outcome || "").toLowerCase();
  const map = tr
    ? {
        white_wins: "Beyaz kazandı (Rhizoh AI)",
        black_wins: "Siyah kazandı (Stockfish)",
        draw: "Berabere",
        stalemate: "Pat — berabere",
        unknown: "Bilinmiyor"
      }
    : {
        white_wins: "White wins (Rhizoh AI)",
        black_wins: "Black wins (Stockfish)",
        draw: "Draw",
        stalemate: "Stalemate — draw",
        unknown: "Unknown"
      };
  return map[id] || id || map.unknown;
}

/**
 * Simple material-aware AI move (not Stockfish — local deterministic pick).
 * @param {ReturnType<typeof createChessArenaGameV0>} game
 */
export function pickChessArenaAiMoveV0(game) {
  const moves = game.legalMoves();
  if (!moves.length) return null;

  const pieceValue = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let best = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    let score = Math.random() * 0.01;
    if (m.captured) score += (pieceValue[m.captured] || 0) * 10;
    if (m.san.includes("+")) score += 2;
    if (m.san.includes("#")) score += 100;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best.san;
}

/**
 * Castle-to-castle match scaffold — two castle IDs share one FEN clock.
 * @param {{ castleA: string, castleB: string, mode?: string }} opts
 */
export function createCastleToCastleChessMatchV0(opts = {}) {
  const game = createChessArenaGameV0({ mode: opts.mode });
  return Object.freeze({
    schema: `${CHESS_ARENA_ENGINE_SCHEMA_V0}.c2c_match`,
    matchId: `c2c_${Date.now().toString(36)}`,
    castleA: String(opts.castleA || "castle_a").slice(0, 64),
    castleB: String(opts.castleB || "castle_b").slice(0, 64),
    game,
    status: "active"
  });
}
