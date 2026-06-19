import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import {
  resolveRhizohProductWorldRealityModeV0,
  shouldRhizohFlyToIstanbulV0,
  shouldRhizohAllowBootstrapCalibrationFlyV0,
  hasRhizohReturningUserAnchorV0,
  coerceRhizohProductRealityModeV0,
  shouldHideT0ContinuityChromeOnWorldSpaceV0,
  shouldRhizohT0LiveChromeVisibleV0,
  shouldRhizohWorldSpaceVoiceDockVisibleV0,
  isRhizohWorldSpaceMapStageV0,
  shouldRhizohCoreHostOwnChessArenaV0,
  shouldUseApexProceduralRealMapV0,
  isRhizohT0AmbientProceduralCityV0,
  resolveRhizohT0HomeRealityModeV0,
  shouldRhizohT0ShowGlobeHomeOverlayV0,
  RHIZOH_T0_AMBIENT_REALITY_SOURCE_V0
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
    expect(
      shouldRhizohAllowBootstrapCalibrationFlyV0({
        pathname: "/world/space",
        worldDomain: "space",
        source: "map_center"
      })
    ).toBe(false);
    expect(
      shouldRhizohAllowBootstrapCalibrationFlyV0({
        pathname: "/world/space",
        source: "voice_warp"
      })
    ).toBe(true);
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

  it("core host skips 1v1 arena on /world/space (map owns the workspace)", () => {
    expect(isRhizohWorldSpaceMapStageV0({ pathname: "/world/space" })).toBe(true);
    expect(shouldRhizohCoreHostOwnChessArenaV0({ pathname: "/world/space" })).toBe(false);
    expect(shouldRhizohCoreHostOwnChessArenaV0({ pathname: "/" })).toBe(true);
  });

  it("ambient procedural city allows REAL_MAP on T0 home", () => {
    vi.stubEnv("VITE_RHIZOH_T0_AMBIENT_PROCEDURAL_CITY", "1");
    expect(isRhizohT0AmbientProceduralCityV0()).toBe(true);
    expect(resolveRhizohT0HomeRealityModeV0()).toBe("REAL_MAP");
    expect(
      coerceRhizohProductRealityModeV0("REAL_MAP", {
        source: RHIZOH_T0_AMBIENT_REALITY_SOURCE_V0,
        productSurface: "world"
      })
    ).toBe("REAL_MAP");
    expect(
      shouldRhizohT0ShowGlobeHomeOverlayV0({
        cesiumLayerActive: false,
        isWorldDomainActive: false,
        realityMode: "REAL_MAP"
      })
    ).toBe(false);
    vi.unstubAllEnvs();
  });

  it("default T0 home keeps GLOBE overlay", () => {
    vi.stubEnv("VITE_RHIZOH_T0_AMBIENT_PROCEDURAL_CITY", "0");
    expect(resolveRhizohT0HomeRealityModeV0()).toBe("GLOBE");
    expect(
      shouldRhizohT0ShowGlobeHomeOverlayV0({
        cesiumLayerActive: false,
        isWorldDomainActive: false,
        realityMode: "GLOBE"
      })
    ).toBe(true);
    vi.unstubAllEnvs();
  });
});
