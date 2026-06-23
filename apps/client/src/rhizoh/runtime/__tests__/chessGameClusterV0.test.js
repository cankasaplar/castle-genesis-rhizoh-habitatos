import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHESS_CLUSTER_SLOT_COUNT_V0,
  CHESS_CLUSTER_MIN_INTERVAL_MS_V0,
  __resetChessGameClusterForTestV0,
  applyChessClusterTimeControlV0,
  getChessClusterRouterMetaV0,
  getChessClusterSlotV0,
  isChessGameClusterRunningV0,
  listChessClusterSlotsV0,
  resolveChessClusterMinIntervalMsV0,
  resolveChessClusterTickDelayMsV0,
  startChessGameClusterV0,
  stopChessGameClusterV0,
  __endChessClusterSlotForTestV0
} from "../chessGameClusterV0.js";
import { __resetChessClusterObserverForTestV0 } from "../chessClusterObserverV0.js";
import { __resetChessClusterMemoryGraphForTestV0 } from "../chessClusterMemoryGraphV0.js";
import { CHESS_ARENA_SESSION_EVENT_V0 } from "../chessArenaSessionV0.js";

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
    expect(getChessClusterSlotV0(0)?.clock?.timeControlId).toBe("cluster_live_3_2");
    expect(getChessClusterSlotV0(1)?.clock?.timeControlId).toBe("cluster_sim_45_0");
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

  it("applyChessClusterTimeControlV0 resolves cluster TC without ReferenceError", () => {
    startChessGameClusterV0({ testFastTick: true, intervalMs: 50 });
    expect(() => applyChessClusterTimeControlV0("cluster_sim_45_0")).not.toThrow();
    expect(getChessClusterSlotV0(0)?.clock?.timeControlId).toBe("cluster_live_3_2");
    expect(() => applyChessClusterTimeControlV0("blitz_3_2")).not.toThrow();
    expect(getChessClusterSlotV0(0)?.clock?.timeControlId).toBe("cluster_live_3_2");
    expect(getChessClusterSlotV0(1)?.clock?.timeControlId).toBe("blitz_3_2");
    stopChessGameClusterV0();
  });

  it("ignores arena session blitz_3_2 — cluster keeps boot TC", () => {
    startChessGameClusterV0({ testFastTick: true, intervalMs: 50, timeControlId: "cluster_sim_45_0" });
    window.dispatchEvent(
      new CustomEvent(CHESS_ARENA_SESSION_EVENT_V0, {
        detail: { timeControlId: "blitz_3_2" }
      })
    );
    expect(getChessClusterSlotV0(0)?.clock?.timeControlId).toBe("cluster_live_3_2");
    expect(getChessClusterSlotV0(1)?.clock?.timeControlId).toBe("cluster_sim_45_0");
    expect(window.__rhizoh.chessGameCluster?.timeControlId).toBe("cluster_sim_45_0");
    stopChessGameClusterV0();
  });

  it("resets slot immediately while finalize is still in flight", async () => {
    const { finalizeChessClusterGameV0 } = await import("../chessClusterLearningV0.js");
    /** @type {(() => void) | null} */
    let releaseFinalize = null;
    finalizeChessClusterGameV0.mockImplementation(
      () =>
        new Promise((resolve) => {
          releaseFinalize = () => resolve({ ok: true, mocked: true });
        })
    );
    startChessGameClusterV0({ testFastTick: true, intervalMs: 30 });
    __endChessClusterSlotForTestV0(0, "draw");
    expect(window.__rhizoh?.chessGameCluster?.sessionGamesEnded).toBe(1);
    const active = listChessClusterSlotsV0().filter((s) => s.status === "active").length;
    expect(active).toBe(CHESS_CLUSTER_SLOT_COUNT_V0);
    const resetSlot = getChessClusterSlotV0(0);
    expect(resetSlot?.status).toBe("active");
    expect(resetSlot?.ply).toBe(resetSlot?.openingSeed?.applied || 0);
    expect(resetSlot?.moveCount).toBe(resetSlot?.ply);
    releaseFinalize?.();
    stopChessGameClusterV0();
  });
});
