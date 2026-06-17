import { describe, expect, it } from "vitest";
import { createChessArenaGameV0, pickChessArenaAiMoveV0 } from "../chessArenaEngineV0.js";
import {
  CHESS_STOCKFISH_ASSET_PATHS_V0,
  CHESS_STOCKFISH_SPAWN_POLICY_V0,
  disposeChessStockfishEngineV0,
  getChessStockfishEngineDetailV0,
  getChessStockfishEngineStatusV0,
  resetChessStockfishEngineV0,
  resolveChessStockfishEffectiveSpawnPolicyV0
} from "../chessStockfishEngineV0.js";

describe("chessStockfishEngineV0", () => {
  it("exposes stable chess-engine asset paths", () => {
    expect(CHESS_STOCKFISH_ASSET_PATHS_V0.workerJs).toBe("/chess-engine/stockfish-nnue-16-single.js");
    expect(CHESS_STOCKFISH_ASSET_PATHS_V0.wasm).toBe("/chess-engine/stockfish-nnue-16-single.wasm");
  });

  it("uses auto spawn policy with blob fallback until CORP preflight passes", () => {
    disposeChessStockfishEngineV0();
    expect(CHESS_STOCKFISH_SPAWN_POLICY_V0).toBe("auto");
    expect(resolveChessStockfishEffectiveSpawnPolicyV0()).toBe("blob_degraded");
    const detail = getChessStockfishEngineDetailV0();
    expect(detail.spawnPolicy).toBe("auto");
    expect(detail.spawnPolicyEffective).toBe("blob_degraded");
    expect(detail.computeDegraded).toBe(true);
    expect(detail.spawnStrategies).toEqual(["wasm_binary_inline", "blob_coep"]);
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
