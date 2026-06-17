import { describe, expect, it } from "vitest";
import {
  CHESS_CLUSTER_SLOT_MODES_V0,
  CHESS_CLUSTER_SLOT_MODE_ID_V0,
  resolveChessClusterSlotModeV0
} from "../chessClusterSlotModesV0.js";

describe("chessClusterSlotModesV0", () => {
  it("defines 8 distinct board modes", () => {
    expect(CHESS_CLUSTER_SLOT_MODES_V0).toHaveLength(8);
    const ids = CHESS_CLUSTER_SLOT_MODES_V0.map((m) => m.modeId);
    expect(new Set(ids).size).toBe(8);
  });

  it("maps slot 0 to rhizoh vs stockfish spectator", () => {
    const mode = resolveChessClusterSlotModeV0(0);
    expect(mode.modeId).toBe(CHESS_CLUSTER_SLOT_MODE_ID_V0.RHIZOH_VS_STOCKFISH);
    expect(mode.moveStrategy).toBe("rhizoh_vs_stockfish");
    expect(mode.spectatorFeatured).toBe(true);
    expect(mode.whiteAgent).toBe("rhizoh_ai");
  });

  it("maps slot 3 to random perturbation", () => {
    const mode = resolveChessClusterSlotModeV0(3);
    expect(mode.modeId).toBe(CHESS_CLUSTER_SLOT_MODE_ID_V0.RANDOM_PERTURBATION);
    expect(mode.moveStrategy).toBe("random_perturb");
  });
});
