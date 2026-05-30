import { describe, expect, it } from "vitest";
import {
  advanceCoherenceFeedbackStateV0,
  createInitialCoherenceFeedbackStateV0,
  mergeCoherenceFeedbackIntoKernelEnergyV0
} from "../coherenceFeedbackLoopV0.js";

describe("advanceCoherenceFeedbackStateV0", () => {
  it("raises distributor pulse EWMA on dirty network diff without touching ws metrics lane", () => {
    const s0 = createInitialCoherenceFeedbackStateV0();
    const { state, kernelHints } = advanceCoherenceFeedbackStateV0(s0, {
      kind: "DISTRIBUTOR_TICK",
      payload: {
        networkDiff: { dirty: true },
        studioEvent: { fullSnapshotRecommended: false },
        uiSnapshot: { frame: 1 }
      }
    });
    expect(state.distributorPulseEwma).toBeGreaterThan(0);
    expect(state.wsMetricsEwma).toBe(0);
    expect(typeof kernelHints.peerEnergyBias01).toBe("number");
  });

  it("WS_METRICS only updates wsMetricsEwma", () => {
    const { state } = advanceCoherenceFeedbackStateV0(createInitialCoherenceFeedbackStateV0(), {
      kind: "WS_METRICS",
      payload: { messagesPerMinute: 60 }
    });
    expect(state.wsMetricsEwma).toBeGreaterThan(0.2);
    expect(state.distributorPulseEwma).toBe(0);
  });

  it("UI pulse increases ui lane only", () => {
    const { state } = advanceCoherenceFeedbackStateV0(createInitialCoherenceFeedbackStateV0(), {
      kind: "UI_PULSE",
      payload: { intensity01: 1 }
    });
    expect(state.uiImpulseEwma).toBeGreaterThan(0.3);
  });
});

describe("mergeCoherenceFeedbackIntoKernelEnergyV0", () => {
  it("applies bias to peer slices", () => {
    const m = mergeCoherenceFeedbackIntoKernelEnergyV0(
      { peerEnergyBias01: 0.1, distinctLangCount: 2, socialConflictFlag: true },
      [{ id: "u1", nexusEnergy: 0.4 }]
    );
    expect(m?.userEnergySlices[0].energy01).toBeCloseTo(0.5, 5);
    expect(m?.distinctLangCount).toBe(2);
    expect(m?.socialConflictFlag).toBe(true);
  });
});
