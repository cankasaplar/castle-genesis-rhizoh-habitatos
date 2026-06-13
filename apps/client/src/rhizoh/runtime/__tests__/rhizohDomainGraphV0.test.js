import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetDomainGraphForTestV0,
  auditCrossDomainDrawerV0,
  getActiveFederationOverlayNodeV0,
  isDomainFederationEdgeAllowedV0,
  resolveFederationNodeFromProductSurfaceV0,
  RHIZOH_FEDERATION_NODE_V0
} from "../rhizohDomainGraphV0.js";

describe("rhizohDomainGraphV0", () => {
  beforeEach(() => {
    __resetDomainGraphForTestV0();
  });

  afterEach(() => {
    __resetDomainGraphForTestV0();
  });

  it("maps product surfaces to federation nodes", () => {
    expect(resolveFederationNodeFromProductSurfaceV0("studio")).toBe(RHIZOH_FEDERATION_NODE_V0.STUDIO);
    expect(resolveFederationNodeFromProductSurfaceV0("broadcast")).toBe(RHIZOH_FEDERATION_NODE_V0.BROADCAST);
    expect(resolveFederationNodeFromProductSurfaceV0("hall")).toBe(RHIZOH_FEDERATION_NODE_V0.CASTLE);
  });

  it("allows world → studio overlay edge", () => {
    expect(isDomainFederationEdgeAllowedV0(RHIZOH_FEDERATION_NODE_V0.WORLD, RHIZOH_FEDERATION_NODE_V0.STUDIO)).toBe(
      true
    );
  });

  it("auditCrossDomainDrawerV0 returns overlay projection for studio on world", () => {
    const audit = auditCrossDomainDrawerV0(RHIZOH_FEDERATION_NODE_V0.WORLD, "studio");
    expect(audit.ok).toBe(true);
    expect(audit.overlayProjectionOnly).toBe(true);
    expect(audit.targetNode).toBe(RHIZOH_FEDERATION_NODE_V0.STUDIO);
  });

  it("rejects unknown surface", () => {
    const audit = auditCrossDomainDrawerV0(RHIZOH_FEDERATION_NODE_V0.WORLD, "unknown_surface");
    expect(audit.ok).toBe(false);
  });

  it("tracks active overlay node", () => {
    expect(getActiveFederationOverlayNodeV0()).toBeNull();
  });
});
