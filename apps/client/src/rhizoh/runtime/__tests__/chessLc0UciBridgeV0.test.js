import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetChessLc0UciBridgeForTestV0,
  getChessLc0EngineStatusV0,
  isChessLc0UciConfiguredV0,
  parseChessLc0UciInfoLineV0,
  resolveChessLc0UciEndpointV0
} from "../chessLc0UciBridgeV0.js";
import {
  CHESS_ENGINE_BACKEND_ID_V0,
  listChessEngineBackendsV0,
  resolveChessEngineBackendV0
} from "../chessEngineRegistryV0.js";
import { fuseChessEvalSourcesV0 } from "../chessEvalFusionV0.js";

describe("chessLc0UciBridgeV0", () => {
  beforeEach(() => {
    __resetChessLc0UciBridgeForTestV0();
  });

  it("reports not_configured without env endpoint", () => {
    expect(resolveChessLc0UciEndpointV0()).toBeNull();
    expect(isChessLc0UciConfiguredV0()).toBe(false);
    expect(getChessLc0EngineStatusV0()).toBe("not_configured");
  });

  it("parses UCI info lines", () => {
    const info = parseChessLc0UciInfoLineV0(
      "info depth 12 seldepth 20 multipv 1 score cp 34 nodes 12000 nps 800000 pv e2e4 e7e5"
    );
    expect(info?.depth).toBe(12);
    expect(info?.cp).toBe(34);
    expect(info?.pv).toContain("e2e4");
  });

  it("parses mate scores", () => {
    const info = parseChessLc0UciInfoLineV0("info depth 20 score mate 3 pv e2e4");
    expect(info?.mate).toBe(3);
  });
});

describe("chessEngineRegistryV0 LC0 slot", () => {
  it("falls back when LC0 requested but unavailable", () => {
    expect(resolveChessEngineBackendV0(CHESS_ENGINE_BACKEND_ID_V0.LC0_UCI)).toBe(
      CHESS_ENGINE_BACKEND_ID_V0.HEURISTIC_FALLBACK
    );
  });

  it("lists LC0 with configured flag", () => {
    const lc0 = listChessEngineBackendsV0().find((b) => b.id === CHESS_ENGINE_BACKEND_ID_V0.LC0_UCI);
    expect(lc0?.available).toBe(false);
    expect(lc0?.configured).toBe(false);
  });
});

describe("chessEvalFusionV0 leela source tagging", () => {
  it("tags leela_stub when no real lc0 cp supplied", () => {
    const fused = fuseChessEvalSourcesV0({
      stockfishCp: 20,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    });
    expect(fused.sources).toContain("leela_stub");
  });

  it("tags leela when real lc0 cp supplied", () => {
    const fused = fuseChessEvalSourcesV0({
      stockfishCp: 20,
      leelaCp: 15,
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    });
    expect(fused.sources).toContain("leela");
    expect(fused.sources).not.toContain("leela_stub");
  });
});
