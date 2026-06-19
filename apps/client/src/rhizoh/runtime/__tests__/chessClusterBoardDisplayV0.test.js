import { describe, expect, it } from "vitest";
import { createChessArenaGameV0 } from "../chessArenaEngineV0.js";
import { resolveChessFidePieceSrcV0 } from "../chessArenaBoardDisplayV0.js";

/** Mirror cluster arena board row builder — must pass piece type for FIDE SVGs. */
function clusterBoardRowsFromFen(fen) {
  const chess = createChessArenaGameV0({ fen });
  const board = chess.chess.board();
  const rows = [];
  for (let r = 0; r < 8; r += 1) {
    const row = [];
    for (let c = 0; c < 8; c += 1) {
      const cell = board[r][c];
      if (!cell) {
        row.push(null);
        continue;
      }
      row.push({ color: cell.color, type: cell.type });
    }
    rows.push(row);
  }
  return rows;
}

describe("chessClusterBoardDisplayV0", () => {
  it("cluster board rows include piece type for FIDE rendering", () => {
    const rows = clusterBoardRowsFromFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    const whiteKing = rows[7][4];
    const blackQueen = rows[0][3];
    expect(whiteKing?.type).toBe("k");
    expect(blackQueen?.type).toBe("q");
    expect(resolveChessFidePieceSrcV0(whiteKing.color, whiteKing.type)).toContain("wK.svg");
    expect(resolveChessFidePieceSrcV0(blackQueen.color, blackQueen.type)).toContain("bQ.svg");
  });

  it("missing type defaults to pawn in FIDE resolver (regression guard)", () => {
    expect(resolveChessFidePieceSrcV0("w")).toContain("wP.svg");
  });
});
