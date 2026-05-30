import { describe, expect, it } from "vitest";
import { separationAccelerationV0 } from "../lib/realSimulation/flockSteeringV0";

describe("flockSteeringV0", () => {
  it("pushes away from overlapping neighbor", () => {
    const a = separationAccelerationV0({ x: 0, z: 0 }, [{ x: 0.2, z: 0 }], 1.0, 10);
    expect(a.x).toBeLessThan(-0.1);
  });
});
