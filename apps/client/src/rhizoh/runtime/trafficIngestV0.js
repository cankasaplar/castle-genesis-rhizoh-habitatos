/**
 * TomTom Traffic Flow → normalized segment feed (v0).
 * @see docs/RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md — Real layer ingress
 */

import { isCastleDebugGranularFlagEnabled } from "./castleDebugGateV0.js";
import { readCastleNexusGeoV0, resolveWorldMapBootstrapGeoV0 } from "./worldMapBootstrapGeoV0.js";
import { resolveWorldMapCameraTargetV0 } from "./worldMapCameraGeoV0.js";

/**
 * @returns {boolean}
 */
export function isRealLayerTrafficIngressEnabledV0() {
  if (isCastleDebugGranularFlagEnabled("VITE_REAL_LAYER_TRAFFIC_INGRESS")) return true;
  return Boolean(getTomTomQueryEnvV0().key);
}

/** @returns {{ key: string, lat: number, lon: number }} */
export function getTomTomQueryEnvV0() {
  const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
  const key = String(env.VITE_TOMTOM_API_KEY || "").trim();
  const nexus = readCastleNexusGeoV0();
  const raw = nexus || resolveWorldMapBootstrapGeoV0();
  const cam = resolveWorldMapCameraTargetV0(raw);
  return Object.freeze({
    key,
    lat: cam.lat,
    lon: cam.lon
  });
}

/**
 * @typedef {'low'|'medium'|'high'|'closed'|'unknown'} TrafficLevelV0
 */

/**
 * @typedef {object} NormalizedTrafficFeedV0
 * @property {TrafficLevelV0} level
 * @property {number} intensity 0–1 congestion pressure
 * @property {number} currentSpeedKmh
 * @property {number} freeFlowSpeedKmh
 * @property {number} currentTravelTimeSec
 * @property {number} freeFlowTravelTimeSec
 * @property {number} timestamp
 * @property {number} confidence
 * @property {boolean} roadClosure
 */

/**
 * @param {unknown} data
 * @returns {NormalizedTrafficFeedV0 | null}
 */
export function normalizeTomTomFlowSegmentJsonV0(data) {
  if (!data || typeof data !== "object") return null;
  const seg =
    /** @type {Record<string, unknown>} */ (data).flowSegmentData &&
    typeof /** @type {Record<string, unknown>} */ (data).flowSegmentData === "object"
      ? /** @type {Record<string, unknown>} */ (/** @type {Record<string, unknown>} */ (data).flowSegmentData)
      : null;
  if (!seg) return null;

  const freeFlowSpeed = Number(seg.freeFlowSpeed);
  const currentSpeed = Number(seg.currentSpeed);
  const freeFlowTravelTime = Number(seg.freeFlowTravelTime);
  const currentTravelTime = Number(seg.currentTravelTime);
  const confidence = Number(seg.confidence);
  const roadClosure = Boolean(seg.roadClosure);

  if (!Number.isFinite(currentSpeed) || !Number.isFinite(freeFlowSpeed) || freeFlowSpeed <= 0) {
    return null;
  }

  const speedRatio = Math.min(1.2, Math.max(0, currentSpeed / freeFlowSpeed));
  const travelRatio =
    Number.isFinite(freeFlowTravelTime) && freeFlowTravelTime > 0 && Number.isFinite(currentTravelTime)
      ? currentTravelTime / freeFlowTravelTime
      : 1;

  let level = /** @type {TrafficLevelV0} */ ("low");
  if (roadClosure) level = "closed";
  else if (speedRatio < 0.55 || travelRatio > 1.45) level = "high";
  else if (speedRatio < 0.78 || travelRatio > 1.15) level = "medium";

  const intensity = Math.min(1, Math.max(0, 1 - speedRatio + Math.max(0, travelRatio - 1) * 0.35));

  return Object.freeze({
    level,
    intensity,
    currentSpeedKmh: currentSpeed,
    freeFlowSpeedKmh: freeFlowSpeed,
    currentTravelTimeSec: Number.isFinite(currentTravelTime) ? currentTravelTime : 0,
    freeFlowTravelTimeSec: Number.isFinite(freeFlowTravelTime) ? freeFlowTravelTime : 0,
    timestamp: Date.now(),
    confidence: Number.isFinite(confidence) ? confidence : 0,
    roadClosure
  });
}

/**
 * @param {{ signal?: AbortSignal, lat?: number, lon?: number }} [opts]
 * @returns {Promise<NormalizedTrafficFeedV0 | null>}
 */
export async function fetchTomTomTrafficNormalizedV0(opts = {}) {
  if (!isRealLayerTrafficIngressEnabledV0()) return null;
  const { key, lat, lon } = getTomTomQueryEnvV0();
  if (!key) return null;

  const la = Number.isFinite(opts.lat) ? Number(opts.lat) : lat;
  const lo = Number.isFinite(opts.lon) ? Number(opts.lon) : lon;
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return null;

  const url =
    `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative/15/json` +
    `?point=${encodeURIComponent(`${la},${lo}`)}` +
    `&unit=KMPH&thickness=10&openLr=false&key=${encodeURIComponent(key)}`;

  const res = await fetch(url, { signal: opts.signal });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return normalizeTomTomFlowSegmentJsonV0(json);
}
