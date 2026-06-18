import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  cancelMapPinHoverDwellV0,
  dispatchSpiralMMOAwakeningStagedV0,
  isMapTransitionBusyV0,
  MAP_PIN_HOVER_DWELL_MS_V0,
  resetWorldMapTransitionForTestsV0,
  scheduleMapPinHoverDwellV0
} from "../worldMapMeaningfulTransitionV0.js";
import { RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0 } from "../spiralMMOAwakeningCycleV0.js";

describe("worldMapMeaningfulTransitionV0", () => {
  beforeEach(() => {
    resetWorldMapTransitionForTestsV0();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces hover dwell before firing callback", () => {
    const hovered = [];
    scheduleMapPinHoverDwellV0({ id: "tower_1", type: "tower" }, (n) => hovered.push(n.id));
    expect(hovered).toHaveLength(0);
    vi.advanceTimersByTime(MAP_PIN_HOVER_DWELL_MS_V0 - 1);
    expect(hovered).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(hovered).toEqual(["tower_1"]);
  });

  it("cancels pending hover on mouseout", () => {
    const cleared = [];
    scheduleMapPinHoverDwellV0({ id: "library" }, () => {}, () => cleared.push("clear"));
    cancelMapPinHoverDwellV0(() => cleared.push("clear"));
    vi.advanceTimersByTime(MAP_PIN_HOVER_DWELL_MS_V0 + 100);
    expect(cleared.length).toBeGreaterThan(0);
    expect(isMapTransitionBusyV0()).toBe(false);
  });

  it("spiral pin click commits awakening without map flyTo zoom", () => {
    const flyTo = vi.fn();
    const awakened = [];
    window.addEventListener(RHIZOH_SPIRAL_MMO_AWAKENING_EVENT_V0, () => awakened.push(1));
    dispatchSpiralMMOAwakeningStagedV0("spiralmmo_europe", { flyTo, getZoom: () => 4 });
    expect(flyTo).not.toHaveBeenCalled();
    expect(awakened).toHaveLength(1);
    expect(isMapTransitionBusyV0()).toBe(false);
  });
});
