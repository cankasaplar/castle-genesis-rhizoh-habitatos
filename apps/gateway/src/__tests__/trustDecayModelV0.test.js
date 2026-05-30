import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  TRUST_DYNAMICS_FORK_V0,
  buildTrustDecayMythologyModelV0,
  collectTrustDynamicsAxesV0,
  resolveTrustDynamicsForkV0
} from "../ops/trustDecayModelV0.js";
import { buildUnifiedStateNarrativeV0 } from "../ops/unifiedStateNarrativeV0.js";
import { runSocialPropagationSimulationV0 } from "../ops/socialPropagationSimulationV0.js";

describe("trustDecayModelV0", () => {
  it("high mythology axes when confidence detached and low raw access", () => {
    const axes = collectTrustDynamicsAxesV0(
      {},
      {
        paths: [
          {
            confidencePublicDistortionRisk: true,
            channel: "tiktok_short",
            persistence: { culturalMemoryFormation: true, urbanLegendEmergence: true }
          }
        ],
        aggregate: {
          dominantDistortionSource: "confidence_detached_from_epistemic_context",
          maxAuthorityAmplificationMultiplier: 5.5,
          worstWatermarkSurvivability: 0.1
        }
      }
    );
    const fork = resolveTrustDynamicsForkV0({
      ...axes,
      divergenceVisible: true,
      rawVerificationAccess: 0.05,
      narrativeContradictionFrequency: 0.4
    });
    assert.ok(fork.mythologyScore > fork.trustDecayScore || fork.fork === TRUST_DYNAMICS_FORK_V0.AMBIGUOUS);
  });

  it("trust decay favored when raw verification high and contradiction high", () => {
    const fork = resolveTrustDynamicsForkV0({
      exposureRepetition: 0.2,
      confidenceDetachmentExposure: 0.3,
      influencerRelayCount: 0,
      rawVerificationAccess: 0.85,
      narrativeContradictionFrequency: 0.75,
      communityReinforcement: 0.1,
      epistemicObservatoryAppeal: false,
      divergenceVisible: true
    });
    assert.equal(fork.fork, TRUST_DYNAMICS_FORK_V0.TRUST_DECAY);
  });

  it("bundles on full narrative export", async () => {
    const n = await buildUnifiedStateNarrativeV0({ tenantId: "org-trust-test" });
    assert.ok(n.culturalRisk?.trustDynamics?.axes.influencerRelayCount >= 0);
    assert.ok(n.culturalRisk.trustDynamics.humanResponse);
    assert.equal(n.culturalRisk.trustDynamics.nonExecutable, true);
  });

  it("same divergence can score both forks materially", () => {
    const fork = resolveTrustDynamicsForkV0({
      exposureRepetition: 0.45,
      confidenceDetachmentExposure: 0.5,
      influencerRelayCount: 2,
      rawVerificationAccess: 0.55,
      narrativeContradictionFrequency: 0.55,
      communityReinforcement: 0.35,
      epistemicObservatoryAppeal: true,
      divergenceVisible: true
    });
    assert.ok(fork.trustDecayScore > 0.1);
    assert.ok(fork.mythologyScore > 0.1);
    assert.ok(fork.margin < 0.2, "bifurcated — neither fork dominates trivially");
  });
});
