import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetStabilityLearningTraceForTestV1_8,
  getLearningTraceV1_8,
  LEARNING_TRACE_KIND_V1_8
} from "../castleStabilityLearningTraceV1_8.js";
import {
  __resetImplicitBiasForTestV1_8,
  observeImplicitBiasV1_8
} from "../castleImplicitBiasLearningV1_8.js";
import {
  __clearPhysicsLifecycleStorageForTestV1_8,
  applyPhysicsDecayV1_8,
  exportPhysicsLifecycleV1_8,
  importPhysicsLifecycleV1_8,
  renormalizePhysicsProfileV1_8
} from "../castleStabilityPhysicsLifecycleV1_8.js";
import {
  __resetStabilityLifecycleLoopForTestV1_8,
  applyStabilityLifecycleLoopV1_8
} from "../castleStabilityLifecycleLoopV1_8.js";
import {
  __resetStabilityMemoryGraphForTestV1_7,
  getUserPhysicsProfileV1_7,
  MODALITY_V1_7,
  observeStabilityMemoryV1_7,
  replacePhysicsProfileV1_7,
  getDefaultPhysicsProfileV1_7
} from "../castleStabilityMemoryGraphV1_7.js";
import { REALITY_PHASE_V1_5 } from "../castleRealityPhaseEngineV1_5.js";
import { __resetStabilityCoGovernorForTestV1_6 } from "../castleStabilityCoGovernorV1_6.js";
import { __resetStabilityHumanLoopForTestV1_6 } from "../castleStabilityHumanLoopV1_6.js";

function mockStability() {
  return Object.freeze({
    stabilizedPlan: Object.freeze({ speakShare: 0.4, memoryShare: 0.3, dominantThreadId: "t1" }),
    stabilizedFrame: Object.freeze({
      threads: [Object.freeze({ threadId: "t1", topicLabel: "co_watch_sports", stabilizedShare: 0.6 })]
    }),
    phase: Object.freeze({ phase: REALITY_PHASE_V1_5.TRANSITIONAL, stabilityScore: 0.55, deformationScale: 0.65 }),
    volatility: 0.3,
    dynamics: Object.freeze({
      contextualIdentity: Object.freeze({ ownerId: "user_local", contextLens: "co_watch" }),
      attentionInertia: Object.freeze({ currentLens: "co_watch" })
    })
  });
}

describe("castleStabilityLifecycleV1_8", () => {
  beforeEach(() => {
    __resetStabilityMemoryGraphForTestV1_7();
    __resetStabilityCoGovernorForTestV1_6();
    __resetStabilityHumanLoopForTestV1_6();
    __resetStabilityLearningTraceForTestV1_8();
    __resetImplicitBiasForTestV1_8();
    __resetStabilityLifecycleLoopForTestV1_8();
    __clearPhysicsLifecycleStorageForTestV1_8();
  });

  it("appendLearningTrace records human-visible learning entries", () => {
    const out = applyStabilityLifecycleLoopV1_8(mockStability(), {
      ownerId: "user_local",
      userInitiated: true,
      text: "normal question",
      atMs: 1000
    });

    expect(out.learningTrace.totalCount).toBeGreaterThan(0);
    expect(out.learningTrace.entries.every((e) => e.humanVisible === true)).toBe(true);
    expect(out.lifecycle.traceable).toBe(true);
  });

  it("implicit bias learns from rapid mic interrupts without stability command", () => {
    observeImplicitBiasV1_8("user_local", {
      atMs: 1000,
      modality: MODALITY_V1_7.CO_WATCH,
      userInitiated: true,
      explicitStabilitySignal: false,
      spikeSalience: 0.7
    });
    const result = observeImplicitBiasV1_8("user_local", {
      atMs: 2500,
      modality: MODALITY_V1_7.CO_WATCH,
      userInitiated: true,
      explicitStabilitySignal: false,
      spikeSalience: 0.75
    });

    expect(result.applied).toBe(true);
    expect(result.reason).toBe("rapid_interrupt_pattern");
    const trace = getLearningTraceV1_8("user_local");
    expect(trace.entries.some((e) => e.kind === LEARNING_TRACE_KIND_V1_8.IMPLICIT_BIAS)).toBe(true);
  });

  it("physics decay pulls stale profile toward defaults", () => {
    const defaults = getDefaultPhysicsProfileV1_7("user_local");
    replacePhysicsProfileV1_7("user_local", {
      ...defaults,
      observationCount: 5,
      personalityPhysicsActive: true,
      lastActiveAtMs: 1000,
      modalityBiasGraph: Object.freeze({
        ...defaults.modalityBiasGraph,
        [MODALITY_V1_7.CO_WATCH]: Object.freeze({
          focusBias: 0.95,
          speechPriority: 0.92,
          memoryPriority: 0.2,
          phaseIndex: 0.05
        })
      })
    });

    const decay = applyPhysicsDecayV1_8("user_local", 1000 + 25 * 60 * 1000);
    expect(decay.decayApplied).toBe(true);
    expect(decay.trace.kind).toBe(LEARNING_TRACE_KIND_V1_8.DECAY);

    const profile = getUserPhysicsProfileV1_7("user_local");
    expect(profile.modalityBiasGraph[MODALITY_V1_7.CO_WATCH].speechPriority).toBeLessThan(0.92);
  });

  it("renormalize guards against overfit deviation", () => {
    const defaults = getDefaultPhysicsProfileV1_7("user_local");
    replacePhysicsProfileV1_7("user_local", {
      ...defaults,
      observationCount: 12,
      personalityPhysicsActive: true,
      modalityBiasGraph: Object.freeze({
        ...defaults.modalityBiasGraph,
        [MODALITY_V1_7.CO_WATCH]: Object.freeze({
          focusBias: 0.98,
          speechPriority: 0.02,
          memoryPriority: 0.95,
          phaseIndex: 0.01
        })
      })
    });

    const renorm = renormalizePhysicsProfileV1_8("user_local", 5000);
    expect(renorm.renormalized).toBe(true);
    expect(renorm.trace.kind).toBe(LEARNING_TRACE_KIND_V1_8.RENORMALIZE);
  });

  it("export and import physics lifecycle envelope for cross-device sync", () => {
    for (let i = 0; i < 3; i += 1) {
      observeStabilityMemoryV1_7("user_local", {
        atMs: 1000 + i * 100,
        modality: MODALITY_V1_7.CO_WATCH,
        systemPhase: REALITY_PHASE_V1_5.TRANSITIONAL,
        resolvedPhase: REALITY_PHASE_V1_5.STABLE,
        negotiationMagnitude: 0.2,
        coGovernanceActive: true,
        userStabilityBias: 0.7,
        speakShare: 0.5
      });
    }

    const envelope = exportPhysicsLifecycleV1_8("user_local", 2000);
    __resetStabilityMemoryGraphForTestV1_7();

    const imported = importPhysicsLifecycleV1_8("user_remote", envelope, { merge: false, atMs: 2100 });
    expect(envelope.schema).toContain("v1.8");
    expect(imported.imported).toBe(true);
    expect(getUserPhysicsProfileV1_7("user_remote").observationCount).toBeGreaterThan(0);
  });
});
