/**
 * B1 — Cesium epistemic bootstrap (v0): anchor → sahne bağlama sözleşmesi (ince katman).
 *
 * - Sarıyer kökü = **world-layer kalibrasyon / ilk kamera** (Castle HOME_BASE kimlik anchor’ı değil).
 *   Kullanıcı canonical home → `primaryAnchorResolverV0` + profil `homeAnchor` (`homeAnchorAuthorityV0.js`).
 * - `deriveAnchorAtmosphereProjectionV0` → fog / globe ışığı (CesiumSpatialAdapter).
 * - Tek root entity (pin); mesh / tile / postprocess pipeline yok.
 *
 * Cesium **truth üretmez**; yalnızca projection substrate. Kamera epistemik anlam taşımaz.
 *
 * @see geographicAnchorsV0.js
 * @see cesiumSpatialAdapterV0.js
 * @see docs/RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md
 */

import { getRhizohCalibrationRootAnchorV0 } from "./geographicAnchorsV0.js";
import { deriveAnchorAtmosphereProjectionV0 } from "./deriveAnchorAtmosphereProjectionV0.js";
import { anchorProjectionToCesiumAtmosphereParamsV0 } from "./cesiumSpatialAdapterV0.js";
import { buildWorldPresenceStateV0 } from "../runtime/worldPresenceRuntimeV0.js";
import { getCachedWeatherAtmosphereFeedV0 } from "../runtime/worldPresenceStoreV0.js";
import { setCesiumEpistemicRuntimeInstallV0, clearCesiumEpistemicRuntimeInstallV0 } from "./cesiumEpistemicRuntimeStoreV0.js";

/** @type {string} */
export const RHIZOH_CALIBRATION_ROOT_ENTITY_ID = "rhizoh_calibration_root_v0";

/** World bootstrap: ilk kamera kökü kalibrasyon (HOME_BASE identity değil). */
export const RHIZOH_EPISTEMIC_CAMERA_MODE_V0 = "calibration_root_locked";

/**
 * Bootstrap için mevcut hava önbelleği ile world presence (snapshot truth değil).
 */
export function buildRhizohEpistemicWorldPresenceForBootstrapV0() {
  const feed = getCachedWeatherAtmosphereFeedV0();
  return buildWorldPresenceStateV0({ weatherFeed: feed });
}

/**
 * @param {typeof import("cesium")} Cesium
 * @returns {{ destination: import("cesium").Cartesian3, orientation: { heading: number, pitch: number, roll: number } }}
 */
export function getRhizohCalibrationRootInitialSetViewV0(Cesium) {
  const root = getRhizohCalibrationRootAnchorV0();
  const heightM = 4200;
  return {
    destination: Cesium.Cartesian3.fromDegrees(root.lon, root.lat, heightM),
    orientation: {
      heading: Cesium.Math.toRadians(22),
      pitch: Cesium.Math.toRadians(-40),
      roll: 0
    }
  };
}

/**
 * @param {import("cesium").Viewer} viewer
 * @param {typeof import("cesium")} Cesium
 * @param {unknown} worldPresenceState
 * @returns {() => void} teardown
 */
export function installRhizohEpistemicCesiumBootstrapV0(viewer, Cesium, worldPresenceState) {
  if (!viewer) {
    return () => {};
  }
  if (typeof viewer.isDestroyed === "function" && viewer.isDestroyed()) {
    return () => {};
  }

  const root = getRhizohCalibrationRootAnchorV0();
  const proj = deriveAnchorAtmosphereProjectionV0(root, worldPresenceState);
  const params = anchorProjectionToCesiumAtmosphereParamsV0(proj);

  const scene = viewer.scene;
  /** @type {{ enabled?: boolean, density?: number, minimumBrightness?: number } | null} */
  let savedFog = null;
  /** @type {{ atmosphereLightIntensity?: number } | null} */
  let savedGlobe = null;

  try {
    if (scene && scene.fog) {
      const f = scene.fog;
      savedFog = {
        enabled: f.enabled,
        density: f.density,
        minimumBrightness: f.minimumBrightness
      };
      f.enabled = true;
      f.density = params.fogDensity;
      if (Object.prototype.hasOwnProperty.call(f, "minimumBrightness")) {
        f.minimumBrightness = params.fogMinimumBrightness;
      }
    }
  } catch {
    /* noop */
  }

  try {
    if (scene && scene.globe && Object.prototype.hasOwnProperty.call(scene.globe, "atmosphereLightIntensity")) {
      savedGlobe = { atmosphereLightIntensity: scene.globe.atmosphereLightIntensity };
      scene.globe.atmosphereLightIntensity = params.atmosphereLightIntensity;
    }
  } catch {
    /* noop */
  }

  /** @type {import("cesium").Entity | null} */
  let entity = null;
  try {
    const existing = viewer.entities.getById(RHIZOH_CALIBRATION_ROOT_ENTITY_ID);
    if (existing) {
      viewer.entities.remove(existing);
    }
    entity = viewer.entities.add({
      id: RHIZOH_CALIBRATION_ROOT_ENTITY_ID,
      name: "Rhizoh calibration root (Sarıyer)",
      position: Cesium.Cartesian3.fromDegrees(root.lon, root.lat, 95),
      point: {
        pixelSize: 11,
        color: Cesium.Color.fromCssColorString("#22d3ee").withAlpha(0.9),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1.5
      }
    });
  } catch {
    /* noop */
  }

  setCesiumEpistemicRuntimeInstallV0(
    {
      anchorId: root.id,
      lon: root.lon,
      lat: root.lat,
      districtLabel: root.districtLabel
    },
    RHIZOH_EPISTEMIC_CAMERA_MODE_V0
  );

  return function teardownRhizohEpistemicCesiumBootstrapV0() {
    try {
      if (entity && viewer && !viewer.isDestroyed?.()) {
        viewer.entities.remove(entity);
      }
    } catch {
      /* noop */
    }
    try {
      if (savedFog && scene && scene.fog) {
        const f = scene.fog;
        if (savedFog.enabled !== undefined) f.enabled = savedFog.enabled;
        if (savedFog.density !== undefined) f.density = savedFog.density;
        if (savedFog.minimumBrightness !== undefined && Object.prototype.hasOwnProperty.call(f, "minimumBrightness")) {
          f.minimumBrightness = savedFog.minimumBrightness;
        }
      }
    } catch {
      /* noop */
    }
    try {
      if (savedGlobe && scene && scene.globe && savedGlobe.atmosphereLightIntensity !== undefined) {
        scene.globe.atmosphereLightIntensity = savedGlobe.atmosphereLightIntensity;
      }
    } catch {
      /* noop */
    }
    clearCesiumEpistemicRuntimeInstallV0();
  };
}
