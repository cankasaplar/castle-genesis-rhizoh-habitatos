import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { handoffSpiralCountdownToWaitingRoomV1 } from "../spiralMMOCountdownHandoffV1.js";
import { RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0 } from "../spiralMMOAwakeningCycleV0.js";
import { applyRhizohWorldMapToolV0 } from "../rhizohWorldMapToolV0.js";
import { handleProductShellSelectV0 } from "../rhizohDrawerStateMachineV0.js";
import { openOctoYuvaEightCameraLabV1 } from "../octoYuvaMediaLabBridgeV1.js";
import {
  enterReplayModeV0,
  exitReplayModeV0,
  markCatchUpActivityV0,
  __resetTemporalBridgeForTestV0
} from "../temporalBridgeV0.js";
import { __resetRhizohCatchUpGuardForTestV0 } from "../rhizohCatchUpGuardV0.js";

vi.mock("../rhizohWorldMapToolV0.js", () => ({
  applyRhizohWorldMapToolV0: vi.fn(() => Promise.resolve())
}));

vi.mock("../rhizohDrawerStateMachineV0.js", () => ({
  handleProductShellSelectV0: vi.fn()
}));

vi.mock("../octoYuvaMediaLabBridgeV1.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    openOctoYuvaEightCameraLabV1: vi.fn()
  };
});

describe("spiralMMOCountdownHandoffV1", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    __resetTemporalBridgeForTestV0();
    __resetRhizohCatchUpGuardForTestV0();
    vi.mocked(applyRhizohWorldMapToolV0).mockClear();
    vi.mocked(handleProductShellSelectV0).mockClear();
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

  it("stages immersion end, city map restore, greenroom — Octo lab is opt-in", async () => {
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

    await vi.advanceTimersByTimeAsync(50);
    expect(openOctoYuvaEightCameraLabV1).not.toHaveBeenCalled();
    await expect(promise).resolves.toBe(true);
  });

  it("skips handoff during catch-up replay", async () => {
    enterReplayModeV0("test_catch_up");
    const immersion = [];
    window.addEventListener(RHIZOH_SPIRAL_MMO_IMMERSION_END_EVENT_V0, () => immersion.push(1));
    const out = await handoffSpiralCountdownToWaitingRoomV1({ source: "test_catch_up" });
    expect(out).toBe(false);
    expect(immersion).toHaveLength(0);
    expect(applyRhizohWorldMapToolV0).not.toHaveBeenCalled();
    exitReplayModeV0("test_catch_up");
  });

  it("skips handoff during catch-up settling window", async () => {
    markCatchUpActivityV0();
    const out = await handoffSpiralCountdownToWaitingRoomV1({ source: "test_settling" });
    expect(out).toBe(false);
    expect(applyRhizohWorldMapToolV0).not.toHaveBeenCalled();
  });
});
