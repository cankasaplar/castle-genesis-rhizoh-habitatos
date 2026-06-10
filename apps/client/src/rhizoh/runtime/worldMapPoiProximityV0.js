/**
 * Epistemic POI proximity gate — only render when camera is local (GPU guard).
 */

import { ISTANBUL_GEO } from "../../castleFlight/geo.js";

const MAX_POI_CAMERA_HEIGHT_M_V0 = 12_000;
const MAX_POI_RADIUS_KM_V0 = 85;

function haversineKmV0(lat1, lon1, lat2, lon2) {
  const r = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * @param {import("cesium").Viewer} viewer
 * @param {typeof import("cesium")} Cesium
 * @returns {{ visible: boolean, cameraLat: number, cameraLon: number, cameraHeightM: number }}
 */
export function resolveEpistemicPoiVisibilityV0(viewer, Cesium) {
  if (!viewer?.camera) {
    return Object.freeze({ visible: false, cameraLat: 0, cameraLon: 0, cameraHeightM: Infinity });
  }
  try {
    const carto = Cesium.Cartographic.fromCartesian(viewer.camera.positionWC);
    const cameraLat = Cesium.Math.toDegrees(carto.latitude);
    const cameraLon = Cesium.Math.toDegrees(carto.longitude);
    const cameraHeightM = carto.height;
    if (!Number.isFinite(cameraHeightM) || cameraHeightM > MAX_POI_CAMERA_HEIGHT_M_V0) {
      return Object.freeze({ visible: false, cameraLat, cameraLon, cameraHeightM });
    }
    const inIstanbul =
      cameraLat >= ISTANBUL_GEO.latMin &&
      cameraLat <= ISTANBUL_GEO.latMax &&
      cameraLon >= ISTANBUL_GEO.lonMin &&
      cameraLon <= ISTANBUL_GEO.lonMax;
    if (!inIstanbul) {
      return Object.freeze({ visible: false, cameraLat, cameraLon, cameraHeightM });
    }
    const centerLat = (ISTANBUL_GEO.latMin + ISTANBUL_GEO.latMax) / 2;
    const centerLon = (ISTANBUL_GEO.lonMin + ISTANBUL_GEO.lonMax) / 2;
    const distKm = haversineKmV0(cameraLat, cameraLon, centerLat, centerLon);
    return Object.freeze({
      visible: distKm <= MAX_POI_RADIUS_KM_V0,
      cameraLat,
      cameraLon,
      cameraHeightM
    });
  } catch {
    return Object.freeze({ visible: false, cameraLat: 0, cameraLon: 0, cameraHeightM: Infinity });
  }
}
