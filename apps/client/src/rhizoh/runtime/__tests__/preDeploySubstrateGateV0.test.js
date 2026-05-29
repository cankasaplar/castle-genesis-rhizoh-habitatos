import { describe, it, expect, beforeEach } from "vitest";
import { createInitialStudioKernelState } from "../../../studio/store/initialState.ts";
import { createDefaultRealitySealLayerStateV0 } from "../realitySealingCoreV0.js";
import {
  collectSealCadenceMetricsV0,
  walQueueOverflowSoakV0,
  peerConvergenceSpamSoakV0,
  sealerWatchdogStarvationProbeV0,
  probeReplayPersistenceCorruptionV0,
  attemptPeerQuarantineRecoveryV0,
  auditSubstrateFeatureFlagsV0,
  BOOT_REALITY_DECISION_V0
} from "../preDeploySubstrateGateV0.js";
import { simulatePeerWalScenarioV0 } from "../peerWalConvergenceWireV0.js";
import { resetWorldRuntimeDaemonStateV0 } from "../worldRuntimeDaemonQueueV0.js";

describe("preDeploySubstrateGateV0", () => {
  beforeEach(() => {
    resetWorldRuntimeDaemonStateV0();
  });

  it("collects seal cadence metrics", () => {
    const seal = createDefaultRealitySealLayerStateV0(null, { nowMs: Date.now() });
    seal.budget.sealsInWindow = 3;
    const m = collectSealCadenceMetricsV0(seal);
    expect(m.queueDepth).toBeGreaterThanOrEqual(0);
    expect(m.sealsPerSec).toBeGreaterThanOrEqual(0);
    expect(m.scheduleReason).toBeTruthy();
  });

  it("WAL queue overflow soak drops beyond max depth", () => {
    const r = walQueueOverflowSoakV0(80);
    expect(r.dropped).toBeGreaterThan(0);
    expect(r.queueDepth).toBeLessThanOrEqual(64);
    expect(r.paused).toBe(true);
  });

  it("peer convergence spam quarantines or accepts without throwing", () => {
    const getState = () => createInitialStudioKernelState();
    const r = peerConvergenceSpamSoakV0(getState, 40);
    expect(r.count).toBe(40);
    expect(r.quarantine + r.accepted).toBeGreaterThanOrEqual(0);
  });

  it("watchdog does not drain under coalesce hold (starvation guard)", () => {
    const r = sealerWatchdogStarvationProbeV0();
    expect(r.starvationObserved).toBe(true);
    expect(r.drained).toBe(0);
  });

  it("replay persistence corruption → reset or quarantine genesis", () => {
    const corrupt = probeReplayPersistenceCorruptionV0("{not-json");
    expect(corrupt.payloadCode).toBe("disk_json_corrupt");
    expect([
      BOOT_REALITY_DECISION_V0.RESET_GENESIS,
      BOOT_REALITY_DECISION_V0.QUARANTINE_GENESIS
    ]).toContain(corrupt.decision);

    const empty = probeReplayPersistenceCorruptionV0("");
    expect(empty.decision).toBe(BOOT_REALITY_DECISION_V0.RESET_GENESIS);
  });

  it("quarantine recovery accepts fresh feed after stale quarantine", () => {
    const getState = () => createInitialStudioKernelState();
    simulatePeerWalScenarioV0("stale", { getState, castleId: "castle:recover" });
    const recovered = attemptPeerQuarantineRecoveryV0(
      "castle:recover",
      {
        history: [
          {
            diffId: "ob:recover:1",
            kind: "obstacle_delta",
            lamport: 1,
            castleId: "castle:recover",
            signed: true,
            payload: { discs: [{ x: 0, z: 0, r: 1 }] }
          }
        ],
        signed: true,
        observedAtMs: Date.now()
      },
      { getState }
    );
    expect(recovered.recovered).toBe(true);
    expect(recovered.priorScenario).toBe("stale");
  });

  it("blocks premature feature flags", () => {
    const ok = auditSubstrateFeatureFlagsV0({});
    expect(ok.ok).toBe(true);
    const bad = auditSubstrateFeatureFlagsV0({ VITE_ROS_EXECUTION_RUNTIME: "1" });
    expect(bad.ok).toBe(false);
    expect(bad.blocked.length).toBeGreaterThan(0);
  });
});
