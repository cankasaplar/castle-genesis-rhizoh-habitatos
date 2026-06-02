import { describe, expect, it, vi, afterEach } from "vitest";
import {
  resolveRhizohProductWorldRealityModeV0,
  shouldRhizohFlyToIstanbulV0,
  hasRhizohReturningUserAnchorV0,
  coerceRhizohProductRealityModeV0,
  isRhizohCapabilityWheelVisibleV0
} from "../rhizohWorldSurfacePolicyV0.js";

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

  it("shows capability wheel only on world surface", () => {
    expect(isRhizohCapabilityWheelVisibleV0("world")).toBe(true);
    expect(isRhizohCapabilityWheelVisibleV0("hall")).toBe(false);
    expect(isRhizohCapabilityWheelVisibleV0("studio")).toBe(false);
  });
});
