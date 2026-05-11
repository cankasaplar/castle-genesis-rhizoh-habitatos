import { describe, expect, it } from "vitest";
import { synthesizeRhizohConstitutionalProductionDecision } from "../constitutionalDecisionLayerV1.js";
import {
  buildRhizohConstitutionalReplayHarnessSeed,
  fingerprintRhizohConstitutionalDecision,
  verifyRhizohConstitutionalReplaySeedIntegrity,
  verifyRhizohConstitutionalDecisionFingerprint
} from "../constitutionalOperationalHardeningV1.js";

function frozenObservation() {
  return {
    ethics: {
      ethicalScore: 0.55,
      harmGradient: 0.35,
      coercionPenalty: 0.12,
      truthDistortionPenalty: 0.2,
      autonomyPreservation: 0.72,
      recommendProceed: true
    },
    cost: { totalRelativeCost: 4.2, mode: "gateway_response_relative_v1" },
    recovery: {
      attractorSnap: { thetaBefore: 0.46, thetaAfter: 0.5 },
      checkpoint: { phase: "constitutional_balanced" }
    },
    latencyAssertion: { ok: true, headroomMs: 400, elapsedMs: 100 },
    metrics: { thetaEffective: 0.46, stressIndex: 0.3, collapseRisk: null },
    envelopeWithinLatencyBudget: true
  };
}

describe("constitutional replay determinism (CI harness)", () => {
  it("replays identical decision fingerprints for identical observations + thresholds", () => {
    const obs = frozenObservation();
    const a = synthesizeRhizohConstitutionalProductionDecision(obs, {
      policyId: "rhizoh.ci.replay_fixture.v1",
      thresholds: { maxRelativeCostThrottle: 18 }
    });
    const b = synthesizeRhizohConstitutionalProductionDecision(obs, {
      policyId: "rhizoh.ci.replay_fixture.v1",
      thresholds: { maxRelativeCostThrottle: 18 }
    });
    const fpa = fingerprintRhizohConstitutionalDecision(a);
    const fpb = fingerprintRhizohConstitutionalDecision(b);
    expect(fpa).toBe(fpb);
    expect(verifyRhizohConstitutionalDecisionFingerprint(a, fpa)).toBe(true);
  });

  it("replay harness seed self-check", () => {
    const obs = frozenObservation();
    const harness = buildRhizohConstitutionalReplayHarnessSeed(obs, {
      primaryPolicyId: "p1",
      primaryPolicyVersion: "9.9.9-ci",
      thresholdsFingerprint: "x",
      theta: 0.46,
      phase: "constitutional_balanced"
    });
    expect(verifyRhizohConstitutionalReplaySeedIntegrity(harness)).toBe(true);
  });
});
