import { describe, expect, it, beforeEach } from "vitest";
import {
  computeProfileConfidenceV1_9,
  conflictAwareBlendV1_9,
  mergePhysicsProfilesV1_9,
  weightedEMAV1_9
} from "../castlePhysicsMergeV1_9.js";
import {
  __resetStabilityMemoryGraphForTestV1_7,
  getDefaultPhysicsProfileV1_7,
  getUserPhysicsProfileV1_7,
  MODALITY_V1_7,
  observeStabilityMemoryV1_7
} from "../castleStabilityMemoryGraphV1_7.js";
import { REALITY_PHASE_V1_5 } from "../castleRealityPhaseEngineV1_5.js";

describe("castlePhysicsMergeV1_9", () => {
  beforeEach(() => {
    __resetStabilityMemoryGraphForTestV1_7();
  });

  it("mergePhysicsProfiles reconciles — not overwrite", () => {
    const local = getDefaultPhysicsProfileV1_7("u1");
    const remote = {
      ...local,
      observationCount: 5,
      modalityBiasGraph: Object.freeze({
        ...local.modalityBiasGraph,
        [MODALITY_V1_7.CO_WATCH]: Object.freeze({
          ...local.modalityBiasGraph[MODALITY_V1_7.CO_WATCH],
          speechPriority: 0.92,
          phaseIndex: 0.08
        })
      })
    };
    const merged = mergePhysicsProfilesV1_9(
      { ...local, observationCount: 3 },
      remote,
      { atMs: 1000 }
    );
    const coWatch = merged.profile.modalityBiasGraph[MODALITY_V1_7.CO_WATCH];
    expect(coWatch.speechPriority).toBeLessThan(0.92);
    expect(coWatch.speechPriority).toBeGreaterThan(local.modalityBiasGraph[MODALITY_V1_7.CO_WATCH].speechPriority);
    expect(merged.reconciliation).toBe("cognitive_merge_v1_9");
    expect(merged.confidence).toBeLessThanOrEqual(merged.localConfidence);
  });

  it("confidence decreases with drift and low observations", () => {
    const fresh = computeProfileConfidenceV1_9({ observationCount: 2 });
    const mature = computeProfileConfidenceV1_9({ observationCount: 30, contextSwitchLatencyProfile: { overrideRate: 0 } });
    expect(mature).toBeGreaterThan(fresh);
  });

  it("weightedEMA blends toward remote with confidence weighting", () => {
    const out = weightedEMAV1_9({ a: 0.2 }, { a: 0.8 }, 0.3, 0.9);
    expect(out.a).toBeGreaterThan(0.2);
    expect(out.a).toBeLessThan(0.8);
  });

  it("conflictAwareBlend dampens high-conflict modality pairs", () => {
    const local = {
      [MODALITY_V1_7.SOCIAL]: Object.freeze({ focusBias: 0.2, speechPriority: 0.1, memoryPriority: 0.3, phaseIndex: 0.9 })
    };
    const remote = {
      [MODALITY_V1_7.SOCIAL]: Object.freeze({ focusBias: 0.9, speechPriority: 0.95, memoryPriority: 0.8, phaseIndex: 0.1 })
    };
    const blended = conflictAwareBlendV1_9(local, remote, 0.5, 0.5);
    expect(blended[MODALITY_V1_7.SOCIAL].speechPriority).toBeGreaterThan(0.1);
    expect(blended[MODALITY_V1_7.SOCIAL].speechPriority).toBeLessThan(0.95);
  });
});

describe("castlePhysicsMergeV1_9 integration", () => {
  beforeEach(() => {
    __resetStabilityMemoryGraphForTestV1_7();
  });

  it("observed profile merge preserves observation count max", () => {
    observeStabilityMemoryV1_7("user_local", {
      atMs: 1000,
      modality: MODALITY_V1_7.CO_WATCH,
      coGovernanceActive: true
    });
    const local = getUserPhysicsProfileV1_7("user_local");
    const remote = { ...local, observationCount: 99 };
    const merged = mergePhysicsProfilesV1_9(local, remote, { atMs: 2000 });
    expect(merged.profile.observationCount).toBe(99);
  });
});
