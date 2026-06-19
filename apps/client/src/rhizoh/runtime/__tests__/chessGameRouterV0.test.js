import { describe, expect, it } from "vitest";
import { startChessGameClusterV0, __resetChessGameClusterForTestV0 } from "../chessGameClusterV0.js";
import {
  CHESS_GAME_ROUTER_ARCHITECTURE_V0,
  getChessGameRouterSnapshotV0,
  getChessLearningGraphSnapshotV0
} from "../chessGameRouterV0.js";
import { disposeChessStockfishEngineV0 } from "../chessStockfishEngineV0.js";

describe("chessGameRouterV0", () => {
  it("exposes 8-game router over single engine", () => {
    __resetChessGameClusterForTestV0();
    disposeChessStockfishEngineV0();
    startChessGameClusterV0({ intervalMs: 5000 });
    const router = getChessGameRouterSnapshotV0("test");
    expect(router.architecture).toBe(CHESS_GAME_ROUTER_ARCHITECTURE_V0);
    expect(router.gameCount).toBe(8);
    expect(router.engineInstances).toBe(1);
    expect(router.slots.length).toBe(8);
    expect(router.running).toBe(true);
    __resetChessGameClusterForTestV0();
  });

  it("learning graph snapshot includes memory scaffold", () => {
    const graph = getChessLearningGraphSnapshotV0("test");
    expect(graph.memoryNodeCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(graph.patternTags)).toBe(true);
  });
});
