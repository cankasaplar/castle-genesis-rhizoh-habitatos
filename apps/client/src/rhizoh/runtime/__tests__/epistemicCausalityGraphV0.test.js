import { describe, expect, it, beforeEach } from "vitest";
import { SYSTEM_STATE_V0 } from "../postGoLiveIntegrityLoopV0.js";
import { BOUNDARY_STATE_V0 } from "../externalBoundaryValidationV0.js";
import { appendEpistemicTickToLedgerV0, clearEpistemicTickLedgerForTestV0 } from "../epistemicTickLedgerV0.js";
import {
  evaluateEpistemicIdentityContinuityV0,
  clearEpistemicIdentityContinuityForTestV0
} from "../epistemicIdentityContinuityV0.js";
import {
  buildEpistemicCausalityGraphV0,
  clearEpistemicCausalityForTestV0,
  evaluateEpistemicCausalityV0,
  explainTickStateChangeV0,
  traceCausalPathV0,
  CAUSAL_EDGE_KIND_V0,
  CAUSAL_NODE_KIND_V0
} from "../epistemicCausalityGraphV0.js";
import { runEpistemicAuditBundleV0, clearEpistemicAuditBundleForTestV0 } from "../epistemicAuditBundleV0.js";
import { clearEpistemicStabilityForTestV0 } from "../epistemicStabilityControllerV0.js";
import { clearExternalReproducibilityForTestV0 } from "../epistemicReproducibilityLayerV0.js";
import { clearBreachCorrelationWindowForTestV0 } from "../breachCorrelationWindowV0.js";
import { clearBreachCorrelationStateForTestV0 } from "../breachCorrelationSynthesisV0.js";
import { clearBreachObservationTraceForTestV0 } from "../violationObservationLogV0.js";

function mockTick(overrides = {}) {
  return {
    correlationId: "corr_causal",
    epistemic_state: overrides.epistemic_state || SYSTEM_STATE_V0.LIVE_OK,
    tickWindow: { closedAtMs: Date.now() },
    playbook: {
      system_state: overrides.playbook_state || SYSTEM_STATE_V0.LIVE_OK,
      checks: overrides.checks || { eventConsistency: { ok: true } }
    },
    boundary: {
      boundary_state: overrides.boundary_state || BOUNDARY_STATE_V0.SKIPPED,
      client: { clientSeqHead: overrides.clientSeqHead ?? null },
      external: { lastAcceptedSeq: overrides.gatewaySeq ?? null }
    },
    synthesis: { compoundFault: Boolean(overrides.compoundFault), dominantResponseMode: "shadow" },
    observability: { entries: [] }
  };
}

describe("epistemicCausalityGraphV0", () => {
  beforeEach(() => {
    clearEpistemicCausalityForTestV0();
    clearEpistemicIdentityContinuityForTestV0();
    clearEpistemicTickLedgerForTestV0();
    clearEpistemicAuditBundleForTestV0();
    clearEpistemicStabilityForTestV0();
    clearExternalReproducibilityForTestV0();
    clearBreachCorrelationWindowForTestV0();
    clearBreachCorrelationStateForTestV0();
    clearBreachObservationTraceForTestV0();
  });

  it("builds cause nodes for divergence flags", () => {
    appendEpistemicTickToLedgerV0(mockTick());
    appendEpistemicTickToLedgerV0(
      mockTick({
        epistemic_state: SYSTEM_STATE_V0.DEGRADED,
        boundary_state: BOUNDARY_STATE_V0.DIVERGED,
        compoundFault: true,
        checks: { eventConsistency: { ok: false } }
      })
    );

    const graph = buildEpistemicCausalityGraphV0();
    expect(graph.nodeCount).toBeGreaterThan(2);
    expect(graph.edges.some((e) => e.kind === CAUSAL_EDGE_KIND_V0.CAUSED)).toBe(true);
    expect(
      graph.nodes.some((n) => n.kind === CAUSAL_NODE_KIND_V0.DIVERGENCE_FLAG && n.flag === "boundary_diverged")
    ).toBe(true);
  });

  it("explainTickStateChange lists primary causes", () => {
    appendEpistemicTickToLedgerV0(mockTick());
    appendEpistemicTickToLedgerV0(
      mockTick({
        epistemic_state: SYSTEM_STATE_V0.QUARANTINE,
        playbook_state: SYSTEM_STATE_V0.QUARANTINE,
        checks: { eventConsistency: { ok: false }, layerTrace: { ok: false } }
      })
    );
    buildEpistemicCausalityGraphV0();
    const ex = explainTickStateChangeV0(2);
    expect(ex.found).toBe(true);
    expect(ex.primaryCauses.length).toBeGreaterThan(0);
    expect(ex.toState).toBe(SYSTEM_STATE_V0.QUARANTINE);
  });

  it("traceCausalPath finds sequential tick link", () => {
    appendEpistemicTickToLedgerV0(mockTick());
    appendEpistemicTickToLedgerV0(
      mockTick({ boundary_state: BOUNDARY_STATE_V0.DIVERGED, compoundFault: true })
    );
    buildEpistemicCausalityGraphV0();
    const path = traceCausalPathV0("tick:1", "tick:2");
    expect(path.found).toBe(true);
    expect(path.path).toEqual(["tick:1", "tick:2"]);
  });

  it("evaluate returns dominantWhy and topCauses", async () => {
    appendEpistemicTickToLedgerV0(mockTick());
    appendEpistemicTickToLedgerV0(
      mockTick({ epistemic_state: SYSTEM_STATE_V0.DEGRADED, compoundFault: true })
    );
    const bundle = await runEpistemicAuditBundleV0({
      fetchExternal: false,
      observe: false,
      collectSignals: () => ({}),
      recordIdentity: false
    });
    evaluateEpistemicIdentityContinuityV0({ bundle });

    const report = evaluateEpistemicCausalityV0();
    expect(report.topCauses.length).toBeGreaterThan(0);
    expect(report.dominantWhy).toBeTruthy();
    expect(report.graph.edgeCount).toBeGreaterThan(0);
  });
});
