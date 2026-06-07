import { describe, expect, it, beforeEach } from "vitest";
import {
  explainControlPlaneDecisionV0,
  explainSpatialEventOriginV0,
  explainTensorSafetyBlockV0,
  explainCascadeIsolationV0,
  getExplanationSnapshotV0,
  getControlPlaneDecisionLogV0,
  getSpatialOriginLogV0,
  getLatestExplanationForDomainV0,
  EXPLANATION_KIND_V0,
  __resetExplanationLayerForTestV0,
  __forceExplanationEnabledForTestV0
} from "../rhizohExplanationLayerV0.js";
import {
  __forceTruthTraceEnabledForTestV0,
  __resetTruthTraceForTestV0
} from "../rhizohTruthTraceLayerV0.js";
import {
  bootstrapRhizohDomainGateV0,
  RHIZOH_DOMAIN_ID_V0
} from "../rhizohDomainGateV0.js";
import {
  runControlPlaneForDomainV0,
  applyCascadeIsolationV0,
  evaluateControlPlaneHealthV0,
  __resetControlPlaneForTestV0
} from "../rhizohControlPlaneV0.js";
import { emitSpatialEventFromDomainV0, __resetSpatialEventEmitterForTestV0 } from "../rhizohSpatialEventEmitterV0.js";
import { mapIntentToActionV0 } from "../rhizohTensorBridgeV0.js";
import { runDomainGateForPathV0 } from "../rhizohDomainNervousSystemV0.js";
import { __resetRhizohDomainCoreStoreForTestV0 } from "../rhizohDomainCoreStoreV0.js";
import { __resetDomainAdapterRegistryForTestV0 } from "../domainAdapterRegistryV0.js";
import { __resetDomainHealthForTestV0 } from "../rhizohDomainHealthContractV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { SPATIAL_NODE_TIER_V0 } from "../rhizohSpatialNodeLayerV0.js";

function resetAll() {
  __resetRhizohDomainCoreStoreForTestV0();
  __resetDomainAdapterRegistryForTestV0();
  __resetDomainHealthForTestV0();
  __resetNervousSystemEventGraphForTestV0();
  __resetControlPlaneForTestV0();
  __resetSpatialEventEmitterForTestV0();
  __resetTruthTraceForTestV0();
  __resetExplanationLayerForTestV0();
  __forceTruthTraceEnabledForTestV0(true);
  __forceExplanationEnabledForTestV0(true);
}

describe("rhizohExplanationLayerV0", () => {
  beforeEach(resetAll);

  it("produces human-readable control plane decision with downgrade reasons", () => {
    const health = evaluateControlPlaneHealthV0(RHIZOH_DOMAIN_ID_V0.WORLD, { tensorOk: false });
    const exp = explainControlPlaneDecisionV0(RHIZOH_DOMAIN_ID_V0.WORLD, health);

    expect(exp?.kind).toBe(EXPLANATION_KIND_V0.CONTROL_PLANE);
    expect(exp?.human).toContain("DOMAIN: WORLD");
    expect(exp?.human).toContain("REASON:");
    expect(exp?.reasons.some((r) => r.code.includes("downgrade"))).toBe(true);
    expect(getControlPlaneDecisionLogV0().length).toBeGreaterThan(0);
  });

  it("explains cesium freeze action with spatial emitter block", () => {
    const health = evaluateControlPlaneHealthV0(RHIZOH_DOMAIN_ID_V0.WORLD, { tensorOk: false });
    const exp = explainControlPlaneDecisionV0(RHIZOH_DOMAIN_ID_V0.WORLD, health);

    expect(exp?.action).toBe("cesium_freeze");
    expect(exp?.reasons.some((r) => r.code === "spatial_emitter_live_blocked")).toBe(true);
  });

  it("tracks spatial event origin chain", () => {
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.LIVE,
      nodeId: "poi-istanbul",
      kind: "poi",
      trigger: "world_map_open"
    });

    const origins = getSpatialOriginLogV0();
    expect(origins.length).toBe(1);
    expect(origins[0].originChain).toContain("spatial_emitter");
    expect(origins[0].reasons.some((r) => r.code === "projection_only")).toBe(true);
  });

  it("explains blocked spatial events under cascade isolation", () => {
    applyCascadeIsolationV0(RHIZOH_DOMAIN_ID_V0.WORLD);
    emitSpatialEventFromDomainV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      tier: SPATIAL_NODE_TIER_V0.LIVE,
      nodeId: "blocked-pin",
      kind: "poi"
    });

    const blocked = getSpatialOriginLogV0().at(-1);
    expect(blocked?.action).toBe("spatial_event_blocked");
    expect(blocked?.reasons.some((r) => r.code === "control_plane_cascade")).toBe(true);

    const cascade = getControlPlaneDecisionLogV0().find((e) => e.kind === EXPLANATION_KIND_V0.CASCADE_ISOLATION);
    expect(cascade?.human?.toLowerCase()).toContain("spatial emitter blocked");
  });

  it("explains tensor safety blocks", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, { pathname: "/academy/observe" });
    runControlPlaneForDomainV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, { tensorResult: { ok: true } });
    mapIntentToActionV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, { intent: "observe_system", mutate: true });

    const exp = getLatestExplanationForDomainV0(RHIZOH_DOMAIN_ID_V0.OBSERVER);
    expect(exp?.kind === EXPLANATION_KIND_V0.TENSOR_SAFETY || exp?.kind === EXPLANATION_KIND_V0.CONTROL_PLANE).toBe(
      true
    );
  });

  it("explains tensor safety block directly", () => {
    const exp = explainTensorSafetyBlockV0("world", "world_cesium_frozen", {
      intent: "fly_to",
      action: "spatial_fly"
    });
    expect(exp?.human).toContain("world_cesium_frozen");
    expect(exp?.reasons.some((r) => r.code === "tensor_safety_threshold")).toBe(true);
  });

  it("exposes snapshot via nervous system", () => {
    runDomainGateForPathV0("/world/space");
    explainCascadeIsolationV0("world", "test");
    const snap = getExplanationSnapshotV0();
    expect(snap.enabled).toBe(true);
    expect(snap.count).toBeGreaterThan(0);
    expect(snap.spatialOrigins).toBeGreaterThanOrEqual(0);
  });
});
