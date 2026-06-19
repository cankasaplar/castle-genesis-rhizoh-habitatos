import { describe, expect, it } from "vitest";
import {
  CHESS_TEACHER_ID_V0,
  CHESS_TEACHER_STATUS_V0,
  getActiveChessTeacherIdV0,
  getChessTeacherDetailV0,
  getChessTeacherStatusV0,
  isChessTeacherOfflineV0,
  resetChessTeacherV0
} from "../chessTeacherInterfaceV0.js";
import { disposeChessStockfishEngineV0 } from "../chessStockfishEngineV0.js";

describe("chessTeacherInterfaceV0", () => {
  it("exposes teacher facade over stockfish engine status", () => {
    disposeChessStockfishEngineV0();
    resetChessTeacherV0();
    expect(getChessTeacherStatusV0()).toBe(CHESS_TEACHER_STATUS_V0.NOT_STARTED);
    expect(isChessTeacherOfflineV0()).toBe(false);
    expect(getActiveChessTeacherIdV0()).toBe(CHESS_TEACHER_ID_V0.STOCKFISH);

    const detail = getChessTeacherDetailV0();
    expect(detail.schema).toContain("chess_teacher_interface");
    expect(detail.influencesExecution).toBe(false);
    expect(detail.engine?.wasmPath).toContain(".wasm");
  });
});
