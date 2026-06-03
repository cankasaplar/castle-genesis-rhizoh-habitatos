import { describe, expect, it, beforeEach } from "vitest";
import {
  applyOriginConfidenceEmaV0,
  resetOriginConfidenceEmaForTestV0
} from "../rhizohSttOriginConfidenceEmaV0.js";
import {
  resolveOriginAttributionDecisionV0,
  POST_STT_ORIGIN_ACTION_V0
} from "../rhizohVoicePostSttSemanticOriginFilterV0.js";

describe("rhizohSttOriginConfidenceEmaV0", () => {
  beforeEach(() => {
    resetOriginConfidenceEmaForTestV0();
  });

  it("smooths single-frame ui leak spike across window", () => {
    const spike = applyOriginConfidenceEmaV0({
      speech: 0.5,
      uiLeak: 0.85,
      subtitleLeak: 0.1,
      languageMatch: 0.7,
      templateScore: 0.8
    });
    expect(resolveOriginAttributionDecisionV0(spike.originConfidenceStable).action).toBe(
      POST_STT_ORIGIN_ACTION_V0.DROP
    );

    resetOriginConfidenceEmaForTestV0();
    applyOriginConfidenceEmaV0({
      speech: 0.72,
      uiLeak: 0.85,
      subtitleLeak: 0.1,
      languageMatch: 0.86,
      templateScore: 0.82
    });
    const clean = applyOriginConfidenceEmaV0({
      speech: 0.74,
      uiLeak: 0.08,
      subtitleLeak: 0.02,
      languageMatch: 0.9,
      templateScore: 0.12
    });
    expect(clean.originConfidenceStable.uiLeak).toBeLessThan(0.7);
    expect(resolveOriginAttributionDecisionV0(clean.originConfidenceStable).action).toBe(
      POST_STT_ORIGIN_ACTION_V0.PASS
    );
  });
});
