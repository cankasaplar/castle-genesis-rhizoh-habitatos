/**
 * Cesium imagery profiles — REAL_MAP sub-layers (streets · satellite · terrain · 3D city).
 */

import {
  normalizeRhizohWorldMapToolIdV0,
  readRhizohWorldMapToolV0,
  resolveRhizohWorldMapFlyTargetV0
} from "./rhizohWorldMapToolV0.js";
import { resolveWorldMapBootstrapGeoV0 } from "./worldMapBootstrapGeoV0.js";
import { resolveWorldMapCameraTargetV0 } from "./worldMapCameraGeoV0.js";

export const RHIZOH_CESIUM_IMAGERY_PROFILES_V0 = Object.freeze([
  "streets",
  "satellite",
  "city_3d",
  "terrain",
  "dark"
]);

/**
 * @param {string} toolId
 * @returns {'streets'|'satellite'|'city_3d'|'terrain'}
 */
export function resolveCesiumImageryProfileForMapToolV0(toolId) {
  const id = normalizeRhizohWorldMapToolIdV0(toolId);
  if (id === "globe") return "satellite";
  if (id === "city_map" || id === "anchor_map") return "city_3d";
  if (id === "satellite") return "satellite";
  if (id === "terrain") return "terrain";
  if (id === "streets") return "dark";
  return "streets";
}

/**
 * @param {string} profile
 */
function tryApplyImageryProfileV0(profile) {
  const c = typeof window !== "undefined" ? window.__CASTLE_CESIUM__ : null;
  if (c?.ready && typeof c.setImageryProfile === "function") {
    void c.setImageryProfile(profile);
    return true;
  }
  return false;
}

/**
 * Map-tool aware camera anchor — avoids 5200m "space view" on city/street tools.
 * @param {string} [toolId]
 */
export function resolveCesiumMapCameraAnchorV0(toolId = readRhizohWorldMapToolV0()) {
  const id = normalizeRhizohWorldMapToolIdV0(toolId);
  const target = resolveRhizohWorldMapFlyTargetV0(id);
  if (!target) {
    const boot = resolveWorldMapCameraTargetV0(resolveWorldMapBootstrapGeoV0());
    return Object.freeze({
      lon: boot.lon,
      lat: boot.lat,
      height: 780,
      headingDeg: 0,
      pitchDeg: -32
    });
  }
  const cam = resolveWorldMapCameraTargetV0(target);
  const defaultHeight =
    id === "city_map" ? 780 : id === "streets" ? 1200 : id === "satellite" ? 2800 : 1180;
  const height = Math.max(350, Math.min(14_000, Number(target.alt) || defaultHeight));
  const pitchDeg =
    id === "city_map" ? -32 : id === "streets" ? -35 : id === "satellite" ? -40 : -38;
  return Object.freeze({
    lon: cam.lon,
    lat: cam.lat,
    height,
    headingDeg: id === "city_map" ? 12 : 22,
    pitchDeg
  });
}

/**
 * Soft zoom ceiling — free camera; only blocks extreme space drift on city tools.
 * @param {string} [toolId]
 */
export function resolveCesiumMapZoomMaxHeightV0(toolId = readRhizohWorldMapToolV0()) {
  const id = normalizeRhizohWorldMapToolIdV0(toolId);
  if (id === "globe") return 18_500_000;
  if (id === "city_map" || id === "streets") return 85_000;
  if (id === "satellite") return 120_000;
  if (id === "terrain") return 140_000;
  return 95_000;
}

export function applyCesiumImageryForMapToolV0(toolId, opts = {}) {
  const profile = resolveCesiumImageryProfileForMapToolV0(toolId);
  if (typeof window === "undefined") return;
  const maxAttempts = opts.maxAttempts ?? 48;
  let attempts = 0;
  const tick = () => {
    if (tryApplyImageryProfileV0(profile)) return;
    attempts += 1;
    if (attempts < maxAttempts) {
      window.setTimeout(tick, 250);
    }
  };
  window.setTimeout(tick, 80);
}
