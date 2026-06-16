import { describe, expect, it } from "vitest";
import {
  formatChessMoveListPgnV0,
  formatChessMoveSanV0,
  normalizeChessMovesToSanV0
} from "../chessMoveSanV0.js";

describe("chessMoveSanV0", () => {
  it("normalizes chess.js verbose objects to SAN", () => {
    const moves = [
      { san: "e4", from: "e2", to: "e4" },
      { san: "e5", from: "e7", to: "e5" },
      "Nf3"
    ];
    expect(normalizeChessMovesToSanV0(moves)).toEqual(["e4", "e5", "Nf3"]);
  });

  it("falls back to from/to when san missing", () => {
    expect(formatChessMoveSanV0({ from: "e2", to: "e4" })).toBe("e2e4");
  });

  it("formats PGN move list", () => {
    expect(formatChessMoveListPgnV0(["e4", "e5", "Nf3", "Nc6"])).toBe("1. e4 e5 2. Nf3 Nc6");
  });
});
