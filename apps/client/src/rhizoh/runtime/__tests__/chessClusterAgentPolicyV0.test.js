import { describe, expect, it } from "vitest";
import {
  CHESS_CLUSTER_AGENT_ID_V0,
  CHESS_CLUSTER_SLOT_AGENTS_V0,
  resolveChessClusterAgentPolicyV0,
  resolveChessClusterStockfishOptsV0
} from "../chessClusterAgentPolicyV0.js";

describe("chessClusterAgentPolicyV0", () => {
  it("defines 8 slot agent pairs", () => {
    expect(CHESS_CLUSTER_SLOT_AGENTS_V0).toHaveLength(8);
  });

  it("resolves fox agent with defensive risk profile", () => {
    const p = resolveChessClusterAgentPolicyV0(CHESS_CLUSTER_AGENT_ID_V0.FOX);
    expect(p.riskProfile).toBe("defensive");
    expect(p.movetimeMs).toBeLessThan(200);
  });

  it("maps agent to stockfish opts", () => {
    const opts = resolveChessClusterStockfishOptsV0(CHESS_CLUSTER_AGENT_ID_V0.OCTOAI);
    expect(opts.skill).toBeGreaterThan(10);
    expect(opts.contempt).toBeGreaterThan(0);
  });
});
