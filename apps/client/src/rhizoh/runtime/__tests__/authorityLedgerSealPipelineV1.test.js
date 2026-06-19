import { beforeEach, describe, expect, it, vi } from "vitest";
import { MUTATION_REASON_CATEGORY_V1 } from "../../ticket/mutationReasonCodeOntologyV1.js";
import {
  ADMISSION_VERDICT_V1,
  arbitrateAdmissionV1,
  resetAdmissionArbitrationForTestV1
} from "../admissionArbitrationLayerV1.js";
import {
  AUTHORITY_CHAIN_STAGE_V1,
  AUTHORITY_DECISION_V1,
  processAuthorityPipelineV1,
  recordHumanAttestationV1,
  replayAuthorityLedgerV1,
  resetAuthorityLedgerForTestV1
} from "../authorityLedgerSealPipelineV1.js";
import {
  ingestChessDriftLaneV0,
  ingestSportsEntropyLaneV0,
  resetCrossSpaceCausalFusionForTestV0
} from "../crossSpaceCausalFusionV0.js";
import { resetCrossSpaceResourceGuardForTestV0 } from "../crossSpaceResourceContentionGuardV0.js";
import { resetCrossSpaceRecForTestV0 } from "../crossSpaceRecReconciliationV0.js";
import {
  fuseAndStabilizeCrossSpaceV0,
  resetCrossSpaceStabilizationForTestV0
} from "../crossSpaceStabilizationLayerV0.js";
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

describe("authorityLedgerSealPipelineV1", () => {
  beforeEach(() => {
    resetAuthorityLedgerForTestV1();
    resetAdmissionArbitrationForTestV1();
    resetCrossSpaceCausalFusionForTestV0();
    resetCrossSpaceRecForTestV0();
    resetCrossSpaceResourceGuardForTestV0();
    resetCrossSpaceStabilizationForTestV0();
  });

  it("seals hold verdict to ledger with height increment", () => {
    const arbitration = arbitrateAdmissionV1(
      {
        projection: { admissionSafe: false, holdReason: "cold_boot" },
        phaseContext: { source: "boot.post_gate", phaseAligned: true }
      },
      { source: "boot.post_gate" }
    );

    const pipeline = processAuthorityPipelineV1({ arbitration });
    expect(pipeline.ledgerHeight).toBe(1);
    expect(pipeline.sealedEntry.height).toBe(1);
    expect(pipeline.sealedEntry.seal.sealHash).toMatch(/^h[0-9a-f]{8}$/);
    expect(pipeline.realityMutationPermitted).toBe(false);
  });

  it("records inference_read_only decision when eligible", () => {
    ingestChessDriftLaneV0({ z: 0.6, category: MUTATION_REASON_CATEGORY_V1.SC });
    ingestSportsEntropyLaneV0({ entropy01: 0.7 });
    const { projection } = fuseAndStabilizeCrossSpaceV0();
    const arbitration = arbitrateAdmissionV1({
      projection,
      phaseContext: { phaseAligned: true, source: "test" }
    });

    const pipeline = processAuthorityPipelineV1({ arbitration });
    expect(arbitration.verdict).toBe(ADMISSION_VERDICT_V1.INFERENCE_ELIGIBLE);
    expect(pipeline.authorityDecision.decision).toBe(AUTHORITY_DECISION_V1.INFERENCE_READ_ONLY);
    expect(pipeline.authorityDecision.realityMutationPermitted).toBe(false);
  });

  it("replays ledger with valid hash chain", () => {
    const a1 = arbitrateAdmissionV1({ projection: { admissionSafe: false } }, { source: "t1" });
    const a2 = arbitrateAdmissionV1({ projection: { admissionSafe: false } }, { source: "t2" });
    processAuthorityPipelineV1({ arbitration: a1 });
    processAuthorityPipelineV1({ arbitration: a2 });

    const replay = replayAuthorityLedgerV1();
    expect(replay.ok).toBe(true);
    expect(replay.height).toBe(2);
    expect(replay.entriesReplayed).toBe(2);
    expect(replay.workerReplayAvailable).toBe(false);
    expect(replay.localReplayAvailable).toBe(true);
  });

  it("human attestation does not auto-grant mutation", () => {
    const attestation = recordHumanAttestationV1({ reason: "mutation_request" });
    const arbitration = arbitrateAdmissionV1(
      { projection: { admissionSafe: false } },
      { requestRealityMutation: true }
    );
    const pipeline = processAuthorityPipelineV1({ arbitration, humanAttestation: attestation });

    expect(pipeline.stages).toContain(AUTHORITY_CHAIN_STAGE_V1.HUMAN_ATTESTATION);
    expect(pipeline.authorityDecision.decision).toBe(AUTHORITY_DECISION_V1.MUTATION_BLOCKED);
    expect(pipeline.sealedEntry.realityMutation.permitted).toBe(false);
  });
});
