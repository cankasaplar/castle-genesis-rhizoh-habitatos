import { describe, expect, it, beforeEach } from "vitest";
import {
  isSpatialReadyGateOpenV0,
  enqueuePreReadySpatialEventV0,
  drainPreReadySpatialQueueV0,
  getSpatialReadyGateSnapshotV0,
  shouldSpatialReadyGateDomainV0,
  isSpatialReadyProbeNodeV0,
  __forceSpatialReadyGateOpenForTestV0,
  __resetSpatialReadyGateForTestV0
} from "../rhizohSpatialReadyGateV0.js";
import {
  emitSpatialEventFromDomainV0,
  emitSpatialEventImmediateV0,
  __resetSpatialEventEmitterForTestV0
} from "../rhizohSpatialEventEmitterV0.js";
import { RHIZOH_DOMAIN_ID_V0 } from "../rhizohDomainCoreStoreV0.js";
import { SPATIAL_NODE_TIER_V0, listSpatialNodesV0, __resetSpatialNodeLayerForTestV0 } from "../rhizohSpatialNodeLayerV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { auditSpatialDriftV0, __resetLiveConsistencyAuditForTestV0 } from "../rhizohLiveConsistencyAuditV0.js";
import { registerCesiumExecutorApiV0, __resetCesiumExecutorForTestV0 } from "../../../castleFlight/cesiumCommandExecutorV0.js";

function resetAll() {
  __resetSpatialReadyGateForTestV0();
  __resetSpatialEventEmitterForTestV0();
  __resetSpatialNodeLayerForTestV0();
  __resetNervousSystemEventGraphForTestV0();
  __resetLiveConsistencyAuditForTestV0();
  __resetCesiumExecutorForTestV0();
  if (typeof window !== "undefined") {
    delete window.__CASTLE_CESIUM__;
  }
}

describe("rhizohSpatialReadyGateV0", () => {
  beforeEach(resetAll);

  it("gates WORLD domain only", () => {
    expect(shouldSpatialReadyGateDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD)).toBe(true);
    expect(shouldSpatialReadyGateDomainV0(RHIZOH_DOMAIN_ID_V0.T0)).toBe(false);
  });

  it("buffers WORLD spatial emit until cesium command-ready", () => {
    const r = emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.LIVE,
      nodeId: "live-avatar",
      kind: "avatar"
    });
    expect(r.buffered).toBe(true);
    expect(r.reason).toBe("cesium_not_ready");
    expect(listSpatialNodesV0().length).toBe(0);
    expect(getSpatialReadyGateSnapshotV0().buffered).toBe(1);
    expect(auditSpatialDriftV0().pass).toBe(true);
  });

  it("drains buffer when cesium becomes ready", () => {
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.STATIC,
      nodeId: "istanbul-pin",
      kind: "poi"
    });
    registerCesiumExecutorApiV0({ ready: true, commandReady: true });
    window.__CASTLE_CESIUM__ = { ready: true, commandReady: true };
    const drained = drainPreReadySpatialQueueV0(emitSpatialEventImmediateV0);
    expect(drained).toBe(1);
    expect(listSpatialNodesV0().length).toBe(1);
    expect(isSpatialReadyGateOpenV0()).toBe(true);
  });

  it("allows probe nodes through gate for system probes", () => {
    expect(isSpatialReadyProbeNodeV0("probe-pin-live")).toBe(true);
    const r = emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.LIVE,
      nodeId: "probe-pin-live",
      kind: "avatar"
    });
    expect(r.buffered).not.toBe(true);
    expect(r.ok).toBe(true);
  });

  it("force open bypasses gate in tests", () => {
    __forceSpatialReadyGateOpenForTestV0(true);
    const r = emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.STATIC,
      nodeId: "forced-pin",
      kind: "poi"
    });
    expect(r.ok).toBe(true);
    expect(r.buffered).not.toBe(true);
  });
});
