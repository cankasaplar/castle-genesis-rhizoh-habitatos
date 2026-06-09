/**
 * Speech ↔ HUD live feed glue (SpiralLive livefeed.js pattern) — debounced refresh after reflex.
 */

import { refreshWorldMapLiveFeedIfStaleV0 } from "./worldMapLiveFeedV0.js";
import { refreshWorldMapTrafficFeedIfStaleV0 } from "./worldMapLiveContextV0.js";
import { refreshWeatherAtmosphereFeedIfStaleV0 } from "./worldPresenceStoreV0.js";

const DEFAULT_MIN_INTERVAL_MS = 30_000;
let _lastRefreshAt = 0;

export function resetSpeechLiveFeedGlueForTestsV0() {
  _lastRefreshAt = 0;
}

/**
 * @param {{ force?: boolean, minIntervalMs?: number }} [opts]
 */
export function maybeRefreshWorldFeedsAfterSpeechV0(opts = {}) {
  const minInterval = Number(opts.minIntervalMs) > 0 ? Number(opts.minIntervalMs) : DEFAULT_MIN_INTERVAL_MS;
  const now = Date.now();
  if (!opts.force && now - _lastRefreshAt < minInterval) return;
  _lastRefreshAt = now;
  void refreshWeatherAtmosphereFeedIfStaleV0({ force: true });
  void refreshWorldMapTrafficFeedIfStaleV0({ force: true });
  void refreshWorldMapLiveFeedIfStaleV0({ force: true });
}
