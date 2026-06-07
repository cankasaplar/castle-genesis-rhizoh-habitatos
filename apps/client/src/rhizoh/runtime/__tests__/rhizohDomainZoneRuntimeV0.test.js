import { describe, expect, it, beforeEach } from "vitest";
import {
  bootstrapRhizohDomainGateV0,
  RHIZOH_DOMAIN_ID_V0
} from "../rhizohDomainGateV0.js";
import {
  __resetRhizohDomainCoreStoreForTestV0
} from "../rhizohDomainCoreStoreV0.js";
import {
  __resetDomainAdapterRegistryForTestV0,
  resolveDomainAdapterV0
} from "../domainAdapterRegistryV0.js";
import {
  CASTLE_ZONE_CAPABILITY_V0,
  STUDIO_ZONE_CAPABILITY_V0,
  OBSERVER_ZONE_CAPABILITY_V0
} from "../rhizohDomainCapabilitySpecV0.js";
import { evaluateDomainHealthV0, __resetDomainHealthForTestV0 } from "../rhizohDomainHealthContractV0.js";
import { mapIntentToActionV0 } from "../rhizohTensorBridgeV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import {
  registerSpatialNodeV0,
  SPATIAL_NODE_TIER_V0,
  __resetSpatialNodeLayerForTestV0
} from "../rhizohSpatialNodeLayerV0.js";

import { __resetControlPlaneForTestV0 } from "../rhizohControlPlaneV0.js";
import { __resetSpatialEventEmitterForTestV0 } from "../rhizohSpatialEventEmitterV0.js";

describe("domain zone runtime", () => {
  beforeEach(() => {
    __resetRhizohDomainCoreStoreForTestV0();
    __resetDomainAdapterRegistryForTestV0();
    __resetDomainHealthForTestV0();
    __resetNervousSystemEventGraphForTestV0();
    __resetSpatialNodeLayerForTestV0();
    __resetControlPlaneForTestV0();
    __resetSpatialEventEmitterForTestV0();
  });

  it("castle zone registers webrtc session presence identity adapters", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.CASTLE, { pathname: "/greenroom/main" });
    expect(resolveDomainAdapterV0(RHIZOH_DOMAIN_ID_V0.CASTLE, CASTLE_ZONE_CAPABILITY_V0.WEBRTC).id).not.toBe("null");
    expect(resolveDomainAdapterV0(RHIZOH_DOMAIN_ID_V0.CASTLE, CASTLE_ZONE_CAPABILITY_V0.SESSION).id).not.toBe("null");
    const health = evaluateDomainHealthV0(RHIZOH_DOMAIN_ID_V0.CASTLE);
    expect(health.gate).toBe(true);
    expect(health.adapter).toBe(true);
  });

  it("studio zone registers filesystem asset map ai adapters", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.STUDIO, { pathname: "/studio" });
    expect(resolveDomainAdapterV0(RHIZOH_DOMAIN_ID_V0.STUDIO, STUDIO_ZONE_CAPABILITY_V0.MAP_BUILDER).id).not.toBe("null");
    const create = mapIntentToActionV0(RHIZOH_DOMAIN_ID_V0.STUDIO, { intent: "create_map" });
    expect(create.action?.action).toBe("allocate_editor_runtime");
  });

  it("observer zone is read-only — blocks mutate", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, { pathname: "/academy/observe" });
    const blocked = mapIntentToActionV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, { intent: "observe_system", mutate: true });
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe("observer_read_only");
    const snap = mapIntentToActionV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, { intent: "observe_system" });
    expect(snap.action?.action).toBe("read_only_snapshot");
  });

  it("spatial nodes sync through spatial engine tiers only", () => {
    registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.STATIC, "poi_1", { kind: "pin" });
    registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.LIVE, "swarm_1", { kind: "agent" });
    registerSpatialNodeV0(SPATIAL_NODE_TIER_V0.TEMPORAL, "ghost_1", { kind: "trace" });
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.OBSERVER, { pathname: "/academy/observe" });
    const inspector = resolveDomainAdapterV0(
      RHIZOH_DOMAIN_ID_V0.OBSERVER,
      OBSERVER_ZONE_CAPABILITY_V0.STATE_INSPECTOR
    );
    expect(inspector.invoke().readOnly).toBe(true);
  });
});
