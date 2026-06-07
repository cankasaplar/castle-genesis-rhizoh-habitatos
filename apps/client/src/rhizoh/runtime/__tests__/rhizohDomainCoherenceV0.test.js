import { describe, expect, it, beforeEach } from "vitest";
import {
  reconcileDomainPathCoherenceV0,
  auditDomainCoherenceV0
} from "../rhizohDomainCoherenceV0.js";
import {
  bootstrapRhizohDomainGateV0,
  RHIZOH_DOMAIN_ID_V0,
  resolveDomainIdFromPathV0
} from "../rhizohDomainGateV0.js";
import { __resetRhizohDomainCoreStoreForTestV0, syncRhizohDomainCoreStoreV0 } from "../rhizohDomainCoreStoreV0.js";
import { __resetDomainAdapterRegistryForTestV0 } from "../domainAdapterRegistryV0.js";
import { __resetDomainHealthForTestV0 } from "../rhizohDomainHealthContractV0.js";
import { __resetNervousSystemEventGraphForTestV0 } from "../rhizohNervousSystemEventGraphV0.js";
import { __resetControlPlaneForTestV0 } from "../rhizohControlPlaneV0.js";
import { __resetSpatialNodeLayerForTestV0 } from "../rhizohSpatialNodeLayerV0.js";
import { __resetSpatialEventEmitterForTestV0 } from "../rhizohSpatialEventEmitterV0.js";

function resetAll() {
  __resetRhizohDomainCoreStoreForTestV0();
  __resetDomainAdapterRegistryForTestV0();
  __resetDomainHealthForTestV0();
  __resetNervousSystemEventGraphForTestV0();
  __resetControlPlaneForTestV0();
  __resetSpatialNodeLayerForTestV0();
  __resetSpatialEventEmitterForTestV0();
}

describe("rhizohDomainCoherenceV0", () => {
  beforeEach(resetAll);

  it("/settings resolves to observer domain", () => {
    expect(resolveDomainIdFromPathV0("/settings")).toBe(RHIZOH_DOMAIN_ID_V0.OBSERVER);
    expect(resolveDomainIdFromPathV0("/academy")).toBe(RHIZOH_DOMAIN_ID_V0.OBSERVER);
  });

  it("reconciles stale t0 core on /settings path", () => {
    bootstrapRhizohDomainGateV0(RHIZOH_DOMAIN_ID_V0.T0, { pathname: "/" });
    syncRhizohDomainCoreStoreV0({ pathname: "/settings", activeDomain: RHIZOH_DOMAIN_ID_V0.T0 });

    const auditBefore = auditDomainCoherenceV0("/settings");
    expect(auditBefore.pass).toBe(false);
    expect(auditBefore.issues).toContain("core_active_domain_path_mismatch");

    const reconciled = reconcileDomainPathCoherenceV0("/settings");
    expect(reconciled.pass).toBe(true);
    expect(reconciled.core.activeDomain).toBe(RHIZOH_DOMAIN_ID_V0.OBSERVER);
    expect(reconciled.controlPlane?.domain).toBe(RHIZOH_DOMAIN_ID_V0.OBSERVER);
  });
});
