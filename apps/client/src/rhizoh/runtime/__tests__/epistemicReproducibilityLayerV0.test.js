import { describe, expect, it, beforeEach } from "vitest";
import { runEpistemicAuditBundleV0 } from "../epistemicAuditBundleV0.js";
import {
  canonicalizeAuditBundleForReproV0,
  clearExternalReproducibilityForTestV0,
  compareImportedBundleEnvironmentsV0,
  compareReproducibleBundlesV0,
  fingerprintReproducibleBundleV0,
  probeBoundaryConsistencyReproducibilityV0,
  probeGatewayLatencyDriftV0,
  runCrossEnvironmentBundleProbeV0,
  runExternalReproducibilityReportV0
} from "../epistemicReproducibilityLayerV0.js";
import { BOUNDARY_STATE_V0 } from "../externalBoundaryValidationV0.js";
import { clearBreachCorrelationWindowForTestV0 } from "../breachCorrelationWindowV0.js";
import { clearBreachCorrelationStateForTestV0 } from "../breachCorrelationSynthesisV0.js";
import { clearBreachObservationTraceForTestV0 } from "../violationObservationLogV0.js";

describe("epistemicReproducibilityLayerV0", () => {
  beforeEach(() => {
    clearExternalReproducibilityForTestV0();
    clearBreachCorrelationWindowForTestV0();
    clearBreachCorrelationStateForTestV0();
    clearBreachObservationTraceForTestV0();
  });

  it("boundary evaluator is reproducible for identical inputs", () => {
    const r = probeBoundaryConsistencyReproducibilityV0({ runs: 16 });
    expect(r.reproducible).toBe(true);
    expect(r.boundary_state).toBe(BOUNDARY_STATE_V0.ALIGNED);
  });

  it("gateway latency drift affects outcome only when reachability differs", () => {
    const d = probeGatewayLatencyDriftV0();
    expect(d.boundaryConsistentWhenSnapshotIdentical).toBe(true);
    expect(d.aligned).toBe(BOUNDARY_STATE_V0.DIVERGED);
    expect(d.slowSameSeq).toBe(BOUNDARY_STATE_V0.DIVERGED);
    expect(d.timeoutSkipped).toBe(BOUNDARY_STATE_V0.SKIPPED);
    expect(d.latencyClassAffectsOutcome).toBe(true);
  });

  it("cross-environment probe matches fingerprints for no-gateway profiles", async () => {
    const probe = await runCrossEnvironmentBundleProbeV0({
      collectSignals: () => ({
        eventSeqs: [1, 2, 3],
        clientBoundary: { clientSeqHead: 3, collectedAtMs: 0 }
      })
    });
    expect(probe.allFingerprintsMatch).toBe(true);
    expect(probe.runs[0].simulationLawOk).toBe(true);
  });

  it("canonical fingerprint stable across two identical bundles", async () => {
    const collect = () => ({ eventSeqs: [1, 2, 3] });
    const a = await runEpistemicAuditBundleV0({
      fetchExternal: false,
      observe: false,
      collectSignals: collect
    });
    clearExternalReproducibilityForTestV0();
    clearBreachCorrelationWindowForTestV0();
    clearBreachCorrelationStateForTestV0();
    clearBreachObservationTraceForTestV0();

    const b = await runEpistemicAuditBundleV0({
      fetchExternal: false,
      observe: false,
      collectSignals: collect
    });

    const cmp = compareReproducibleBundlesV0(a, b);
    expect(cmp.fingerprintsMatch).toBe(true);
    expect(cmp.match).toBe(true);
  });

  it("compareImportedBundleEnvironments parses JSON exports", async () => {
    const bundle = await runEpistemicAuditBundleV0({
      fetchExternal: false,
      observe: false,
      collectSignals: () => ({})
    });
    const json = JSON.stringify(bundle);
    const cmp = compareImportedBundleEnvironmentsV0(json, json);
    expect(cmp.match).toBe(true);
    expect(cmp.fingerprintsMatch).toBe(true);
    const canon = canonicalizeAuditBundleForReproV0(bundle);
    const fp = fingerprintReproducibleBundleV0(bundle);
    expect(fp.fingerprint).toMatch(/^repro_bundle_/);
    expect(canon.law.allPassed).toBe(true);
  });

  it("runExternalReproducibilityReportV0 aggregates probes", async () => {
    const report = await runExternalReproducibilityReportV0();
    expect(report.boundaryConsistency.reproducible).toBe(true);
    expect(report.gatewayLatencyDrift.latencyClassAffectsOutcome).toBe(true);
    expect(report.crossEnvironment.allFingerprintsMatch).toBe(true);
    expect(report.externallyReproducible).toBe(true);
  });
});
