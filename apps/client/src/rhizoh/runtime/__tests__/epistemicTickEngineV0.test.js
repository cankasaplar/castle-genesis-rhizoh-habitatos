import { describe, expect, it, beforeEach } from "vitest";
import {
  resolveEpistemicStateV0,
  runEpistemicTickV0,
  EPISTEMIC_TICK_SCHEMA_V0
} from "../epistemicTickEngineV0.js";
import { SYSTEM_STATE_V0 } from "../postGoLiveIntegrityLoopV0.js";
import { BOUNDARY_STATE_V0 } from "../externalBoundaryValidationV0.js";
import {
  clearBreachObservationTraceForTestV0,
  getBreachObservationTraceV0
} from "../violationObservationLogV0.js";
import { clearBreachCorrelationStateForTestV0 } from "../breachCorrelationSynthesisV0.js";

describe("epistemicTickEngineV0 (§7 convergence)", () => {
  beforeEach(() => {
    clearBreachObservationTraceForTestV0();
    clearBreachCorrelationStateForTestV0();
  });

  it("resolveEpistemicStateV0 escalates boundary DIVERGED + playbook fail", () => {
    const state = resolveEpistemicStateV0(
      { system_state: SYSTEM_STATE_V0.DEGRADED },
      { boundary_state: BOUNDARY_STATE_V0.DIVERGED },
      { compoundFault: false }
    );
    expect(state).toBe(SYSTEM_STATE_V0.DEGRADED);
  });

  it("resolveEpistemicStateV0 QUARANTINE when playbook quarantined", () => {
    const state = resolveEpistemicStateV0(
      { system_state: SYSTEM_STATE_V0.QUARANTINE },
      { boundary_state: BOUNDARY_STATE_V0.ALIGNED },
      { compoundFault: true }
    );
    expect(state).toBe(SYSTEM_STATE_V0.QUARANTINE);
  });

  it("runEpistemicTickV0 unifies layers under one correlationId", async () => {
    const report = await runEpistemicTickV0({
      fetchExternal: false,
      observe: true,
      endCorrelationWindow: true,
      collectSignals: () => ({
        eventSeqs: [3, 1],
        orphanNarrativeDetected: true,
        derivedTracePresent: true,
        narrativeProvenanceOk: true
      })
    });

    expect(report.schema).toBe(EPISTEMIC_TICK_SCHEMA_V0);
    expect(report.correlationId).toMatch(/^corr_/);
    expect(report.playbook.system_state).toBe(SYSTEM_STATE_V0.QUARANTINE);
    expect(typeof report.playbook.state).toBe("function");
    expect(report.playbook.state()).toBe(SYSTEM_STATE_V0.QUARANTINE);
    expect(report.boundary.validate()).toBe(BOUNDARY_STATE_V0.SKIPPED);
    expect(report.synthesis.coherence().correlationId).toBe(report.correlationId);
    expect(report.observability.trace().length).toBeGreaterThanOrEqual(1);
    expect(report.observability.entries.every((e) => e.correlationId === report.correlationId)).toBe(
      true
    );
    expect(report.epistemic_state).toBe(SYSTEM_STATE_V0.QUARANTINE);
    expect(report.centralizedArbitrationBus).toBe(false);
  });

  it("compound tick produces synthesis compoundFault", async () => {
    const report = await runEpistemicTickV0({
      fetchExternal: false,
      observe: true,
      endCorrelationWindow: true,
      collectSignals: () => ({
        eventSeqs: [5, 2],
        orphanNarrativeDetected: true
      })
    });
    expect(report.synthesis.compoundFault).toBe(true);
    expect(report.synthesis.dominantResponseMode).toBeTruthy();
  });
});
