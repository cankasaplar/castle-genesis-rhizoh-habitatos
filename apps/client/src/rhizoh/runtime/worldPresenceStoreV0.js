/**
 * World presence — weather feed cache + düşük frekanslı poll (v0).
 *
 * Amaç: atmosferik süreklilik hissi; meteoroloji doğruluğu değil → varsayılan poll 5 dk.
 * Renderer / Cesium sahibi değil; yalnızca ingest cache + isteğe bağlı interval.
 *
 * @see docs/RHIZOH_LIVING_WORLD_AND_EMBODIMENT_ROADMAP_V0.md
 */

import { fetchOpenWeatherNormalizedV0, getOpenWeatherQueryEnvV0, buildAtmosphereEpochIdV0 } from "./weatherIngestV0.js";
import { isWorldExecutionOffV0 } from "./worldExecutionGateV0.js";

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const DEFAULT_POLL_MS = 5 * 60 * 1000;
/** Anahtar yokken boş cevaplar için daha uzun bekleme (gereksiz ağ gürültüsü yok). */
const EMPTY_KEY_COOLDOWN_MS = 10 * 60 * 1000;

/** @type {import("./weatherIngestV0.js").NormalizedAtmosphericFeedV0 | null} */
let _cachedFeed = null;
let _cacheValidUntil = 0;
/** @type {Promise<import("./weatherIngestV0.js").NormalizedAtmosphericFeedV0 | null> | null} */
let _inFlight = null;

/** @type {{ source: string, fetchedAt: number, epoch: string }} */
let _atmosphereProvenance = { source: "none", fetchedAt: 0, epoch: "atm_init" };

export function resetWorldPresenceWeatherCacheForTestsV0() {
  _cachedFeed = null;
  _cacheValidUntil = 0;
  _inFlight = null;
  _atmosphereProvenance = { source: "none", fetchedAt: 0, epoch: "atm_init" };
}

/** Son ingest kaynağı (projection debug / çoklu kaynak genişlemesi için). */
export function getWeatherAtmosphereProvenanceV0() {
  return { ..._atmosphereProvenance };
}

/** @returns {import("./weatherIngestV0.js").NormalizedAtmosphericFeedV0 | null} */
export function getCachedWeatherAtmosphereFeedV0() {
  return _cachedFeed;
}

/**
 * TTL içindeyse ağa gitmez; stale ise fetch (dedupe in-flight).
 * @param {{ ttlMs?: number, signal?: AbortSignal }} [opts]
 */
export async function refreshWeatherAtmosphereFeedIfStaleV0(opts = {}) {
  if (isWorldExecutionOffV0()) {
    return _cachedFeed;
  }
  const ttl = typeof opts.ttlMs === "number" && opts.ttlMs > 0 ? opts.ttlMs : DEFAULT_TTL_MS;
  const now = Date.now();
  if (now < _cacheValidUntil) return _cachedFeed;
  if (_inFlight) return _inFlight;

  _inFlight = (async () => {
    try {
      const { key } = getOpenWeatherQueryEnvV0();
      const at = Date.now();
      const feed = await fetchOpenWeatherNormalizedV0({ signal: opts.signal });
      const backoff = key ? ttl : Math.max(ttl, EMPTY_KEY_COOLDOWN_MS);
      _cachedFeed = feed;
      _cacheValidUntil = Date.now() + backoff;
      if (!key) {
        _atmosphereProvenance = {
          source: "openweather/unconfigured",
          fetchedAt: at,
          epoch: buildAtmosphereEpochIdV0(null)
        };
      } else if (!feed) {
        _atmosphereProvenance = {
          source: "openweather/unavailable",
          fetchedAt: at,
          epoch: buildAtmosphereEpochIdV0(null)
        };
      } else {
        _atmosphereProvenance = {
          source: "openweather/current",
          fetchedAt: at,
          epoch: buildAtmosphereEpochIdV0(feed)
        };
      }
      return feed;
    } catch {
      _cacheValidUntil = Date.now() + 60_000;
      _atmosphereProvenance = {
        source: "openweather/error",
        fetchedAt: Date.now(),
        epoch: buildAtmosphereEpochIdV0(null)
      };
      return _cachedFeed;
    } finally {
      _inFlight = null;
    }
  })();

  return _inFlight;
}

/**
 * @param {{ intervalMs?: number, ttlMs?: number, onTick?: (feed: import("./weatherIngestV0.js").NormalizedAtmosphericFeedV0 | null) => void, signal?: AbortSignal }} [opts]
 * @returns {() => void} stop
 */
export function startWorldWeatherAtmospherePollingV0(opts = {}) {
  if (isWorldExecutionOffV0()) {
    return () => {};
  }
  const intervalMs = typeof opts.intervalMs === "number" && opts.intervalMs > 0 ? opts.intervalMs : DEFAULT_POLL_MS;
  const ttlMs = typeof opts.ttlMs === "number" && opts.ttlMs > 0 ? opts.ttlMs : intervalMs;

  const tick = () => {
    void refreshWeatherAtmosphereFeedIfStaleV0({ ttlMs, signal: opts.signal }).then(() => {
      try {
        opts.onTick?.(getCachedWeatherAtmosphereFeedV0());
      } catch {
        /* noop */
      }
    });
  };

  tick();
  const id = setInterval(tick, intervalMs);
  return () => clearInterval(id);
}
