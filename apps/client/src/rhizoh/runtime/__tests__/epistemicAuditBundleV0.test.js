import { describe, expect, it, beforeEach } from "vitest";
import {
  clearEpistemicAuditBundleForTestV0,
  exportEpistemicAuditBundleJsonV0,
  formatGoLiveSection6EvidenceMarkdownV0,
  runEpistemicAuditBundleV0,
  EPISTEMIC_AUDIT_BUNDLE_SCHEMA_V0
} from "../epistemicAuditBundleV0.js";
import { clearEpistemicTickLedgerForTestV0 } from "../epistemicTickLedgerV0.js";
import { clearEpistemicStabilityForTestV0 } from "../epistemicStabilityControllerV0.js";
import { clearBreachObservationTraceForTestV0 } from "../violationObservationLogV0.js";
import { clearBreachCorrelationWindowForTestV0 } from "../breachCorrelationWindowV0.js";
import { clearBreachCorrelationStateForTestV0 } from "../breachCorrelationSynthesisV0.js";

describe("epistemicAuditBundleV0 (Go-Live §6 atom)", () => {
  beforeEach(() => {
    clearEpistemicAuditBundleForTestV0();
    clearEpistemicTickLedgerForTestV0();
    clearEpistemicStabilityForTestV0();
    clearBreachObservationTraceForTestV0();
    clearBreachCorrelationWindowForTestV0();
    clearBreachCorrelationStateForTestV0();
  });

  it("runs simulation + tick under one correlationId with full snapshot", async () => {
    const bundle = await runEpistemicAuditBundleV0({
      fetchExternal: false,
      collectSignals: () => ({})
    });

    expect(bundle.schema).toBe(EPISTEMIC_AUDIT_BUNDLE_SCHEMA_V0);
    expect(bundle.goLiveEvidenceAtom).toBe(true);
    expect(bundle.correlationId).toMatch(/^corr_/);
    expect(bundle.tick.correlationId).toBe(bundle.correlationId);
    expect(bundle.synthesis.correlationId).toBe(bundle.correlationId);
    expect(bundle.simulation?.allPassed).toBe(true);
    expect(bundle.simulation?.total).toBeGreaterThanOrEqual(11);
    expect(bundle.tickGraph.nodes.length).toBeGreaterThanOrEqual(1);
    expect(bundle.ledger.nodes.length).toBeGreaterThanOrEqual(1);
    expect(bundle.stability.driftRiskScore).toBeGreaterThanOrEqual(0);
    expect(bundle.boundary.boundary_state).toBeDefined();
    expect(bundle.gateHints.simulationLawOk).toBe(true);
    expect(bundle.interpretationOnly).toBe(true);
  });

  it("exports replayable JSON", async () => {
    const bundle = await runEpistemicAuditBundleV0({
      fetchExternal: false,
      collectSignals: () => ({})
    });
    const parsed = JSON.parse(exportEpistemicAuditBundleJsonV0(bundle));
    expect(parsed.readOnly).toBe(true);
    expect(parsed.correlationId).toBe(bundle.correlationId);
    expect(parsed.tickGraph).toBeDefined();
  });

  it("formats SESSION_LOG markdown block", async () => {
    const bundle = await runEpistemicAuditBundleV0({
      fetchExternal: false,
      collectSignals: () => ({})
    });
    const md = formatGoLiveSection6EvidenceMarkdownV0(bundle);
    expect(md).toContain("Go-Live §6");
    expect(md).toContain(bundle.bundleId);
    expect(md).toContain("LAW_OK");
  });

  it("can skip simulation for tick-only bundle", async () => {
    const bundle = await runEpistemicAuditBundleV0({
      runSimulation: false,
      fetchExternal: false,
      collectSignals: () => ({})
    });
    expect(bundle.simulation).toBeNull();
    expect(bundle.gateHints.simulationLawOk).toBeNull();
    expect(bundle.tick.correlationId).toBe(bundle.correlationId);
  });
});
