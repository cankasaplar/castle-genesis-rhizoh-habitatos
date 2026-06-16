import { describe, expect, it } from "vitest";
import {
  formatChessMoveListPgnV0,
  formatChessMoveSanV0,
  normalizeChessMovesToSanV0
} from "../chessMoveSanV0.js";

describe("chessMoveSanV0", () => {
  it("extracts SAN from chess.js move objects", () => {
    const moves = [{ san: "e4" }, { san: "e5" }, { san: "Nf3" }];
    expect(normalizeChessMovesToSanV0(moves)).toEqual(["e4", "e5", "Nf3"]);
    expect(formatChessMoveListPgnV0(moves)).toBe("1. e4 e5 2. Nf3");
  });

  it("passes through string moves", () => {
    expect(formatChessMoveSanV0("O-O")).toBe("O-O");
  });
});
