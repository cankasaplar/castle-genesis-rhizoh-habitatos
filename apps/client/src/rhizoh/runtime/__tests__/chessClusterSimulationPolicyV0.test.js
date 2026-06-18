import { describe, expect, it } from "vitest";
import {
  CHESS_CLUSTER_DEFAULT_TIME_CONTROL_ID_V0,
  CHESS_CLUSTER_MAX_PLY_V0,
  resolveChessClusterBootOptsV0,
  resolveChessClusterTimeControlV0,
  shouldEndChessClusterGameByPlyCapV0
} from "../chessClusterSimulationPolicyV0.js";

describe("chessClusterSimulationPolicyV0", () => {
  it("defaults to cluster_sim_45_0 for boot", () => {
    const boot = resolveChessClusterBootOptsV0();
    expect(boot.timeControlId).toBe("cluster_sim_45_0");
    expect(boot.maxPly).toBe(CHESS_CLUSTER_MAX_PLY_V0);
  });

  it("resolves cluster_sim_45_0 with 45s initial", () => {
    const tc = resolveChessClusterTimeControlV0("cluster_sim_45_0");
    expect(tc.initialMs).toBe(45_000);
  });

  it("ends game at max ply cap", () => {
    expect(shouldEndChessClusterGameByPlyCapV0(79)).toBe(false);
    expect(shouldEndChessClusterGameByPlyCapV0(80)).toBe(true);
  });
});
