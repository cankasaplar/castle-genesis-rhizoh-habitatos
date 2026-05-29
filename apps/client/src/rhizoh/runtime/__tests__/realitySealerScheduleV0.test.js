import { describe, it, expect } from "vitest";
import {
  REALITY_SEALER_CADENCE_V0,
  evaluateSealerScheduleV0,
  sortSealQueueByPriorityV0
} from "../realitySealerScheduleV0.js";
import { createDefaultRealitySealLayerStateV0, enqueueRealitySealCandidateV0 } from "../realitySealingCoreV0.js";

describe("realitySealerScheduleV0", () => {
  it("sorts topology before scene chunk", () => {
    const q = sortSealQueueByPriorityV0([
      {
        candidateId: "a",
        source: "wal",
        commitClassId: "high_rate_substrate",
        payloadHash: "p1",
        enqueuedAtMs: 1
      },
      {
        candidateId: "b",
        source: "wal",
        commitClassId: "sealing_topology_mandate",
        payloadHash: "p2",
        enqueuedAtMs: 2
      }
    ]);
    expect(q[0].commitClassId).toBe("sealing_topology_mandate");
  });

  it("holds drain under min interval hysteresis", () => {
    const now = 10_000;
    let seal = createDefaultRealitySealLayerStateV0(null, { nowMs: now });
    seal = enqueueRealitySealCandidateV0(seal, {
      candidateId: "c1",
      source: "wal",
      commitClassId: "high_rate_substrate",
      payloadHash: "p",
      enqueuedAtMs: now
    });
    seal = {
      ...seal,
      scheduler: { ...seal.scheduler, lastDrainAtMs: now - 10 }
    };
    const ev = evaluateSealerScheduleV0(seal, now);
    expect(ev.shouldDrain).toBe(false);
    expect(ev.reason).toBe("hold_hysteresis");
  });

  it("forces drain when max cadence elapsed", () => {
    const now = 20_000;
    let seal = enqueueRealitySealCandidateV0(createDefaultRealitySealLayerStateV0(), {
      candidateId: "c2",
      source: "studio",
      commitClassId: "high_rate_substrate",
      payloadHash: "p",
      enqueuedAtMs: now
    });
    seal = {
      ...seal,
      scheduler: { ...seal.scheduler, lastDrainAtMs: now - REALITY_SEALER_CADENCE_V0.maxDrainIntervalMs - 1 }
    };
    const ev = evaluateSealerScheduleV0(seal, now);
    expect(ev.shouldDrain).toBe(true);
    expect(ev.reason).toBe("max_cadence_elapsed");
  });
});
