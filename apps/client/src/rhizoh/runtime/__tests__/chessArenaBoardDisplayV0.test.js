import { describe, expect, it } from "vitest";
import {
  parseChessUciSquaresV0,
  resolveChessFidePieceSrcV0,
  resolveChessLastMoveSquaresV0,
  resolveChessSquareGlowStyleV0
} from "../chessArenaBoardDisplayV0.js";

describe("chessArenaBoardDisplayV0", () => {
  it("parses UCI from/to squares", () => {
    expect(parseChessUciSquaresV0("e2e4")).toEqual({ from: "e2", to: "e4" });
    expect(parseChessUciSquaresV0("bad")).toBeNull();
  });

  it("resolves last move from uci or from/to", () => {
    expect(resolveChessLastMoveSquaresV0({ uci: "g1f3" })).toEqual({ from: "g1", to: "f3" });
    expect(resolveChessLastMoveSquaresV0({ from: "d7", to: "d5" })).toEqual({
      from: "d7",
      to: "d5"
    });
    expect(resolveChessLastMoveSquaresV0(null)).toBeNull();
  });

  it("applies Kanagawa glow on from and to squares only", () => {
    const last = { from: "e2", to: "e4" };
    expect(resolveChessSquareGlowStyleV0("e2", last)?.boxShadow).toContain("inset");
    expect(resolveChessSquareGlowStyleV0("e4", last)?.boxShadow).toContain("inset");
    expect(resolveChessSquareGlowStyleV0("e5", last)).toBeUndefined();
  });

  it("maps FIDE cburnett piece paths", () => {
    expect(resolveChessFidePieceSrcV0("w", "k")).toBe("/chess/pieces/cburnett/wK.svg");
    expect(resolveChessFidePieceSrcV0("b", "q")).toBe("/chess/pieces/cburnett/bQ.svg");
  });
});
