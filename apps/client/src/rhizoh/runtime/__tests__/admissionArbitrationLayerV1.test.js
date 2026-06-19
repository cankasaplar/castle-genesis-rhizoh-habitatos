import { beforeEach, describe, expect, it, vi } from "vitest";
import { MUTATION_REASON_CATEGORY_V1 } from "../../ticket/mutationReasonCodeOntologyV1.js";
import {
  ADMISSION_AUTHORITY_MODEL_V1,
  ADMISSION_HOLD_REASON_V1,
  ADMISSION_VERDICT_V1,
  arbitrateAdmissionV1,
  requestHumanAdmissionAttestationV1,
  resetAdmissionArbitrationForTestV1
} from "../admissionArbitrationLayerV1.js";
import {
  ingestChessDriftLaneV0,
  ingestSportsEntropyLaneV0,
  resetCrossSpaceCausalFusionForTestV0
} from "../crossSpaceCausalFusionV0.js";
import {
  fuseAndStabilizeCrossSpaceV0,
  resetCrossSpaceStabilizationForTestV0
} from "../crossSpaceStabilizationLayerV0.js";
import { resetCrossSpaceResourceGuardForTestV0 } from "../crossSpaceResourceContentionGuardV0.js";
import { resetCrossSpaceRecForTestV0 } from "../crossSpaceRecReconciliationV0.js";
import { CAUSAL_SPACE_ID_V0 } from "../sportsCausalSpaceV0.js";

vi.mock("../multiArenaSchedulerV0.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    selectActiveArenaFrameV0: vi.fn(() => ({
      primarySpaceId: CAUSAL_SPACE_ID_V0.CHESS,
      arbitrationReason: "chess_baseline_default"
    }))
  };
});

describe("admissionArbitrationLayerV1", () => {
  beforeEach(() => {
    resetAdmissionArbitrationForTestV1();
    resetCrossSpaceCausalFusionForTestV0();
    resetCrossSpaceRecForTestV0();
    resetCrossSpaceResourceGuardForTestV0();
    resetCrossSpaceStabilizationForTestV0();
  });

  it("never grants reality mutation from fusion path", () => {
    ingestChessDriftLaneV0({ z: 0.6, category: MUTATION_REASON_CATEGORY_V1.SC });
    ingestSportsEntropyLaneV0({ entropy01: 0.7 });
    const { projection } = fuseAndStabilizeCrossSpaceV0();
    const verdict = arbitrateAdmissionV1({ projection, phaseContext: { phaseAligned: true } });

    expect(verdict.realityMutationPermitted).toBe(false);
    expect(verdict.fusionAuthorityDenied).toBe(true);
    expect(verdict.authorityModel).toBe(ADMISSION_AUTHORITY_MODEL_V1.POLICY_ARBITRATION);
  });

  it("grants inference_eligible when stabilization passes", () => {
    ingestChessDriftLaneV0({ z: 0.6, category: MUTATION_REASON_CATEGORY_V1.SC });
    ingestSportsEntropyLaneV0({ entropy01: 0.7 });
    const { projection } = fuseAndStabilizeCrossSpaceV0();
    const verdict = arbitrateAdmissionV1({
      projection,
      phaseContext: { phaseAligned: true, source: "test" }
    });

    expect(verdict.verdict).toBe(ADMISSION_VERDICT_V1.INFERENCE_ELIGIBLE);
    expect(verdict.inferenceEligible).toBe(true);
    expect(verdict.admissionClass).toBe("inference_only");
  });

  it("holds cold boot with no lane evidence", () => {
    const verdict = arbitrateAdmissionV1(
      {
        projection: {
          admissionSafe: false,
          projectionTrustClass: "hold_projection",
          holdReason: "separability_below_threshold",
          separability: { separabilityOk: false, lanes: [] },
          laneAudit: { chess: { present: false }, sports: { present: false }, cux: { present: false } }
        },
        phaseContext: { phaseAligned: true, source: "boot.post_gate", phaseSeq: 1 }
      },
      { source: "boot.post_gate" }
    );

    expect(verdict.verdict).toBe(ADMISSION_VERDICT_V1.HOLD);
    expect(verdict.inferenceEligible).toBe(false);
    expect(verdict.holdReason).toBe(ADMISSION_HOLD_REASON_V1.COLD_BOOT_NO_SIGNAL);
  });

  it("requires human attestation for reality mutation requests", () => {
    const verdict = arbitrateAdmissionV1(
      { projection: { admissionSafe: true } },
      { requestRealityMutation: true }
    );

    expect(verdict.verdict).toBe(ADMISSION_VERDICT_V1.HUMAN_ATTESTATION_REQUIRED);
    expect(verdict.realityMutationPermitted).toBe(false);
    expect(verdict.elevationPath).toBe(ADMISSION_AUTHORITY_MODEL_V1.HUMAN_ONLY_GATE);
  });

  it("human attestation request does not auto-admit", () => {
    const pending = requestHumanAdmissionAttestationV1({ reason: "test_mutation" });
    expect(pending.pending).toBe(true);
    expect(pending.note).toContain("does not auto-grant");
  });

  it("is deterministic — same input yields same verdict class", () => {
    const projection = {
      admissionSafe: true,
      projectionTrustClass: "admission_safe",
      separability: {
        separabilityOk: true,
        lanes: [{ present: true, aboveThreshold: true }]
      },
      laneAudit: {
        chess: { present: true, raw: { shares: { SC: 0.5 } } }
      }
    };
    const a = arbitrateAdmissionV1({ projection, phaseContext: { phaseAligned: true } });
    resetAdmissionArbitrationForTestV1();
    const b = arbitrateAdmissionV1({ projection, phaseContext: { phaseAligned: true } });
    expect(a.verdict).toBe(b.verdict);
    expect(a.inferenceEligible).toBe(b.inferenceEligible);
  });
});
