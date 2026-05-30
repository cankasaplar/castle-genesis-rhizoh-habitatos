import { describe, it, expect } from "vitest";
import { resolvePrimaryAnchorForIdentityV0 } from "../primaryAnchorResolverV0.js";
import {
  assertIdentityPrimaryNotCalibrationWorldSeedV0,
  HOME_BASE_NOT_CAMERA_VIEWPORT_LAW_V0,
  SARIYER_IS_NOT_USER_CASTLE_LAW_V0
} from "../anchorTruthTableV0.js";
import {
  assertHomeAnchorAuthoritySourceAllowedV0,
  FORBIDDEN_HOME_ANCHOR_AUTHORITY_SOURCES_V0,
  HOME_ANCHOR_AUTHORITY_CHAIN_V0,
  ZERO_DEMO_POLICY_INTENT_V0
} from "../homeAnchorAuthorityV0.js";

describe("anchorTruthTableV0", () => {
  it("guard rejects calibration id posing as HOME_BASE", () => {
    const g = assertIdentityPrimaryNotCalibrationWorldSeedV0({
      kind: "HOME_BASE",
      anchor: { id: "anchor_sariyer_stability", provenance: "user_profile" }
    });
    expect(g.ok).toBe(false);
  });

  it("documents camera vs HOME_BASE separation", () => {
    expect(HOME_BASE_NOT_CAMERA_VIEWPORT_LAW_V0).toContain("viewport");
    expect(SARIYER_IS_NOT_USER_CASTLE_LAW_V0).toContain("calibration");
  });
});

describe("primaryAnchorResolverV0", () => {
  it("guest → ephemeral explore (no HOME_BASE)", () => {
    const r = resolvePrimaryAnchorForIdentityV0({ authMode: "guest" });
    expect(r.kind).toBe("EPHEMERAL_EXPLORE");
  });

  it("authenticated without profile anchor → NONE", () => {
    const r = resolvePrimaryAnchorForIdentityV0({ authMode: "authenticated", userHomeAnchor: null });
    expect(r.kind).toBe("NONE");
  });

  it("authenticated with profile home → HOME_BASE with user_profile provenance", () => {
    const r = resolvePrimaryAnchorForIdentityV0({
      authMode: "authenticated",
      userHomeAnchor: { lat: 52.5, lon: 13.4, placeLabel: "Canonical home", anchorId: "my_flat" }
    });
    expect(r.kind).toBe("HOME_BASE");
    if (r.kind === "HOME_BASE") {
      expect(r.anchor.provenance).toBe("user_profile");
      expect(r.anchor.lat).toBeCloseTo(52.5);
      expect(r.anchor.id).toBe("my_flat");
    }
  });

  it("rejects world calibration anchor id as HOME_BASE (no demo-city-as-me)", () => {
    const r = resolvePrimaryAnchorForIdentityV0({
      authMode: "authenticated",
      userHomeAnchor: {
        lat: 41.1169,
        lon: 29.0567,
        anchorId: "anchor_sariyer_stability",
        placeLabel: "Sarıyer"
      }
    });
    expect(r.kind).toBe("NONE");
  });

  it("passes through profile immutable fields when present", () => {
    const r = resolvePrimaryAnchorForIdentityV0({
      authMode: "authenticated",
      userHomeAnchor: {
        lat: 41.04,
        lon: 29.01,
        anchorId: "serencebey_home",
        placeLabel: "Serencebey",
        verifiedAt: 1_700_000_000_000,
        revision: 2
      }
    });
    expect(r.kind).toBe("HOME_BASE");
    if (r.kind === "HOME_BASE") {
      expect(r.anchor.verifiedAt).toBe(1_700_000_000_000);
      expect(r.anchor.revision).toBe(2);
    }
  });
});

describe("homeAnchorAuthorityV0", () => {
  it("documents authority chain", () => {
    expect(HOME_ANCHOR_AUTHORITY_CHAIN_V0).toContain("user_profile");
    expect(HOME_ANCHOR_AUTHORITY_CHAIN_V0).toContain("primaryAnchorResolverV0");
  });

  it("rejects forbidden authority sources", () => {
    for (const s of FORBIDDEN_HOME_ANCHOR_AUTHORITY_SOURCES_V0) {
      expect(assertHomeAnchorAuthoritySourceAllowedV0(s).ok).toBe(false);
    }
    expect(assertHomeAnchorAuthoritySourceAllowedV0("user_profile").ok).toBe(true);
  });

  it("zero-demo policy intent is present", () => {
    expect(ZERO_DEMO_POLICY_INTENT_V0.toLowerCase()).toContain("hardcoded");
  });
});
