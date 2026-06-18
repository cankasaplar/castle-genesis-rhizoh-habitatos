import { beforeEach, describe, expect, it } from "vitest";
import {
  getChessEngineContentionSnapshotV0,
  resolveChessMoveTimeoutBufferMsV0,
  shouldDeferArenaPrewarmV0
} from "../chessEngineContentionGateV0.js";
import { CHESS_ENGINE_TASK_KIND_V0 } from "../chessEngineTaskQueueV0.js";

describe("chessEngineContentionGateV0", () => {
  beforeEach(() => {
    window.__rhizoh = {};
  });

  it("shouldDeferArenaPrewarmV0 when cluster running and lock held", () => {
    window.__rhizoh.chessGameCluster = { running: true };
    window.__rhizoh.chessScheduler = { chessLock: true };
    expect(shouldDeferArenaPrewarmV0()).toBe(true);
  });

  it("resolveChessMoveTimeoutBufferMsV0 gives cluster moves more wall time", () => {
    const cluster = resolveChessMoveTimeoutBufferMsV0({
      queueKind: CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE
    });
    const prewarm = resolveChessMoveTimeoutBufferMsV0({
      queueKind: CHESS_ENGINE_TASK_KIND_V0.PREWARM
    });
    expect(cluster).toBeGreaterThan(prewarm);
    expect(cluster).toBeGreaterThanOrEqual(2800);
  });

  it("getChessEngineContentionSnapshotV0 reports contended state", () => {
    window.__rhizoh.chessGameCluster = { running: true };
    window.__rhizoh.chessEngineQueue = { pendingCount: 3 };
    const snap = getChessEngineContentionSnapshotV0();
    expect(snap.contended).toBe(true);
  });
});
