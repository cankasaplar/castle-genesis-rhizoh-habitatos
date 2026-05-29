import { describe, expect, it, beforeEach } from "vitest";
import { SYSTEM_STATE_V0 } from "../postGoLiveIntegrityLoopV0.js";
import { BOUNDARY_STATE_V0 } from "../externalBoundaryValidationV0.js";
import {
  appendEpistemicTickToLedgerV0,
  clearEpistemicTickLedgerForTestV0
} from "../epistemicTickLedgerV0.js";
import {
  clearEpistemicStabilityForTestV0,
  computeSystemDriftRiskScoreV0,
  detectA9A11SignalSuppressionV0,
  evaluateEpistemicStabilityV0,
  evaluateLongTermDivergenceV0,
  smoothEpistemicTickGraphV0
} from "../epistemicStabilityControllerV0.js";

function mockTick(overrides = {}) {
  return {
    correlationId: `corr_${Math.random()}`,
    epistemic_state: overrides.epistemic_state || SYSTEM_STATE_V0.LIVE_OK,
    tickWindow: { closedAtMs: Date.now() },
    playbook: { system_state: overrides.playbook_state || SYSTEM_STATE_V0.LIVE_OK },
    boundary: {
      boundary_state: overrides.boundary_state || BOUNDARY_STATE_V0.SKIPPED,
      client: { clientSeqHead: overrides.clientSeqHead ?? null },
      external: { lastAcceptedSeq: overrides.gatewaySeq ?? null }
    },
    synthesis: { compoundFault: Boolean(overrides.compoundFault), dominantResponseMode: "shadow" },
    observability: { entries: [] }
  };
}

describe("epistemicStabilityControllerV0", () => {
  beforeEach(() => {
    clearEpistemicTickLedgerForTestV0();
    clearEpistemicStabilityForTestV0();
  });

  it("smooths tick graph without changing raw ledger", () => {
    appendEpistemicTickToLedgerV0(mockTick({ epistemic_state: SYSTEM_STATE_V0.QUARANTINE }));
    appendEpistemicTickToLedgerV0(mockTick({ epistemic_state: SYSTEM_STATE_V0.LIVE_OK }));
    const smoothed = smoothEpistemicTickGraphV0({ windowTicks: 8 });
    expect(smoothed.nonExecutive).toBe(true);
    expect(smoothed.series[0].raw_epistemic_state).toBe(SYSTEM_STATE_V0.QUARANTINE);
    expect(stateRank(smoothed.series[1].smoothed_epistemic_state)).toBeLessThanOrEqual(
      stateRank(smoothed.series[0].smoothed_epistemic_state)
    );
  });

  it("breaches long-term divergence thresholds", () => {
    for (let i = 0; i < 8; i++) {
      appendEpistemicTickToLedgerV0(
        mockTick({
          epistemic_state: SYSTEM_STATE_V0.DEGRADED,
          boundary_state: BOUNDARY_STATE_V0.DIVERGED,
          compoundFault: true
        })
      );
    }
    const lt = evaluateLongTermDivergenceV0({ windowTicks: 8 });
    expect(lt.thresholdBreached).toBe(true);
    expect(lt.breaches.length).toBeGreaterThan(0);
  });

  it("detects A11 boundary gap signal ids", () => {
    for (let i = 0; i < 5; i++) {
      appendEpistemicTickToLedgerV0(
        mockTick({
          boundary_state: BOUNDARY_STATE_V0.ALIGNED,
          clientSeqHead: 20 + i * 3,
          gatewaySeq: 1
        })
      );
    }
    const sup = detectA9A11SignalSuppressionV0({ windowTicks: 8 });
    expect(sup.signalIdsNonEmpty).toBe(true);
    expect(sup.signalIds).toContain("a11_boundary_gap_suppressed");
  });

  it("computes drift risk score band", () => {
    for (let i = 0; i < 6; i++) {
      appendEpistemicTickToLedgerV0(
        mockTick({ epistemic_state: SYSTEM_STATE_V0.QUARANTINE, compoundFault: true })
      );
    }
    const risk = computeSystemDriftRiskScoreV0({ windowTicks: 8 });
    expect(risk.driftRiskScore).toBeGreaterThan(45);
    expect(["watch", "elevated", "critical"]).toContain(risk.band);
  });

  it("evaluateEpistemicStabilityV0 returns unified report", () => {
    appendEpistemicTickToLedgerV0(mockTick());
    const report = evaluateEpistemicStabilityV0();
    expect(report.schema).toContain("epistemic_stability");
    expect(report.driftRisk.driftRiskScore).toBeGreaterThanOrEqual(0);
    expect(report.interpretationOnly).toBe(true);
  });
});

function stateRank(state) {
  if (state === SYSTEM_STATE_V0.QUARANTINE) return 2;
  if (state === SYSTEM_STATE_V0.DEGRADED) return 1;
  return 0;
}
