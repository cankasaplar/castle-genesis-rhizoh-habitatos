import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  hasUserLocalWorldGeoV0,
  resolveWorldMapInitialCameraV0,
  WORLD_GLOBAL_ORBIT_CAMERA_V0
} from "../worldMapViewBootstrapV0.js";

describe("worldMapViewBootstrapV0", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.__CASTLE_NEXUS_GEO__ = undefined;
      localStorage.removeItem("rhizoh.local.ghost_castle.v0");
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined") {
      window.__CASTLE_NEXUS_GEO__ = undefined;
      localStorage.removeItem("rhizoh.local.ghost_castle.v0");
    }
  });

  it("no geo user starts at global orbit", () => {
    expect(hasUserLocalWorldGeoV0()).toBe(false);
    const cam = resolveWorldMapInitialCameraV0("city_map");
    expect(cam.height).toBe(WORLD_GLOBAL_ORBIT_CAMERA_V0.height);
    expect(cam.pitchDeg).toBe(WORLD_GLOBAL_ORBIT_CAMERA_V0.pitchDeg);
  });

  it("nexus geo user gets local cinematic camera", () => {
    window.__CASTLE_NEXUS_GEO__ = { lat: 41.3851, lon: 2.1734, source: "test" };
    expect(hasUserLocalWorldGeoV0()).toBe(true);
    const cam = resolveWorldMapInitialCameraV0("city_map");
    expect(cam.height).toBe(780);
    expect(cam.pitchDeg).toBe(-32);
    expect(cam.lat).toBeCloseTo(41.3851, 3);
  });
});
