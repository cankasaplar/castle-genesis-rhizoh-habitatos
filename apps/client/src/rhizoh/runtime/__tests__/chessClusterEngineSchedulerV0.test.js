import { describe, expect, it } from "vitest";
import {
  __resetChessClusterEngineSchedulerForTestV0,
  getChessClusterEngineSchedulerSnapshotV0
} from "../chessClusterEngineSchedulerV0.js";
import { CHESS_STOCKFISH_CLUSTER_MULTI_PV_V0 } from "../chessStockfishEngineV0.js";

describe("chessClusterEngineSchedulerV0", () => {
  it("exposes single-engine multi-PV architecture", () => {
    __resetChessClusterEngineSchedulerForTestV0();
    const snap = getChessClusterEngineSchedulerSnapshotV0();
    expect(snap.engineInstances).toBe(1);
    expect(snap.multiPvCapacity).toBe(CHESS_STOCKFISH_CLUSTER_MULTI_PV_V0);
    expect(snap.queuedOps).toBe(0);
  });
});
