/**
 * Multi-source chess eval fusion — Stockfish + Leela stub + opening DB winrate.
 * RESEARCH-ONLY — truth layer before learning (not event-based).
 */

import { listRhizohOpeningBookV0 } from "./rhizohOpeningBookV0.js";
import {
  estimateChessMaterialBalanceV0,
  createChessArenaGameV0,
  CHESS_GAME_MODE_V0
} from "./chessArenaEngineV0.js";

export const CHESS_EVAL_FUSION_SCHEMA_V0 = "castle.rhizoh.chess_eval_fusion.v0";

export const CHESS_EVAL_FUSION_WEIGHTS_V0 = Object.freeze({
  stockfish: 0.45,
  leela: 0.35,
  database: 0.2
});

const CP_SCALE_V0 = 400;

/**
 * Normalize centipawn-ish signal to [-1, 1].
 * @param {number | null | undefined} cp
 */
export function normalizeChessEvalCpV0(cp) {
  const n = Number(cp);
  if (!Number.isFinite(n)) return null;
  return Math.max(-1, Math.min(1, n / CP_SCALE_V0));
}

/**
 * Leela LC0 not bundled — material/seizure heuristic proxy tagged leela_stub.
 * @param {string | null} fen
 */
export function resolveLeelaStubEvalCpV0(fen) {
  if (!fen) return null;
  try {
    const game = createChessArenaGameV0({ mode: CHESS_GAME_MODE_V0.AI_AI, fen });
    const balance = estimateChessMaterialBalanceV0(game, "w");
    return Math.round(balance * 120);
  } catch {
    return null;
  }
}

/**
 * Opening-book winrate proxy for position (0..1 white perspective).
 * @param {string[]} [sanMoves]
 */
export function resolveDatabaseWinrateV0(sanMoves = []) {
  const book = listRhizohOpeningBookV0();
  if (!book.length) return 0.5;
  const prefix = sanMoves.map((m) => String(m || "").trim().toLowerCase()).filter(Boolean).slice(0, 8);
  if (!prefix.length) return 0.5;

  let best = null;
  let bestLen = 0;
  for (const row of book) {
    const rowMoves = (row.moves || []).map((m) => String(m).trim().toLowerCase());
    let match = 0;
    for (let i = 0; i < Math.min(prefix.length, rowMoves.length); i++) {
      if (prefix[i] !== rowMoves[i]) break;
      match += 1;
    }
    if (match > bestLen) {
      bestLen = match;
      best = row;
    }
  }
  if (!best || bestLen < 1) return 0.5;
  const games = Number(best.games) || 0;
  const wins = Number(best.wins) || 0;
  if (games < 1) return 0.5;
  return Math.max(0, Math.min(1, wins / games));
}

/**
 * @param {{
 *   stockfishCp?: number | null,
 *   leelaCp?: number | null,
 *   databaseWinrate?: number | null,
 *   sanMoves?: string[],
 *   fen?: string | null
 * }} input
 */
export function fuseChessEvalSourcesV0(input = {}) {
  const stockfishNorm = normalizeChessEvalCpV0(input.stockfishCp);
  const leelaCp = input.leelaCp != null ? input.leelaCp : resolveLeelaStubEvalCpV0(input.fen);
  const leelaNorm = normalizeChessEvalCpV0(leelaCp);
  const dbRate =
    input.databaseWinrate != null
      ? Math.max(0, Math.min(1, Number(input.databaseWinrate)))
      : resolveDatabaseWinrateV0(input.sanMoves);
  const databaseNorm = dbRate * 2 - 1;

  const sources = [];
  const values = [];
  const weights = [];

  if (stockfishNorm != null) {
    sources.push("stockfish");
    values.push(stockfishNorm);
    weights.push(CHESS_EVAL_FUSION_WEIGHTS_V0.stockfish);
  }
  if (leelaNorm != null) {
    sources.push(input.leelaCp != null ? "leela" : "leela_stub");
    values.push(leelaNorm);
    weights.push(CHESS_EVAL_FUSION_WEIGHTS_V0.leela);
  }
  if (databaseNorm != null) {
    sources.push("database");
    values.push(databaseNorm);
    weights.push(CHESS_EVAL_FUSION_WEIGHTS_V0.database);
  }

  const weightSum = weights.reduce((a, b) => a + b, 0) || 1;
  const finalEval = values.reduce((sum, v, i) => sum + v * (weights[i] / weightSum), 0);

  const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const variance =
    values.length > 1
      ? values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
      : 0;

  return Object.freeze({
    schema: CHESS_EVAL_FUSION_SCHEMA_V0,
    finalEval: Number(finalEval.toFixed(4)),
    variance: Number(variance.toFixed(4)),
    sources: Object.freeze(sources),
    stockfishCp: input.stockfishCp ?? null,
    leelaCp: leelaCp ?? null,
    databaseWinrate: dbRate,
    sourceCount: sources.length,
    confidence: Number(Math.max(0, 1 - variance).toFixed(3)),
    atMs: Date.now()
  });
}

/**
 * Rank-based cp proxy when only MultiPV rank is known.
 * @param {number | null} matchedRank
 */
export function stockfishCpFromMatchedRankV0(matchedRank) {
  const rank = Number(matchedRank);
  if (!Number.isFinite(rank) || rank < 1) return null;
  if (rank === 1) return 0;
  if (rank === 2) return -35;
  if (rank === 3) return -70;
  return -120;
}
