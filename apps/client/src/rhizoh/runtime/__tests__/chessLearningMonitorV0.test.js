import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CHESS_CLUSTER_MOVE_EVENT_V0,
  __resetChessGameClusterForTestV0,
  startChessGameClusterV0,
  stopChessGameClusterV0
} from "../chessGameClusterV0.js";
import { CHESS_CLUSTER_POLICY_DIFF_EVENT_V0 } from "../chessClusterLearningTraceV0.js";
import {
  CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0,
  __resetChessLearningMonitorForTestV0,
  ensureChessLearningMonitorListenersV0,
  getChessLearningMonitorSnapshotV0,
  recordChessLearningMonitorMoveV0,
  startChessLearningMeasurementV0
} from "../chessLearningMonitorV0.js";

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

describe("chessLearningMonitorV0", () => {
  beforeEach(() => {
    __resetChessGameClusterForTestV0();
    __resetChessLearningMonitorForTestV0();
    window.__rhizoh = {};
  });

  afterEach(() => {
    stopChessGameClusterV0();
    __resetChessLearningMonitorForTestV0();
    delete window.__rhizoh;
  });

  it("records moves and exposes spectator slot 0", () => {
    recordChessLearningMonitorMoveV0({
      move: { slotId: 0, san: "e4", engine: "rhizoh_ai", atMs: 1 },
      observation: { critical: true }
    });
    const snap = getChessLearningMonitorSnapshotV0("test");
    expect(snap.recentMoves).toHaveLength(1);
    expect(snap.recentMoves[0].san).toBe("e4");
    expect(snap.spectatorSlotId).toBe(CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0);
  });

  it("listens to cluster move and policy_diff events", async () => {
    ensureChessLearningMonitorListenersV0();
    startChessGameClusterV0({ testFastTick: true, intervalMs: 30, timeControlId: "bullet_1_0" });

    window.dispatchEvent(
      new CustomEvent(CHESS_CLUSTER_MOVE_EVENT_V0, {
        detail: {
          move: { slotId: 0, san: "Nf3", engine: "rhizoh_ai", atMs: Date.now() },
          observation: {}
        }
      })
    );
    window.dispatchEvent(
      new CustomEvent(CHESS_CLUSTER_POLICY_DIFF_EVENT_V0, {
        detail: { slotId: 0, summary: "book vs engine", atMs: Date.now() }
      })
    );

    const snap = getChessLearningMonitorSnapshotV0("events");
    expect(snap.recentMoves.some((m) => m.san === "Nf3")).toBe(true);
    expect(snap.recentPolicyDiffs.some((d) => d.summary === "book vs engine")).toBe(true);
    expect(window.__rhizoh.chessLearningMonitor).toBeTruthy();
  });

  it("startChessLearningMeasurementV0 exposes counters", () => {
    __resetChessLearningMonitorForTestV0();
    startChessLearningMeasurementV0();
    recordChessLearningMonitorMoveV0({
      move: { slotId: 1, san: "d4", engine: "rhizoh_ai", atMs: 2 },
      observation: {}
    });
    const snap = getChessLearningMonitorSnapshotV0("measure");
    expect(snap.measurement.active).toBe(true);
    expect(snap.measurement.movesMeasured).toBe(1);
    expect(snap.measurement.stockfishMovesMeasured).toBe(0);
  });
});
