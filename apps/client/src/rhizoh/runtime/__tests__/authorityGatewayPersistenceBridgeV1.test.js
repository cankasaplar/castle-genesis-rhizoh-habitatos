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
  getAuthorityGatewayBridgeSnapshotV1,
  markAuthorityGatewayRoutesOkV1,
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
        lastWitness: { clientSealHash: pipeline.sealHash }
      })
    });

    await vi.advanceTimersByTimeAsync(300);

    expect(fetch).toHaveBeenCalled();
    const [url, opts] = fetch.mock.calls[0];
    expect(String(url)).toContain("/rhizoh/authority/ledger/batch");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.entries).toHaveLength(1);
    expect(body.entries[0].height).toBe(1);

    const snap = getAuthorityGatewayBridgeSnapshotV1();
    expect(snap.lastWitnessedHeight).toBe(1);
    expect(snap.sharedOfficialHistory).toBe(true);
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
