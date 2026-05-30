import { describe, expect, it } from "vitest";
import {
  hashPetTransformsDeterminismV0,
  fnv1aHash32HexV0
} from "../lib/realSimulation/simulationCompletionLayerV0";

describe("simulationCompletionLayerV0", () => {
  it("hash is stable for same input", () => {
    const pets = {
      a: { transform: { x: 1, y: 0, z: 2, rotY: 0.1 } }
    };
    expect(hashPetTransformsDeterminismV0(3, pets)).toBe(hashPetTransformsDeterminismV0(3, pets));
  });

  it("fnv1a returns hex", () => {
    expect(fnv1aHash32HexV0("abc").length).toBeGreaterThan(4);
  });
});
