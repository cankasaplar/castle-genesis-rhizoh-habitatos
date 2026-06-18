import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHESS_CLUSTER_SLOT_COUNT_V0,
  CHESS_CLUSTER_MIN_INTERVAL_MS_V0,
  __resetChessGameClusterForTestV0,
  getChessClusterRouterMetaV0,
  getChessClusterSlotV0,
  isChessGameClusterRunningV0,
  listChessClusterSlotsV0,
  resolveChessClusterMinIntervalMsV0,
  resolveChessClusterTickDelayMsV0,
  startChessGameClusterV0,
  stopChessGameClusterV0
} from "../chessGameClusterV0.js";
import { __resetChessClusterObserverForTestV0 } from "../chessClusterObserverV0.js";
import { __resetChessClusterMemoryGraphForTestV0 } from "../chessClusterMemoryGraphV0.js";

vi.mock("../chessClusterMovePickerV0.js", () => ({
  pickChessClusterMoveV0: vi.fn(async (_slot, game) => {
    const moves = game.legalMoves();
    if (!moves.length) return { move: null, engine: "mock" };
    const uci = `${moves[0].from}${moves[0].to}${moves[0].promotion || ""}`;
    return { move: uci, engine: "mock_stockfish" };
  })
}));

vi.mock("../chessClusterLearningV0.js", () => ({
  finalizeChessClusterGameV0: vi.fn(async () => ({ ok: true, mocked: true }))
}));

describe("chessGameClusterV0", () => {
  beforeEach(() => {
    __resetChessGameClusterForTestV0();
    __resetChessClusterObserverForTestV0();
    __resetChessClusterMemoryGraphForTestV0();
    window.__rhizoh = {};
  });

  afterEach(() => {
    __resetChessGameClusterForTestV0();
    delete window.__rhizoh;
  });

  it("starts 8 independent slots", () => {
    const out = startChessGameClusterV0({ testFastTick: true, intervalMs: 50 });
    expect(out.ok).toBe(true);
    expect(listChessClusterSlotsV0()).toHaveLength(CHESS_CLUSTER_SLOT_COUNT_V0);
    expect(getChessClusterSlotV0(0)?.status).toBe("active");
    expect(getChessClusterSlotV0(0)?.modeId).toBe("rhizoh_vs_stockfish");
    expect(getChessClusterSlotV0(0)?.clock?.timeControlId).toBe("blitz_3_2");
    expect(window.__rhizoh.chessGameCluster?.architecture).toBe("single_engine_multi_pv");
    expect(window.__rhizoh.chessGameCluster?.engineScheduler?.engineInstances).toBe(1);
    stopChessGameClusterV0();
  });

  it("is idempotent on second start", () => {
    startChessGameClusterV0({ testFastTick: true, intervalMs: 50 });
    const second = startChessGameClusterV0({ testFastTick: true, intervalMs: 50 });
    expect(second.already).toBe(true);
    stopChessGameClusterV0();
  });

  it("stops cluster simulation", () => {
    startChessGameClusterV0({ testFastTick: true, intervalMs: 50 });
    stopChessGameClusterV0();
    expect(isChessGameClusterRunningV0()).toBe(false);
  });

  it("clamps prod min interval to 800ms band", () => {
    expect(resolveChessClusterMinIntervalMsV0({ intervalMs: 320 })).toBe(
      CHESS_CLUSTER_MIN_INTERVAL_MS_V0
    );
    expect(resolveChessClusterMinIntervalMsV0({ minIntervalMs: 900 })).toBe(900);
    expect(resolveChessClusterTickDelayMsV0(1200)).toBe(1200);
    expect(resolveChessClusterTickDelayMsV0(400)).toBe(900);
  });

  it("publishes adaptive tick metadata when started", () => {
    startChessGameClusterV0({ minIntervalMs: 900 });
    expect(getChessClusterRouterMetaV0().minIntervalMs).toBe(900);
    expect(window.__rhizoh.chessGameCluster?.tickScheduling).toBe("adaptive_settimeout_chess_lock");
    stopChessGameClusterV0();
  });
});
