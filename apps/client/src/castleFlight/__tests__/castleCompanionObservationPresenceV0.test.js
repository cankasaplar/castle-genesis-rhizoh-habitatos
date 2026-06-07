import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  resolveCompanionObservationPresenceV0,
  readCompanionObservationCartographicV0
} from "../castleCompanionObservationPresenceV0.js";
import {
  spawnObservationCompanionV0,
  readCastlePweV0,
  patchCastlePwePresenceV0
} from "../castlePersistentWorldEntityV0.js";

describe("castleCompanionObservationPresenceV0", () => {
  beforeEach(() => {
    window.__CASTLE_CESIUM__ = {
      ready: true,
      commandReady: true,
      getCameraGeo: () => ({ lat: 41.02, lon: 28.98, height: 200 })
    };
    spawnObservationCompanionV0("observer-1");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.__CASTLE_CESIUM__;
  });

  it("marks observable when camera and map active", () => {
    const pres = resolveCompanionObservationPresenceV0({ mapSurfaceActive: true });
    expect(pres.observable).toBe(true);
    expect(pres.mode).toBe("camera");
    expect(pres.camera?.lat).toBeCloseTo(41.02, 2);
  });

  it("dormant when map surface inactive", () => {
    const pres = resolveCompanionObservationPresenceV0({ mapSurfaceActive: false });
    expect(pres.observable).toBe(false);
    expect(pres.dormancy).toBe("dormant");
  });

  it("prefers camera cartographic over map anchor", () => {
    expect(readCastlePweV0()?.castleLink?.bound).toBe(false);
    patchCastlePwePresenceV0({
      observable: true,
      cameraOpen: true,
      dormancy: "active",
      camera: { lat: 40.5, lon: 29.1, heightM: 150, atMs: Date.now() }
    });
    const carto = readCompanionObservationCartographicV0();
    expect(carto?.source).toBe("companion_camera_frustum");
    expect(carto?.lat).toBeCloseTo(40.5, 2);
  });
});
