import { describe, expect, it, beforeEach } from "vitest";
import {
  resolveTraceSamplingV0,
  resolveSpatialDeltaV0,
  getTraceSamplingSnapshotV0,
  TRACE_CLASS_V0,
  __forceFullTraceForTestV0,
  __setTraceUiSampleRateForTestV0,
  __resetTraceSamplingForTestV0
} from "../rhizohTraceSamplingV0.js";
import {
  traceTruthEventV0,
  TRUTH_TRACE_KIND_V0,
  getTruthTraceLogV0,
  __forceTruthTraceEnabledForTestV0,
  __resetTruthTraceForTestV0
} from "../rhizohTruthTraceLayerV0.js";
import { emitSpatialEventFromDomainV0, __resetSpatialEventEmitterForTestV0 } from "../rhizohSpatialEventEmitterV0.js";
import { getSpatialOriginLogV0, __resetExplanationLayerForTestV0 } from "../rhizohExplanationLayerV0.js";
import { RHIZOH_DOMAIN_ID_V0 } from "../rhizohDomainCoreStoreV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { SPATIAL_NODE_TIER_V0 } from "../rhizohSpatialNodeLayerV0.js";

describe("rhizohTraceSamplingV0", () => {
  beforeEach(() => {
    __resetTraceSamplingForTestV0();
    __resetTruthTraceForTestV0();
    __resetExplanationLayerForTestV0();
    __resetSpatialEventEmitterForTestV0();
    __resetNervousSystemEventGraphForTestV0();
    __forceTruthTraceEnabledForTestV0(true);
  });

  it("always records critical path events when sampling active", () => {
    __forceFullTraceForTestV0(false);
    const r = resolveTraceSamplingV0(TRUTH_TRACE_KIND_V0.CONTROL_PLANE, { domain: "world" });
    expect(r.record).toBe(true);
    expect(r.mode).toBe("full");
  });

  it("samples successful UI adapter invokes", () => {
    __forceFullTraceForTestV0(false);
    __setTraceUiSampleRateForTestV0(0);
    const skip = resolveTraceSamplingV0(TRUTH_TRACE_KIND_V0.ADAPTER_INVOKE, {
      domain: "world",
      capability: "spatial",
      resultOk: true,
      adapterId: "world:spatial"
    });
    expect(skip.record).toBe(false);

    __setTraceUiSampleRateForTestV0(1);
    const keep = resolveTraceSamplingV0(TRUTH_TRACE_KIND_V0.ADAPTER_INVOKE, {
      domain: "world",
      capability: "spatial",
      resultOk: true,
      adapterId: "world:spatial"
    });
    expect(keep.record).toBe(true);
    expect(keep.mode).toBe("sampled");
  });

  it("always records adapter failures on critical tier", () => {
    __forceFullTraceForTestV0(false);
    const r = resolveTraceSamplingV0(TRUTH_TRACE_KIND_V0.ADAPTER_INVOKE, {
      domain: "world",
      resultOk: false,
      resultReason: "cesium_not_ready"
    });
    expect(r.record).toBe(true);
    expect(r.tier).toBe("critical");
  });

  it("delta-skips duplicate spatial nodes", () => {
    __forceFullTraceForTestV0(false);
    const detail = { tier: "live", nodeId: "pin-1", kind: "poi", sourceDomain: "world" };
    expect(resolveSpatialDeltaV0("live", "pin-1", detail).record).toBe(true);
    expect(resolveSpatialDeltaV0("live", "pin-1", detail).record).toBe(false);
  });

  it("integrates with trace log and stats", () => {
    __forceFullTraceForTestV0(false);
    __setTraceUiSampleRateForTestV0(0);
    traceTruthEventV0(TRUTH_TRACE_KIND_V0.CONTROL_PLANE, { domain: "world" });
    traceTruthEventV0(TRUTH_TRACE_KIND_V0.ADAPTER_INVOKE, {
      domain: "world",
      resultOk: true,
      adapterId: "world:spatial"
    });
    expect(getTruthTraceLogV0().length).toBe(1);
    const snap = getTraceSamplingSnapshotV0();
    expect(snap.stats.skipped).toBeGreaterThan(0);
  });

  it("skips duplicate spatial explain when trace delta skipped", () => {
    __forceFullTraceForTestV0(false);
    const event = {
      tier: SPATIAL_NODE_TIER_V0.LIVE,
      nodeId: "dup-pin",
      kind: "poi"
    };
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, event);
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, event);
    expect(getSpatialOriginLogV0().length).toBe(1);
  });

  it("always records tensor replay as explicit full trace", () => {
    __forceFullTraceForTestV0(false);
    const r = resolveTraceSamplingV0(TRUTH_TRACE_KIND_V0.TENSOR_REPLAY, { domain: "world" });
    expect(r.record).toBe(true);
    expect(r.tier).toBe("replay");
    expect(r.traceClass).toBe(TRACE_CLASS_V0.CRITICAL);
  });

  it("classifies skipped UI events as NOISE", () => {
    __forceFullTraceForTestV0(false);
    __setTraceUiSampleRateForTestV0(0);
    const r = resolveTraceSamplingV0(TRUTH_TRACE_KIND_V0.ADAPTER_INVOKE, {
      domain: "world",
      resultOk: true,
      adapterId: "world:spatial"
    });
    expect(r.traceClass).toBe(TRACE_CLASS_V0.NOISE);
    const snap = getTraceSamplingSnapshotV0();
    expect(snap.classification.noise).toBeGreaterThan(0);
  });
});
