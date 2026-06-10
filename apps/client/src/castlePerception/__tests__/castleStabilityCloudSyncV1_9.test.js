import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetStabilityCloudSyncForTestV1_9,
  buildCloudSyncEnvelopeV1_9,
  pullPhysicsLifecycleCloudSyncV1_9,
  pushPhysicsLifecycleCloudSyncV1_9,
  registerStabilityCloudSyncAdapterV1_9
} from "../castleStabilityCloudSyncV1_9.js";
import {
  formatLearningTraceEntryV1_9,
  summarizeLearningTraceStripV1_9
} from "../castleStabilityLearningTraceUiV1_9.js";
import {
  appendLearningTraceV1_8,
  __resetStabilityLearningTraceForTestV1_8,
  LEARNING_TRACE_KIND_V1_8
} from "../castleStabilityLearningTraceV1_8.js";
import {
  __resetStabilityMemoryGraphForTestV1_7,
  observeStabilityMemoryV1_7,
  MODALITY_V1_7
} from "../castleStabilityMemoryGraphV1_7.js";
import { REALITY_PHASE_V1_5 } from "../castleRealityPhaseEngineV1_5.js";
import {
  __resetStabilityLifecycleLoopForTestV1_9,
  applyStabilityLifecycleLoopV1_9,
  publishCastleOsLoopEventV1_9
} from "../castleStabilityLifecycleLoopV1_9.js";
import { __resetStabilityCoGovernorForTestV1_6 } from "../castleStabilityCoGovernorV1_6.js";
import { __resetStabilityHumanLoopForTestV1_6 } from "../castleStabilityHumanLoopV1_6.js";
import { __resetStabilityLifecycleLoopForTestV1_8 } from "../castleStabilityLifecycleLoopV1_8.js";
import { __resetImplicitBiasForTestV1_8 } from "../castleImplicitBiasLearningV1_8.js";
import { __clearPhysicsLifecycleStorageForTestV1_8 } from "../castleStabilityPhysicsLifecycleV1_8.js";

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

describe("castleStabilityCloudSyncV1_9", () => {
  beforeEach(() => {
    __resetStabilityCloudSyncForTestV1_9();
    __resetStabilityMemoryGraphForTestV1_7();
    __resetStabilityLearningTraceForTestV1_8();
  });

  it("builds cloud envelope with physics and trace tail", () => {
    observeStabilityMemoryV1_7("user_local", {
      atMs: 1000,
      modality: MODALITY_V1_7.CO_WATCH,
      coGovernanceActive: true,
      systemPhase: REALITY_PHASE_V1_5.TRANSITIONAL,
      resolvedPhase: REALITY_PHASE_V1_5.STABLE
    });
    appendLearningTraceV1_8("user_local", {
      atMs: 1000,
      kind: LEARNING_TRACE_KIND_V1_8.PRIOR_APPLIED,
      reason: "learned_physics_prior_applied_before_interaction"
    });

    const envelope = buildCloudSyncEnvelopeV1_9("user_local", 1100);
    expect(envelope.schema).toContain("v1.9");
    expect(envelope.physicsEnvelope.profile.observationCount).toBeGreaterThan(0);
    expect(envelope.learningTraceTail.length).toBeGreaterThan(0);
  });

  it("queues push offline when no cloud adapter", () => {
    observeStabilityMemoryV1_7("user_local", {
      atMs: 1000,
      modality: MODALITY_V1_7.CO_WATCH,
      coGovernanceActive: true
    });
    const push = pushPhysicsLifecycleCloudSyncV1_9("user_local", { atMs: 1100, immediate: true });
    expect(push.mode).toBe("offline_queue");
    expect(push.queueLength).toBeGreaterThan(0);
  });

  it("schedules debounced cloud write by default", () => {
    observeStabilityMemoryV1_7("user_local", {
      atMs: 1000,
      modality: MODALITY_V1_7.CO_WATCH,
      coGovernanceActive: true
    });
    const push = pushPhysicsLifecycleCloudSyncV1_9("user_local", { atMs: 1100 });
    expect(push.scheduled).toBe(true);
    expect(push.mode).toContain("debounced");
  });

  it("uses registered adapter for async push", async () => {
    const pushed = [];
    registerStabilityCloudSyncAdapterV1_9({
      push: async (env) => {
        pushed.push(env);
      }
    });
    observeStabilityMemoryV1_7("user_local", {
      atMs: 1000,
      modality: MODALITY_V1_7.CO_WATCH,
      coGovernanceActive: true
    });
    const result = pushPhysicsLifecycleCloudSyncV1_9("user_local", { atMs: 1100, immediate: true });
    expect(result.mode).toBe("cloud_async");
    expect(result.pushed).toBe(true);
    await Promise.resolve();
    expect(pushed.length).toBe(1);
    expect(pushed[0].userId).toBe("user_local");
  });

  it("pull merges latest offline queue envelope", () => {
    observeStabilityMemoryV1_7("user_local", {
      atMs: 1000,
      modality: MODALITY_V1_7.CO_WATCH,
      coGovernanceActive: true,
      userStabilityBias: 0.7,
      speakShare: 0.5
    });
    pushPhysicsLifecycleCloudSyncV1_9("user_local", { atMs: 1100, immediate: true });
    __resetStabilityMemoryGraphForTestV1_7();

    const pull = pullPhysicsLifecycleCloudSyncV1_9("user_local", { merge: false, atMs: 1200 });
    expect(pull.pulled).toBe(true);
    expect(pull.mode).toBe("offline_queue");
  });
});

