import { describe, expect, it } from "vitest";
import {
  CHESS_ENGINE_BACKEND_ID_V0,
  listChessEngineBackendsV0,
  resolveChessEngineBackendV0
} from "../chessEngineRegistryV0.js";

describe("chessEngineRegistryV0", () => {
  it("resolves stockfish when available", () => {
    expect(resolveChessEngineBackendV0(CHESS_ENGINE_BACKEND_ID_V0.STOCKFISH_WASM_16)).toBe(
      CHESS_ENGINE_BACKEND_ID_V0.STOCKFISH_WASM_16
    );
  });

  it("falls back when LC0 requested but unavailable", () => {
    expect(resolveChessEngineBackendV0(CHESS_ENGINE_BACKEND_ID_V0.LC0_UCI)).toBe(
      CHESS_ENGINE_BACKEND_ID_V0.HEURISTIC_FALLBACK
    );
  });

  it("lists LC0 as reserved with configured flag", () => {
    const backends = listChessEngineBackendsV0();
    const lc0 = backends.find((b) => b.id === CHESS_ENGINE_BACKEND_ID_V0.LC0_UCI);
    expect(lc0?.available).toBe(false);
    expect(lc0?.configured).toBe(false);
  });
});
