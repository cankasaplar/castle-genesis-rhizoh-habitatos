import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import { mintAuthorityEpochIdV1, resetAuthorityEpochForTestV1 } from "../authorityEpochBoundaryV1.js";
import {
  buildEpochMergeEventPayloadV1,
  epochMergeAndAssimilateV1,
  resetAuthorityEpochMergeForTestV1
} from "../authorityEpochMergeEventV1.js";
import {
  resetAuthorityGatewayBridgeForTestV1
} from "../authorityGatewayPersistenceBridgeV1.js";
import {
  processAuthorityPipelineV1,
  resetAuthorityLedgerForTestV1
} from "../authorityLedgerSealPipelineV1.js";
import { arbitrateAdmissionV1, resetAdmissionArbitrationForTestV1 } from "../admissionArbitrationLayerV1.js";

vi.mock("../../../castleFlight/castleFlightConfig.js", () => ({
  getCastleFlightConfig: () => ({ gatewayToken: "test-gateway-token" })
}));

vi.mock("../../useRhizohGatewayMonitor.js", () => ({
  getOrCreateCastleDevUid: () => "dev-merge-test",
  getRhizohGatewayHealthBase: () => "https://gateway.test"
}));

vi.mock("../../epistemic/epistemicLedgerStreamV529.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    onEpistemicTelemetryGatewayAttachV1: vi.fn(() => ({ attached: true }))
  };
});

describe("authorityEpochMergeEventV1", () => {
  beforeEach(() => {
    resetAuthorityEpochForTestV1();
    resetAuthorityLedgerForTestV1();
    resetAdmissionArbitrationForTestV1();
    resetAuthorityGatewayBridgeForTestV1();
    resetAuthorityEpochMergeForTestV1();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds causal assimilation payload from client + gateway snapshots", () => {
    mintAuthorityEpochIdV1({ bootAtMs: 5000, clientSeed: "merge-seed" });
    const arbitration = arbitrateAdmissionV1(
      { projection: { admissionSafe: false }, phaseContext: { phaseAligned: true, source: "test" } },
      { source: "test" }
    );
    processAuthorityPipelineV1({ arbitration });

    const payload = buildEpochMergeEventPayloadV1({
      gatewayBridge: {
        lastWitnessedHeight: 0,
        lastGatewayWitness: { epochId: "hepoch_gateway", clientSealHash: "hgw01" },
        sharedOfficialHistory: false
      }
    });

    expect(payload.schema).toBe("castle.rhizoh.epoch_merge_event.v1");
    expect(payload.mergeStrategy).toBe("causal_assimilation");
    expect(payload.resolution.rule).toBe("preserve_both_histories");
    expect(payload.sourceEpoch).toMatch(/^h[0-9a-f]{8}$/);
    expect(payload.targetEpoch).toBe("hepoch_gateway");
  });

  it("posts merge to gateway and returns cross-epoch replay", async () => {
    mintAuthorityEpochIdV1({ bootAtMs: 6000, clientSeed: "merge-post" });
    const arbitration = arbitrateAdmissionV1(
      { projection: { admissionSafe: false }, phaseContext: { phaseAligned: true, source: "test" } },
      { source: "test" }
    );
    processAuthorityPipelineV1({ arbitration });

    vi.mocked(fetch).mockImplementation(async (url) => {
      const u = String(url);
      if (u.includes("/rhizoh/authority/epoch/merge")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            mergeEvent: {
              schema: "castle.rhizoh.epoch_merge_event.v1",
              sourceEpoch: "hepoch_client",
              targetEpoch: "hepoch_gateway",
              output: { mergedEpochId: "hmerged99" }
            }
          })
        };
      }
      if (u.includes("/rhizoh/authority/ledger/replay")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            snapshot: { activeEpochId: "hepoch_gateway", subjectHeight: 1 },
            replay: {
              ok: true,
              epochId: "hepoch_gateway",
              height: 1,
              trace: [{ height: 1, clientSealHash: "hgw01", ok: true }]
            }
          })
        };
      }
      return { ok: false, status: 404, json: async () => ({ ok: false }) };
    });

    const result = await epochMergeAndAssimilateV1({
      fetchRemote: true,
      alignment: {
        aligned: false,
        divergenceType: "session_resync",
        severity: "soft_drift",
        sameTimeline: false,
        witnessPropagation: "epoch_boundary",
        layers: {
          client: { present: true, height: 1, epochId: "hepoch_client", sealHead: "hc01" },
          gateway: { present: true, height: 1, epochId: "hepoch_gateway", sealHead: "hgw01" }
        },
        signals: ["session_resync"]
      }
    });

    expect(result.ok).toBe(true);
    expect(result.mergeEvent?.output?.mergedEpochId).toBe("hmerged99");
    expect(result.crossEpochReplay?.resolutionRule).toBe("preserve_both_histories");
    expect(fetch).toHaveBeenCalled();
  });
});
