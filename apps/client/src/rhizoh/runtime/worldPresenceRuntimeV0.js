/**
 * World presence runtime (v0) — atmospheric slice first.
 *
 * Niyet: "game state manager" değil; ham API ile renderer arasında
 * **urban cognition synthesizer** — semantic atmospheric interpretation → world presence state.
 *
 * Pipeline: OpenWeather → `weatherIngestV0` (normalize) → burada ambient + `deriveEpistemicAtmosphereV0` → state.
 * PR-3.1 discrete key: `deriveEpistemicKeyFromWorldPresenceSliceV0` in `deriveEpistemicKeyV0.js` (state → key derivation).
 * Cesium / Three sahibi değil; projection surface sonraki katmanda (sceneProjectionAdapter — henüz yok).
 *
 * @see docs/RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md
 */

/** @typedef {import("./weatherIngestV0.js").NormalizedAtmosphericFeedV0} NormalizedAtmosphericFeedV0 */

const SCHEMA = "worldPresence.v0";

function nowMs() {
  return Date.now();
}

/**
 * @param {number} t epoch ms
 * @returns {{ hour: number, minute: number, epochMs: number }}
 */
function localTimeFromEpoch(t) {
  const d = new Date(t);
  return { hour: d.getHours(), minute: d.getMinutes(), epochMs: t };
}

/**
 * @param {NormalizedAtmosphericFeedV0} feed
 * @returns {string}
 */
function inferWeatherTypeV0(feed) {
  if (feed.rainIntensity > 0.12) return "rain";
  if (feed.cloudDensity > 0.75) return "clouds";
  if (feed.cloudDensity < 0.22) return "clear";
  return "mixed";
}

/**
 * Yerel saat + isteğe bağlı OpenWeather feed → ambient (henüz semantic değil).
 * @param {number} epochMs
 * @param {NormalizedAtmosphericFeedV0 | null} [weatherFeed]
 */
export function buildAmbientAtmosphereFromFeedV0(epochMs, weatherFeed) {
  const localTime = localTimeFromEpoch(epochMs);
  const hour = localTime.hour;
  let luminosity = hour >= 7 && hour < 19 ? 0.82 : 0.34;
  if (weatherFeed) {
    luminosity *= 1 - weatherFeed.cloudDensity * 0.28;
    luminosity = Math.min(1, Math.max(0.08, luminosity));
  }

  /** @type {Record<string, unknown>} */
  const base = {
    weatherType: "unknown",
    cloudDensity: 0.45,
    humidity: 0.5,
    localTime,
    luminosity,
    rainIntensity: 0,
    wind: 0,
    temperature: null,
    feedTimestamp: null
  };

  if (!weatherFeed) return /** @type {any} */ (base);

  return /** @type {any} */ ({
    ...base,
    weatherType: inferWeatherTypeV0(weatherFeed),
    cloudDensity: weatherFeed.cloudDensity,
    humidity: weatherFeed.humidity,
    luminosity,
    rainIntensity: weatherFeed.rainIntensity,
    wind: weatherFeed.wind,
    temperature: weatherFeed.temperature,
    feedTimestamp: weatherFeed.timestamp
  });
}

/** Geriye dönük uyumluluk — `buildAmbientAtmosphereFromFeedV0(nowMs(), null)` ile aynı. */
export function buildNeutralAmbientAtmosphereV0() {
  return buildAmbientAtmosphereFromFeedV0(nowMs(), null);
}

/**
 * Epistemik çevre koşulu — shader parametresi değil; bilişsel çevre yüzeyi.
 * @param {{ ambient?: ReturnType<typeof buildAmbientAtmosphereFromFeedV0> }} [slice]
 */
export function deriveEpistemicAtmosphereV0(slice = {}) {
  const amb = slice.ambient || buildAmbientAtmosphereFromFeedV0(nowMs(), null);
  const cd = Math.min(1, Math.max(0, amb.cloudDensity));
  const lum = Math.min(1, Math.max(0, amb.luminosity));
  const humid = Math.min(1, Math.max(0, amb.humidity));
  const rain = Math.min(1, Math.max(0, typeof amb.rainIntensity === "number" ? amb.rainIntensity : 0));
  const wn = Math.min(1, Math.max(0, typeof amb.wind === "number" ? amb.wind : 0));

  const visibilityBudget =
    (1 - cd * 0.45) * (1 - humid * 0.15) * (0.62 + lum * 0.38) * (1 - wn * 0.08) * (1 - rain * 0.06);
  const auraIntensity = 0.38 + lum * 0.48 - cd * 0.22;
  const driftBloom = Math.min(1, Math.max(0, cd * 0.52 + humid * 0.22 + rain * 0.38));
  const h = amb.localTime?.hour ?? 12;
  const nightResonance = h < 6 || h > 21 ? 0.42 + (1 - lum) * 0.38 : 0.12;
  const fogDiffusion = Math.min(1, Math.max(0, humid * 0.42 + cd * 0.33 + rain * 0.15));

  return {
    visibilityBudget: Math.min(1, Math.max(0.06, visibilityBudget)),
    auraIntensity: Math.min(1, Math.max(0, auraIntensity)),
    driftBloom,
    nightResonance: Math.min(1, Math.max(0, nightResonance)),
    fogDiffusion
  };
}

/**
 * @param {{
 *   weatherFeed?: NormalizedAtmosphericFeedV0 | null,
 *   livingContext?: {
 *     locationSeed?: { timeZone?: string, locale?: string, seedBasis?: string },
 *     worldInstance?: { instanceId?: string, timeZone?: string, locale?: string }
 *   }
 * }} [io]
 */
export function buildWorldPresenceStateV0(io = {}) {
  const epochMs = nowMs();
  const feed = io.weatherFeed === undefined ? null : io.weatherFeed;
  const ambient = buildAmbientAtmosphereFromFeedV0(epochMs, feed);
  const atmosphere = deriveEpistemicAtmosphereV0({ ambient });
  const lc = io.livingContext;
  const living =
    lc && (lc.locationSeed || lc.worldInstance)
      ? Object.freeze({
          worldInstanceId: lc.worldInstance?.instanceId ?? null,
          timeZone: lc.worldInstance?.timeZone ?? lc.locationSeed?.timeZone ?? null,
          locale: lc.worldInstance?.locale ?? lc.locationSeed?.locale ?? null,
          seedBasis: lc.locationSeed?.seedBasis ?? null
        })
      : null;
  return {
    schema: SCHEMA,
    at: epochMs,
    ambient,
    atmosphere,
    living,
    memoryEcho: null,
    collectivePulse: null
  };
}
