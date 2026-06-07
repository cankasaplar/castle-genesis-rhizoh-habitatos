import { describe, it, expect } from "vitest";
import {
  computeFoxCubeSpatialTargetsV1,
  isFoxLocomotionMotionStateV1,
  resolveFoxSpatialMotionStateV1
} from "../foxCompanionSpatialV1.js";
import { deriveFoxCompanionBehaviorDriveV1 } from "../companionBehaviorOnlyV0.js";

describe("foxCompanionSpatialV1", () => {
  it("pulls fox toward cube on positive reach bias", () => {
    const layout = { baseX: -0.14, baseY: -0.19, baseZ: 0.04, bounds: { x: 0.28, z: 0.24 } };
    const drive = deriveFoxCompanionBehaviorDriveV1({
      fieldState: "idle",
      draftText: "test",
      busy: false
    });
    const idle = computeFoxCubeSpatialTargetsV1(drive, 0, layout, {
      orbPos: { x: 0.62, y: 0.02, z: 0.14 },
      ecologyReachBias: 0.05
    });
    const approach = computeFoxCubeSpatialTargetsV1(drive, 0, layout, {
      orbPos: { x: 0.62, y: 0.02, z: 0.14 },
      ecologyReachBias: 0.55
    });
    expect(approach.x).toBeGreaterThan(idle.x);
  });

  it("keeps listening stationary without draft", () => {
    const drive = deriveFoxCompanionBehaviorDriveV1({
      fieldState: "speaking",
      busy: false
    });
    expect(resolveFoxSpatialMotionStateV1(drive, { reachBias: 0.55 })).toBe("listening");
    expect(isFoxLocomotionMotionStateV1("listening")).toBe(false);
  });

  it("walk on draft typing", () => {
    const drive = deriveFoxCompanionBehaviorDriveV1({
      fieldState: "idle",
      draftText: "merhaba",
      busy: false
    });
    expect(resolveFoxSpatialMotionStateV1(drive, { reachBias: 0.42 })).toBe("walk");
    expect(isFoxLocomotionMotionStateV1("walk")).toBe(true);
  });
});
