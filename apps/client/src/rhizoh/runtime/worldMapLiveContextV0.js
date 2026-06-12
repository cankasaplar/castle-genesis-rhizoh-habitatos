/**
 * World map live context — local clock + OpenWeather + TomTom traffic (HUD chip).
 */

import { readCastleNexusGeoV0, resolveWorldMapBootstrapGeoV0 } from "./worldMapBootstrapGeoV0.js";
import { resolveWorldMapCameraTargetV0 } from "./worldMapCameraGeoV0.js";
import {
  getCachedWeatherAtmosphereFeedV0,
  refreshWeatherAtmosphereFeedIfStaleV0,
  startWorldWeatherAtmospherePollingV0
} from "./worldPresenceStoreV0.js";
import { fetchTomTomTrafficNormalizedV0, isRealLayerTrafficIngressEnabledV0 } from "./trafficIngestV0.js";
import { isWorldExecutionOffV0 } from "./worldExecutionGateV0.js";

const DEFAULT_TRAFFIC_TTL_MS = 5 * 60 * 1000;
const DEFAULT_POLL_MS = 5 * 60 * 1000;
const TICK_MS = 30_000;

/** @type {import("./trafficIngestV0.js").NormalizedTrafficFeedV0 | null} */
let _cachedTraffic = null;
let _trafficValidUntil = 0;
/** @type {Promise<import("./trafficIngestV0.js").NormalizedTrafficFeedV0 | null> | null} */
let _trafficInFlight = null;

/**
 * @returns {{ lat: number, lon: number, label?: string, source: string }}
 */
export function resolveWorldMapLiveGeoV0() {
  const nexus = readCastleNexusGeoV0();
  const raw = nexus || resolveWorldMapBootstrapGeoV0();
  const cam = resolveWorldMapCameraTargetV0(raw);
  return Object.freeze({
    lat: cam.lat,
    lon: cam.lon,
    label: raw.label,
    source: cam.clamped ? "land_clamp" : raw.source || "bootstrap"
  });
}

/**
 * @param {{ lat: number, lon: number }} geo
 * @returns {string}
 */
export function resolveWorldMapTimeZoneV0(geo) {
  const la = Number(geo?.lat);
  const lo = Number(geo?.lon);
  if (la >= 35.5 && la <= 42.5 && lo >= 25.5 && lo <= 45.5) return "Europe/Istanbul";
  return "UTC";
}

/**
 * @param {{ lat: number, lon: number }} geo
 * @param {string} [locale]
 * @returns {string}
 */
