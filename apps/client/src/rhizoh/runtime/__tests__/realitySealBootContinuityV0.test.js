import { describe, it, expect } from "vitest";
import {
  BOOT_REALITY_DECISION_V0,
  resolveBootRealitySealContinuityV0
} from "../realitySealBootContinuityV0.js";
import { createDefaultRealitySealLayerStateV0 } from "../realitySealingCoreV0.js";

describe("realitySealBootContinuityV0", () => {
  it("resets to genesis on empty disk", () => {
    const r = resolveBootRealitySealContinuityV0({ ok: false, code: "disk_empty" }, 1000);
    expect(r.decision).toBe(BOOT_REALITY_DECISION_V0.RESET_GENESIS);
    expect(r.seal.realityEpoch).toBe(0);
  });

  it("quarantines on replay chain break", () => {
    const bad = createDefaultRealitySealLayerStateV0();
    bad.auditTrail = [
      {
        atMs: 1,
        candidateId: "x",
        source: "studio",
        commitClassId: "sealing_topology_mandate",
        verdict: "allow_epoch_bump",
        priorEpoch: 0,
        nextEpoch: 2,
        priorSealHash: "h00000000",
        sealHash: "h11111111"
      }
    ];
    const r = resolveBootRealitySealContinuityV0(
      { ok: true, payload: { savedAtMs: Date.now(), realitySeal: bad } },
      Date.now()
    );
    expect(r.decision).toBe(BOOT_REALITY_DECISION_V0.QUARANTINE_GENESIS);
  });

  it("continues sealed world when replay ok", () => {
    const seal = createDefaultRealitySealLayerStateV0();
    const good = {
      savedAtMs: Date.now(),
      realitySeal: {
        ...seal,
        realityEpoch: 1,
        sealHashHead: "habcdef01",
        auditTrail: [
          {
            atMs: 1,
            candidateId: "g",
            source: "studio",
            commitClassId: "sealing_topology_mandate",
            verdict: "allow_epoch_bump",
            priorEpoch: 0,
            nextEpoch: 1,
            priorSealHash: "h00000000",
            sealHash: "habcdef01",
            roomScope: "room:main"
          }
        ]
      },
      witness: { realityEpoch: 1, sealHashHead: "habcdef01", replayOk: true }
    };
    const r = resolveBootRealitySealContinuityV0({ ok: true, payload: good }, Date.now());
    expect(r.decision).toBe(BOOT_REALITY_DECISION_V0.CONTINUE_SEALED_WORLD);
    expect(r.seal.realityEpoch).toBe(1);
  });
});
