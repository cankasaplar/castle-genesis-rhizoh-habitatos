import { describe, expect, it } from "vitest";
import {
  resolveSpiralCubeRenderScaleV0,
  resolveSpiralCubeSizePxV0,
  SPIRAL_CUBE_CANONICAL_CELL_PX_V0
} from "../spiralMMOCubeUnitV0.js";

describe("spiralMMOCubeUnitV0", () => {
  it("derives size from canonical cell unit", () => {
    const size = resolveSpiralCubeSizePxV0({ depthLayer: 1, sizeNoise: 0.5, isOrder: false });
    expect(size).toBeGreaterThan(SPIRAL_CUBE_CANONICAL_CELL_PX_V0 * 0.85);
    expect(size).toBeLessThan(SPIRAL_CUBE_CANONICAL_CELL_PX_V0 * 1.35);
  });

  it("order cubes are larger than non-order at same depth", () => {
    const plain = resolveSpiralCubeSizePxV0({ depthLayer: 0, sizeNoise: 0.3, isOrder: false });
    const order = resolveSpiralCubeSizePxV0({ depthLayer: 0, sizeNoise: 0.3, isOrder: true });
    expect(order).toBeGreaterThan(plain);
  });

  it("render scale comes from spec depth only", () => {
    expect(resolveSpiralCubeRenderScaleV0({ depth: 0.2 })).toBeLessThan(
      resolveSpiralCubeRenderScaleV0({ depth: 0.9 })
    );
  });
});
