/**
 * Media tube bottom ticker — gateway sports/news + Open-Meteo weather (no client API keys).
 */

import {
  buildWorldMapSportsNewsLinesV0,
  getWorldMapLiveFeedSnapshotV0,
  refreshWorldMapLiveFeedIfStaleV0,
  resolveWorldMapLiveFeedHttpV0
} from "./worldMapLiveFeedV0.js";

export const WORLD_SPACE_MEDIA_TICKER_SCHEMA_V0 = "rhizoh.world_space_media_ticker.v0";

const DEFAULT_LAT = 41.01;
const DEFAULT_LON = 28.95;

/**
 * @param {{ lat?: number, lon?: number, signal?: AbortSignal }} [opts]
 */
export async function fetchOpenMeteoWeatherLineV0(opts = {}) {
  const lat = Number.isFinite(opts.lat) ? opts.lat : DEFAULT_LAT;
  const lon = Number.isFinite(opts.lon) ? opts.lon : DEFAULT_LON;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    "&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto";
  try {
    const res = await fetch(url, { signal: opts.signal, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`open_meteo_${res.status}`);
    const json = await res.json();
    const cur = json?.current;
    if (!cur) return null;
    const temp = Number(cur.temperature_2m);
    const wind = Number(cur.wind_speed_10m);
    const code = Number(cur.weather_code);
    const label = weatherCodeLabelV0(code);
    return Object.freeze({
      provider: "open-meteo",
      lat,
      lon,
      line: `${label} · ${Number.isFinite(temp) ? `${Math.round(temp)}°C` : "—"} · rüzgar ${Number.isFinite(wind) ? `${Math.round(wind)} km/s` : "—"}`
    });
  } catch {
    return null;
  }
}

/** @param {number} code */
function weatherCodeLabelV0(code) {
  if (code === 0) return "Açık";
  if (code <= 3) return "Parçalı bulutlu";
  if (code <= 48) return "Sis";
  if (code <= 67) return "Yağmur";
  if (code <= 77) return "Kar";
  if (code <= 82) return "Sağanak";
  if (code <= 86) return "Kar sağanağı";
  if (code <= 99) return "Fırtına";
  return "Hava";
}

/**
 * @param {string} [locale]
 */
export function buildMediaTubeTickerFallbackNoteV0(locale = "tr") {
  const tr = String(locale).toLowerCase().startsWith("tr");
  const gatewayUrl = resolveWorldMapLiveFeedHttpV0();
  if (!gatewayUrl) {
    return tr
      ? "Gateway world-feed URL yok — spor/haber için VITE_LIVE_GATEWAY_BASE ayarla; hava Open-Meteo ile canlı."
      : "No gateway world-feed URL — set VITE_LIVE_GATEWAY_BASE for sports/news; weather via Open-Meteo.";
  }
  return tr
    ? "Spor/haber gateway üzerinden (API anahtarları sunucuda); hava Open-Meteo canlı."
    : "Sports/news via gateway (API keys server-side); weather live from Open-Meteo.";
}

/**
 * @param {{
 *   feed?: ReturnType<typeof getWorldMapLiveFeedSnapshotV0>,
 *   weather?: Awaited<ReturnType<typeof fetchOpenMeteoWeatherLineV0>>,
 *   locale?: string
 * }} input
 */
export function buildMediaTubeTickerSegmentsV0(input = {}) {
  const tr = String(input.locale || "tr").toLowerCase().startsWith("tr");
  const feed = input.feed ?? getWorldMapLiveFeedSnapshotV0();
  const lines = buildWorldMapSportsNewsLinesV0(feed, input.locale);
  /** @type {string[]} */
  const segments = [];

  if (input.weather?.line) {
    segments.push(tr ? `İstanbul · ${input.weather.line}` : `Istanbul · ${input.weather.line}`);
  }

  if (lines.hasSports) {
    segments.push(tr ? `Spor · ${lines.sportChips.join(" · ")}` : `Sports · ${lines.sportChips.join(" · ")}`);
  } else {
    segments.push(tr ? lines.emptySportsLabel : lines.emptySportsLabel);
  }

  if (lines.hasNews) {
    segments.push(tr ? `Haber · ${lines.newsLine}` : `News · ${lines.newsLine}`);
  } else {
    segments.push(tr ? lines.emptyNewsLabel : lines.emptyNewsLabel);
  }

  segments.push(buildMediaTubeTickerFallbackNoteV0(input.locale));

  return Object.freeze(segments.filter(Boolean));
}

/**
 * @param {{ locale?: string, lat?: number, lon?: number, signal?: AbortSignal }} [opts]
 */
export async function refreshMediaTubeTickerPayloadV0(opts = {}) {
  const [feed, weather] = await Promise.all([
    refreshWorldMapLiveFeedIfStaleV0({ force: false, locale: opts.locale, signal: opts.signal }),
    fetchOpenMeteoWeatherLineV0({ lat: opts.lat, lon: opts.lon, signal: opts.signal })
  ]);
  const segments = buildMediaTubeTickerSegmentsV0({
    feed: feed ?? getWorldMapLiveFeedSnapshotV0(),
    weather,
    locale: opts.locale
  });
  return Object.freeze({
    schema: WORLD_SPACE_MEDIA_TICKER_SCHEMA_V0,
    segments,
    text: segments.join("   ◆   "),
    fetchedAt: Date.now()
  });
}
