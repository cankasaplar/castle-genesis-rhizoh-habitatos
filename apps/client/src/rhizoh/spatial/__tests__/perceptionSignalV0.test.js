import { describe, it, expect, beforeEach } from "vitest";
import { resetCesiumEpistemicRuntimeStoreForTestsV0 } from "../cesiumEpistemicRuntimeStoreV0.js";
import {
  haversineDistanceKmV0,
  derivePerceptionSignalV0,
  readCesiumEpistemicObservationV0,
  PERCEPTION_SIGNAL_SCHEMA_V0
} from "../perceptionSignalV0.js";

describe("perceptionSignalV0", () => {
  beforeEach(() => {
    resetCesiumEpistemicRuntimeStoreForTestsV0();
  });

  it("haversineDistanceKmV0 is symmetric", () => {
    const a = haversineDistanceKmV0(41, 29, 40.99, 29.03);
    const b = haversineDistanceKmV0(40.99, 29.03, 41, 29);
    expect(a).toBeCloseTo(b, 5);
    expect(a).toBeGreaterThan(0);
  });

  it("derivePerceptionSignalV0 returns zeros without observation", () => {
    const s = derivePerceptionSignalV0(null, {
      calibrationOrigin: { lon: 29, lat: 41 },
      expectedLocalFog: 0.3
    });
    expect(s.schema).toBe(PERCEPTION_SIGNAL_SCHEMA_V0);
    expect(s.cameraDriftFromOrigin).toBe(0);
  });

  it("cameraDriftFromOrigin increases with distance from origin", () => {
    const origin = { lon: 29.0567, lat: 41.1169 };
    const near = derivePerceptionSignalV0(
      { cameraLon: 29.06, cameraLat: 41.12, cameraHeightM: 1000, fogDensity: null },
      { calibrationOrigin: origin, expectedLocalFog: 0.2 }
    );
    const far = derivePerceptionSignalV0(
      { cameraLon: 28.9, cameraLat: 41.0, cameraHeightM: 1000, fogDensity: null },
      { calibrationOrigin: origin, expectedLocalFog: 0.2 }
    );
    expect(far.cameraDriftFromOrigin).toBeGreaterThan(near.cameraDriftFromOrigin);
  });

  it("readCesiumEpistemicObservationV0 reads camera and fog", () => {
    const Cesium = {
      Cartographic: {
        fromCartesian: () => ({
          longitude: 0.5,
          latitude: 0.7,
          height: 900
        })
      },
      Math: {
        toDegrees: (r) => (r * 180) / Math.PI
      }
    };
    const viewer = {
      isDestroyed: () => false,
      camera: { positionWC: {} },
      scene: { fog: { density: 2.5e-5 } }
    };
    const o = readCesiumEpistemicObservationV0(/** @type {any} */ (viewer), Cesium);
    expect(o?.fogDensity).toBe(2.5e-5);
    expect(o?.cameraHeightM).toBe(900);
  });
});
