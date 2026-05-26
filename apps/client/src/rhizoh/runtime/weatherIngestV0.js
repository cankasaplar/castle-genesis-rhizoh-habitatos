/**
 * OpenWeather → normalized atmospheric feed (v0).
 *
 * Yalnızca düz sayısal yüzey; semantic interpretation `worldPresenceRuntimeV0` içinde kalır.
 * @see docs/RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md (STEP B.1)
 * @see docs/RHIZOH_GO_LIVE_ACTIVATION_PROTOCOL_V1.md §1 — Real layer ingress
 */

import { isCastleDebugGranularFlagEnabled } from "./castleDebugGateV0.js";

/**
 * @returns {boolean}
 */
export function isRealLayerWeatherIngressEnabledV0() {
  if (isCastleDebugGranularFlagEnabled("VITE_REAL_LAYER_WEATHER_INGRESS")) return true;
  return Boolean(getOpenWeatherQueryEnvV0().key);
}

/**
 * @typedef {object} NormalizedAtmosphericFeedV0
 * @property {number} cloudDensity 0–1
 * @property {number} humidity 0–1
 * @property {number} rainIntensity 0–1
 * @property {number} wind 0–1 (OpenWeather m/s ölçekli normalize)
 * @property {number} temperature °C (units=metric)
 * @property {number} timestamp ingest anı (epoch ms)
 */

const DEFAULT_LAT = 41.015137;
const DEFAULT_LON = 28.97953;

/** @returns {{ key: string, lat: number, lon: number }} */
export function getOpenWeatherQueryEnvV0() {
  const env = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env : {};
  const key = String(env.VITE_OPENWEATHER_API_KEY || "").trim();
  const latRaw = env.VITE_OPENWEATHER_LAT;
  const lonRaw = env.VITE_OPENWEATHER_LON;
  const lat = latRaw != null && String(latRaw).trim() !== "" ? Number(latRaw) : DEFAULT_LAT;
  const lon = lonRaw != null && String(lonRaw).trim() !== "" ? Number(lonRaw) : DEFAULT_LON;
  return { key, lat: Number.isFinite(lat) ? lat : DEFAULT_LAT, lon: Number.isFinite(lon) ? lon : DEFAULT_LON };
}

/**
 * Pure: OpenWeather Current Weather JSON → normalized feed.
 * @param {unknown} data
 * @returns {NormalizedAtmosphericFeedV0 | null}
 */
export function normalizeOpenWeatherCurrentJsonV0(data) {
  if (!data || typeof data !== "object") return null;
  const d = /** @type {Record<string, unknown>} */ (data);
  const main = d.main && typeof d.main === "object" ? /** @type {Record<string, unknown>} */ (d.main) : {};
  const clouds = d.clouds && typeof d.clouds === "object" ? /** @type {Record<string, unknown>} */ (d.clouds) : {};
  const wind = d.wind && typeof d.wind === "object" ? /** @type {Record<string, unknown>} */ (d.wind) : {};
  const rain = d.rain && typeof d.rain === "object" ? /** @type {Record<string, unknown>} */ (d.rain) : {};

  const rain1h = typeof rain["1h"] === "number" ? rain["1h"] : typeof rain["3h"] === "number" ? rain["3h"] / 3 : 0;
  const rainIntensity = Math.min(1, Math.max(0, Number(rain1h) / 12));
  const windNorm = Math.min(1, Math.max(0, (Number(wind.speed) || 0) / 18));
  const hum = Math.min(1, Math.max(0, (Number(main.humidity) || 0) / 100));
  const cloud = Math.min(1, Math.max(0, (Number(clouds.all) || 0) / 100));
  const temp = typeof main.temp === "number" && Number.isFinite(main.temp) ? main.temp : 0;

  return {
    cloudDensity: cloud,
    humidity: hum,
    rainIntensity,
    wind: windNorm,
    temperature: temp,
    timestamp: Date.now()
  };
}

/**
 * Atmosfer epoch / provenance kimliği (feed içeriğine deterministik; runtime SSOT değil).
 * @param {NormalizedAtmosphericFeedV0 | null} feed
 * @returns {string}
 */
export function buildAtmosphereEpochIdV0(feed) {
  let h = 2166136261 >>> 0;
  const s = feed
    ? `${feed.timestamp}|${feed.cloudDensity}|${feed.humidity}|${feed.temperature}|${feed.rainIntensity}|${feed.wind}`
    : "null";
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `atm_${(h >>> 0).toString(16)}`;
}

/**
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<NormalizedAtmosphericFeedV0 | null>}
 */
export async function fetchOpenWeatherNormalizedV0(opts = {}) {
  if (!isRealLayerWeatherIngressEnabledV0()) return null;
  const { key, lat, lon } = getOpenWeatherQueryEnvV0();
  if (!key) return null;

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&units=metric&appid=${encodeURIComponent(key)}`;
  const res = await fetch(url, { signal: opts.signal });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return normalizeOpenWeatherCurrentJsonV0(json);
}
