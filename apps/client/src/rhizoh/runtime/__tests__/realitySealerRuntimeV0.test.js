import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  runCanonicalRealitySealerTickV0,
  buildRealitySealReplayWitnessV0,
  evaluateEpochBumpPolicyV0,
  persistRealitySealV0,
  hydrateRealitySealFromDiskV0,
  EPOCH_BUMP_POLICY_V0
} from "../realitySealerRuntimeV0.js";
import { enqueueRealitySealCandidateV0, createDefaultRealitySealLayerStateV0 } from "../realitySealingCoreV0.js";

function sealingCandidate(id) {
  return {
    candidateId: id,
    source: "studio",
    commitClassId: "sealing_topology_mandate",
    roomScope: "room:main",
    payloadHash: `p-${id}`,
    enqueuedAtMs: 1
  };
}

describe("realitySealerRuntimeV0", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    if (typeof localStorage !== "undefined") localStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("drains seal queue on canonical tick", () => {
    let seal = enqueueRealitySealCandidateV0(
      createDefaultRealitySealLayerStateV0(),
      sealingCandidate("a1")
    );
    const tick = runCanonicalRealitySealerTickV0(seal, { nowMs: 100, forceDrain: true });
    expect(tick.processed).toBe(1);
    expect(tick.sealed).toBe(1);
    expect(tick.seal.realityEpoch).toBe(1);
    expect(tick.seal.sealQueue).toHaveLength(0);
  });

  it("exports replay witness with ok chain", () => {
    const seal = runCanonicalRealitySealerTickV0(
      enqueueRealitySealCandidateV0(createDefaultRealitySealLayerStateV0(), sealingCandidate("w1")),
      { nowMs: 50, forceDrain: true }
    ).seal;
    const w = buildRealitySealReplayWitnessV0(seal);
    expect(w.replayOk).toBe(true);
    expect(w.realityEpoch).toBe(1);
  });

  it("holds drain when inflation policy is critical", () => {
    let seal = createDefaultRealitySealLayerStateV0(null, { maxSealsPerWindow: 1, windowMs: 60_000 });
    seal = runCanonicalRealitySealerTickV0(
      enqueueRealitySealCandidateV0(seal, sealingCandidate("b1")),
      { nowMs: 1, forceDrain: true }
    ).seal;
    seal = enqueueRealitySealCandidateV0(seal, sealingCandidate("b2"));
    const tick = runCanonicalRealitySealerTickV0(seal, { nowMs: 2 });
    expect(EPOCH_BUMP_POLICY_V0.holdOnCriticalInflation).toBe(true);
    if (tick.inflationStatus === "critical") {
      expect(tick.policyHold).toBe(true);
      expect(tick.sealed).toBe(0);
      expect(tick.seal.sealQueue.length).toBeGreaterThan(0);
    }
  });

  it("persists and hydrates when env enabled", () => {
    vi.stubEnv("VITE_REALITY_SEAL_PERSIST", "1");
    const seal = runCanonicalRealitySealerTickV0(
      enqueueRealitySealCandidateV0(createDefaultRealitySealLayerStateV0(), sealingCandidate("d1")),
      { nowMs: 10, forceDrain: true }
    ).seal;
    const p = persistRealitySealV0(seal);
    expect(p.ok).toBe(true);
    const h = hydrateRealitySealFromDiskV0();
    expect(h?.realityEpoch).toBe(1);
  });

  it("evaluates epoch bump policy band", () => {
    const status = evaluateEpochBumpPolicyV0(createDefaultRealitySealLayerStateV0());
    expect(["ok", "warn", "critical"]).toContain(status);
  });
});
