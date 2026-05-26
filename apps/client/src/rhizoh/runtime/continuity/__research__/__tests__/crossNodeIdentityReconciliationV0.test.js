import { describe, expect, it } from "vitest";
import {
  COHERENT_DISAGREEMENT_MODE_V0,
  reconcileCrossNodeIdentityV0,
  stabilizeWithoutTruthCollapseV0
} from "../crossNodeIdentityReconciliationV0.js";
import {
  IDENTITY_CONTINUITY_VERDICT_V0,
  deriveEpistemicFingerprintV0
} from "../epistemicIdentityContinuityV0.js";

const WORLD = "world:mediterranean";

function nodeObservation(nodeId, weightOffset = 0) {
  const fp = deriveEpistemicFingerprintV0({
    livingWorldId: WORLD,
    issuancePath: "canonical_chain",
    lineageRoot: "lineage:shared-root",
    witnessAnchor: { weight: 4 + weightOffset, class: "gateway", decayRate: 0.08 }
  });
  return {
    nodeId,
    verdict: IDENTITY_CONTINUITY_VERDICT_V0.SAME_SUBJECT_LOW_CONFIDENCE,
    confidence: 0.65 + weightOffset * 0.02,
    fingerprint: fp,
    lineageEquivalent: true,
    bootSealVersion: 12
  };
}

describe("crossNodeIdentityReconciliationV0 (RESEARCH-ONLY)", () => {
  it("Barcelona + Istanbul same_subject_low_confidence → degraded_ensemble without truth collapse", () => {
    const reconciliation = reconcileCrossNodeIdentityV0({
      livingWorldId: WORLD,
      observations: [nodeObservation("node:barcelona", 0), nodeObservation("node:istanbul", 0.1)]
    });

    expect(reconciliation.truthCollapsed).toBe(false);
    expect(reconciliation.stabilizationMode).toBe(COHERENT_DISAGREEMENT_MODE_V0.DEGRADED_ENSEMBLE);
    expect(reconciliation.ensembleVerdict).toBe(
      IDENTITY_CONTINUITY_VERDICT_V0.SAME_SUBJECT_LOW_CONFIDENCE
    );
    expect(reconciliation.hardGate).toBe(false);

    const stable = stabilizeWithoutTruthCollapseV0(reconciliation, {
      networkExecutorNodeId: "node:istanbul"
    });
    expect(stable.stable).toBe(true);
    expect(stable.ensembleActive).toBe(true);
    expect(stable.degradedObservability).toBe(true);
    expect(stable.allowConcurrentExecution).toBe(true);
    expect(stable.truthCollapsed).toBe(false);
    expect(stable.executionConvergenceGuard.ok).toBe(true);
  });

  it("different fingerprints but shared lineage → jurisdictional_split", () => {
    const barcelona = nodeObservation("node:barcelona", 0);
    const istanbul = deriveEpistemicFingerprintV0({
      livingWorldId: WORLD,
      issuancePath: "canonical_chain",
      lineageRoot: "lineage:shared-root",
      witnessAnchor: { weight: 12, class: "peer", decayRate: 0.2 }
    });
    const reconciliation = reconcileCrossNodeIdentityV0({
      livingWorldId: WORLD,
      observations: [
        {
          ...barcelona,
          verdict: IDENTITY_CONTINUITY_VERDICT_V0.LINEAGE_OK_IDENTITY_FORK
        },
        {
          nodeId: "node:istanbul",
          verdict: IDENTITY_CONTINUITY_VERDICT_V0.LINEAGE_OK_IDENTITY_FORK,
          confidence: 0.55,
          fingerprint: istanbul,
          lineageEquivalent: true
        }
      ]
    });

    expect(reconciliation.truthCollapsed).toBe(false);
    expect(reconciliation.stabilizationMode).toBe(
      COHERENT_DISAGREEMENT_MODE_V0.JURISDICTIONAL_SPLIT
    );
  });

  it("bundleId is stable for same observation set", () => {
    const obs = [nodeObservation("node:barcelona"), nodeObservation("node:istanbul")];
    const a = reconcileCrossNodeIdentityV0({ livingWorldId: WORLD, observations: obs });
    const b = reconcileCrossNodeIdentityV0({ livingWorldId: WORLD, observations: obs });
    expect(a.bundle.bundleId).toBe(b.bundle.bundleId);
  });
});
