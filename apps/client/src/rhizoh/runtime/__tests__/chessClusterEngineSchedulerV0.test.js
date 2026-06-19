import { describe, expect, it, vi } from "vitest";
import { createChessArenaGameV0 } from "../chessArenaEngineV0.js";
import {
  __resetChessClusterEngineSchedulerForTestV0,
  getChessClusterEngineSchedulerSnapshotV0,
  scheduleClusterEngineMoveV0
} from "../chessClusterEngineSchedulerV0.js";
import {
  CHESS_ENGINE_TASK_KIND_V0,
  CHESS_ENGINE_TASK_PRIORITY_V0,
  __resetChessEngineTaskQueueForTestV0,
  enqueueChessEngineTaskV0
} from "../chessEngineTaskQueueV0.js";
import {
  CHESS_STOCKFISH_CLUSTER_MULTI_PV_V0,
  withChessStockfishEngineLockV0
} from "../chessStockfishEngineV0.js";

vi.mock("../chessStockfishEngineV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getChessStockfishEngineStatusV0: vi.fn(() => "stockfish_wasm"),
    pickChessArenaEngineMoveV0: vi.fn(async () =>
      Object.freeze({ move: "e2e4", engine: "stockfish_wasm" })
    )
  };
});

describe("chessClusterEngineSchedulerV0", () => {
  it("exposes single-engine multi-PV architecture", () => {
    __resetChessClusterEngineSchedulerForTestV0();
    __resetChessEngineTaskQueueForTestV0();
    const snap = getChessClusterEngineSchedulerSnapshotV0();
    expect(snap.engineInstances).toBe(1);
    expect(snap.multiPvCapacity).toBe(CHESS_STOCKFISH_CLUSTER_MULTI_PV_V0);
    expect(snap.queuedOps).toBe(0);
  });

  it("scheduleClusterEngineMoveV0 does not nest engine mutex (avoids deadlock)", async () => {
    __resetChessClusterEngineSchedulerForTestV0();
    __resetChessEngineTaskQueueForTestV0();
    const game = createChessArenaGameV0();
    let innerLockEntered = false;

    const nested = withChessStockfishEngineLockV0(async () => {
      innerLockEntered = true;
      const out = await scheduleClusterEngineMoveV0(game, { useStockfish: true });
      expect(out?.move).toBe("e2e4");
      return out;
    });

    await expect(
      Promise.race([
        nested,
        new Promise((_, reject) => setTimeout(() => reject(new Error("deadlock_timeout")), 500))
      ])
    ).resolves.toMatchObject({ move: "e2e4", engine: "stockfish_wasm" });
    expect(innerLockEntered).toBe(true);
  });

  it("tunes movetime under queue pressure without mutating frozen adaptive opts", async () => {
    __resetChessClusterEngineSchedulerForTestV0();
    __resetChessEngineTaskQueueForTestV0();
    for (let i = 0; i < 3; i += 1) {
      enqueueChessEngineTaskV0({
        priority: CHESS_ENGINE_TASK_PRIORITY_V0.CLUSTER_MOVE,
        kind: CHESS_ENGINE_TASK_KIND_V0.CLUSTER_MOVE,
        label: `pending_${i}`,
        run: () => new Promise(() => {})
      });
    }
    const game = createChessArenaGameV0();
    await expect(
      scheduleClusterEngineMoveV0(game, { useStockfish: true, movetimeMs: 900 })
    ).resolves.toMatchObject({ move: "e2e4" });
  });
});
