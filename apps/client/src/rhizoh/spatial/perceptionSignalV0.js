/**
 * B2 — Perception signal (v0), **daraltılmış kilit: yalnızca DEBUG + gözlemlenebilirlik**.
 *
 * - **Runtime karar mekanizmasına girmez** (fog / aura / worldPresence smoothing veya ingest bu dosyayı kullanmamalı).
 * - **Kural:** Cesium → `perceptionSignal` okunabilir; **Cesium → worldPresenceState / snapshot truth ASLA yazılmaz.**
 * - Tüketim: `perceptionDebugStoreV0` + isteğe bağlı UI overlay (`VITE_RHIZOH_PERCEPTION_DEBUG=1`), telemetri / konsol — “bilinç motoru” değil.
 *
 * Sinyaller (0–1):
 * - `cameraDriftFromOrigin` — kalibrasyon kökünden kamera uzaklığı (mesafe normalize).
 * - `anchorFieldDistortion` — anchor epistemik profillerine göre sahadaki “divergence ağırlıklı” basınç.
 * - `fogMismatchDelta` — beklenen (projection) sis ile gözlenen sahne `fog.density` arasındaki sapma (log-oran).
 *
 * @see cesiumEpistemicRuntimeStoreV0.js
 * @see geographicAnchorsV0.js
 * @see docs/RHIZOH_PROJECTION_DISCIPLINE_V0.md
 */

import { getCesiumEpistemicRuntimeSnapshotV0 } from "./cesiumEpistemicRuntimeStoreV0.js";
import { resolveAnchorFieldDistortion01V0 } from "./spatialAnchorResolverV0.js";
import { haversineDistanceKmV0 } from "./spatialHaversineV0.js";

export { haversineDistanceKmV0 };

export const PERCEPTION_SIGNAL_SCHEMA_V0 = "perceptionSignal.v0";

/**
 * @typedef {{
 *   cameraLon: number,
 *   cameraLat: number,
 *   cameraHeightM: number,
 *   fogDensity: number | null
 * }} CesiumEpistemicObservationV0
 */

/**
 * @typedef {{
 *   calibrationOrigin?: { lon: number, lat: number } | null,
 *   expectedLocalFog?: number
 * }} PerceptionSignalContextV0
 */

/**
 * @typedef {{
 *   schema: string,
 *   cameraDriftFromOrigin: number,
 *   anchorFieldDistortion: number,
 *   fogMismatchDelta: number
 * }} PerceptionSignalV0
 */

/**
 * Salt okunur: Viewer + Cesium API ile anlık gözlem (yan etki: yok).
 * @param {import("cesium").Viewer | null | undefined} viewer
 * @param {typeof import("cesium")} Cesium
 * @returns {CesiumEpistemicObservationV0 | null}
 */
export function readCesiumEpistemicObservationV0(viewer, Cesium) {
  if (!viewer || !Cesium) return null;
  if (typeof viewer.isDestroyed === "function" && viewer.isDestroyed()) return null;
  try {
    const cart = Cesium.Cartographic.fromCartesian(viewer.camera.positionWC);
    if (!cart) return null;
    const cameraLon = Cesium.Math.toDegrees(cart.longitude);
    const cameraLat = Cesium.Math.toDegrees(cart.latitude);
    const cameraHeightM = cart.height;
    let fogDensity = null;
    try {
      const d = viewer.scene?.fog?.density;
      if (typeof d === "number" && Number.isFinite(d)) fogDensity = d;
    } catch {
      /* noop */
    }
    return { cameraLon, cameraLat, cameraHeightM, fogDensity };
  } catch {
    return null;
  }
}

/**
 * @param {CesiumEpistemicObservationV0 | null} observation
 * @param {PerceptionSignalContextV0} [context]
 * @returns {PerceptionSignalV0}
 */
export function derivePerceptionSignalV0(observation, context = {}) {
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  const snap = getCesiumEpistemicRuntimeSnapshotV0();
  const origin =
    context.calibrationOrigin && typeof context.calibrationOrigin === "object"
      ? context.calibrationOrigin
      : snap.origin && snap.installed
        ? { lon: snap.origin.lon, lat: snap.origin.lat }
        : null;

  const expectedLocalFog =
    typeof context.expectedLocalFog === "number" && Number.isFinite(context.expectedLocalFog)
      ? clamp01(context.expectedLocalFog)
      : 0.22;

  if (!observation || !origin || !Number.isFinite(observation.cameraLat) || !Number.isFinite(observation.cameraLon)) {
    return {
      schema: PERCEPTION_SIGNAL_SCHEMA_V0,
      cameraDriftFromOrigin: 0,
      anchorFieldDistortion: 0,
      fogMismatchDelta: 0
    };
  }

  const dKm = haversineDistanceKmV0(origin.lat, origin.lon, observation.cameraLat, observation.cameraLon);
  const cameraDriftFromOrigin = clamp01(dKm / 42);

  const anchorFieldDistortion = resolveAnchorFieldDistortion01V0(observation.cameraLat, observation.cameraLon);

  let fogMismatchDelta = 0;
  if (observation.fogDensity != null && Number.isFinite(observation.fogDensity) && observation.fogDensity > 0) {
    const expectedPhys = 1e-5 + expectedLocalFog * 2.1e-4;
    const ratio = observation.fogDensity / expectedPhys;
    fogMismatchDelta = clamp01(Math.abs(Math.log(ratio)) / 2.8);
  }

  return {
    schema: PERCEPTION_SIGNAL_SCHEMA_V0,
    cameraDriftFromOrigin,
    anchorFieldDistortion,
    fogMismatchDelta
  };
}

/**
 * Tek adımda: Cesium gözlem + sinyal (yine **yazma yok**).
 * @param {import("cesium").Viewer | null | undefined} viewer
 * @param {typeof import("cesium")} Cesium
 * @param {PerceptionSignalContextV0} [context]
 * @returns {PerceptionSignalV0}
 */
export function observePerceptionSignalFromCesiumV0(viewer, Cesium, context = {}) {
  const obs = readCesiumEpistemicObservationV0(viewer, Cesium);
  return derivePerceptionSignalV0(obs, context);
}
