import { describe, expect, it } from "vitest";
import { resolveSttGateConfidenceV0 } from "../sttGateConfidenceV0.js";

describe("sttGateConfidenceV0", () => {
  it("prefers temporal effectiveConfidence over raw", () => {
    const g = resolveSttGateConfidenceV0({
      confidence: 0.55,
      temporal: { effectiveConfidence: 0.61, rawConfidence: 0.55 }
    });
    expect(g.gateConfidence).toBe(0.61);
    expect(g.drift01).toBeCloseTo(0.06, 2);
  });
});
