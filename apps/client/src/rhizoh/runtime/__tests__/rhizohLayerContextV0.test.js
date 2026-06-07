import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetRhizohWorldSystemModeForTestV0,
  RHIZOH_WORLD_SYSTEM_MODE_V0,
  writeRhizohWorldSystemModeV0
} from "../rhizohWorldSystemModeV0.js";
import {
  gateRhizohSpatialCommandV0,
  isRhizohContextWheelVisibleV0,
  isRhizohMapWheelVisibleV0,
  isRhizohSocialLayerActiveV0,
  isRhizohSpatialMapEngineActiveV0,
  isRhizohSystemModeLayerActiveV0,
  resolveRhizohCesiumLayerActiveV0,
  resolveRhizohLayerModeV0,
  RHIZOH_LAYER_MODE_V0
} from "../rhizohLayerContextV0.js";
import { writeRhizohChromePanelsOpenV0 } from "../rhizohProductChromePanelsV0.js";

describe("rhizohLayerContextV0", () => {
  beforeEach(() => {
    __resetRhizohWorldSystemModeForTestV0();
    writeRhizohChromePanelsOpenV0({
      world: false,
      hall: false,
      greenroom: false,
      broadcast: false,
      studio: false,
      profile: false
    });
  });

  afterEach(() => {
    __resetRhizohWorldSystemModeForTestV0();
  });

  it("defaults to t0_live when world drawer closed — no wheel", () => {
    expect(resolveRhizohLayerModeV0()).toBe(RHIZOH_LAYER_MODE_V0.T0_LIVE);
    expect(isRhizohContextWheelVisibleV0()).toBe(false);
    expect(isRhizohMapWheelVisibleV0()).toBe(false);
    expect(gateRhizohSpatialCommandV0("fly_to").allowed).toBe(false);
  });

  it("maps_space when on /world/space", () => {
    expect(resolveRhizohLayerModeV0({ pathname: "/world/space" })).toBe(RHIZOH_LAYER_MODE_V0.MAPS_SPACE);
    expect(isRhizohContextWheelVisibleV0({ pathname: "/world/space" })).toBe(true);
    expect(isRhizohMapWheelVisibleV0({ pathname: "/world/space" })).toBe(true);
    expect(gateRhizohSpatialCommandV0("fly_to", { pathname: "/world/space" }).allowed).toBe(true);
    expect(isRhizohSpatialMapEngineActiveV0({ pathname: "/world/space", mapSurfaceActive: true })).toBe(true);
  });

  it("maps_social on /world/social — wheel visible, map blocked", () => {
    expect(resolveRhizohLayerModeV0({ pathname: "/world/social" })).toBe(RHIZOH_LAYER_MODE_V0.MAPS_SOCIAL);
    expect(isRhizohSocialLayerActiveV0({ pathname: "/world/social" })).toBe(true);
    expect(isRhizohContextWheelVisibleV0({ pathname: "/world/social" })).toBe(true);
    expect(isRhizohMapWheelVisibleV0({ pathname: "/world/social" })).toBe(false);
    expect(gateRhizohSpatialCommandV0("fly_to", { pathname: "/world/social" }).allowed).toBe(false);
  });

  it("mode_robotics on /world/modes", () => {
    writeRhizohWorldSystemModeV0(RHIZOH_WORLD_SYSTEM_MODE_V0.ROBOTICS);
    expect(resolveRhizohLayerModeV0({ pathname: "/world/modes", worldSystemMode: RHIZOH_WORLD_SYSTEM_MODE_V0.ROBOTICS })).toBe(
      RHIZOH_LAYER_MODE_V0.MODE_ROBOTICS
    );
    expect(isRhizohSystemModeLayerActiveV0({ pathname: "/world/modes", worldSystemMode: RHIZOH_WORLD_SYSTEM_MODE_V0.ROBOTICS })).toBe(true);
    expect(isRhizohContextWheelVisibleV0({ pathname: "/world/modes" })).toBe(true);
    expect(gateRhizohSpatialCommandV0("fly_to", { pathname: "/world/modes" }).allowed).toBe(false);
  });

  it("mode_spiral when spiral selected on modes tab", () => {
    writeRhizohWorldSystemModeV0(RHIZOH_WORLD_SYSTEM_MODE_V0.SPIRAL);
    expect(
      resolveRhizohLayerModeV0({ pathname: "/world/modes", worldSystemMode: RHIZOH_WORLD_SYSTEM_MODE_V0.SPIRAL })
    ).toBe(RHIZOH_LAYER_MODE_V0.MODE_SPIRAL);
  });

  it("cesium layer only on world space with REAL_MAP and non-globe tool", () => {
    expect(
      resolveRhizohCesiumLayerActiveV0({
        mapSurfaceActive: true,
        realityMode: "REAL_MAP",
        pathname: "/world/space",
        mapTool: "city_map"
      })
    ).toBe(true);
    expect(
      resolveRhizohCesiumLayerActiveV0({
        mapSurfaceActive: true,
        realityMode: "REAL_MAP",
        pathname: "/world/space",
        mapTool: "globe"
      })
    ).toBe(false);
    expect(
      resolveRhizohCesiumLayerActiveV0({
        mapSurfaceActive: true,
        realityMode: "REAL_MAP",
        pathname: "/world/social",
        mapTool: "city_map"
      })
    ).toBe(false);
    expect(
      resolveRhizohCesiumLayerActiveV0({
        mapSurfaceActive: true,
        realityMode: "REAL_MAP",
        pathname: "/",
        mapTool: "city_map",
        openProductDrawerId: "profile"
      })
    ).toBe(false);
    expect(
      resolveRhizohCesiumLayerActiveV0({
        mapSurfaceActive: true,
        realityMode: "REAL_MAP",
        pathname: "/",
        mapTool: "city_map",
        detailDrawerOpen: true
      })
    ).toBe(false);
  });
});
