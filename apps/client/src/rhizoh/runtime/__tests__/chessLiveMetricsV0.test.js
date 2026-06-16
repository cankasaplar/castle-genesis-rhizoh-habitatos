import { describe, expect, it } from "vitest";
import { computeChessLiveMetricsV0 } from "../chessLiveMetricsV0.js";

describe("chessLiveMetricsV0", () => {
  it("computes accuracy and risk from regret trace", () => {
    const metrics = computeChessLiveMetricsV0({
      outcome: "draw",
      localColor: "w",
      moveCount: 40,
      regret: {
        regretCount: 2,
        forcedWinIgnored: true,
        evalTrace: [
          { swingCp: -60 },
          { swingCp: -20 },
          { swingCp: 5 }
        ]
      }
    });
    expect(metrics.accuracy).toBeGreaterThan(0);
    expect(metrics.riskIndex).toBeGreaterThan(50);
    expect(metrics.forcedWinIgnored).toBe(true);
    expect(metrics.momentum).toBeLessThan(0);
  });
});
