import { describe, expect, it, beforeEach } from "vitest";
import {
  runFullSystemReportV0,
  runFullSystemProbeV0,
  printFullSystemReportV0,
  FULL_SYSTEM_PROBE_ROUTES_V0,
  __resetFullSystemReportConsoleForTestV0
} from "../rhizohFullSystemReportV0.js";
import { __resetRhizohDomainCoreStoreForTestV0 } from "../rhizohDomainCoreStoreV0.js";
import { __resetDomainAdapterRegistryForTestV0 } from "../domainAdapterRegistryV0.js";
import { __resetDomainHealthForTestV0 } from "../rhizohDomainHealthContractV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { __resetControlPlaneForTestV0 } from "../rhizohControlPlaneV0.js";
import { __resetSpatialEventEmitterForTestV0 } from "../rhizohSpatialEventEmitterV0.js";
import { __resetSpatialNodeLayerForTestV0 } from "../rhizohSpatialNodeLayerV0.js";
import { __resetTruthTraceForTestV0, __forceTruthTraceEnabledForTestV0 } from "../rhizohTruthTraceLayerV0.js";
import { __resetExplanationLayerForTestV0 } from "../rhizohExplanationLayerV0.js";
import { __resetLiveConsistencyAuditForTestV0 } from "../rhizohLiveConsistencyAuditV0.js";
import { __resetSpatialReadyGateForTestV0 } from "../rhizohSpatialReadyGateV0.js";

function resetAll() {
  __resetRhizohDomainCoreStoreForTestV0();
  __resetDomainAdapterRegistryForTestV0();
  __resetDomainHealthForTestV0();
  __resetNervousSystemEventGraphForTestV0();
  __resetControlPlaneForTestV0();
  __resetSpatialEventEmitterForTestV0();
  __resetSpatialNodeLayerForTestV0();
  __resetTruthTraceForTestV0();
  __resetExplanationLayerForTestV0();
  __resetLiveConsistencyAuditForTestV0();
  __resetSpatialReadyGateForTestV0();
  __resetFullSystemReportConsoleForTestV0();
  __forceTruthTraceEnabledForTestV0(true);
}

describe("rhizohFullSystemReportV0", () => {
  beforeEach(resetAll);

  it("probes all domain gate routes", () => {
    const probe = runFullSystemProbeV0();
    expect(probe.gatesTotal).toBe(FULL_SYSTEM_PROBE_ROUTES_V0.length);
    expect(probe.gatesPass).toBe(probe.gatesTotal);
    expect(probe.liveOpsTotal).toBeGreaterThan(0);
  });

  it("builds full report with audit", () => {
    const report = runFullSystemReportV0({ probe: true, restorePath: false });
    expect(report.schema).toBe("rhizoh.full_system_report.v0");
    expect(report.domainCore).toBeTruthy();
    expect(report.truthTrace).toBeTruthy();
    expect(report.probe?.gates.length).toBe(FULL_SYSTEM_PROBE_ROUTES_V0.length);
  });

  it("prints report text with integrity tiers", () => {
    const text = printFullSystemReportV0(runFullSystemReportV0({ probe: false }));
    expect(text).toContain("RHIZOH FULL SYSTEM REPORT");
    expect(text).toContain("OVERALL");
    expect(text).toContain("Core Integrity");
    expect(text).toContain("structural:");
  });
});
