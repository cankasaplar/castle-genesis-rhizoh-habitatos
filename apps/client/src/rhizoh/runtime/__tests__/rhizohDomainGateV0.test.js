import { describe, expect, it, beforeEach } from "vitest";
import {
  bootstrapRhizohDomainGateV0,
  RHIZOH_DOMAIN_ID_V0,
  resolveDomainIdFromPathV0
} from "../rhizohDomainGateV0.js";
import {
  __resetRhizohDomainCoreStoreForTestV0,
  getRhizohDomainCoreSnapshotV0,
  passDomainStateV0
} from "../rhizohDomainCoreStoreV0.js";
import {
  __resetDomainAdapterRegistryForTestV0,
  resolveDomainAdapterV0,
  RHIZOH_DOMAIN_CAPABILITY_V0
} from "../domainAdapterRegistryV0.js";

import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { __resetDomainHealthForTestV0 } from "../rhizohDomainHealthContractV0.js";

import { __resetControlPlaneForTestV0 } from "../rhizohControlPlaneV0.js";

describe("rhizohDomainGateV0", () => {
  beforeEach(() => {
    __resetRhizohDomainCoreStoreForTestV0();
    __resetDomainAdapterRegistryForTestV0();
    __resetDomainHealthForTestV0();
    __resetNervousSystemEventGraphForTestV0();
    __resetControlPlaneForTestV0();
  });

  it("resolves domain id from pathname", () => {
    expect(resolveDomainIdFromPathV0("/")).toBe(RHIZOH_DOMAIN_ID_V0.T0);
    expect(resolveDomainIdFromPathV0("/world/space")).toBe(RHIZOH_DOMAIN_ID_V0.WORLD);
    expect(resolveDomainIdFromPathV0("/map")).toBe(RHIZOH_DOMAIN_ID_V0.WORLD);
    expect(resolveDomainIdFromPathV0("/hall/main")).toBe(RHIZOH_DOMAIN_ID_V0.CASTLE);
    expect(resolveDomainIdFromPathV0("/greenroom/main")).toBe(RHIZOH_DOMAIN_ID_V0.CASTLE);
    expect(resolveDomainIdFromPathV0("/studio")).toBe(RHIZOH_DOMAIN_ID_V0.STUDIO);
    expect(resolveDomainIdFromPathV0("/spiral")).toBe(RHIZOH_DOMAIN_ID_V0.STUDIO);
    expect(resolveDomainIdFromPathV0("/academy")).toBe(RHIZOH_DOMAIN_ID_V0.OBSERVER);
    expect(resolveDomainIdFromPathV0("/academy/observe")).toBe(RHIZOH_DOMAIN_ID_V0.OBSERVER);
    expect(resolveDomainIdFromPathV0("/academy/research")).toBe(RHIZOH_DOMAIN_ID_V0.OBSERVER);
    expect(resolveDomainIdFromPathV0("/settings")).toBe(RHIZOH_DOMAIN_ID_V0.OBSERVER);
    expect(resolveDomainIdFromPathV0("/observer/settings")).toBe(RHIZOH_DOMAIN_ID_V0.OBSERVER);
  });

  it("bootstraps isolated domain runtime without cross-domain leakage", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.T0, { pathname: "/" });
    const t0 = getRhizohDomainCoreSnapshotV0();
    expect(t0.activeDomain).toBe(RHIZOH_DOMAIN_ID_V0.T0);
    expect(t0.layerMode).toBe("t0_live");

    const gate = bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.WORLD, {
      pathname: "/world/space",
      worldDomain: "space",
      fromDomain: RHIZOH_DOMAIN_ID_V0.T0,
      passPayload: { entry: "world_tab" }
    });
    expect(gate.health?.gate).toBe(true);
    expect(gate.controlPlane?.health?.propagation).toBeTruthy();
    const world = getRhizohDomainCoreSnapshotV0();
    expect(world.activeDomain).toBe(RHIZOH_DOMAIN_ID_V0.WORLD);
    expect(world.layerMode).toBe("maps_space");
    expect(world.explicitPass?.from).toBe(RHIZOH_DOMAIN_ID_V0.T0);
  });

  it("returns null adapter silently for missing capability", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.T0, { pathname: "/" });
    const adapter = resolveDomainAdapterV0(RHIZOH_DOMAIN_ID_V0.T0, "nonexistent_cap");
    expect(adapter.id).toBe("null");
    expect(adapter.invoke().reason).toBe("null_adapter");
  });

  it("passDomainStateV0 is the only explicit cross-talk path", () => {
    passDomainStateV0("t0", "world", { focus: "map" });
    const snap = getRhizohDomainCoreSnapshotV0();
    expect(snap.explicitPass?.payload).toEqual({ focus: "map" });
  });
});
