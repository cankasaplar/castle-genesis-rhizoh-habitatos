import { describe, expect, it } from "vitest";
import {
  CHESS_BROADCAST_FEATURED_MATCH_V0,
  getChessBroadcastOpponentMatrixV0
} from "../chessBroadcastOpponentMatrixV0.js";

describe("chessBroadcastOpponentMatrixV0", () => {
  it("exports featured RhizohAI vs Stockfish MAX match", () => {
    const matrix = getChessBroadcastOpponentMatrixV0();
    expect(matrix.interpretationOnly).toBe(true);
    expect(matrix.featuredMatch.format).toBe("RhizohAI vs Stockfish MAX");
    expect(matrix.featuredMatch.blackPreset).toBe("MAX");
    expect(matrix.clusterSlots).toHaveLength(8);
    expect(matrix.clusterSlots[0].spectatorFeatured).toBe(true);
    expect(matrix.stockfishTiers).toContain("MAX");
    expect(CHESS_BROADCAST_FEATURED_MATCH_V0.timeControlId).toBe("cluster_sim_45_0");
  });
});
