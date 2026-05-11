import { describe, expect, it } from "vitest";
import { computeRhizohProductDecisionOverlay } from "../rhizohProductDecisionLayerV1.js";

describe("rhizohProductDecisionLayerV1", () => {
  it("extends closure banner when timeout-heavy dismiss pattern", () => {
    const overlay = computeRhizohProductDecisionOverlay({
      rollup: {
        closureDismiss: { timeout: 6, replaced_or_unmount: 1 },
        turnDepthCount: 2
      },
      derived: { avgTurnDepth: 0.5 }
    });
    expect(overlay.ux.closureBannerMs).toBeGreaterThan(12000);
    expect(overlay.rationale.some((r) => r.includes("closure"))).toBe(true);
  });

  it("relaxes trust gates on trust_build stall signal", () => {
    const overlay = computeRhizohProductDecisionOverlay({
      rollup: {
        phaseDwellMs: { TRUST_BUILD: 200_000 },
        phaseEnterCount: { NORMAL_CHAT: 0, TRUST_BUILD: 1 },
        turnDepthCount: 20
      },
      derived: { avgTurnDepth: 0.2 }
    });
    expect(overlay.phaseTuning.trustBondForNormal).toBeLessThanOrEqual(0.28);
    expect(overlay.rationale.some((r) => r.includes("trust_build"))).toBe(true);
  });
});
