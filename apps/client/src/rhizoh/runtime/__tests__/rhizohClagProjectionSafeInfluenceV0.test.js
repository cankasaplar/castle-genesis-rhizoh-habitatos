import { describe, it, expect } from "vitest";
import { applyProjectionSafeInfluenceReductionV0 } from "../rhizohClagProjectionSafeInfluenceV0.js";

describe("rhizohClagProjectionSafeInfluenceV0", () => {
  it("passes through scores when no contamination risk", () => {
    const pre = {
      dominantShaper: "depth",
      shapingAnswer: "conversation_depth_mode_shaping",
      shaperScores: { depth: 0.5, narrative: 0.3, academy: 0 }
    };
    const out = applyProjectionSafeInfluenceReductionV0(pre, null);
    expect(out.reductionApplied).toBe(false);
    expect(out.shaperScores.depth).toBe(0.5);
  });

  it("dampens narrative/academy when graph contamination detected", () => {
    const pre = {
      dominantShaper: "narrative",
      shapingAnswer: "narrative_and_depth_co_shaping",
      shaperScores: { depth: 0.24, narrative: 0.33, academy: 0.1 }
    };
    const out = applyProjectionSafeInfluenceReductionV0(pre, {
      graphContamination: { detected: true, blockedNodeIds: ["real_life:anchor_sariyer_stability"] }
    });
    expect(out.reductionApplied).toBe(true);
    expect(out.shaperScores.narrative).toBeLessThan(0.33);
    expect(out.shaperScores.depth).toBe(0.24);
  });
});
