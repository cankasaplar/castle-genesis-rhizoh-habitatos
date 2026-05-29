import { describe, expect, it, beforeEach } from "vitest";
import { createInitialStudioKernelState } from "../../../studio/store/initialState.ts";
import {
  buildRealityHealthMetricsSnapshotV0,
  observePeerWalConvergenceMetricsV0,
  observeSealerTickMetricsV0,
  resetRealityHealthMetricsForTestV0
} from "../realityHealthMetricsV0.js";

describe("realityHealthMetricsV0", () => {
  beforeEach(() => {
    resetRealityHealthMetricsForTestV0();
  });

  it("records sealer drain and epoch bump counters", () => {
    const seal = createInitialStudioKernelState().realitySeal;
    observeSealerTickMetricsV0(seal, { drained: true, sealed: 1, scheduleReason: "high_priority_ready" });
    const snap = buildRealityHealthMetricsSnapshotV0(seal);
    expect(snap.counters.drainPasses).toBeGreaterThanOrEqual(1);
    expect(snap.counters.schedulePokes).toBeGreaterThanOrEqual(1);
    expect(snap.sealCadence).toBeTruthy();
  });

  it("records peer quarantine and replay mismatch", () => {
    observePeerWalConvergenceMetricsV0({ scenario: "replay_mismatch", disposition: "quarantine" });
    observePeerWalConvergenceMetricsV0({ scenario: "unsigned", disposition: "quarantine" });
    const snap = buildRealityHealthMetricsSnapshotV0();
    expect(snap.counters.quarantineEvents).toBe(2);
    expect(snap.counters.replayMismatchEvents).toBe(1);
    expect(snap.counters.unsignedRejectEvents).toBe(1);
  });
});
