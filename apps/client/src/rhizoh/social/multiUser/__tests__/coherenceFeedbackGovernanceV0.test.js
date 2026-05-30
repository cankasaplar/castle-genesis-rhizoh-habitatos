import { describe, expect, it } from "vitest";
import {
  DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0,
  deriveGovernedKernelHintsFromStateV0,
  mergeCoherenceFeedbackGovernanceV0
} from "../coherenceFeedbackGovernanceV0.js";

describe("deriveGovernedKernelHintsFromStateV0", () => {
  it("rate-limits bias delta vs previous applied bias", () => {
    const mild = {
      youtubePerfEwma: 0.5,
      wsMetricsEwma: 0.1,
      distributorPulseEwma: 0.1,
      distributorDriftEwma: 0.1,
      uiImpulseEwma: 0.1,
      studioEwma: 0.1,
      llmStressEwma: 0.1
    };
    const hot = {
      youtubePerfEwma: 1,
      wsMetricsEwma: 0.95,
      distributorPulseEwma: 0.95,
      distributorDriftEwma: 0.95,
      uiImpulseEwma: 0.95,
      studioEwma: 0.95,
      llmStressEwma: 0.95
    };
    const g = mergeCoherenceFeedbackGovernanceV0({ maxBiasDeltaPerTick: 0.02 });
    const hM = deriveGovernedKernelHintsFromStateV0(mild, null, g);
    const hH = deriveGovernedKernelHintsFromStateV0(hot, hM.peerEnergyBias01, g);
    expect(Math.abs(hH.peerEnergyBias01 - hM.peerEnergyBias01)).toBeLessThanOrEqual(0.021);
  });

  it("keeps WS metrics and distributor pulse separable in bias composition", () => {
    const g = DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0;
    const a = deriveGovernedKernelHintsFromStateV0(
      {
        youtubePerfEwma: 0.5,
        wsMetricsEwma: 0.9,
        distributorPulseEwma: 0,
        distributorDriftEwma: 0,
        uiImpulseEwma: 0,
        studioEwma: 0,
        llmStressEwma: 0
      },
      null,
      g
    );
    const b = deriveGovernedKernelHintsFromStateV0(
      {
        youtubePerfEwma: 0.5,
        wsMetricsEwma: 0,
        distributorPulseEwma: 0.9,
        distributorDriftEwma: 0,
        uiImpulseEwma: 0,
        studioEwma: 0,
        llmStressEwma: 0
      },
      null,
      g
    );
    expect(a.peerEnergyBias01).not.toBe(b.peerEnergyBias01);
  });
});
