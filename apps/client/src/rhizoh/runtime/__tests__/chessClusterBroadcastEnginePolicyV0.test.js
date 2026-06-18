import { beforeEach, describe, expect, it } from "vitest";
import {
  getChessClusterBroadcastEnginePolicySnapshotV0,
  isChessClusterBroadcastModeV0,
  shouldUseStockfishForClusterSlotV0
} from "../chessClusterBroadcastEnginePolicyV0.js";
import { publishChessClusterArenaOpenV0 } from "../chessEngineContentionGateV0.js";
import { CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0 } from "../chessLearningMonitorV0.js";

describe("chessClusterBroadcastEnginePolicyV0", () => {
  beforeEach(() => {
    window.__rhizoh = {};
    publishChessClusterArenaOpenV0(false);
  });

  it("uses Stockfish for all slots when broadcast UI is closed", () => {
    expect(isChessClusterBroadcastModeV0()).toBe(false);
    expect(shouldUseStockfishForClusterSlotV0(0)).toBe(true);
    expect(shouldUseStockfishForClusterSlotV0(3)).toBe(true);
    expect(shouldUseStockfishForClusterSlotV0(7)).toBe(true);
  });

  it("uses Stockfish only for featured slot when 8-camera UI is open", () => {
    publishChessClusterArenaOpenV0(true);
    expect(isChessClusterBroadcastModeV0()).toBe(true);
    expect(shouldUseStockfishForClusterSlotV0(CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0)).toBe(true);
    expect(shouldUseStockfishForClusterSlotV0(1)).toBe(false);
    expect(shouldUseStockfishForClusterSlotV0(7)).toBe(false);
  });

  it("snapshot reports broadcast grid heuristic policy", () => {
    publishChessClusterArenaOpenV0(true);
    const snap = getChessClusterBroadcastEnginePolicySnapshotV0();
    expect(snap.broadcastMode).toBe(true);
    expect(snap.featuredSlotId).toBe(CHESS_CLUSTER_SPECTATOR_SLOT_ID_V0);
    expect(snap.gridUsesHeuristic).toBe(true);
  });
});
