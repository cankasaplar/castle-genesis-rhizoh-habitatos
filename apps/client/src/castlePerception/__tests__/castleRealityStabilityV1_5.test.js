import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetAdaptiveInteractionForTestV1_5,
  applyLearnedInteractionV1_5,
  getLearnedInteractionWeightV1_5,
  observeInteractionOutcomeV1_5
} from "../castleAdaptiveInteractionV1_5.js";
import {
  buildInertiaVectorFieldV1_5,
  getResistanceV1_5
} from "../castleInertiaVectorFieldV1_5.js";
import {
  __resetRealityPhaseForTestV1_5,
  computeRealityPhaseV1_5,
  REALITY_PHASE_V1_5
} from "../castleRealityPhaseEngineV1_5.js";
import {
  __resetRealityStabilityForTestV1_5,
  applyRealityStabilityV1_5,
  resumeRealityContextV1_5
} from "../castleRealityStabilityGovernorV1_5.js";
import { applyRealityDynamicsV1_4 } from "../castleRealityDynamicsV1_4.js";
import { composeRealityV1_3 } from "../castleRealityCompositionV1_3.js";
import {
  __resetConversationThreadsForTestV1_2,
  createConversationThreadV1_2
} from "../castleConversationThreadV1_2.js";
import { __resetContextualIdentityForTestV1_3 } from "../castleContextualIdentityV1_3.js";
import { __resetAttentionInertiaForTestV1_4 } from "../castleAttentionInertiaV1_4.js";
import { __resetRoomRealityForTestV1_2, initRoomRealityV1_2 } from "../castleRoomRealityV1_2.js";

describe("castleRealityStabilityV1_5", () => {
  beforeEach(() => {
    __resetAdaptiveInteractionForTestV1_5();
    __resetRealityPhaseForTestV1_5();
    __resetRealityStabilityForTestV1_5();
    __resetContextualIdentityForTestV1_3();
    __resetAttentionInertiaForTestV1_4();
    __resetConversationThreadsForTestV1_2();
    __resetRoomRealityForTestV1_2();
    initRoomRealityV1_2({ roomId: "stab_room" });
  });

  it("resistance matrix is asymmetric — match to social harder than reverse", () => {
    expect(getResistanceV1_5("co_watch", "social")).toBeGreaterThan(getResistanceV1_5("social", "co_watch"));
  });

  it("learned interaction reduces suppresses under strong user intent", () => {
    const base = {
      fromTopic: "co_watch_sports",
      toTopic: "audiobook",
      suppresses: 0.42,
      enhances: 0,
      reframes: 0,
      delays: 0.22
    };
    observeInteractionOutcomeV1_5({
      fromTopic: "co_watch_sports",
      toTopic: "audiobook",
      userIntentBoost: 0.9,
      volatility: 0.2,
      dominantShift: false
    });
    const learned = applyLearnedInteractionV1_5(base, { userIntentBoost: 0.9 });
    expect(learned.suppresses).toBeLessThan(base.suppresses);
    expect(getLearnedInteractionWeightV1_5("co_watch_sports", "audiobook", "suppresses")).toBeLessThan(1);
  });

  it("phase engine locks on low volatility stable dominant thread", () => {
    const phase = computeRealityPhaseV1_5({
      atMs: 1000,
      volatility: 0.1,
      maxDeformationDelta: 0.08,
      contextShiftPending: false,
      dominantThreadStable: true
    });
    expect(phase.phase).toBe(REALITY_PHASE_V1_5.LOCKED);
    expect(phase.freezeFrame).toBe(true);
  });

  it("stability governor dampens volatile deformation", () => {
    const atMs = 5000;
    createConversationThreadV1_2({ ownerId: "u", topicLabel: "co_watch_sports", priority: 80, atMs });
    createConversationThreadV1_2({ ownerId: "u", topicLabel: "audiobook", priority: 70, atMs: atMs + 50 });

    const composition = composeRealityV1_3({
      actionPlan: { speak: true, memoryWrite: true, priority: 70, mode: "co_presence" },
      identityEvent: {
        ownerId: "u",
        preview: "Rhizoh?",
        type: "intent",
        salience: 0.8,
        timestamp: atMs + 100
      },
      atMs: atMs + 200
    });
    const dynamics = applyRealityDynamicsV1_4(composition, { ownerId: "u", atMs: atMs + 200 });

    const stable = applyRealityStabilityV1_5(dynamics, {
      ownerId: "u",
      userInitiated: true,
      atMs: atMs + 200
    });

    expect(stable.schema).toBe("castle.reality_stability.v1.5");
    expect(stable.stabilizedPlan.stabilityApplied).toBe(true);
    expect(stable.stabilizedPlan.phase).toBeTruthy();
    expect(stable.inertiaVectorField.magnitude).toBeGreaterThan(0);

    const linear = dynamics.deformedPlan.speakShare;
    if (stable.phase.phase === REALITY_PHASE_V1_5.STABLE) {
      expect(stable.stabilizedPlan.speakShare).toBeLessThanOrEqual(linear + 0.01);
    }
  });

  it("resumeRealityContext clears freeze snapshot", () => {
    const result = resumeRealityContextV1_5("userA");
    expect(result.resumed).toBe(true);
  });

  it("vector field reduces resistance when user intent overrides", () => {
    const highIntent = buildInertiaVectorFieldV1_5({
      laggedLens: "co_watch",
      currentLens: "social",
      userIntentBoost: 0.9
    });
    const lowIntent = buildInertiaVectorFieldV1_5({
      laggedLens: "co_watch",
      currentLens: "social",
      userIntentBoost: 0.3
    });
    expect(highIntent.transitionResistance).toBeLessThan(lowIntent.transitionResistance);
    expect(highIntent.userIntentOverride).toBe(true);
  });
});
