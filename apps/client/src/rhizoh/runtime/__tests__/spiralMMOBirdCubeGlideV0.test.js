import { describe, expect, it } from "vitest";
import {
  sampleSpiralMMOBirdCubeGlideV0,
  shouldTriggerSpiralMMOBirdCubeGlideV0
} from "../spiralMMOBirdCubeGlideV0.js";

describe("spiralMMOBirdCubeGlideV0", () => {
  it("samples bezier glide with lift", () => {
    const start = sampleSpiralMMOBirdCubeGlideV0({ x: 0, y: 0, z: 0 }, { x: 100, y: 50 }, 0.5);
    expect(start.y).toBeLessThan(25);
    expect(start.z).toBeGreaterThan(0);
  });

  it("triggers glide only after first loop near path end", () => {
    expect(shouldTriggerSpiralMMOBirdCubeGlideV0(0.9, 0, 0)).toBe(false);
    expect(shouldTriggerSpiralMMOBirdCubeGlideV0(0.9, 1, 0)).toBe(false);
    expect(shouldTriggerSpiralMMOBirdCubeGlideV0(0.9, 2, 0)).toBe(true);
    expect(shouldTriggerSpiralMMOBirdCubeGlideV0(0.5, 2, 1)).toBe(false);
  });
});