describe("castleStabilityLearningTraceUiV1_9", () => {
  it("formats strip with last 3 human-visible entries", () => {
    const trace = {
      totalCount: 5,
      entries: [
        appendLearningTraceV1_8("u", { kind: LEARNING_TRACE_KIND_V1_8.DECAY, reason: "stale_physics_decay_toward_defaults", atMs: 1 }),
        appendLearningTraceV1_8("u", { kind: LEARNING_TRACE_KIND_V1_8.IMPLICIT_BIAS, reason: "rapid_interrupt_pattern", atMs: 2 }),
        appendLearningTraceV1_8("u", { kind: LEARNING_TRACE_KIND_V1_8.PRIOR_APPLIED, reason: "learned_physics_prior_applied_before_interaction", atMs: 3 }),
        appendLearningTraceV1_8("u", { kind: LEARNING_TRACE_KIND_V1_8.MEMORY_OBSERVE, reason: "physics_observation_tick", atMs: 4 })
      ]
    };
    const strip = summarizeLearningTraceStripV1_9(trace, 3);
    expect(strip.entries.length).toBe(3);
    expect(strip.traceable).toBe(true);
    expect(formatLearningTraceEntryV1_9(strip.entries[0]).label).toBeTruthy();
  });
});

describe("castleStabilityLifecycleLoopV1_9", () => {
  beforeEach(() => {
    __resetStabilityMemoryGraphForTestV1_7();
    __resetStabilityCoGovernorForTestV1_6();
    __resetStabilityHumanLoopForTestV1_6();
    __resetStabilityLifecycleLoopForTestV1_8();
    __resetStabilityLifecycleLoopForTestV1_9();
    __resetStabilityLearningTraceForTestV1_8();
    __resetImplicitBiasForTestV1_8();
    __resetStabilityCloudSyncForTestV1_9();
    __clearPhysicsLifecycleStorageForTestV1_8();
  });

  it("returns traceStrip and cloudSync on lifecycle tick", () => {
    const out = applyStabilityLifecycleLoopV1_9(mockStability(), {
      ownerId: "user_local",
      userInitiated: true,
      text: "normal question",
      atMs: 1000
    });
    expect(out.schema).toBe("castle.stability_lifecycle_loop.v1.9");
    expect(out.traceStrip).toBeDefined();
    expect(out.learningTraceStrip).toBeDefined();
    expect(out.cloudSync).toBeDefined();
  });

  it("publishCastleOsLoopEventV1_9 is safe in node (no window)", () => {
    expect(() => publishCastleOsLoopEventV1_9({ atMs: 1 })).not.toThrow();
  });
});
