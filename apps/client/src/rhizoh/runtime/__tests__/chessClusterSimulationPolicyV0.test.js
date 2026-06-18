import { describe, expect, it } from "vitest";
import {
  CHESS_CLUSTER_DEFAULT_TIME_CONTROL_ID_V0,
  CHESS_CLUSTER_MAX_PLY_V0,
  resolveChessClusterBootOptsV0,
  resolveChessClusterTimeControlV0,
  shouldEndChessClusterGameByPlyCapV0
} from "../chessClusterSimulationPolicyV0.js";

describe("chessClusterSimulationPolicyV0", () => {
  it("defaults to cluster_sim_1_0 for boot", () => {
    const boot = resolveChessClusterBootOptsV0();
    expect(boot.timeControlId).toBe(CHESS_CLUSTER_DEFAULT_TIME_CONTROL_ID_V0);
    expect(boot.maxPly).toBe(CHESS_CLUSTER_MAX_PLY_V0);
  });

  it("resolves cluster time control with 60s initial", () => {
    const tc = resolveChessClusterTimeControlV0("cluster_sim_1_0");
    expect(tc.initialMs).toBe(60_000);
  });

  it("ends game at max ply cap", () => {
    expect(shouldEndChessClusterGameByPlyCapV0(119)).toBe(false);
    expect(shouldEndChessClusterGameByPlyCapV0(120)).toBe(true);
  });
});
