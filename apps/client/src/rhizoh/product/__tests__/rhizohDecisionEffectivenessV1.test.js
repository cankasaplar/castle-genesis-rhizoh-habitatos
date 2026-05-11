import { describe, expect, it } from "vitest";
import {
  avgClosureVisibleMsFromRollupSlice,
  segmentAvgClosureVisibleMs,
  segmentAvgTurnDepth,
  dismissTotal
} from "../rhizohDecisionEffectivenessV1.js";

describe("rhizohDecisionEffectivenessV1 helpers", () => {
  it("computes segment average closure visible delta", () => {
    const base = { closureVisibleMsSum: 10_000, closureVisibleMsCount: 2, closureDismiss: {} };
    const cur = { closureVisibleMsSum: 14_000, closureVisibleMsCount: 3, closureDismiss: {} };
    expect(avgClosureVisibleMsFromRollupSlice(base)).toBe(5000);
    expect(segmentAvgClosureVisibleMs(base, cur)).toBe(4000);
  });

  it("computes segment average depth", () => {
    const base = { turnDepthSum: 1, turnDepthCount: 2 };
    const cur = { turnDepthSum: 2.5, turnDepthCount: 5 };
    expect(segmentAvgTurnDepth(base, cur)).toBeCloseTo(0.5);
  });

  it("sums dismiss counts", () => {
    expect(dismissTotal({ closureDismiss: { timeout: 2, replaced_or_unmount: 1 } })).toBe(3);
  });
});
