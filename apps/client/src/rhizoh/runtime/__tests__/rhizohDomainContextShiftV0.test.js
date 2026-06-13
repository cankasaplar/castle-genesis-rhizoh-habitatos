import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetRhizohDomainCoreStoreForTestV0,
  getRhizohDomainCoreSnapshotV0
} from "../rhizohDomainCoreStoreV0.js";
import {
  __resetDomainGraphForTestV0,
  getActiveFederationOverlayNodeV0,
  RHIZOH_FEDERATION_NODE_V0
} from "../rhizohDomainGraphV0.js";
import {
  applyDomainContextShiftV0,
  clearFederationOverlayContextV0,
  planDomainContextShiftV0,
  shiftRhizohDomainContextV0
} from "../rhizohDomainContextShiftV0.js";
import { DOMAIN_CONTEXT_SHIFT_MODE_V0 } from "../rhizohDomainGraphV0.js";

describe("rhizohDomainContextShiftV0", () => {
  beforeEach(() => {
    __resetRhizohDomainCoreStoreForTestV0();
    __resetDomainGraphForTestV0();
  });

  afterEach(() => {
    __resetRhizohDomainCoreStoreForTestV0();
    __resetDomainGraphForTestV0();
  });

  it("plans overlay shift for studio on world space", () => {
    const plan = planDomainContextShiftV0({
      pathname: "/world/space",
      surfaceId: "studio",
      inPlace: true
    });
    expect(plan.mode).toBe(DOMAIN_CONTEXT_SHIFT_MODE_V0.OVERLAY);
    expect(plan.toNode).toBe(RHIZOH_FEDERATION_NODE_V0.STUDIO);
  });

  it("apply overlay keeps host domain unchanged", () => {
    const coreBefore = getRhizohDomainCoreSnapshotV0();
    const plan = planDomainContextShiftV0({
      pathname: "/world/space",
      surfaceId: "broadcast",
      inPlace: true
    });
    const applied = applyDomainContextShiftV0(plan);
    expect(applied.ok).toBe(true);
    expect(applied.activeDomainUnchanged).toBe(true);
    expect(getActiveFederationOverlayNodeV0()).toBe(RHIZOH_FEDERATION_NODE_V0.BROADCAST);
    expect(getRhizohDomainCoreSnapshotV0().explicitPass).not.toBeNull();
    expect(coreBefore.activeDomain).toBe(getRhizohDomainCoreSnapshotV0().activeDomain);
  });

  it("clearFederationOverlayContextV0 resets overlay", () => {
    shiftRhizohDomainContextV0({ pathname: "/world/space", surfaceId: "studio", inPlace: true });
    expect(getActiveFederationOverlayNodeV0()).toBe(RHIZOH_FEDERATION_NODE_V0.STUDIO);
    clearFederationOverlayContextV0(RHIZOH_FEDERATION_NODE_V0.WORLD);
    expect(getActiveFederationOverlayNodeV0()).toBeNull();
  });
});
