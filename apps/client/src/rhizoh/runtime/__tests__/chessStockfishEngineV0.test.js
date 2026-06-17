import { describe, expect, it } from "vitest";
import { createChessArenaGameV0, pickChessArenaAiMoveV0 } from "../chessArenaEngineV0.js";
import {
  CHESS_STOCKFISH_ASSET_PATHS_V0,
  disposeChessStockfishEngineV0,
  getChessStockfishEngineDetailV0,
  getChessStockfishEngineStatusV0,
  resetChessStockfishEngineV0
} from "../chessStockfishEngineV0.js";

describe("chessStockfishEngineV0", () => {
  it("exposes stable chess-engine asset paths", () => {
    expect(CHESS_STOCKFISH_ASSET_PATHS_V0.workerJs).toBe("/chess-engine/stockfish-nnue-16-single.js");
    expect(CHESS_STOCKFISH_ASSET_PATHS_V0.wasm).toBe("/chess-engine/stockfish-nnue-16-single.wasm");
  });

  it("prefers absolute_hash then wasm_binary_inline spawn strategies", () => {
    disposeChessStockfishEngineV0();
    const detail = getChessStockfishEngineDetailV0();
    expect(detail.spawnStrategies[0]).toBe("absolute_hash");
    expect(detail.spawnStrategies).toEqual([
      "absolute_hash",
      "relative_hash",
      "wasm_binary_inline",
      "blob_coep",
      "blob_worker"
    ]);
  });

  it("starts in not_started and can reset after dispose", () => {
    disposeChessStockfishEngineV0();
    expect(getChessStockfishEngineStatusV0()).toBe("not_started");
    resetChessStockfishEngineV0();
    const detail = getChessStockfishEngineDetailV0();
    expect(detail.status).toBe("not_started");
    expect(detail.wasmPath).toContain(".wasm");
  });
});

describe("pickChessArenaAiMoveV0 deterministic fallback", () => {
  it("returns the same move for the same position", () => {
    const game = createChessArenaGameV0();
    const first = game.legalMoves()[0]?.san;
    expect(first).toBeTruthy();
    const repeat = createChessArenaGameV0();
    expect(pickChessArenaAiMoveV0(game)).toBe(pickChessArenaAiMoveV0(repeat));
  });
});
