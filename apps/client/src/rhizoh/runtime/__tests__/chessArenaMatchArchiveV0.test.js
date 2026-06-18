import { describe, expect, it, beforeEach } from "vitest";
import {
  archiveChessArenaMatchV0,
  isChessArenaArchiveMeaningfulV0,
  listChessArenaArchiveV0
} from "../chessArenaMatchArchiveV0.js";

describe("chessArenaMatchArchiveV0", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("rhizoh.chess_arena_archive.v0");
    }
  });

  it("filters zero-move abandoned sessions from archive list", () => {
    archiveChessArenaMatchV0({
      matchId: "zero",
      mode: "ai_human",
      outcome: "black_wins",
      moves: [],
      fen: "",
      white: "You",
      black: "Stockfish"
    });
    archiveChessArenaMatchV0({
      matchId: "real",
      mode: "ai_human",
      outcome: "white_wins",
      moves: ["e4", "e5"],
      fen: "",
      white: "You",
      black: "Stockfish"
    });

    const rows = listChessArenaArchiveV0(10);
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("real");
  });

  it("classifies meaningful archive rows by move count", () => {
    expect(isChessArenaArchiveMeaningfulV0({ moves: [] })).toBe(false);
    expect(isChessArenaArchiveMeaningfulV0({ moves: ["d4"] })).toBe(true);
  });
});
