import { describe, expect, it } from "vitest";
import { DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0 } from "../coherenceFeedbackGovernanceV0.js";
import {
  advanceGovernanceEvolutionV0,
  createInitialGovernanceEvolutionStateV0,
  resolveEffectiveCoherenceGovernanceV0
} from "../coherenceGovernanceEvolutionV0.js";

describe("advanceGovernanceEvolutionV0", () => {
  it("decays lifts when no youtube hint", () => {
    const s0 = { ...createInitialGovernanceEvolutionStateV0(), explorationLift01: 0.1, overloadLift01: 0.08 };
    const s1 = advanceGovernanceEvolutionV0(s0, null, null);
    expect(s1.explorationLift01).toBeLessThan(s0.explorationLift01);
  });

  it("raises exploration lift under stagnation-like hint", () => {
    const s = advanceGovernanceEvolutionV0(createInitialGovernanceEvolutionStateV0(), {
      emotionalDensity01: 0.05,
      publishRecommendationScore: 0.08,
      rhizohRuntimeRole: "GUIDE"
    });
    expect(s.explorationLift01).toBeGreaterThan(0.001);
  });

  it("binds sameRoleStreak to repeated kernel role trace (opts rhizohRuntimeRole)", () => {
    let st = createInitialGovernanceEvolutionStateV0();
    for (let i = 0; i < 5; i++) {
      st = advanceGovernanceEvolutionV0(st, null, { rhizohRuntimeRole: "INTERPRETER" });
    }
    expect(st.sameRoleStreak).toBe(5);
    expect(st.behaviorRoleKey).toBe("INTERPRETER");
    st = advanceGovernanceEvolutionV0(st, null, { rhizohRuntimeRole: "GUIDE" });
    expect(st.sameRoleStreak).toBe(1);
    expect(st.behaviorRoleKey).toBe("GUIDE");
  });
});

describe("resolveEffectiveCoherenceGovernanceV0", () => {
  it("widens bias delta slightly when exploration lift is high", () => {
    const ev = { ...createInitialGovernanceEvolutionStateV0(), explorationLift01: 0.12, overloadLift01: 0 };
    const g = resolveEffectiveCoherenceGovernanceV0(DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0, ev);
    expect(g.maxBiasDeltaPerTick).toBeGreaterThan(DEFAULT_COHERENCE_FEEDBACK_GOVERNANCE_V0.maxBiasDeltaPerTick);
  });
});
