/**
 * Chess UGE encoder — maps SAN moves to TopologyEvent shapes (no semantics).
 * RESEARCH-ONLY observation substrate.
 */

import { Chess } from "chess.js";
import { RHIZOH_GEOMETRY_PATTERN_FAMILY_V0 } from "./rhizohGeometryPatternFamilyV0.js";
import { freezeTopologyEventV0 } from "./rhizohGeometryTopologyV0.js";

/**
 * @param {string} square
 * @returns {[number, number]}
 */
function squareToCoordV0(square) {
  const sq = String(square || "");
  if (sq.length < 2) return [0, 0];
  return [sq.charCodeAt(0) - 97, Number(sq[1]) - 1];
}

/**
 * @param {string} fen
 * @param {'w'|'b'} color
 */
function findKingSquareV0(fen, color) {
  const chess = new Chess(fen);
  const board = chess.board();
  const target = color === "w" ? "w" : "b";
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const cell = board[7 - rank][file];
      if (cell?.type === "k" && cell.color === target) {
        return String.fromCharCode(97 + file) + String(rank + 1);
      }
    }
  }
  return null;
}

/**
 * Enemy king mobility when it is that side's turn.
 * @param {string} fen
 * @param {'w'|'b'} kingColor
 */
export function measureEnemyKingMobilityV0(fen, kingColor) {
  const chess = new Chess(fen);
  if (chess.turn() !== kingColor) return null;
  const kingSq = findKingSquareV0(fen, kingColor);
  if (!kingSq) return 0;
  return chess.moves({ square: kingSq, verbose: true }).length;
}

/**
 * @param {import('chess.js').Chess} chess
 * @param {string} square
 * @param {'w'|'b'} color
 */
function countFriendlyNeighborsV0(chess, square, color) {
  const [file, rank] = squareToCoordV0(square);
  let count = 0;
  const board = chess.board();
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let df = -1; df <= 1; df += 1) {
      if (dr === 0 && df === 0) continue;
      const f = file + df;
      const r = 7 - (rank + dr);
      if (f < 0 || f > 7 || r < 0 || r > 7) continue;
      const cell = board[r][f];
      if (cell && cell.color === color) count += 1;
    }
  }
  return count;
}

/**
 * @param {string} beforeFen
 * @param {string} san
 */
export function encodeChessTopologyEventV0(beforeFen, san) {
  const chess = new Chess(String(beforeFen || ""));
  const moverColor = chess.turn();
  const enemyColor = moverColor === "w" ? "b" : "w";

  let move;
  try {
    move = chess.move(String(san || ""));
  } catch {
    return null;
  }
  if (!move) return null;

  const afterFen = chess.fen();
  const kingMobAfter = measureEnemyKingMobilityV0(afterFen, enemyColor);

  const beforeEnemyTurn = new Chess(beforeFen);
  const parts = beforeFen.split(" ");
  parts[1] = enemyColor;
  const enemyTurnFen = parts.join(" ");
  const kingMobBefore = measureEnemyKingMobilityV0(enemyTurnFen, enemyColor);

  const enclosureDelta =
    kingMobBefore != null && kingMobAfter != null ? Math.max(0, kingMobBefore - kingMobAfter) : 0;

  const clusterCount = countFriendlyNeighborsV0(chess, move.to, moverColor);
  const isJump =
    move.piece === "n" || move.flags.includes("k") || move.flags.includes("q") || move.flags.includes("b");

  const fromCoord = squareToCoordV0(move.from);
  const toCoord = squareToCoordV0(move.to);
  const chebyshev =
    Math.max(Math.abs(toCoord[0] - fromCoord[0]), Math.abs(toCoord[1] - fromCoord[1])) || 1;

  let topologyType = RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER;
  if (enclosureDelta >= 1 || move.san.includes("+")) {
    topologyType = RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.ENCLOSURE;
  } else if (isJump) {
    topologyType = RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.JUMP;
  } else if (clusterCount >= 2) {
    topologyType = RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER;
  }

  let deltaMagnitude = 0.2;
  if (topologyType === RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.ENCLOSURE) {
    deltaMagnitude = Math.min(1, (enclosureDelta + (move.san.includes("+") ? 1 : 0)) / 8);
  } else if (topologyType === RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.JUMP) {
    deltaMagnitude = Math.min(1, chebyshev / 4);
  } else {
    deltaMagnitude = Math.min(1, clusterCount / 6);
  }

  return freezeTopologyEventV0({
    sourceSpace: "chess",
    topologyType,
    patternFamily: topologyType,
    entity: move.piece,
    from: fromCoord,
    to: toCoord,
    deltaMagnitude,
    metrics: {
      enclosureDelta,
      clusterCount,
      isJump,
      kingMobBefore,
      kingMobAfter,
      chebyshev
    }
  });
}
