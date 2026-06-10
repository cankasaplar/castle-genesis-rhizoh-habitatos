/**
 * Read-only runtime snapshot for canonical reflex replies (system / weather).
 * Observation only — never execution authority.
 */

import {
  getCachedWeatherAtmosphereFeedV0,
  getWeatherAtmosphereProvenanceV0,
  refreshWeatherAtmosphereFeedIfStaleV0
} from "./worldPresenceStoreV0.js";
import {
  getOpenWeatherQueryEnvV0,
  isRealLayerWeatherIngressEnabledV0
} from "./weatherIngestV0.js";
import { hasUserGeoForLocalFeedsV0 } from "./rhizohUserGeoConsentV0.js";

export const RHIZOH_CANONICAL_REFLEX_SNAPSHOT_SCHEMA_V1 =
  "castle.rhizoh.canonical_reflex_snapshot.v1";

export const CANONICAL_WEATHER_MODE_V1 = Object.freeze({
  LIVE: "live",
  STUB: "stub"
});

const GATEWAY_FRESH_MS_V1 = 120_000;

/**
 * @param {number} [nowMs]
 */
export function readRuntimeHealthBridgeV1(nowMs = Date.now()) {
  const w =
    typeof globalThis !== "undefined" && globalThis.window ? globalThis.window : {};
  const h = w.__rhizoh?.runtimeHealth;
  if (!h || typeof h !== "object") return null;
  return Object.freeze({ ...h, atMs: Number(h.atMs) || nowMs });
}

/**
 * @param {number} [nowMs]
 */
export function readCanonicalReflexSnapshotV1(nowMs = Date.now()) {
  const now = Number(nowMs) || Date.now();
  const w =
    typeof globalThis !== "undefined" && globalThis.window ? globalThis.window : {};

  const health = readRuntimeHealthBridgeV1(now);
  const coord = w.__CASTLE_VOICE_TRANSCRIBE_COORDINATOR__ || null;
  const lastGatewayMs = Number(coord?.lastGatewayConnectAtMs) || 0;
  const gatewayFresh =
    health?.gatewayConnected === true ||
    (lastGatewayMs > 0 && now - lastGatewayMs <= GATEWAY_FRESH_MS_V1);

  const liveLayer = w.__rhizoh?.liveLayer || null;
  const coPresence = w.__rhizoh?.coPresenceRuntime || null;
  const voiceAdapter = w.__CASTLE_VOICE_INPUT_ADAPTER__ || null;

  const voiceReady =
    voiceAdapter?.voiceAvailability === "available" ||
    voiceAdapter?.voiceRegistered === true ||
    Boolean(liveLayer?.lastEmit);

  const weatherProv = getWeatherAtmosphereProvenanceV0();
  const weatherFeed = getCachedWeatherAtmosphereFeedV0();

  return Object.freeze({
    schema: RHIZOH_CANONICAL_REFLEX_SNAPSHOT_SCHEMA_V1,
    atMs: now,
    gatewayConnected: gatewayFresh,
    gatewayPhase: health?.gatewayPhase || null,
    gatewayLastConnectMs: lastGatewayMs || null,
    voiceReady: voiceReady === true,
    coPresenceActive: Boolean(coPresence?.schema),
    livePresenceEmitted: Boolean(liveLayer?.lastEmit),
    worldActive: health?.worldActive === true,
    rhizohHeartbeat: health?.rhizohHeartbeat === true,
    weatherConfigured: Boolean(getOpenWeatherQueryEnvV0().key),
    weatherLive: weatherProv.source === "openweather/current" && Boolean(weatherFeed),
    weatherSource: weatherProv.source
  });
}

/**
 * @param {import("./weatherIngestV0.js").NormalizedAtmosphericFeedV0} feed
 * @param {string} loc
 */
function deriveWeatherConditionLabelV1(feed, loc) {
  const main = String(feed.weatherMain || "").toLowerCase();
  const description = String(feed.description || "").trim();
  if (loc === "tr") {
    // Ignore English API description blobs (e.g. "clear sky"); keep Turkish surface text.
    if (description && /[çğıöşüÇĞİÖŞÜ]/.test(description)) return description;
    if (main.includes("rain") || feed.rainIntensity > 0.12) return "yağmurlu";
    if (main.includes("cloud") || feed.cloudDensity > 0.55) return "bulutlu";
    if (main.includes("clear")) return "açık";
    if (feed.rainIntensity > 0.12) return "yağmurlu";
    if (feed.cloudDensity > 0.55) return "bulutlu";
    return "açık";
  }
  if (description) return description;
  if (main) return main.toLowerCase();
  if (feed.rainIntensity > 0.12) return "rainy";
  if (feed.cloudDensity > 0.55) return "cloudy";
  return "clear";
}

/**
 * @param {string} [locale]
 * @param {import("./weatherIngestV0.js").NormalizedAtmosphericFeedV0 | null} [feed]
 * @param {{ source?: string }} [provenance]
 */
