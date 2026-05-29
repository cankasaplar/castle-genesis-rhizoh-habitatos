import { describe, expect, it, beforeEach } from "vitest";
import { runEpistemicAuditBundleV0 } from "../epistemicAuditBundleV0.js";
import { appendEpistemicTickToLedgerV0, clearEpistemicTickLedgerForTestV0 } from "../epistemicTickLedgerV0.js";
import { SYSTEM_STATE_V0 } from "../postGoLiveIntegrityLoopV0.js";
import { BOUNDARY_STATE_V0 } from "../externalBoundaryValidationV0.js";
import {
  assessReproducibilityConsistencyOverTimeV0,
  clearEpistemicIdentityContinuityForTestV0,
  deriveLedgerIdentityHashV0,
  deriveTickGraphIdentityDriftV0,
  evaluateEpistemicIdentityContinuityV0,
  getGlobalEpistemicIdentityV0,
  IDENTITY_CONTINUITY_VERDICT_V0,
  recordBundleFingerprintEvolutionV0
} from "../epistemicIdentityContinuityV0.js";
import { clearEpistemicAuditBundleForTestV0 } from "../epistemicAuditBundleV0.js";
import { clearEpistemicStabilityForTestV0 } from "../epistemicStabilityControllerV0.js";
import { clearExternalReproducibilityForTestV0 } from "../epistemicReproducibilityLayerV0.js";
import { clearBreachCorrelationWindowForTestV0 } from "../breachCorrelationWindowV0.js";
import { clearBreachCorrelationStateForTestV0 } from "../breachCorrelationSynthesisV0.js";
import { clearBreachObservationTraceForTestV0 } from "../violationObservationLogV0.js";

function mockTick(overrides = {}) {
  return {
    correlationId: `corr_test`,
    epistemic_state: overrides.epistemic_state || SYSTEM_STATE_V0.LIVE_OK,
    tickWindow: { closedAtMs: Date.now() },
    playbook: { system_state: SYSTEM_STATE_V0.LIVE_OK },
    boundary: { boundary_state: BOUNDARY_STATE_V0.SKIPPED },
    synthesis: { compoundFault: false, dominantResponseMode: "shadow" },
    observability: { entries: [] },
    simulation: { allPassed: true }
  };
}

describe("epistemicIdentityContinuityV0", () => {
  beforeEach(() => {
    clearEpistemicIdentityContinuityForTestV0();
    clearEpistemicTickLedgerForTestV0();
    clearEpistemicAuditBundleForTestV0();
    clearEpistemicStabilityForTestV0();
    clearExternalReproducibilityForTestV0();
    clearBreachCorrelationWindowForTestV0();
    clearBreachCorrelationStateForTestV0();
    clearBreachObservationTraceForTestV0();
  });

  it("derives stable ledger identity hash for same ledger", () => {
    appendEpistemicTickToLedgerV0(mockTick());
    const a = deriveLedgerIdentityHashV0();
    const b = deriveLedgerIdentityHashV0();
    expect(a.ledgerIdentityHash).toBe(b.ledgerIdentityHash);
    expect(a.ledgerIdentityHash).toMatch(/^h[0-9a-f]{8}$/);
  });

  it("detects tick graph drift when ledger grows", async () => {
    appendEpistemicTickToLedgerV0(mockTick());
    const first = deriveTickGraphIdentityDriftV0();
    expect(first.graphDriftDetected).toBe(false);

    appendEpistemicTickToLedgerV0(mockTick({ epistemic_state: SYSTEM_STATE_V0.DEGRADED }));
    const second = deriveTickGraphIdentityDriftV0();
    expect(second.graphDriftDetected).toBe(true);
  });

  it("tracks bundle fingerprint evolution and repro consistency", async () => {
    const b1 = await runEpistemicAuditBundleV0({
      fetchExternal: false,
      observe: false,
      collectSignals: () => ({ eventSeqs: [1, 2, 3] }),
      recordIdentity: false
    });
    recordBundleFingerprintEvolutionV0(b1);

    const b2 = await runEpistemicAuditBundleV0({
      fetchExternal: false,
      observe: false,
      collectSignals: () => ({ eventSeqs: [1, 2, 3] }),
      recordIdentity: false
    });
    recordBundleFingerprintEvolutionV0(b2);

    const repro = assessReproducibilityConsistencyOverTimeV0();
    expect(repro.windowSize).toBe(2);
    expect(repro.reproConsistent).toBe(true);
  });

  it("evaluate returns global epistemic identity id", async () => {
    const bundle = await runEpistemicAuditBundleV0({
      fetchExternal: false,
      observe: false,
      collectSignals: () => ({ eventSeqs: [1, 2, 3] })
    });
    const report = evaluateEpistemicIdentityContinuityV0({ bundle });
    expect(report.globalIdentity.epistemicIdentityId).toMatch(/^epi_id_/);
    expect(report.verdict).not.toBe(IDENTITY_CONTINUITY_VERDICT_V0.UNINITIALIZED);
    const global = getGlobalEpistemicIdentityV0();
    expect(global.epistemicIdentityId).toBe(report.globalIdentity.epistemicIdentityId);
  });

  it("audit bundle wires identity by default", async () => {
    await runEpistemicAuditBundleV0({
      fetchExternal: false,
      observe: false,
      collectSignals: () => ({})
    });
    const report = evaluateEpistemicIdentityContinuityV0();
    expect(report.fingerprintEvolution.chainLength).toBeGreaterThanOrEqual(1);
  });
});
