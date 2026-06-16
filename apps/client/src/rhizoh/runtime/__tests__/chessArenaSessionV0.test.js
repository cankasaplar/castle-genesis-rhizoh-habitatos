import { describe, expect, it } from "vitest";
import {
  CHESS_TIME_CONTROL_V0,
  readChessArenaSessionV0,
  resolveChessTimeControlV0,
  saveChessArenaSessionV0
} from "../chessArenaSessionV0.js";

describe("chessArenaSessionV0", () => {
  it("defaults to blitz 3+2", () => {
    const session = readChessArenaSessionV0();
    expect(session.timeControlId).toBe(CHESS_TIME_CONTROL_V0.BLITZ_3_2.id);
    const tc = resolveChessTimeControlV0(session.timeControlId);
    expect(tc.incrementMs).toBe(2000);
  });

  it("persists opponent preset", () => {
    const next = saveChessArenaSessionV0({ opponentPresetId: "STRONG" });
    expect(next.opponentPresetId).toBe("STRONG");
  });
});
