import { beforeEach, describe, expect, it } from "vitest";
import {
  getChessClusterBroadcastEnginePolicySnapshotV0,
  isChessClusterBroadcastModeV0,
  resolveChessClusterBroadcastTickPlanV0,
  resolveChessClusterTickSlotOrderV0,
  shouldFinalizeClusterBroadcastEndV0,
  shouldTickChessClusterSlotClockV0,
  shouldUseStockfishForClusterSlotV0
} from "../chessClusterBroadcastEnginePolicyV0.js";
import { publishChessClusterBroadcastActiveV0 } from "../chessEngineContentionGateV0.js";
import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "../chessLearningMonitorV0.js";

describe("chessClusterBroadcastEnginePolicyV0", () => {
  beforeEach(() => {
    window.__rhizoh = {};
    publishChessClusterBroadcastActiveV0(false);
  });

  it("uses Stockfish for all slots when broadcast UI is closed", () => {
    expect(isChessClusterBroadcastModeV0()).toBe(false);
    expect(shouldUseStockfishForClusterSlotV0(0)).toBe(true);
    expect(shouldUseStockfishForClusterSlotV0(3)).toBe(true);
    expect(shouldUseStockfishForClusterSlotV0(7)).toBe(true);
  });

  it("uses Stockfish only for featured slot when 8-camera UI is open", () => {
    publishChessClusterBroadcastActiveV0(true);
    expect(isChessClusterBroadcastModeV0()).toBe(true);
    expect(shouldUseStockfishForClusterSlotV0(CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0)).toBe(true);
    expect(shouldUseStockfishForClusterSlotV0(1)).toBe(false);
    expect(shouldUseStockfishForClusterSlotV0(7)).toBe(false);
  });

  it("snapshot reports broadcast grid heuristic policy", () => {
    publishChessClusterBroadcastActiveV0(true);
    const snap = getChessClusterBroadcastEnginePolicySnapshotV0();
    expect(snap.broadcastMode).toBe(true);
    expect(snap.featuredSlotId).toBe(CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0);
    expect(snap.gridUsesHeuristic).toBe(true);
    expect(snap.movesPerTick).toBe(2);
  });

  it("orders featured slot first during broadcast ticks", () => {
    publishChessClusterBroadcastActiveV0(true);
    expect(resolveChessClusterTickSlotOrderV0(5, 8)[0]).toBe(0);
    publishChessClusterBroadcastActiveV0(false);
    expect(resolveChessClusterTickSlotOrderV0(5, 8)[0]).toBe(5);
  });

  it("always finalizes max-ply cap during broadcast (learning throughput)", () => {
    publishChessClusterBroadcastActiveV0(true);
    const slot = { slotId: 0, ply: 4 };
    expect(shouldFinalizeClusterBroadcastEndV0(slot, "draw", "max_ply_cap")).toBe(true);
    expect(shouldFinalizeClusterBroadcastEndV0({ slotId: 1, ply: 2 }, "draw", "max_ply_cap")).toBe(
      true
    );
    expect(shouldFinalizeClusterBroadcastEndV0(slot, "draw", "checkmate_or_draw")).toBe(true);
  });

  it("holds timeout reset for grid slot below min ply during broadcast", () => {
    publishChessClusterBroadcastActiveV0(true);
    expect(shouldFinalizeClusterBroadcastEndV0({ slotId: 1, ply: 2 }, "white_wins", "timeout")).toBe(
      false
    );
    expect(shouldFinalizeClusterBroadcastEndV0({ slotId: 1, ply: 12 }, "white_wins", "timeout")).toBe(
      true
    );
  });

  it("never ends featured LIVE slot on timeout during broadcast", () => {
    publishChessClusterBroadcastActiveV0(true);
    expect(
      shouldFinalizeClusterBroadcastEndV0({ slotId: 0, ply: 40 }, "white_wins", "timeout")
    ).toBe(false);
    expect(
      shouldFinalizeClusterBroadcastEndV0({ slotId: 0, ply: 40 }, "white_wins", "checkmate_or_draw")
    ).toBe(true);
  });

  it("ticks clock only for featured slot during broadcast", () => {
    publishChessClusterBroadcastActiveV0(true);
    expect(shouldTickChessClusterSlotClockV0({ slotId: 0 })).toBe(true);
    expect(shouldTickChessClusterSlotClockV0({ slotId: 3 })).toBe(false);
    publishChessClusterBroadcastActiveV0(false);
    expect(shouldTickChessClusterSlotClockV0({ slotId: 3 })).toBe(true);
  });

  it("rotates B-roll slot 1–7 each broadcast tick with featured slot 0", () => {
    publishChessClusterBroadcastActiveV0(true);
    expect(resolveChessClusterBroadcastTickPlanV0(0)).toEqual([0, 1]);
    expect(resolveChessClusterBroadcastTickPlanV0(1)).toEqual([0, 2]);
    expect(resolveChessClusterBroadcastTickPlanV0(6)).toEqual([0, 7]);
    expect(resolveChessClusterBroadcastTickPlanV0(7)).toEqual([0, 1]);
    publishChessClusterBroadcastActiveV0(false);
    expect(resolveChessClusterBroadcastTickPlanV0(3)).toBeNull();
  });
});
