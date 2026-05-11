import { CapabilityToken } from "../sovereignChronos.js";
import { POLICY_ACTION_MUTATE } from "../constitutional/constitutionalPolicies.js";
import { createInitialConstitutionalState } from "../constitutional/constitutionalState.js";
import { createHyperEdgeStore } from "../memory/hyperEdgeStore.js";

export function epochInput(over = {}) {
  const s0 = createInitialConstitutionalState(0);
  return {
    prevState: s0,
    prevStore: createHyperEdgeStore(),
    prevPressure: [0, 0, 0, 0, 0],
    kappa: 0.12,
    basePriority: "NORMAL",
    closureInput: {
      worldState: { coherence: 0.75, novelty: 0.25 },
      memoryState: { depth: 0.55, stability: 0.6, echo: 0.5, salience: 0.55 },
      interactionState: { uncertainty: 0.35 },
      agentState: { conflict: 0.65 },
      verifyOptions: { tier: 0, chronosBudgetMs: 100, provenanceHint: 0.8 },
      discomfortSignals: {
        expectedVsObserved: 0.35,
        policyVsAction: 0.3,
        memoryVsReality: 0.28,
        proofVsUncertainty: 0.32
      },
      simTime: 1,
      now: 90000,
      capability: new CapabilityToken({ scope: "e", expiresAtSim: 999, actions: [POLICY_ACTION_MUTATE] }),
      mutationReason: "epoch_test",
      prevSchedule: { version: 0, wakeCycle: 1, verificationCadence: 1, memoryCompaction: 2, sovereignReview: 5 },
      ...over
    }
  };
}
