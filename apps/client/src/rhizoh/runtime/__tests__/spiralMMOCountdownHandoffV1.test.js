import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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
    vi.useFakeTimers();
    window.__rhizoh = {
      v11LeafletMap: {
        flyTo: vi.fn(),
        getZoom: vi.fn(() => 12),
        getCenter: vi.fn(() => ({ lat: 41.01, lng: 28.97 }))
      }
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("stages immersion end, city map restore, greenroom + octo lab", async () => {
    const immersion = [];
    window.addEventListener(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0, () => immersion.push(1));

    const promise = handoffSpiralCountdownToWaitingRoomV1({ source: "test" });
    expect(immersion).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(120);
    expect(applyRhizohWorldMapToolV0).toHaveBeenCalledWith(
      "city_map",
      expect.objectContaining({ leafletOnly: true })
    );

    await vi.advanceTimersByTimeAsync(900);
    expect(handleProductShellSelectV0).toHaveBeenCalledWith(
      "greenroom",
      expect.objectContaining({ inPlace: true })
    );

    await vi.advanceTimersByTimeAsync(350);
    expect(openOctoYuvaEightCameraLabV1).toHaveBeenCalled();
    await expect(promise).resolves.toBe(true);
  });
});