export function formatWeatherReplyV1(locale, feedIn, provenanceIn) {
  const loc = String(locale || "tr").toLowerCase().slice(0, 2);
  if (!hasUserGeoForLocalFeedsV0()) {
    return Object.freeze({
      mode: CANONICAL_WEATHER_MODE_V1.STUB,
      text: formatWeatherStubReplyV1(loc, { reason: "no_user_geo" }),
      source: "no_user_geo"
    });
  }
  const feed = feedIn ?? getCachedWeatherAtmosphereFeedV0();
  const prov = provenanceIn ?? getWeatherAtmosphereProvenanceV0();
  const live = prov?.source === "openweather/current" && feed != null;

  if (!live) {
    return Object.freeze({
      mode: CANONICAL_WEATHER_MODE_V1.STUB,
      text: formatWeatherStubReplyV1(loc),
      source: prov?.source || "none"
    });
  }

  const temp = Math.round(Number(feed.temperature) || 0);
  const label = deriveWeatherConditionLabelV1(feed, loc);
  const { lat, lon } = getOpenWeatherQueryEnvV0();

  if (loc === "tr") {
    return Object.freeze({
      mode: CANONICAL_WEATHER_MODE_V1.LIVE,
      text: `Şu an bölgede yaklaşık ${temp} derece, ${label}.`,
      source: prov.source,
      temperature: temp,
      lat,
      lon
    });
  }

  return Object.freeze({
    mode: CANONICAL_WEATHER_MODE_V1.LIVE,
    text: `About ${temp}° here right now, ${label}.`,
    source: prov.source,
    temperature: temp,
    lat,
    lon
  });
}

/**
 * Refresh (bounded) then format — voice path may await this briefly.
 * @param {string} [locale]
 * @param {{ timeoutMs?: number }} [opts]
 */
export async function resolveWeatherReplyAsyncV1(locale, opts = {}) {
  if (!hasUserGeoForLocalFeedsV0()) {
    const loc = String(locale || "tr").toLowerCase().slice(0, 2);
    return Object.freeze({
      mode: CANONICAL_WEATHER_MODE_V1.STUB,
      text: formatWeatherStubReplyV1(loc, { reason: "no_user_geo" }),
      source: "no_user_geo"
    });
  }
  const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : 2200;
  if (isRealLayerWeatherIngressEnabledV0()) {
    try {
      await Promise.race([
        refreshWeatherAtmosphereFeedIfStaleV0({ ttlMs: 0 }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("weather_refresh_timeout")), timeoutMs);
        })
      ]);
    } catch {
      /* cache or stub */
    }
  }
  return formatWeatherReplyV1(locale);
}

/**
 * @param {string} [locale]
 * @param {ReturnType<typeof readCanonicalReflexSnapshotV1>} [snap]
 */
export function formatSystemStatusReplyV1(locale, snapIn) {
  const loc = String(locale || "tr").toLowerCase().slice(0, 2);
  const snap = snapIn || readCanonicalReflexSnapshotV1();

  if (loc === "tr") {
    if (snap.gatewayConnected && snap.voiceReady && snap.rhizohHeartbeat) {
      return "Sistem hazır — gateway bağlı, ses yolu açık, Rhizoh nabızda. Buradayım.";
    }
    if (snap.gatewayConnected && snap.voiceReady) {
      return "Sistem hazır — gateway bağlı, ses yolu açık. Buradayım.";
    }
    if (snap.gatewayConnected) {
      return `Gateway bağlı (${snap.gatewayPhase || "connected"}) — ses katmanı hazırlanıyor.`;
    }
    return "Gateway henüz bağlı değil — bağlantı bekleniyor.";
  }

  if (snap.gatewayConnected && snap.voiceReady) {
    return "System ready — gateway online, voice path open. I'm here.";
  }
  if (snap.gatewayConnected) {
    return `Gateway connected (${snap.gatewayPhase || "connected"}) — voice layer warming up.`;
  }
  return "Gateway not connected yet — waiting for link.";
}

/**
 * @param {string} [locale]
 */
export function formatPresenceQueryReplyV1(locale) {
  const loc = String(locale || "tr").toLowerCase().slice(0, 2);
  if (loc === "tr") {
    return "Buradayım — seni dinliyorum. Ne konuşmak istersin?";
  }
  return "I'm here — listening. What would you like to talk about?";
}

/**
 * @param {string} [locale]
 */
export function formatWeatherStubReplyV1(locale, opts = {}) {
  const loc = String(locale || "tr").toLowerCase().slice(0, 2);
  if (opts?.reason === "no_user_geo") {
    if (loc === "tr") {
      return "Konum izni olmadan hava durumunu söyleyemem. İzin verirsen bulunduğun yeri kullanırım.";
    }
    return "I can't report local weather without your location. Grant permission and I'll use where you are.";
  }
  if (loc === "tr") {
    if (!getOpenWeatherQueryEnvV0().key) {
      return "Canlı hava verisi henüz bağlı değil — OpenWeather anahtarı yapılandırılmamış.";
    }
    return "Hava verisine şu an ulaşamadım — birazdan tekrar dene.";
  }
  if (!getOpenWeatherQueryEnvV0().key) {
    return "Live weather isn't configured — OpenWeather key missing.";
  }
  return "Weather feed unavailable right now — try again shortly.";
}
