import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetStabilityMemoryGraphForTestV1_7,
  getContextDriftSummaryV1_7,
  getStabilityMemoryPriorsV1_7,
  getUserPhysicsProfileV1_7,
  inferModalityV1_7,
  inferTimeBucketV1_7,
  MODALITY_V1_7,
  observeStabilityMemoryV1_7,
  TIME_BUCKET_V1_7
} from "../castleStabilityMemoryGraphV1_7.js";
import { applyStabilityMemoryLoopV1_7 } from "../castleStabilityMemoryLoopV1_7.js";
import { REALITY_PHASE_V1_5 } from "../castleRealityPhaseEngineV1_5.js";
import { __resetStabilityCoGovernorForTestV1_6 } from "../castleStabilityCoGovernorV1_6.js";
import { __resetStabilityHumanLoopForTestV1_6, submitStabilityFeedbackV1_6, STABILITY_FEEDBACK_SIGNAL_V1_6 } from "../castleStabilityHumanLoopV1_6.js";

function mockStability(overrides = {}) {
  return Object.freeze({
    stabilizedPlan: Object.freeze({
      speak: true,
      speakShare: 0.42,
      memoryShare: 0.3,
      highlightShare: 0.25,
      dominantThreadId: "sports"
    }),
    stabilizedFrame: Object.freeze({
      threads: [
        Object.freeze({
          threadId: "sports",
          topicLabel: "co_watch_sports",
          stabilizedShare: 0.6,
          executionShare: 0.6
        })
      ]
    }),
    phase: Object.freeze({
      phase: REALITY_PHASE_V1_5.TRANSITIONAL,
      deformationScale: 0.65,
      stabilityScore: 0.55
    }),
    volatility: 0.38,
    dynamics: Object.freeze({
      contextualIdentity: Object.freeze({ ownerId: "user_local", contextLens: "co_watch" }),
      attentionInertia: Object.freeze({ currentLens: "co_watch", laggedLens: "co_watch" })
    }),
    ...overrides
  });
}

describe("castleStabilityMemoryGraphV1_7", () => {
  beforeEach(() => {
    __resetStabilityMemoryGraphForTestV1_7();
    __resetStabilityCoGovernorForTestV1_6();
    __resetStabilityHumanLoopForTestV1_6();
  });

  it("infers co_watch modality from contextual lens", () => {
    expect(inferModalityV1_7(mockStability())).toBe(MODALITY_V1_7.CO_WATCH);
  });

  it("builds memory priors from default physics profile", () => {
    const priors = getStabilityMemoryPriorsV1_7("user_local", {
      modality: MODALITY_V1_7.CO_WATCH,
      timeBucket: TIME_BUCKET_V1_7.EVENING,
      atMs: Date.UTC(2026, 5, 7, 20, 0, 0)
    });
    expect(priors.modality).toBe(MODALITY_V1_7.CO_WATCH);
    expect(priors.interruptionTolerance).toBeLessThan(0.5);
    expect(priors.phaseIndexPrior).toBeDefined();
  });

  it("records context drift when user overrides system phase", () => {
    observeStabilityMemoryV1_7("user_local", {
      atMs: 1000,
      modality: MODALITY_V1_7.CO_WATCH,
      timeBucket: TIME_BUCKET_V1_7.EVENING,
      systemPhase: REALITY_PHASE_V1_5.TRANSITIONAL,
      resolvedPhase: REALITY_PHASE_V1_5.STABLE,
      negotiationMagnitude: 0.22,
      feedbackSignal: "fast_explain",
      coGovernanceActive: true,
      userStabilityBias: 0.74,
      speakShare: 0.51,
      memoryShare: 0.28
    });

    const drift = getContextDriftSummaryV1_7("user_local");
    expect(drift.totalDriftEvents).toBe(1);
    expect(drift.driftByModality[MODALITY_V1_7.CO_WATCH]).toBe(1);

    const profile = getUserPhysicsProfileV1_7("user_local");
    expect(profile.personalityPhysicsActive).toBe(true);
    expect(profile.observationCount).toBe(1);
  });

  it("learns modality bias after repeated co_watch fast explain overrides", () => {
    for (let i = 0; i < 5; i += 1) {
      observeStabilityMemoryV1_7("user_local", {
        atMs: 1000 + i * 500,
        modality: MODALITY_V1_7.CO_WATCH,
        systemPhase: REALITY_PHASE_V1_5.TRANSITIONAL,
        resolvedPhase: REALITY_PHASE_V1_5.STABLE,
        negotiationMagnitude: 0.2,
        feedbackSignal: "fast_explain",
        coGovernanceActive: true,
        userStabilityBias: 0.74,
        speakShare: 0.55,
        memoryShare: 0.25
      });
    }

    const priors = getStabilityMemoryPriorsV1_7("user_local", {
      modality: MODALITY_V1_7.CO_WATCH,
      atMs: 5000
    });
    expect(priors.learnedPhysicsActive).toBe(true);
    expect(priors.speechPriority).toBeGreaterThan(0.52);
  });

  it("memory loop applies priors and records observation per tick", () => {
    submitStabilityFeedbackV1_6(STABILITY_FEEDBACK_SIGNAL_V1_6.FAST_EXPLAIN, {
      ownerId: "user_local",
      atMs: 1000
    });

    const out = applyStabilityMemoryLoopV1_7(mockStability(), {
      ownerId: "user_local",
      atMs: 1100
    });

    expect(out.modality).toBe(MODALITY_V1_7.CO_WATCH);
    expect(out.memoryPriors).toBeDefined();
    expect(out.userPhysicsProfile.observationCount).toBeGreaterThan(0);
    expect(out.contextDrift).toBeDefined();
  });

  it("infers night bucket from late hour", () => {
    const nightMs = Date.UTC(2026, 5, 7, 23, 30, 0);
    expect(inferTimeBucketV1_7(nightMs)).toBe(TIME_BUCKET_V1_7.NIGHT);
  });
});
