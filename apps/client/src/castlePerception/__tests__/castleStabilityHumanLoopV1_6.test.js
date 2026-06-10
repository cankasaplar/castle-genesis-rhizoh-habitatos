import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetStabilityHumanLoopForTestV1_6,
  applyStabilityHumanLoopV1_6,
  parseStabilityFeedbackV1_6,
  STABILITY_FEEDBACK_SIGNAL_V1_6,
  submitStabilityFeedbackV1_6
} from "../castleStabilityHumanLoopV1_6.js";
import { __resetStabilityCoGovernorForTestV1_6 } from "../castleStabilityCoGovernorV1_6.js";
import { REALITY_PHASE_V1_5 } from "../castleRealityPhaseEngineV1_5.js";

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
    }),
    Object.freeze({
      threadId: "chat",
      topicLabel: "social_conversation",
      stabilizedShare: 0.2,
      executionShare: 0.2
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
    stabilizedFrame: Object.freeze({
      threads,
      phase: Object.freeze({
        phase: REALITY_PHASE_V1_5.STABLE,
        deformationScale: 0.35,
        learningEnabled: true,
        freezeFrame: false,
        stabilityScore: 0.74
      })
    }),
    phase: Object.freeze({
      phase: REALITY_PHASE_V1_5.STABLE,
      deformationScale: 0.35,
      learningEnabled: true,
      freezeFrame: false,
      stabilityScore: 0.74
    }),
    dynamics: Object.freeze({
      contextualIdentity: Object.freeze({ ownerId: "user_local" })
    })
  });
}

describe("castleStabilityHumanLoopV1_6", () => {
  beforeEach(() => {
    __resetStabilityHumanLoopForTestV1_6();
    __resetStabilityCoGovernorForTestV1_6();
  });

  it("parses Turkish sustain mode with co_watch lens", () => {
    const parsed = parseStabilityFeedbackV1_6("şu an maç modunda kal");
    expect(parsed?.signal).toBe(STABILITY_FEEDBACK_SIGNAL_V1_6.SUSTAIN_MODE);
    expect(parsed?.sustainLens).toBe("co_watch");
  });

  it("parses add_aliveness anti-sterilization feedback", () => {
    const parsed = parseStabilityFeedbackV1_6("bu çok steril, daha canlı");
    expect(parsed?.signal).toBe(STABILITY_FEEDBACK_SIGNAL_V1_6.ADD_ALIVENESS);
  });

  it("sustain_mode boosts matching thread and locks phase overlay", () => {
    submitStabilityFeedbackV1_6(STABILITY_FEEDBACK_SIGNAL_V1_6.SUSTAIN_MODE, {
      ownerId: "user_local",
      sustainLens: "co_watch",
      atMs: 1000
    });

    const out = applyStabilityHumanLoopV1_6(mockStability(), {
      ownerId: "user_local",
      atMs: 1100
    });

    expect(out.humanLoop.active).toBe(true);
    expect(out.governedPlan.humanSignal).toBe(STABILITY_FEEDBACK_SIGNAL_V1_6.SUSTAIN_MODE);
    expect(out.governedPlan.phase).toBe(REALITY_PHASE_V1_5.LOCKED);

    const sports = out.governedFrame.threads.find((t) => t.threadId === "sports");
    const audio = out.governedFrame.threads.find((t) => t.threadId === "audio");
    expect(sports.stabilizedShare).toBeGreaterThan(audio.stabilizedShare);
  });

  it("add_aliveness raises deformation floor and speak share", () => {
    const baseline = applyStabilityHumanLoopV1_6(mockStability(), { atMs: 1000 });
    const out = applyStabilityHumanLoopV1_6(mockStability(), {
      stabilityFeedback: STABILITY_FEEDBACK_SIGNAL_V1_6.ADD_ALIVENESS,
      ownerId: "user_local",
      atMs: 1000
    });

    expect(out.governedFrame.phase.deformationScale).toBeGreaterThanOrEqual(0.58);
  });

  it("slow_down reduces speak share vs baseline", () => {
    const baseline = applyStabilityHumanLoopV1_6(mockStability(), { atMs: 1000 });
    const out = applyStabilityHumanLoopV1_6(mockStability(), {
      userInitiated: true,
      text: "çok yavaş",
      ownerId: "user_local",
      atMs: 1000
    });

    expect(out.governedPlan.speakShare).toBeLessThan(baseline.governedPlan.speakShare);
    expect(out.governedPlan.phase).toBe(REALITY_PHASE_V1_5.STABLE);
  });

  it("release_lock clears active human feedback hold", () => {
    submitStabilityFeedbackV1_6(STABILITY_FEEDBACK_SIGNAL_V1_6.SUSTAIN_MODE, {
      ownerId: "user_local",
      sustainLens: "co_watch",
      atMs: 1000
    });

    submitStabilityFeedbackV1_6(STABILITY_FEEDBACK_SIGNAL_V1_6.RELEASE_LOCK, {
      ownerId: "user_local",
      atMs: 1200
    });

    const out = applyStabilityHumanLoopV1_6(mockStability(), {
      ownerId: "user_local",
      atMs: 1300
    });
    expect(out.humanLoop.active).toBe(false);
  });
});
