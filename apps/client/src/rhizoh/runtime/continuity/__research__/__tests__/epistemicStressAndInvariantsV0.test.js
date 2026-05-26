import { describe, expect, it } from "vitest";
import {
  assertExecutionConvergenceGuardV0,
  deriveAllowConcurrentExecutionV0
} from "../epistemicExecutionInvariantsV0.js";
import {
  COHERENT_DISAGREEMENT_MODE_V0,
  reconcileCrossNodeIdentityV0,
  stabilizeWithoutTruthCollapseV0
} from "../crossNodeIdentityReconciliationV0.js";
import {
  computeEpistemicSplitBrainScoreV0,
  propagateEpistemicStressV0
} from "../epistemicStressPropagationV0.js";
import { IDENTITY_CONTINUITY_VERDICT_V0 } from "../epistemicIdentityContinuityV0.js";

describe("epistemic execution invariants (RESEARCH-ONLY)", () => {
  it("allowConcurrentExecution when stable plural interpretation", () => {
    const c = deriveAllowConcurrentExecutionV0(COHERENT_DISAGREEMENT_MODE_V0.DEGRADED_ENSEMBLE, true);
    expect(c.allowConcurrentExecution).toBe(true);
  });

  it("execution convergence guard rejects branch proliferation", () => {
    const g = assertExecutionConvergenceGuardV0({
      networkExecutorNodeId: "node:istanbul",
      interpretationBranchCount: 99,
      stable: true
    });
    expect(g.ok).toBe(false);
    expect(g.drift).toBe("branch_proliferation");
  });

  it("stable degraded ensemble + single executor passes guard", () => {
    const obs = [
      {
        nodeId: "node:barcelona",
        verdict: IDENTITY_CONTINUITY_VERDICT_V0.SAME_SUBJECT_LOW_CONFIDENCE,
        confidence: 0.7
      },
      {
        nodeId: "node:istanbul",
        verdict: IDENTITY_CONTINUITY_VERDICT_V0.SAME_SUBJECT_LOW_CONFIDENCE,
        confidence: 0.68
      }
    ];
    const rec = reconcileCrossNodeIdentityV0({ livingWorldId: "world:med", observations: obs });
    const stable = stabilizeWithoutTruthCollapseV0(rec, {
      networkExecutorNodeId: "node:istanbul",
      interpretationBranchCount: 1
    });
    expect(stable.allowConcurrentExecution).toBe(true);
    expect(stable.executionConvergenceGuard.ok).toBe(true);
    expect(stable.truthCollapsed).toBe(false);
  });
});

describe("epistemic stress propagation (Phase 9.1 stub)", () => {
  it("splitBrain score rises with verdict spread", () => {
    const unanimous = computeEpistemicSplitBrainScoreV0({
      observations: [
        { nodeId: "a", verdict: "same_subject_low_confidence", confidence: 0.7 },
        { nodeId: "b", verdict: "same_subject_low_confidence", confidence: 0.69 }
      ],
      disagreementField: {
        nodeCount: 2,
        verdictSpread: 1,
        confidenceMean: 0.695,
        confidenceMin: 0.69,
        confidenceMax: 0.7,
        unanimous: true,
        lowConfidenceBand: true
      },
      pairwiseRelations: [{ nodeA: "a", nodeB: "b", crossConfidence: 0.9, sameFingerprint: true }]
    });
    const plural = computeEpistemicSplitBrainScoreV0({
      observations: [
        { nodeId: "a", verdict: "same_subject", confidence: 0.95 },
        { nodeId: "b", verdict: "unrelated", confidence: 0.2 }
      ],
      disagreementField: {
        nodeCount: 2,
        verdictSpread: 2,
        confidenceMean: 0.575,
        confidenceMin: 0.2,
        confidenceMax: 0.95,
        unanimous: false,
        lowConfidenceBand: false
      },
      pairwiseRelations: [{ nodeA: "a", nodeB: "b", crossConfidence: 0.1, sameFingerprint: false }]
    });
    expect(plural.epistemicSplitBrainScore).toBeGreaterThan(unanimous.epistemicSplitBrainScore);
  });

  it("propagateEpistemicStress shapes field without truth collapse", () => {
    const out = propagateEpistemicStressV0({
      nodes: [
        { nodeId: "node:barcelona", localStress: 0.6 },
        { nodeId: "node:istanbul", localStress: 0.3 }
      ],
      edges: [{ from: "node:barcelona", to: "node:istanbul", trustWeight: 0.8 }]
    });
    expect(out.truthCollapsed).toBe(false);
    expect(out.stressField).toHaveLength(2);
    expect(out.fieldDigest).toMatch(/^h[0-9a-f]+$/);
  });
});
