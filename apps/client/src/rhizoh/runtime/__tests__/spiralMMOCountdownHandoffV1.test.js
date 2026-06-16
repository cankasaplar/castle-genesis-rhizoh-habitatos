import { describe, expect, it, vi, beforeEach } from "vitest";
import { handoffSpiralCountdownToWaitingRoomV1 } from "../spiralMMOCountdownHandoffV1.js";
import { RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0 } from "../spiralMMOAwakeningCycleV0.js";
import { applyRhizohWorldMapToolV0 } from "../rhizohWorldMapToolV0.js";
import { handleProductShellSelectV0 } from "../rhizohDrawerStateMachineV0.js";
import { openOctoYuvaEightCameraLabV1 } from "../octoYuvaMediaLabBridgeV1.js";

vi.mock("../rhizohWorldMapToolV0.js", () => ({
  applyRhizohWorldMapToolV0: vi.fn(() => Promise.resolve())
}));

vi.mock("../rhizohDrawerStateMachineV0.js", () => ({
  handleProductShellSelectV0: vi.fn()
}));

vi.mock("../octoYuvaMediaLabBridgeV1.js", () => ({
  openOctoYuvaEightCameraLabV1: vi.fn()
}));

describe("spiralMMOCountdownHandoffV1", () => {
  beforeEach(() => {
    window.__rhizoh = {};
  });

  it("dispatches immersion end, city map restore, greenroom + octo lab", () => {
    const immersion = [];
    window.addEventListener(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0, () => immersion.push(1));

    expect(handoffSpiralCountdownToWaitingRoomV1({ source: "test" })).toBe(true);
    expect(immersion).toHaveLength(1);
    expect(applyRhizohWorldMapToolV0).toHaveBeenCalledWith(
      "city_map",
      expect.objectContaining({ leafletOnly: true })
    );
    expect(handleProductShellSelectV0).toHaveBeenCalledWith(
      "greenroom",
      expect.objectContaining({ inPlace: true })
    );
    expect(openOctoYuvaEightCameraLabV1).toHaveBeenCalled();
  });
});
