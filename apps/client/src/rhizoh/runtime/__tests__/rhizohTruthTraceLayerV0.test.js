import { describe, expect, it, beforeEach } from "vitest";
import {
  traceDomainTransitionV0,
  traceTensorDecisionV0,
  getTruthTraceLogV0,
  getTruthTraceByKindV0,
  getTruthTraceSnapshotV0,
  TRUTH_TRACE_KIND_V0,
  __resetTruthTraceForTestV0,
  __forceTruthTraceEnabledForTestV0
} from "../rhizohTruthTraceLayerV0.js";
import { replayTensorIntentV0 } from "../rhizohTensorReplayV0.js";
import { bootstrapRhizohDomainGateV0, RHIZOH_DOMAIN_ID_V0 } from "../rhizohDomainGateV0.js";
import { mapIntentToActionV0 } from "../rhizohTensorBridgeV0.js";
import { passDomainStateV0, __resetRhizohDomainCoreStoreForTestV0 } from "../rhizohDomainCoreStoreV0.js";
import { __resetDomainAdapterRegistryForTestV0 } from "../domainAdapterRegistryV0.js";
import { __resetDomainHealthForTestV0 } from "../rhizohDomainHealthContractV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { __resetControlPlaneForTestV0 } from "../rhizohControlPlaneV0.js";
import { emitSpatialEventFromDomainV0, __resetSpatialEventEmitterForTestV0 } from "../rhizohSpatialEventEmitterV0.js";
import { registerSpatialNodeV0, SPATIAL_NODE_TIER_V0, __resetSpatialNodeLayerForTestV0 } from "../rhizohSpatialNodeLayerV0.js";
import { runDomainGateForPathV0 } from "../rhizohDomainNervousSystemV0.js";

describe("rhizohTruthTraceLayerV0", () => {
  beforeEach(() => {
    __resetRhizohDomainCoreStoreForTestV0();
    __resetDomainAdapterRegistryForTestV0();
    __resetDomainHealthForTestV0();
    __resetNervousSystemEventGraphForTestV0();
    __resetControlPlaneForTestV0();
    __resetSpatialEventEmitterForTestV0();
    __resetSpatialNodeLayerForTestV0();
    __resetTruthTraceForTestV0();
    __forceTruthTraceEnabledForTestV0(true);
  });

  it("records domain transition on gate bootstrap", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.WORLD, { pathname: "/world/space" });
    const rows = getTruthTraceByKindV0(TRUTH_TRACE_KIND_V0.DOMAIN_TRANSITION);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.at(-1).domain).toBe(RHIZOH_DOMAIN_ID_V0.WORLD);
  });

  it("traces intent → tensor → adapter chain with latency", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.WORLD, { pathname: "/world/space" });
    mapIntentToActionV0(RHIZOH_DOMAIN_ID_V0.WORLD, { intent: "open_world_map" });

    const tensorRows = getTruthTraceByKindV0(TRUTH_TRACE_KIND_V0.TENSOR_DECISION);
    const last = tensorRows.at(-1);
    expect(last?.intent).toBe("open_world_map");
    expect(last?.tensorAction).toBe("spatial_render_init");
    expect(typeof last?.latencyMs).toBe("number");
    expect(last?.chain).toContain("intent");
  });

  it("logs adapter identity on resolve and invoke", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.WORLD, { pathname: "/world/space" });
    mapIntentToActionV0(RHIZOH_DOMAIN_ID_V0.WORLD, { intent: "bridge_init" });

    const resolveRows = getTruthTraceByKindV0(TRUTH_TRACE_KIND_V0.ADAPTER_RESOLVE);
    expect(resolveRows.some((r) => r.adapterId?.includes("tensor"))).toBe(true);
  });

  it("traces explicit domain pass", () => {
    passDomainStateV0(RHIZOH_DOMAIN_ID_V0.T0, RHIZOH_DOMAIN_ID_V0.WORLD, { invite: "x" });
    const rows = getTruthTraceByKindV0(TRUTH_TRACE_KIND_V0.DOMAIN_PASS);
    expect(rows.at(-1).from).toBe(RHIZOH_DOMAIN_ID_V0.T0);
    expect(rows.at(-1).to).toBe(RHIZOH_DOMAIN_ID_V0.WORLD);
  });

  it("marks LIVE spatial nodes as projectionOnly", () => {
    registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.LIVE, "pin-1", { lat: 41, lon: 29 });
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.LIVE,
      nodeId: "pin-2",
      kind: "poi"
    });

    const rows = getTruthTraceByKindV0(TRUTH_TRACE_KIND_V0.SPATIAL_NODE);
    expect(rows.every((r) => r.projectionOnly === true)).toBe(true);
  });

  it("replays tensor intent without side effects", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.WORLD, { pathname: "/world/space" });
    const replay = replayTensorIntentV0(RHIZOH_DOMAIN_ID_V0.WORLD, "open_world_map");
    expect(replay.dryRun).toBe(true);
    expect(replay.result?.action?.action).toBe("spatial_render_init");

    const replayRows = getTruthTraceByKindV0(TRUTH_TRACE_KIND_V0.TENSOR_REPLAY);
    expect(replayRows.length).toBeGreaterThan(0);
  });

  it("exposes snapshot via nervous system gate", () => {
    runDomainGateForPathV0("/world/space");
    traceTensorDecisionV0({ domain: "world", intent: "probe", action: "health_probe" });
    const snap = getTruthTraceSnapshotV0();
    expect(snap.enabled).toBe(true);
    expect(snap.count).toBeGreaterThan(0);
    expect(snap.entries.length).toBe(getTruthTraceLogV0().length);
  });
});
