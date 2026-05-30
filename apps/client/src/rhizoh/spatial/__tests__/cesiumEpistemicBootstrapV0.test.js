import { describe, it, expect, beforeEach } from "vitest";
import { resetWorldPresenceWeatherCacheForTestsV0 } from "../../runtime/worldPresenceStoreV0.js";
import { resetCesiumEpistemicRuntimeStoreForTestsV0, getCesiumEpistemicRuntimeSnapshotV0 } from "../cesiumEpistemicRuntimeStoreV0.js";import {
  installRhizohEpistemicCesiumBootstrapV0,
  RHIZOH_CALIBRATION_ROOT_ENTITY_ID,
  buildRhizohEpistemicWorldPresenceForBootstrapV0
} from "../cesiumEpistemicBootstrapV0.js";

describe("cesiumEpistemicBootstrapV0", () => {
  beforeEach(() => {
    resetWorldPresenceWeatherCacheForTestsV0();
    resetCesiumEpistemicRuntimeStoreForTestsV0();
  });

  it("install applies fog and entity then teardown restores", () => {
    const fog = { enabled: false, density: 1e-6, minimumBrightness: 0.5 };
    const globe = { atmosphereLightIntensity: 0.99 };
    const entities = {
      _list: /** @type {any[]} */ ([]),
      getById(id) {
        return this._list.find((e) => e.id === id);
      },
      add(spec) {
        const e = { ...spec };
        this._list.push(e);
        return e;
      },
      remove(e) {
        this._list = this._list.filter((x) => x !== e);
      }
    };
    const viewer = {
      isDestroyed: () => false,
      scene: { fog, globe },
      entities
    };
    const Cesium = {
      Cartesian3: { fromDegrees: (lon, lat, h) => ({ lon, lat, h }) },
      Color: {
        BLACK: {},
        fromCssColorString: () => ({ withAlpha: () => ({}) })
      },
      Math: { toRadians: (d) => (d * Math.PI) / 180 }
    };

    const state = buildRhizohEpistemicWorldPresenceForBootstrapV0();
    const teardown = installRhizohEpistemicCesiumBootstrapV0(/** @type {any} */ (viewer), Cesium, state);

    expect(getCesiumEpistemicRuntimeSnapshotV0().installed).toBe(true);
    expect(fog.enabled).toBe(true);
    expect(fog.density).toBeGreaterThan(1e-6);
    expect(entities.getById(RHIZOH_CALIBRATION_ROOT_ENTITY_ID)).toBeTruthy();

    teardown();

    expect(getCesiumEpistemicRuntimeSnapshotV0().installed).toBe(false);
    expect(fog.enabled).toBe(false);
    expect(fog.density).toBe(1e-6);
    expect(entities.getById(RHIZOH_CALIBRATION_ROOT_ENTITY_ID)).toBeUndefined();
  });
});
