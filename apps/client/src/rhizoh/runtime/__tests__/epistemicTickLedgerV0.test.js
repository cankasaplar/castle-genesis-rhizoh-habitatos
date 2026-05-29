import { describe, expect, it, beforeEach } from "vitest";
import { runEpistemicTickV0 } from "../epistemicTickEngineV0.js";
import { SYSTEM_STATE_V0 } from "../postGoLiveIntegrityLoopV0.js";
import { BOUNDARY_STATE_V0 } from "../externalBoundaryValidationV0.js";
import {
  analyzeA9CrossTickCorrelationV0,
  analyzeCrossTickDivergenceV0,
  appendEpistemicTickToLedgerV0,
  buildEpistemicTickGraphV0,
  clearEpistemicTickLedgerForTestV0,
  exportEpistemicTickHistoryJsonV0,
  getEpistemicTickLedgerV0
} from "../epistemicTickLedgerV0.js";

function mockTick(overrides = {}) {
  return {
    correlationId: overrides.correlationId || `corr_${Math.random()}`,
    epistemic_state: overrides.epistemic_state || SYSTEM_STATE_V0.LIVE_OK,
    tickWindow: { closedAtMs: Date.now() },
    playbook: { system_state: overrides.playbook_state || SYSTEM_STATE_V0.LIVE_OK },
    boundary: {
      boundary_state: overrides.boundary_state || BOUNDARY_STATE_V0.SKIPPED,
      client: { clientSeqHead: overrides.clientSeqHead ?? null },
      external: { lastAcceptedSeq: overrides.gatewaySeq ?? null }
    },
    synthesis: {
      compoundFault: Boolean(overrides.compoundFault),
      dominantResponseMode: "shadow"
    },
    observability: { entries: [] }
  };
}

describe("epistemicTickLedgerV0", () => {
  beforeEach(() => {
    clearEpistemicTickLedgerForTestV0();
  });

  it("appends nodes with sequential prevTickSeq", () => {
    appendEpistemicTickToLedgerV0(mockTick({ epistemic_state: SYSTEM_STATE_V0.LIVE_OK }));
    appendEpistemicTickToLedgerV0(mockTick({ epistemic_state: SYSTEM_STATE_V0.DEGRADED }));
    const ledger = getEpistemicTickLedgerV0();
    expect(ledger.total).toBe(2);
    expect(ledger.nodes[1].prevTickSeq).toBe(1);
    expect(ledger.nodes[1].stateDelta).toBe("LIVE_OK->DEGRADED");
  });

  it("builds tick graph with sequential edges", () => {
    appendEpistemicTickToLedgerV0(mockTick());
    appendEpistemicTickToLedgerV0(mockTick());
    const graph = buildEpistemicTickGraphV0();
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges.some((e) => e.kind === "sequential")).toBe(true);
  });

  it("detects epistemic_state regression across ticks", () => {
    appendEpistemicTickToLedgerV0(mockTick({ epistemic_state: SYSTEM_STATE_V0.LIVE_OK }));
    appendEpistemicTickToLedgerV0(
      mockTick({
        epistemic_state: SYSTEM_STATE_V0.QUARANTINE,
        boundary_state: BOUNDARY_STATE_V0.DIVERGED,
        compoundFault: true
      })
    );
    const div = analyzeCrossTickDivergenceV0();
    expect(div.diverging).toBe(true);
    expect(div.worstEpistemicState).toBe(SYSTEM_STATE_V0.QUARANTINE);
    expect(div.uniqueDivergenceFlags).toContain("epistemic_state_regressed");
  });

  it("A9 closes cross-tick compound incidents", () => {
    appendEpistemicTickToLedgerV0(
      mockTick({ epistemic_state: SYSTEM_STATE_V0.DEGRADED, compoundFault: true })
    );
    appendEpistemicTickToLedgerV0(
      mockTick({ epistemic_state: SYSTEM_STATE_V0.DEGRADED, compoundFault: true })
    );
    appendEpistemicTickToLedgerV0(mockTick({ epistemic_state: SYSTEM_STATE_V0.LIVE_OK }));
    const a9 = analyzeA9CrossTickCorrelationV0();
    expect(a9.incidentCount).toBe(1);
    expect(a9.a9Closed).toBe(true);
    expect(a9.incidents[0].crossTickCompound).toBe(true);
  });

  it("export produces replayable JSON", () => {
    appendEpistemicTickToLedgerV0(mockTick());
    const json = exportEpistemicTickHistoryJsonV0();
    const parsed = JSON.parse(json);
    expect(parsed.readOnly).toBe(true);
    expect(parsed.ledger.nodes).toHaveLength(1);
    expect(parsed.graph.nodes).toHaveLength(1);
  });

  it("runEpistemicTickV0 records to ledger by default", async () => {
    await runEpistemicTickV0({
      fetchExternal: false,
      observe: false,
      collectSignals: () => ({})
    });
    expect(getEpistemicTickLedgerV0().total).toBe(1);
  });
});
