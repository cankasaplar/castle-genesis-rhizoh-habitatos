/**
 * Agent-aware chess heuristic — distinct Fox/Octo/Rhizoh styles when Stockfish offline.
 * RESEARCH-ONLY
 */

import { Chess } from "chess.js";

const PIECE_VALUE_V0 = Object.freeze({ p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 });

function seededUnitV0(seed) {
  const x = Math.sin(Number(seed) || 0) * 10000;
  return x - Math.floor(x);
}

function materialBalanceV0(chess, forWhite = true) {
  const board = chess.board();
  let w = 0;
  let b = 0;
  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue;
      const v = PIECE_VALUE_V0[cell.type] || 0;
      if (cell.color === "w") w += v;
      else b += v;
    }
  }
  const bal = w - b;
  return forWhite ? bal : -bal;
}

/**
 * @param {import('chess.js').Chess} chess
 * @param {object} policy
 * @param {"w"|"b"} side
 */
function evaluatePositionV0(chess, policy, side) {
  const forWhite = side === "w";
  let score = materialBalanceV0(chess, forWhite) * 10;

  if (chess.isCheck()) score += forWhite === (chess.turn() === "w") ? -1.8 : 1.8;
  if (chess.isCheckmate()) {
    score += chess.turn() === (forWhite ? "w" : "b") ? -500 : 500;
  }

  const moves = chess.moves({ verbose: true });
  score += moves.length * (forWhite === (chess.turn() === "w") ? 0.08 : -0.08);

  const contempt = Number(policy.contempt) || 0;
  const risk = String(policy.riskProfile || "balanced");
  if (risk === "aggressive") score += contempt * 0.04;
  if (risk === "defensive") score -= Math.abs(contempt) * 0.03;
  if (risk === "learning") score += 0.15;

  return score;
}

/**
 * @param {ReturnType<import('./chessArenaEngineV0.js').createChessArenaGameV0>} game
 * @param {object} [policy]
 * @param {{ slotId?: number, agentId?: string }} [opts]
 */
export function pickChessAgentHeuristicMoveV0(game, policy = {}, opts = {}) {
  const moves = game.legalMoves();
  if (!moves.length) return null;

  const ply = game.moveHistory?.length || 0;
  const seed = (Number(opts.slotId) || 0) * 991 + ply * 37 + String(opts.agentId || "").length * 13;
  const explorationRate = Math.max(0, Math.min(0.35, Number(policy.explorationRate) || 0.1));

  if (moves.length > 1 && seededUnitV0(seed) < explorationRate) {
    const pick = moves[Math.floor(seededUnitV0(seed + 1) * moves.length)];
    return `${pick.from}${pick.to}${pick.promotion || ""}`;
  }

  const side = game.turn();
  const contempt = Number(policy.contempt) || 0;
  const risk = String(policy.riskProfile || "balanced");

  /** @type {{ move: typeof moves[0], score: number }[]} */
  const ranked = [];

  for (const m of moves) {
    let score = 0;
    if (m.captured) score += (PIECE_VALUE_V0[m.captured] || 0) * 12;
    if (m.san.includes("+")) score += 2.2 + contempt * 0.02;
    if (m.san.includes("#")) score += 400;
    if (risk === "aggressive" && m.san.includes("x")) score += 1.5;
    if (risk === "defensive" && !m.captured) score += 0.4;

    try {
      const clone = new Chess(game.fen());
      clone.move(m.san);
      score += evaluatePositionV0(clone, policy, side) * 0.35;
    } catch {
      /* keep tactical score */
    }

    ranked.push({ move: m, score });
  }

  ranked.sort((a, b) => b.score - a.score);
  const topScore = ranked[0]?.score ?? -Infinity;
  const band = risk === "aggressive" ? 0.55 : risk === "defensive" ? 0.25 : 0.4;
  const candidates = ranked.filter((r) => r.score >= topScore - band);
  const pick = candidates[Math.floor(seededUnitV0(seed + 2) * candidates.length)]?.move || ranked[0]?.move;
  if (!pick) return null;
  return `${pick.from}${pick.to}${pick.promotion || ""}`;
}
