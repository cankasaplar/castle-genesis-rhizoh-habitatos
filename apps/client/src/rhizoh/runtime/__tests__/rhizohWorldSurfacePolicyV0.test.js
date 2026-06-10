import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import {
  resolveRhizohProductWorldRealityModeV0,
  shouldRhizohFlyToIstanbulV0,
  hasRhizohReturningUserAnchorV0,
  coerceRhizohProductRealityModeV0,
  shouldHideT0ContinuityChromeOnWorldSpaceV0,
  shouldRhizohT0LiveChromeVisibleV0,
  shouldRhizohWorldSpaceVoiceDockVisibleV0,
  shouldUseApexProceduralRealMapV0
} from "../rhizohWorldSurfacePolicyV0.js";
import { isRhizohContextWheelVisibleV0 } from "../rhizohLayerContextV0.js";
import {
  __resetRhizohWorldDrawerDomainForTestV0
} from "../rhizohWorldDrawerDomainV0.js";

vi.mock("../memoryAnchorSystemV0.js", () => ({
  readUserAnchorV0: vi.fn(() => null)
}));

import { readUserAnchorV0 } from "../memoryAnchorSystemV0.js";

describe("rhizohWorldSurfacePolicyV0", () => {
  afterEach(() => {
    vi.mocked(readUserAnchorV0).mockReturnValue(null);
  });

  it("WORLD product surface is always GLOBE", () => {
    expect(resolveRhizohProductWorldRealityModeV0("world")).toBe("GLOBE");
  });

  it("never flyTo Istanbul on world surface", () => {
    expect(
      shouldRhizohFlyToIstanbulV0({
        productSurface: "world",
        realityMode: "REAL_MAP",
        source: "PRODUCT_SHELL_WORLD_MAP"
      })
    ).toBe(false);
  });

  it("allows Istanbul fly on explicit REAL_MAP hall route", () => {
    expect(
      shouldRhizohFlyToIstanbulV0({
        productSurface: "hall",
        realityMode: "REAL_MAP",
        source: "PRODUCT_SHELL_HALL"
      })
    ).toBe(true);
  });

  it("coerces PRODUCT_SHELL_WORLD away from REAL_MAP (red line)", () => {
    expect(
      coerceRhizohProductRealityModeV0("REAL_MAP", {
        source: "PRODUCT_SHELL_WORLD",
        productSurface: "world"
      })
    ).toBe("GLOBE");
    expect(
      coerceRhizohProductRealityModeV0("REAL_MAP", {
        source: "MAP_TOOL_EXPLICIT",
        productSurface: "world"
      })
    ).toBe("REAL_MAP");
  });

  it("detects returning user when anchor exists", () => {
    vi.mocked(readUserAnchorV0).mockReturnValue({ thread_id: "t1", label: "Serencebey" });
    expect(hasRhizohReturningUserAnchorV0()).toBe(true);
  });

  it("shows context wheel only on world domain paths (not T0 live)", () => {
    expect(isRhizohContextWheelVisibleV0({ pathname: "/" })).toBe(false);
    expect(isRhizohContextWheelVisibleV0({ pathname: "/world/space" })).toBe(true);
    expect(isRhizohContextWheelVisibleV0({ pathname: "/world/social" })).toBe(true);
    expect(isRhizohContextWheelVisibleV0({ pathname: "/world/modes" })).toBe(true);
  });

  it("allows REAL_MAP on world domain route sources", () => {
    expect(
      coerceRhizohProductRealityModeV0("REAL_MAP", {
        source: "ROUTE_WORLD_DOMAIN",
        productSurface: "world"
      })
    ).toBe("REAL_MAP");
    expect(
      coerceRhizohProductRealityModeV0("REAL_MAP", {
        source: "ROUTE_MAP",
        productSurface: "world"
      })
    ).toBe("REAL_MAP");
  });

  it("T0 full chrome vs World Space voice dock", () => {
    expect(shouldRhizohT0LiveChromeVisibleV0({ isWorldDomainActive: false })).toBe(true);
    expect(
      shouldRhizohT0LiveChromeVisibleV0({
        isWorldDomainActive: true,
        worldDomain: "space"
      })
    ).toBe(false);
    expect(
      shouldRhizohT0LiveChromeVisibleV0({
        isWorldDomainActive: true,
        worldDomain: "social"
      })
    ).toBe(true);
    expect(
      shouldRhizohWorldSpaceVoiceDockVisibleV0({
        isWorldDomainActive: true,
        worldDomain: "space"
      })
    ).toBe(true);
    expect(
      shouldHideT0ContinuityChromeOnWorldSpaceV0({
        pathname: "/world/space",
        worldDomain: "space"
      })
    ).toBe(true);
    expect(shouldUseApexProceduralRealMapV0({ pathname: "/world/space" })).toBe(false);
    expect(shouldUseApexProceduralRealMapV0({ pathname: "/" })).toBe(true);
  });
});
