import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  CHESS_ENGINE_BRIDGE_KIND_V0,
  __resetChessEngineBridgeForTestV0,
  emitChessEngineBridgeV0
} from "../chessEngineBridgeV0.js";
import { resetDriftCubeRingV0 } from "../rhizohGeometryDriftCubeV0.js";
import {
  __resetRhizohUgeEngineHookForTestV0,
  attachRhizohUgeEngineHookV0,
  detachRhizohUgeEngineHookV0,
  isRhizohUgeEngineHookAttachedV0,
  observeRhizohUgeMovePairV0
} from "../rhizohUgeEngineHookV0.js";
import { __resetTemporalBridgeForTestV0, enterReplayModeV0, exitReplayModeV0 } from "../temporalBridgeV0.js";

describe("rhizohUgeEngineHookV0", () => {
  beforeEach(() => {
    __resetChessEngineBridgeForTestV0();
    __resetRhizohUgeEngineHookForTestV0();
    resetDriftCubeRingV0();
    __resetTemporalBridgeForTestV0();
    window.__rhizoh = {};
    vi.restoreAllMocks();
  });

  it("attaches and detaches with arena lifecycle semantics", () => {
    expect(isRhizohUgeEngineHookAttachedV0()).toBe(false);
    attachRhizohUgeEngineHookV0({ matchId: "arena_test" });
    expect(isRhizohUgeEngineHookAttachedV0()).toBe(true);
    expect(window.__rhizoh.uge.attached).toBe(true);
    detachRhizohUgeEngineHookV0();
    expect(isRhizohUgeEngineHookAttachedV0()).toBe(false);
  });

  it("skips observation during temporal replay", () => {
    enterReplayModeV0("test");
    const obs = observeRhizohUgeMovePairV0({
      fenBefore: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
      teacherMove: "e7e5",
      rhizohMove: "e4"
    });
    expect(obs?.skipped).toBe(true);
    expect(obs?.reason).toBe("temporal_replay_active");
    exitReplayModeV0("test");
  });

  it("observes move pair from engine bridge played_move event", async () => {
    vi.spyOn(await import("../chessStockfishEngineV0.js"), "analyzeChessPositionV0").mockResolvedValue(
      Object.freeze({ bestMove: "e2e4", cp: 25, depth: 10, pv: "e2e4 e7e5" })
    );

    attachRhizohUgeEngineHookV0({ matchId: "bridge_test" });
    emitChessEngineBridgeV0(CHESS_ENGINE_BRIDGE_KIND_V0.PLAYED_MOVE, {
      fenBefore: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      rhizohMove: "d4",
      san: "d4"
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(window.__rhizoh.uge.observationCount).toBeGreaterThan(0);
    expect(window.__rhizoh.uge.last?.rhizohMove).toBe("d4");
    detachRhizohUgeEngineHookV0();
  });
});
