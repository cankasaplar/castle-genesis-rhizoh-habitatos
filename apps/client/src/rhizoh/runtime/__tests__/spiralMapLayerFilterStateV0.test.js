import { beforeEach, describe, expect, it } from "vitest";
import {
  focusSpiralMapLayerV0,
  readSpiralMapLayerFilterStateV0,
  SPIRAL_MAP_LAYER_FILTER_EVENT_V0,
  writeSpiralMapLayerFilterStateV0
} from "../spiralMapLayerFilterStateV0.js";
import { SPIRAL_MAP_LAYER_V0 } from "../spatialDistributionLayerV0.js";

describe("spiralMapLayerFilterStateV0", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("rhizoh.spiral_map_layer_filter.v0");
    }
  });

  it("defaults to explorer-only V11 first-live filter", () => {
    const state = readSpiralMapLayerFilterStateV0();
    expect(state[SPIRAL_MAP_LAYER_V0.EXPLORER]).toBe(true);
    expect(state[SPIRAL_MAP_LAYER_V0.CASTLE]).toBe(false);
    expect(state[SPIRAL_MAP_LAYER_V0.ECONOMY]).toBe(false);
    expect(state.includeDormant).toBe(false);
  });

  it("focusSpiralMapLayerV0 enables single layer focus", () => {
    const state = focusSpiralMapLayerV0(SPIRAL_MAP_LAYER_V0.CASTLE);
    expect(state[SPIRAL_MAP_LAYER_V0.CASTLE]).toBe(true);
    expect(state[SPIRAL_MAP_LAYER_V0.EXPLORER]).toBe(false);
    expect(state.includeDormant).toBe(true);
  });

  it("writeSpiralMapLayerFilterStateV0 dispatches filter event", () => {
    let seen = null;
    const handler = (e) => {
      seen = e.detail?.state;
    };
    window.addEventListener(SPIRAL_MAP_LAYER_FILTER_EVENT_V0, handler);
    writeSpiralMapLayerFilterStateV0({ economy: true });
    window.removeEventListener(SPIRAL_MAP_LAYER_FILTER_EVENT_V0, handler);
    expect(seen?.economy).toBe(true);
  });
});
