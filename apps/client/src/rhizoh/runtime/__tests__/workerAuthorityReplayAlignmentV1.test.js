import { beforeEach, describe, expect, it } from "vitest";
import {
  ADMISSION_VERDICT_V1,
  arbitrateAdmissionV1,
  resetAdmissionArbitrationForTestV1
} from "../admissionArbitrationLayerV1.js";
import {
  processAuthorityPipelineV1,
  replayAuthorityLedgerV1,
  resetAuthorityLedgerForTestV1
} from "../authorityLedgerSealPipelineV1.js";
import {
  ALIGNMENT_SEVERITY_V1,
  DIVERGENCE_TYPE_V1,
  REPLAY_MODE_V1,
  SOURCE_OF_TRUTH_V1,
  workerAuthorityReplayAlignmentV1
} from "../workerAuthorityReplayAlignmentV1.js";

describe("workerAuthorityReplayAlignmentV1", () => {
  beforeEach(() => {
    resetAuthorityLedgerForTestV1();
    resetAdmissionArbitrationForTestV1();
  });

  it("reports aligned when client and gateway seal heads match", () => {
    const arbitration = arbitrateAdmissionV1(
      {
        projection: { admissionSafe: false, holdReason: "cold_boot" },
        phaseContext: { phaseAligned: true, source: "test" }
      },
      { source: "test" }
    );
    processAuthorityPipelineV1({ arbitration });
    const clientReplay = replayAuthorityLedgerV1();

    const result = workerAuthorityReplayAlignmentV1({
      ledger: {
        ledgerHeight: 1,
        sealChainHead: clientReplay.sealHead,
        replay: clientReplay
      },
      gatewayWitness: {
        chainHeight: 1,
        chainHead: clientReplay.sealHead,
        replay: {
          ok: true,
          height: 1,
          sealHead: clientReplay.sealHead,
          trace: [{ height: 1, clientSealHash: clientReplay.sealHead }]
        }
      },
      workerReplay: { available: false },
      replayMode: REPLAY_MODE_V1.DETERMINISTIC_ONLY
    });

    expect(result.aligned).toBe(true);
    expect(result.divergenceType).toBe(DIVERGENCE_TYPE_V1.NONE);
    expect(result.severity).toBe(ALIGNMENT_SEVERITY_V1.NONE);
    expect(result.question).toBe("where_can_same_state_be_computed");
  });

  it("detects seal_mismatch with hard_divergence", () => {
    const result = workerAuthorityReplayAlignmentV1({
      ledger: {
        ledgerHeight: 1,
        sealChainHead: "h11111111",
        replay: { ok: true, height: 1, sealHead: "h11111111", trace: [] }
      },
      gatewayWitness: {
        chainHeight: 1,
        chainHead: "h22222222",
        replay: { ok: true, height: 1, sealHead: "h22222222", trace: [] }
      },
      workerReplay: { available: false }
    });

    expect(result.aligned).toBe(false);
    expect(result.divergenceType).toBe(DIVERGENCE_TYPE_V1.SEAL_MISMATCH);
    expect(result.severity).toBe(ALIGNMENT_SEVERITY_V1.HARD_DIVERGENCE);
    expect(result.sourceOfTruth).toBe(SOURCE_OF_TRUTH_V1.CLIENT);
  });

  it("detects height_desync as soft_drift when gateway lags", () => {
    const result = workerAuthorityReplayAlignmentV1({
      ledger: { ledgerHeight: 2, sealChainHead: "habc", replay: { ok: true, trace: [] } },
      gatewayWitness: { chainHeight: 1, chainHead: "habc", replay: { ok: true, trace: [] } },
      workerReplay: { available: false }
    });

    expect(result.aligned).toBe(false);
    expect(result.divergenceType).toBe(DIVERGENCE_TYPE_V1.HEIGHT_DESYNC);
    expect(result.severity).toBe(ALIGNMENT_SEVERITY_V1.SOFT_DRIFT);
    expect(result.sourceOfTruth).toBe(SOURCE_OF_TRUTH_V1.CLIENT);
  });

  it("detects missing_entry when gateway height is zero", () => {
    const result = workerAuthorityReplayAlignmentV1({
      ledger: {
        ledgerHeight: 1,
        sealChainHead: "h999",
        replay: {
          ok: true,
          height: 1,
          sealHead: "h999",
          trace: [{ height: 1, actual: "h999" }]
        }
      },
      gatewayWitness: { chainHeight: 0, chainHead: "", replay: { ok: true, trace: [] } },
      workerReplay: { available: false }
    });

    expect(result.aligned).toBe(false);
    expect(result.divergenceType).toBe(DIVERGENCE_TYPE_V1.MISSING_ENTRY);
    expect(result.severity).toBe(ALIGNMENT_SEVERITY_V1.SOFT_DRIFT);
  });

  it("hold verdict history does not block alignment check", () => {
    const arbitration = arbitrateAdmissionV1(
      {
        projection: { admissionSafe: false },
        phaseContext: { phaseAligned: true, source: "test" }
      },
      { source: "test" }
    );
    expect(arbitration.verdict).toBe(ADMISSION_VERDICT_V1.HOLD);
    const pipeline = processAuthorityPipelineV1({ arbitration });
    const replay = replayAuthorityLedgerV1();

    const result = workerAuthorityReplayAlignmentV1({
      ledger: { ledgerHeight: 1, sealChainHead: pipeline.sealHash, replay },
      gatewayWitness: {
        chainHeight: 1,
        chainHead: pipeline.sealHash,
        replay: {
          ok: true,
          height: 1,
          sealHead: pipeline.sealHash,
          trace: [{ height: 1, clientSealHash: pipeline.sealHash }]
        }
      }
    });

    expect(result.aligned).toBe(true);
  });
});