export function formatWorldMapLocalClockV0(geo, locale = "tr") {
  const tz = resolveWorldMapTimeZoneV0(geo);
  const tr = String(locale).toLowerCase().startsWith("tr");
  try {
    return new Intl.DateTimeFormat(tr ? "tr-TR" : "en-GB", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date());
  } catch {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
}

/**
 * @param {import("./weatherIngestV0.js").NormalizedAtmosphericFeedV0 | null} feed
 * @param {string} [locale]
 * @returns {string}
 */
export function formatWorldMapWeatherLineV0(feed, locale = "tr") {
  if (!feed) return "";
  const tr = String(locale).toLowerCase().startsWith("tr");
  const temp = Number.isFinite(feed.temperature) ? `${Math.round(feed.temperature)}°C` : "—";
  const desc =
    feed.description ||
    (feed.weatherMain
      ? feed.weatherMain
      : tr
        ? "bilinmiyor"
        : "unknown");
  return `${temp} · ${desc}`;
}

/**
 * @param {import("./trafficIngestV0.js").NormalizedTrafficFeedV0 | null} feed
 * @param {string} [locale]
 * @returns {string}
 */
export function formatWorldMapTrafficLineV0(feed, locale = "tr") {
  if (!feed) return "";
  const tr = String(locale).toLowerCase().startsWith("tr");
  const map = tr
    ? { low: "düşük", medium: "orta", high: "yoğun", closed: "kapalı", unknown: "—" }
    : { low: "low", medium: "medium", high: "heavy", closed: "closed", unknown: "—" };
  const label = map[feed.level] || map.unknown;
  return tr ? `trafik: ${label}` : `traffic: ${label}`;
}

/**
 * @param {string} [locale]
 * @returns {{
 *   geo: ReturnType<typeof resolveWorldMapLiveGeoV0>,
 *   timeLabel: string,
 *   weatherLine: string,
 *   trafficLine: string,
 *   weatherFeed: import("./weatherIngestV0.js").NormalizedAtmosphericFeedV0 | null,
 *   trafficFeed: import("./trafficIngestV0.js").NormalizedTrafficFeedV0 | null
 * }}
 */
export function getWorldMapLiveContextSnapshotV0(locale = "tr") {
  const geo = resolveWorldMapLiveGeoV0();
  const weatherFeed = getCachedWeatherAtmosphereFeedV0();
  const trafficFeed = _cachedTraffic;
  return Object.freeze({
    geo,
    timeLabel: formatWorldMapLocalClockV0(geo, locale),
    weatherLine: formatWorldMapWeatherLineV0(weatherFeed, locale),
    trafficLine: formatWorldMapTrafficLineV0(trafficFeed, locale),
    weatherFeed,
    trafficFeed
  });
}

export function resetWorldMapTrafficCacheForTestsV0() {
  _cachedTraffic = null;
  _trafficValidUntil = 0;
  _trafficInFlight = null;
}

/**
 * @param {{ ttlMs?: number, signal?: AbortSignal, lat?: number, lon?: number }} [opts]
 */
export async function refreshWorldMapTrafficFeedIfStaleV0(opts = {}) {
  if (isWorldExecutionOffV0() || !isRealLayerTrafficIngressEnabledV0()) {
    return _cachedTraffic;
  }
  const ttl =
    typeof opts.ttlMs === "number" && opts.ttlMs > 0 ? opts.ttlMs : DEFAULT_TRAFFIC_TTL_MS;
  const now = Date.now();
  if (!opts.force && now < _trafficValidUntil) return _cachedTraffic;
  if (_trafficInFlight) return _trafficInFlight;

  _trafficInFlight = (async () => {
    try {
      const feed = await fetchTomTomTrafficNormalizedV0({
        signal: opts.signal,
        lat: opts.lat,
        lon: opts.lon
      });
      _cachedTraffic = feed;
      _trafficValidUntil = Date.now() + ttl;
      return feed;
    } catch {
      _trafficValidUntil = Date.now() + 60_000;
      return _cachedTraffic;
    } finally {
      _trafficInFlight = null;
    }
  })();

  return _trafficInFlight;
}

/**
 * @param {{ intervalMs?: number, locale?: string, onUpdate?: (snap: ReturnType<typeof getWorldMapLiveContextSnapshotV0>) => void, signal?: AbortSignal }} [opts]
 * @returns {() => void}
 */
export function startWorldMapLiveContextPollingV0(opts = {}) {
  const locale = opts.locale || "tr";
  const intervalMs =
    typeof opts.intervalMs === "number" && opts.intervalMs > 0 ? opts.intervalMs : DEFAULT_POLL_MS;
  const executionOff = isWorldExecutionOffV0();

  const emit = () => {
    try {
      opts.onUpdate?.(getWorldMapLiveContextSnapshotV0(locale));
    } catch {
      /* noop */
    }
  };

  const refreshAll = () => {
    if (executionOff) {
      emit();
      return;
    }
    const geo = resolveWorldMapLiveGeoV0();
    void refreshWeatherAtmosphereFeedIfStaleV0({ signal: opts.signal }).then(emit);
    void refreshWorldMapTrafficFeedIfStaleV0({
      signal: opts.signal,
      lat: geo.lat,
      lon: geo.lon
    }).then(emit);
  };

  const stopWeather = executionOff
    ? () => {}
    : startWorldWeatherAtmospherePollingV0({
        intervalMs,
        onTick: emit,
        signal: opts.signal
      });

  refreshAll();
  const clockId = setInterval(() => emit(), TICK_MS);
  const dataId = executionOff ? null : setInterval(refreshAll, intervalMs);

  return () => {
    stopWeather();
    clearInterval(clockId);
    if (dataId) clearInterval(dataId);
  };
}
