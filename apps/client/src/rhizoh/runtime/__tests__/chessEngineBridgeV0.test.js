import { describe, expect, it, beforeEach } from "vitest";
import {
  CHESS_ENGINE_BRIDGE_KIND_V0,
  __resetChessEngineBridgeForTestV0,
  emitChessEngineBridgeV0,
  getChessEngineBridgeRegistryV0,
  onChessEngineBridgeV0
} from "../chessEngineBridgeV0.js";

describe("chessEngineBridgeV0", () => {
  beforeEach(() => {
    __resetChessEngineBridgeForTestV0();
    window.__rhizoh = {};
  });

  it("emits bestmove to subscribers and registry", () => {
    const seen = [];
    onChessEngineBridgeV0(CHESS_ENGINE_BRIDGE_KIND_V0.BESTMOVE, (detail) => {
      seen.push(detail);
    });

    emitChessEngineBridgeV0(CHESS_ENGINE_BRIDGE_KIND_V0.BESTMOVE, {
      fen: "startpos",
      stockfishEval: Object.freeze({ bestMove: "e2e4", cp: 30, depth: 12 })
    });

    expect(seen).toHaveLength(1);
    expect(seen[0].stockfishEval.bestMove).toBe("e2e4");
    expect(getChessEngineBridgeRegistryV0().lastBestmove?.fen).toBe("startpos");
    expect(window.__rhizoh.engineBridge.listenerCount).toBe(1);
  });

  it("publishes engine_status without executing observers on window mount", () => {
    emitChessEngineBridgeV0(CHESS_ENGINE_BRIDGE_KIND_V0.ENGINE_STATUS, {
      status: "stockfish_wasm",
      reason: "readyok"
    });
    expect(getChessEngineBridgeRegistryV0().lastEngineStatus?.status).toBe("stockfish_wasm");
    expect(window.__rhizoh.engineBridge.schema).toBe("rhizoh.chess_engine_bridge.v0");
  });
});
