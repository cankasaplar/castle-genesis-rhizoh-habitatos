import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  applySpiralMapRealityModeV0,
  CASTLE_IDENTITY_MODE_EVENT_V0,
  ensureSpiralMapRealityModeHydratedV0,
  readSpiralMapRealityModeV0,
  SPIRAL_MAP_REALITY_MODE_EVENT_V0,
  SPIRAL_MAP_REALITY_MODE_LS_KEY_V0,
  SPIRAL_MAP_REALITY_MODE_V0
} from "../spiralMapRealityModeV0.js";
import { SPIRAL_MAP_LAYER_V0 } from "../spatialDistributionLayerV0.js";

describe("spiralMapRealityModeV0", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("rhizoh.spiral_map_layer_filter.v0");
      localStorage.removeItem(SPIRAL_MAP_REALITY_MODE_LS_KEY_V0);
      localStorage.removeItem("rhizoh.world.map_marker_layers.v0");
    }
  });

  it("defaults to explorer reality mode", () => {
    expect(readSpiralMapRealityModeV0()).toBe(SPIRAL_MAP_REALITY_MODE_V0.EXPLORER);
  });

  it("applySpiralMapRealityModeV0 sets castle layer preset", () => {
    const next = applySpiralMapRealityModeV0(SPIRAL_MAP_REALITY_MODE_V0.CASTLE);
    expect(next[SPIRAL_MAP_LAYER_V0.CASTLE]).toBe(true);
    expect(next[SPIRAL_MAP_LAYER_V0.EXPLORER]).toBe(false);
    expect(next.includeDormant).toBe(true);
    expect(readSpiralMapRealityModeV0(next)).toBe(SPIRAL_MAP_REALITY_MODE_V0.CASTLE);
  });

  it("applySpiralMapRealityModeV0 sets full world mesh flag", () => {
    const next = applySpiralMapRealityModeV0(SPIRAL_MAP_REALITY_MODE_V0.FULL_WORLD);
    expect(next.fullWorldMesh).toBe(true);
    expect(next[SPIRAL_MAP_LAYER_V0.EXPLORER]).toBe(true);
    expect(next[SPIRAL_MAP_LAYER_V0.CASTLE]).toBe(true);
    expect(next[SPIRAL_MAP_LAYER_V0.ECONOMY]).toBe(true);
    expect(readSpiralMapRealityModeV0(next)).toBe(SPIRAL_MAP_REALITY_MODE_V0.FULL_WORLD);
  });

  it("applySpiralMapRealityModeV0 dispatches reality and castle identity events", () => {
    const realityHandler = vi.fn();
    const castleHandler = vi.fn();
    window.addEventListener(SPIRAL_MAP_REALITY_MODE_EVENT_V0, realityHandler);
    window.addEventListener(CASTLE_IDENTITY_MODE_EVENT_V0, castleHandler);
    applySpiralMapRealityModeV0(SPIRAL_MAP_REALITY_MODE_V0.CASTLE);
    window.removeEventListener(SPIRAL_MAP_REALITY_MODE_EVENT_V0, realityHandler);
    window.removeEventListener(CASTLE_IDENTITY_MODE_EVENT_V0, castleHandler);
    expect(realityHandler).toHaveBeenCalled();
    expect(castleHandler).toHaveBeenCalled();
    expect(realityHandler.mock.calls[0][0].detail.mode).toBe(SPIRAL_MAP_REALITY_MODE_V0.CASTLE);
  });

  it("ensureSpiralMapRealityModeHydratedV0 persists explorer default when storage empty", () => {
    const state = ensureSpiralMapRealityModeHydratedV0();
    expect(state[SPIRAL_MAP_LAYER_V0.EXPLORER]).toBe(true);
    expect(localStorage.getItem("rhizoh.spiral_map_layer_filter.v0")).toBeTruthy();
    expect(readSpiralMapRealityModeV0()).toBe(SPIRAL_MAP_REALITY_MODE_V0.EXPLORER);
  });

  it("applySpiralMapRealityModeV0 replaces explorer preset when switching to castle", () => {
    applySpiralMapRealityModeV0(SPIRAL_MAP_REALITY_MODE_V0.EXPLORER);
    const next = applySpiralMapRealityModeV0(SPIRAL_MAP_REALITY_MODE_V0.CASTLE);
    expect(next.realityMode).toBe(SPIRAL_MAP_REALITY_MODE_V0.CASTLE);
    expect(next.explorer).toBe(false);
    expect(readSpiralMapRealityModeV0()).toBe(SPIRAL_MAP_REALITY_MODE_V0.CASTLE);
    expect(localStorage.getItem(SPIRAL_MAP_REALITY_MODE_LS_KEY_V0)).toBe(
      SPIRAL_MAP_REALITY_MODE_V0.CASTLE
    );
    expect(JSON.parse(localStorage.getItem("rhizoh.spiral_map_layer_filter.v0")).realityMode).toBe(
      SPIRAL_MAP_REALITY_MODE_V0.CASTLE
    );
  });

  it("ensureSpiralMapRealityModeHydratedV0 restores persisted castle after filter drift", () => {
    localStorage.setItem(SPIRAL_MAP_REALITY_MODE_LS_KEY_V0, SPIRAL_MAP_REALITY_MODE_V0.CASTLE);
    localStorage.setItem(
      "rhizoh.spiral_map_layer_filter.v0",
      JSON.stringify({
        explorer: true,
        castle: false,
        economy: false,
        seasonal: false,
        includeDormant: false,
        realityMode: SPIRAL_MAP_REALITY_MODE_V0.EXPLORER
      })
    );
    const state = ensureSpiralMapRealityModeHydratedV0();
    expect(readSpiralMapRealityModeV0(state)).toBe(SPIRAL_MAP_REALITY_MODE_V0.CASTLE);
    expect(state.castle).toBe(true);
    expect(state.explorer).toBe(false);
  });

  it("ensureSpiralMapRealityModeHydratedV0 repairs stale castle label with explorer layer flags", () => {
    localStorage.setItem(SPIRAL_MAP_REALITY_MODE_LS_KEY_V0, SPIRAL_MAP_REALITY_MODE_V0.CASTLE);
    localStorage.setItem(
      "rhizoh.spiral_map_layer_filter.v0",
      JSON.stringify({
        explorer: true,
        castle: false,
        economy: false,
        seasonal: false,
        includeDormant: false,
        realityMode: SPIRAL_MAP_REALITY_MODE_V0.CASTLE
      })
    );
    expect(readSpiralMapRealityModeV0()).toBe(SPIRAL_MAP_REALITY_MODE_V0.EXPLORER);
    const state = ensureSpiralMapRealityModeHydratedV0();
    expect(readSpiralMapRealityModeV0(state)).toBe(SPIRAL_MAP_REALITY_MODE_V0.CASTLE);
    expect(state.castle).toBe(true);
    expect(state.includeDormant).toBe(true);
  });

  it("ensureSpiralMapRealityModeHydratedV0 repairs empty object storage", () => {
    localStorage.setItem("rhizoh.spiral_map_layer_filter.v0", "{}");
    const state = ensureSpiralMapRealityModeHydratedV0();
    expect(state.realityMode).toBe(SPIRAL_MAP_REALITY_MODE_V0.EXPLORER);
    expect(JSON.parse(localStorage.getItem("rhizoh.spiral_map_layer_filter.v0")).explorer).toBe(true);
  });
});
