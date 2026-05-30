import { describe, expect, it } from "vitest";
import { DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0 } from "../coherenceFeedbackGovernanceV0.js";
import {
  GOVERNANCE_CONFLICT_POLICY_V0,
  governanceConflictPrecedenceLabelV0,
  resolveGovernanceFeedbackVsEvolutionV0
} from "../coherenceGovernanceConflictResolverV0.js";

describe("resolveGovernanceFeedbackVsEvolutionV0", () => {
  it("EVOLUTION_WINS matches pure evolution overlay", () => {
    const ev = { explorationLift01: 0.12, overloadLift01: 0 };
    const g = resolveGovernanceFeedbackVsEvolutionV0(
      DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0,
      ev,
      GOVERNANCE_CONFLICT_POLICY_V0.EVOLUTION_WINS
    );
    expect(g.maxBiasDeltaPerTick).toBeGreaterThan(DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0.maxBiasDeltaPerTick);
  });

  it("BASE_PRIORITY_BLEND pulls effective weights back toward base vs evolution", () => {
    const ev = { explorationLift01: 0.12, overloadLift01: 0 };
    const evolvedOnly = resolveGovernanceFeedbackVsEvolutionV0(
      DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0,
      ev,
      GOVERNANCE_CONFLICT_POLICY_V0.EVOLUTION_WINS
    );
    const blended = resolveGovernanceFeedbackVsEvolutionV0(
      DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0,
      ev,
      GOVERNANCE_CONFLICT_POLICY_V0.BASE_PRIORITY_BLEND
    );
    expect(Math.abs(blended.weightUiOnEnergyBias - DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0.weightUiOnEnergyBias)).toBeLessThan(
      Math.abs(evolvedOnly.weightUiOnEnergyBias - DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0.weightUiOnEnergyBias)
    );
  });

  it("exposes human-readable precedence labels", () => {
    expect(governanceConflictPrecedenceLabelV0(GOVERNANCE_CONFLICT_POLICY_V0.EVOLUTION_WINS)).toContain("EVOLUTION");
    expect(governanceConflictPrecedenceLabelV0(GOVERNANCE_CONFLICT_POLICY_V0.BASE_PRIORITY_BLEND)).toContain("BASE");
  });
});
