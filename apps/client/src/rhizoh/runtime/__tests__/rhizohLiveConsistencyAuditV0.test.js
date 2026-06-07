import { describe, expect, it, beforeEach } from "vitest";
import {
  runLiveConsistencyAuditV0,
  auditNodeConsistencyV0,
  auditEventOriginGraphV0,
  auditAdapterStabilityV0,
  auditSpatialDriftV0,
  noteSpatialNodeSpawnV0,
  spatialNodeIdentityHashV0,
  __resetLiveConsistencyAuditForTestV0
} from "../rhizohLiveConsistencyAuditV0.js";
import { emitSpatialEventFromDomainV0, __resetSpatialEventEmitterForTestV0 } from "../rhizohSpatialEventEmitterV0.js";
import { bootstrapRhizohDomainGateV0, RHIZOH_DOMAIN_ID_V0 } from "../rhizohDomainGateV0.js";
import { __resetRhizohDomainCoreStoreForTestV0 } from "../rhizohDomainCoreStoreV0.js";
import { __resetDomainAdapterRegistryForTestV0 } from "../domainAdapterRegistryV0.js";
import { __resetDomainHealthForTestV0 } from "../rhizohDomainHealthContractV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { __resetControlPlaneForTestV0 } from "../rhizohControlPlaneV0.js";
import { __resetExplanationLayerForTestV0 } from "../rhizohExplanationLayerV0.js";
import {
  __resetTruthTraceForTestV0,
  __forceTruthTraceEnabledForTestV0
} from "../rhizohTruthTraceLayerV0.js";
import { SPATIAL_NODE_TIER_V0, __resetSpatialNodeLayerForTestV0 } from "../rhizohSpatialNodeLayerV0.js";
import { __forceSpatialReadyGateOpenForTestV0, __resetSpatialReadyGateForTestV0 } from "../rhizohSpatialReadyGateV0.js";

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
  __forceTruthTraceEnabledForTestV0(true);
}

describe("rhizohLiveConsistencyAuditV0", () => {
  beforeEach(resetAll);

  it("detects duplicate node spawns", () => {
    noteSpatialNodeSpawnV0("live", "pin-a");
    noteSpatialNodeSpawnV0("live", "pin-a");
    const axis = auditNodeConsistencyV0();
    expect(axis.pass).toBe(false);
    expect(axis.duplicates.length).toBeGreaterThan(0);
  });

  it("produces stable identity hash", () => {
    const h1 = spatialNodeIdentityHashV0("static", "pin-1", { kind: "poi", sourceDomain: "world" });
    const h2 = spatialNodeIdentityHashV0("static", "pin-1", { kind: "poi", sourceDomain: "world" });
    expect(h1).toBe(h2);
  });

  it("builds event origin graph from spatial emissions after domain bootstrap", () => {
    __forceSpatialReadyGateOpenForTestV0(true);
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.WORLD, { pathname: "/world/space" });
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.STATIC,
      nodeId: "istanbul-pin",
      kind: "poi"
    });
    const axis = auditEventOriginGraphV0();
    expect(axis.edgeCount).toBeGreaterThan(0);
  });

  it("reports spatial drift when live nodes exist without cesium (immediate path)", () => {
    __forceSpatialReadyGateOpenForTestV0(true);
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.LIVE,
      nodeId: "live-avatar",
      kind: "avatar"
    });
    const axis = auditSpatialDriftV0();
    expect(axis.pass).toBe(false);
    expect(axis.issues).toContain("live_nodes_before_cesium_ready");
  });

  it("runs full 4-axis audit report", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.WORLD, { pathname: "/world/space" });
    const report = runLiveConsistencyAuditV0({ domain: RHIZOH_DOMAIN_ID_V0.WORLD });
    expect(report.schema).toBe("rhizoh.live_consistency_audit.v0");
    expect(report.axes.nodeConsistency).toBeTruthy();
    expect(report.axes.eventOriginGraph).toBeTruthy();
    expect(report.axes.adapterStability).toBeTruthy();
    expect(report.axes.spatialDrift).toBeTruthy();
    expect(typeof report.pass).toBe("boolean");
  });

  it("adapter stability passes on clean bootstrap", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.T0, { pathname: "/" });
    const axis = auditAdapterStabilityV0();
    expect(axis.pass).toBe(true);
  });
});
