import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetStabilityCoGovernorForTestV1_6,
  negotiateStabilityV1_6
} from "../castleStabilityCoGovernorV1_6.js";
import { REALITY_PHASE_V1_5 } from "../castleRealityPhaseEngineV1_5.js";
import {
  parseStabilityFeedbackV1_6,
  applyStabilityHumanLoopV1_6,
  STABILITY_FEEDBACK_SIGNAL_V1_6,
  submitStabilityFeedbackV1_6,
  __resetStabilityHumanLoopForTestV1_6
} from "../castleStabilityHumanLoopV1_6.js";

function mockStability(overrides = {}) {
  const threads = overrides.threads || [
    Object.freeze({
      threadId: "sports",
      topicLabel: "co_watch_sports",
      stabilizedShare: 0.45,
      executionShare: 0.45
    }),
    Object.freeze({
      threadId: "audio",
      topicLabel: "audiobook",
      stabilizedShare: 0.35,
      executionShare: 0.35
    })
  ];

  return Object.freeze({
    stabilizedPlan: Object.freeze({
      speak: true,
      speakShare: 0.42,
      memoryShare: 0.3,
      highlightShare: 0.25,
      dominantThreadId: "sports",
      ...overrides.plan
    }),
    stabilizedFrame: Object.freeze({ threads }),
    phase: Object.freeze({
      phase: REALITY_PHASE_V1_5.TRANSITIONAL,
      deformationScale: 0.65,
      learningEnabled: true,
      freezeFrame: false,
      stabilityScore: 0.55
    }),
    volatility: 0.38,
    dynamics: Object.freeze({
      contextualIdentity: Object.freeze({ ownerId: "user_local" })
    })
  });
}

describe("castleStabilityCoGovernorV1_6", () => {
  beforeEach(() => {
    __resetStabilityCoGovernorForTestV1_6();
    __resetStabilityHumanLoopForTestV1_6();
  });

  it("negotiation field detects user_leans_fast when user wants fast explain", () => {
    const feedback = Object.freeze({
      signal: STABILITY_FEEDBACK_SIGNAL_V1_6.FAST_EXPLAIN,
      source: "voice_parse",
      atMs: 1000,
      expiresAtMs: 9000
    });

    const out = negotiateStabilityV1_6(mockStability(), {
      ownerId: "user_local",
      atMs: 1100,
      feedback
    });

    expect(out.negotiated).toBe(true);
    expect(out.coGovernorState.negotiationField.direction).toBe("user_leans_stable");
    expect(out.stabilityAgreement.interactionContract).toBe(true);
    expect(out.negotiatedPlan.speakShare).toBeGreaterThan(0.35);
  });

  it("summarize_request keeps speak low and schedules summary spike", () => {
    const feedback = Object.freeze({
      signal: STABILITY_FEEDBACK_SIGNAL_V1_6.SUMMARIZE_REQUEST,
      source: "ingress",
      atMs: 1000,
      expiresAtMs: 12000
    });

    const out = negotiateStabilityV1_6(mockStability(), {
      ownerId: "user_local",
      atMs: 1100,
      feedback
    });

    expect(out.negotiatedPlan.speakShare).toBeLessThanOrEqual(0.2);
    expect(out.negotiatedPlan.memoryShare).toBeGreaterThanOrEqual(0.4);
    expect(out.negotiatedPlan.summarySpikeScheduled).toBe(true);
  });

  it("phase is blended between system and user — not hard override", () => {
    const feedback = Object.freeze({
      signal: STABILITY_FEEDBACK_SIGNAL_V1_6.FAST_EXPLAIN,
      source: "explicit",
      atMs: 1000,
      expiresAtMs: 9000
    });

    const out = negotiateStabilityV1_6(mockStability(), {
      ownerId: "user_local",
      atMs: 1100,
      feedback
    });

    expect(out.negotiatedPhase.coGoverned).toBe(true);
    expect(out.negotiatedPhase.priorPhase).toBe(REALITY_PHASE_V1_5.TRANSITIONAL);
    expect(out.stabilityAgreement.negotiatedPhaseRange.blendedIndex).toBeDefined();
  });

  it("parses YouTube+match fast explain scenario from Turkish voice", () => {
    const parsed = parseStabilityFeedbackV1_6("bana hızlı açıkla");
    expect(parsed?.signal).toBe(STABILITY_FEEDBACK_SIGNAL_V1_6.FAST_EXPLAIN);

    submitStabilityFeedbackV1_6(parsed.signal, {
      ownerId: "user_local",
      atMs: 1000
    });

    const out = applyStabilityHumanLoopV1_6(mockStability(), {
      ownerId: "user_local",
      userInitiated: true,
      text: "bana hızlı açıkla",
      atMs: 1100
    });

    expect(out.coGovernance.negotiated).toBe(true);
    expect(out.stabilityAgreement.allowedDeformationRange.resolved).toBeLessThan(0.65);
  });
});
