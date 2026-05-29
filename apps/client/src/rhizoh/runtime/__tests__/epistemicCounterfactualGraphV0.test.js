import { describe, expect, it, beforeEach } from "vitest";
import { SYSTEM_STATE_V0 } from "../postGoLiveIntegrityLoopV0.js";
import { BOUNDARY_STATE_V0 } from "../externalBoundaryValidationV0.js";
import { appendEpistemicTickToLedgerV0, clearEpistemicTickLedgerForTestV0 } from "../epistemicTickLedgerV0.js";
import {
  buildEpistemicCounterfactualGraphV0,
  clearEpistemicCounterfactualForTestV0,
  deriveMinimalCounterfactualFixV0,
  enumerateCounterfactualsForTickV0,
  evaluateEpistemicCounterfactualV0,
  predictCounterfactualEpistemicStateV0
} from "../epistemicCounterfactualGraphV0.js";
import {
  buildEpistemicCausalityGraphV0,
  clearEpistemicCausalityForTestV0
} from "../epistemicCausalityGraphV0.js";
import { clearEpistemicIdentityContinuityForTestV0 } from "../epistemicIdentityContinuityV0.js";

function ledgerNode(overrides = {}) {
  return {
    tickSeq: overrides.tickSeq ?? 1,
    playbook_state: overrides.playbook_state ?? SYSTEM_STATE_V0.LIVE_OK,
    boundary_state: overrides.boundary_state ?? BOUNDARY_STATE_V0.SKIPPED,
    compoundFault: Boolean(overrides.compoundFault),
    epistemic_state: overrides.epistemic_state ?? SYSTEM_STATE_V0.DEGRADED,
    divergenceFlags: overrides.divergenceFlags ?? ["boundary_diverged"]
  };
}

describe("epistemicCounterfactualGraphV0", () => {
  beforeEach(() => {
    clearEpistemicCounterfactualForTestV0();
    clearEpistemicCausalityForTestV0();
    clearEpistemicIdentityContinuityForTestV0();
    clearEpistemicTickLedgerForTestV0();
  });

  it("predictCounterfactualEpistemicState lowers state when boundary fixed", () => {
    const node = ledgerNode({
      playbook_state: SYSTEM_STATE_V0.LIVE_OK,
      boundary_state: BOUNDARY_STATE_V0.DIVERGED,
      compoundFault: false,
      epistemic_state: SYSTEM_STATE_V0.DEGRADED
    });
    const predicted = predictCounterfactualEpistemicStateV0(node, {
      boundary_state: BOUNDARY_STATE_V0.ALIGNED
    });
    expect(predicted).toBe(SYSTEM_STATE_V0.LIVE_OK);
  });

  it("enumerateCounterfactualsForTick lists alternate branches", () => {
    appendEpistemicTickToLedgerV0({
      correlationId: "c",
      epistemic_state: SYSTEM_STATE_V0.DEGRADED,
      tickWindow: { closedAtMs: 1 },
      playbook: { system_state: SYSTEM_STATE_V0.LIVE_OK },
      boundary: { boundary_state: BOUNDARY_STATE_V0.DIVERGED },
      synthesis: { compoundFault: true, dominantResponseMode: "shadow" },
      observability: { entries: [] }
    });
    const listed = enumerateCounterfactualsForTickV0(1);
    expect(listed.found).toBe(true);
    expect(listed.branches.some((b) => b.flag === "boundary_diverged" && b.wouldChange)).toBe(
      true
    );
    expect(listed.branches.some((b) => b.flag === "minimal_fix")).toBe(true);
  });

  it("deriveMinimalCounterfactualFix reaches LIVE_OK when fixes suffice", () => {
    const node = ledgerNode({
      playbook_state: SYSTEM_STATE_V0.LIVE_OK,
      boundary_state: BOUNDARY_STATE_V0.DIVERGED,
      compoundFault: false,
      divergenceFlags: ["boundary_diverged"]
    });
    const fix = deriveMinimalCounterfactualFixV0(node);
    expect(fix.reachable).toBe(true);
    expect(fix.predicted).toBe(SYSTEM_STATE_V0.LIVE_OK);
  });

  it("buildEpistemicCounterfactualGraph links actual to alternates", () => {
    appendEpistemicTickToLedgerV0({
      correlationId: "c",
      epistemic_state: SYSTEM_STATE_V0.QUARANTINE,
      tickWindow: { closedAtMs: 1 },
      playbook: { system_state: SYSTEM_STATE_V0.QUARANTINE },
      boundary: { boundary_state: BOUNDARY_STATE_V0.DIVERGED },
      synthesis: { compoundFault: true, dominantResponseMode: "shadow" },
      observability: { entries: [] }
    });
    buildEpistemicCausalityGraphV0();
    const graph = buildEpistemicCounterfactualGraphV0();
    expect(graph.counterfactual).toBe(true);
    expect(graph.edges.some((e) => e.kind === "alternate")).toBe(true);
    expect(graph.nodes.some((n) => n.kind === "counterfactual")).toBe(true);
  });

  it("evaluateEpistemicCounterfactualV0 returns headline", () => {
    appendEpistemicTickToLedgerV0({
      correlationId: "c",
      epistemic_state: SYSTEM_STATE_V0.DEGRADED,
      tickWindow: { closedAtMs: 1 },
      playbook: { system_state: SYSTEM_STATE_V0.LIVE_OK },
      boundary: { boundary_state: BOUNDARY_STATE_V0.DIVERGED },
      synthesis: { compoundFault: false, dominantResponseMode: "shadow" },
      observability: { entries: [] }
    });
    buildEpistemicCausalityGraphV0();
    const report = evaluateEpistemicCounterfactualV0();
    expect(report.headline).toBeTruthy();
    expect(report.sensitivity.byLayer.boundary).toBeDefined();
  });
});
