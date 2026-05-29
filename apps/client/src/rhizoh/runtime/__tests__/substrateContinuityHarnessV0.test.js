import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildDrainContinuitySegmentV0,
  resetSubstrateContinuityHarnessStateForTestsV0,
  substrateContinuityHarnessEnabledV0,
  buildSubstrateContinuityHarnessSnapshotV0
} from "../substrateContinuityHarnessV0.js";
import { createDefaultRealitySealLayerStateV0 } from "../realitySealingCoreV0.js";
import { buildRealitySealReplayWitnessV0 } from "../realitySealerRuntimeV0.js";

describe("substrateContinuityHarnessV0", () => {
  beforeEach(() => {
    resetSubstrateContinuityHarnessStateForTestsV0();
    vi.unstubAllEnvs();
  });

  it("is disabled unless VITE_SUBSTRATE_CONTINUITY_IDB=1", () => {
    vi.stubEnv("VITE_SUBSTRATE_CONTINUITY_IDB", "0");
    expect(substrateContinuityHarnessEnabledV0()).toBe(false);
    vi.stubEnv("VITE_SUBSTRATE_CONTINUITY_IDB", "1");
    expect(substrateContinuityHarnessEnabledV0()).toBe(true);
  });

  it("builds drain segment with hash chain fold", () => {
    const seal = createDefaultRealitySealLayerStateV0();
    const witness = buildRealitySealReplayWitnessV0(seal);
    const seg = buildDrainContinuitySegmentV0(seal, witness, 0);
    expect(seg.tick).toBe(0);
    expect(typeof seg.hash).toBe("string");
    expect(seg.hash.length).toBeGreaterThan(2);
    expect(seg.body.realityEpoch).toBe(seal.realityEpoch);
  });

  it("snapshot documents narrow harness scope", () => {
    const snap = buildSubstrateContinuityHarnessSnapshotV0();
    expect(snap.scope.walSegments).toBe(true);
    expect(snap.scope.outbox).toBe(false);
    expect(snap.scope.gatewayMerge).toBe(false);
  });
});
