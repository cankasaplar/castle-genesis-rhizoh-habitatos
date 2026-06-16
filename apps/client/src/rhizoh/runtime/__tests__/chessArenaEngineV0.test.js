import { describe, expect, it } from "vitest";
import {
  CHESS_GAME_MODE_V0,
  createChessArenaGameV0,
  estimateChessMaterialBalanceV0,
  formatChessOutcomeLabelV0,
  pickChessArenaAiMoveV0
} from "../chessArenaEngineV0.js";
import { parseChessVoiceMoveV0 } from "../chessVoiceMoveParserV0.js";

describe("chessArenaEngineV0", () => {
  it("plays legal opening moves", () => {
    const game = createChessArenaGameV0({ mode: CHESS_GAME_MODE_V0.BLITZ });
    const r1 = game.tryMove("e4");
    expect(r1.ok).toBe(true);
    const r2 = game.tryMove("e5");
    expect(r2.ok).toBe(true);
    expect(game.isGameOver()).toBe(false);
  });

  it("rejects illegal moves", () => {
    const game = createChessArenaGameV0();
    const bad = game.tryMove("e5");
    expect(bad.ok).toBe(false);
  });

  it("AI picks a legal move", () => {
    const game = createChessArenaGameV0({ mode: CHESS_GAME_MODE_V0.AI_AI });
    game.tryMove("e4");
    const ai = pickChessArenaAiMoveV0(game);
    expect(ai).toBeTruthy();
    expect(game.tryMove(ai).ok).toBe(true);
  });

  it("estimates material balance for Rhizoh as white", () => {
    const game = createChessArenaGameV0();
    expect(estimateChessMaterialBalanceV0(game, "w")).toBe(0);
  });

  it("formats outcome labels", () => {
    expect(formatChessOutcomeLabelV0("draw", true)).toContain("Berabere");
    expect(formatChessOutcomeLabelV0("white_wins", false)).toContain("Rhizoh");
  });
});

describe("chessVoiceMoveParserV0", () => {
  it("parses Turkish voice e4", () => {
    const p = parseChessVoiceMoveV0("at e4 oyna");
    expect(p.move).toBe("e4");
  });

  it("parses short castle", () => {
    const p = parseChessVoiceMoveV0("kısa rok");
    expect(p.move).toBe("O-O");
  });
});
