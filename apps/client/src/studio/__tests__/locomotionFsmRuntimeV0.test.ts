import { describe, expect, it } from "vitest";
import {
  createLocomotionFsmRuntimeV0,
  tickLocomotionFsmGraphV0,
  velocityTowardPointV0
} from "../lib/realSimulation/locomotionFsmRuntimeV0";

describe("locomotionFsmRuntimeV0", () => {
  it("seeks when far", () => {
    const rt = createLocomotionFsmRuntimeV0(0);
    const out = tickLocomotionFsmGraphV0(rt, 5, 100, {
      seekSpeed: 2,
      arriveRadius: 1.5,
      idleRadius: 0.3
    });
    expect(out.speed).toBe(2);
    const v = velocityTowardPointV0({ x: 0, z: 0 }, { x: 3, z: 0 }, out.speed);
    expect(v.x).toBeGreaterThan(1.5);
  });
});
