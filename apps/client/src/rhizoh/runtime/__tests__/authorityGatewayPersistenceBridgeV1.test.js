import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import {
  ADMISSION_VERDICT_V1,
  arbitrateAdmissionV1,
  resetAdmissionArbitrationForTestV1
} from "../admissionArbitrationLayerV1.js";
import {
  AUTHORITY_SEAL_EVENT_V1,
  processAuthorityPipelineV1,
  resetAuthorityLedgerForTestV1
} from "../authorityLedgerSealPipelineV1.js";
import {
  ensureAuthorityGatewayPersistenceBridgeV1,
  authorityWitnessPartitionKeyV1,
  ensureGatewayAppendV1,
  getAuthorityGatewayBridgeSnapshotV1,
  markAuthorityGatewayRoutesOkV1,
  onAuthorityGatewayConnectV1,
  resetAuthorityGatewayBridgeForTestV1
} from "../authorityGatewayPersistenceBridgeV1.js";

vi.mock("../../../castleFlight/castleFlightConfig.js", () => ({
  getCastleFlightConfig: () => ({ gatewayToken: "test-gateway-token" })
}));

vi.mock("../../useRhizohGatewayMonitor.js", () => ({
  getOrCreateCastleDevUid: () => "dev-test-uid",
  getRhizohGatewayHealthBase: () => "https://gateway.test"
}));

vi.mock("../../epistemic/epistemicLedgerStreamV529.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    onEpistemicTelemetryGatewayAttachV1: vi.fn(() => ({ attached: true }))
  };
});

describe("authorityGatewayPersistenceBridgeV1", () => {
  beforeEach(() => {
    resetAuthorityLedgerForTestV1();
    resetAdmissionArbitrationForTestV1();
    resetAuthorityGatewayBridgeForTestV1();
    markAuthorityGatewayRoutesOkV1();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("arms listener on ensure and buffers sealed hold entry", () => {
    ensureAuthorityGatewayPersistenceBridgeV1();
    const arbitration = arbitrateAdmissionV1(
      {
        projection: { admissionSafe: false, holdReason: "cold_boot" },
        phaseContext: { source: "test", phaseAligned: true }
      },
      { source: "test" }
    );
    expect(arbitration.verdict).toBe(ADMISSION_VERDICT_V1.HOLD);

    processAuthorityPipelineV1({ arbitration });
    const snap = getAuthorityGatewayBridgeSnapshotV1();
    expect(snap.wired).toBe(true);
    expect(snap.diagnosis.holdHistoryTransport).toBe(true);
    expect(snap.diagnosis.fusionOnBridge).toBe(false);
  });

  it("flushes sealed entry to gateway witness batch route", async () => {
    vi.useFakeTimers();
    ensureAuthorityGatewayPersistenceBridgeV1();
    const arbitration = arbitrateAdmissionV1(
      {
        projection: { admissionSafe: false },
        phaseContext: { phaseAligned: true, source: "test" }
      },
      { source: "test" }
    );
    const pipeline = processAuthorityPipelineV1({ arbitration });

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        witnessed: 1,
        quarantined: 0,
        chainHeight: 1,
        epochId: pipeline.sealedEntry.epoch?.epochId,
        lastWitness: {
          clientSealHash: pipeline.sealHash,
          epochId: pipeline.sealedEntry.epoch?.epochId,
          height: 1
        }
      })
    });

    await vi.advanceTimersByTimeAsync(300);

    expect(fetch).toHaveBeenCalled();
    const snap = getAuthorityGatewayBridgeSnapshotV1();
    expect(snap.sharedOfficialHistory).toBe(true);
    expect(snap.witnessPropagation).toBe("complete");
    vi.useRealTimers();
  });

  it("uses epoch:height partition keys for witness dedup", () => {
    const key = authorityWitnessPartitionKeyV1("hepoch_a", 1);
    expect(key).toBe("hepoch_a:1");
    ensureAuthorityGatewayPersistenceBridgeV1();
    const arbitration = arbitrateAdmissionV1(
      {
        projection: { admissionSafe: false },
        phaseContext: { phaseAligned: true, source: "test" }
      },
      { source: "test" }
    );
    const pipeline = processAuthorityPipelineV1({ arbitration });
    const r1 = ensureGatewayAppendV1({ entry: pipeline.sealedEntry });
    const r2 = ensureGatewayAppendV1({ entry: pipeline.sealedEntry });
    expect(r1.queued).toBe(true);
    expect(r2.alreadyWitnessed || r2.queued).toBeTruthy();
  });

  it("onAuthorityGatewayConnect schedules flush for pending guarantees", async () => {
    vi.useFakeTimers();
    ensureAuthorityGatewayPersistenceBridgeV1();
    const arbitration = arbitrateAdmissionV1(
      {
        projection: { admissionSafe: false },
        phaseContext: { phaseAligned: true, source: "test" }
      },
      { source: "test" }
    );
    const pipeline = processAuthorityPipelineV1({ arbitration });

    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ok: true,
        witnessed: 1,
        quarantined: 0,
        chainHeight: 1,
        lastWitness: { clientSealHash: pipeline.sealHash, height: 1 }
      })
    });

    onAuthorityGatewayConnectV1("test_connect");
    await vi.advanceTimersByTimeAsync(300);
    expect(fetch).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("does not reinterpret admission on transport path", () => {
    ensureAuthorityGatewayPersistenceBridgeV1();
    const handler = vi.fn();
    window.addEventListener(AUTHORITY_SEAL_EVENT_V1, handler);
    const arbitration = arbitrateAdmissionV1(
      {
        projection: { admissionSafe: false },
        phaseContext: { phaseAligned: true, source: "test" }
      },
      { source: "test" }
    );
    processAuthorityPipelineV1({ arbitration });
    expect(handler).toHaveBeenCalled();
    const entry = handler.mock.calls[0][0].detail;
    expect(entry.admissionRequest.verdict).toBe(ADMISSION_VERDICT_V1.HOLD);
    window.removeEventListener(AUTHORITY_SEAL_EVENT_V1, handler);
  });
});
