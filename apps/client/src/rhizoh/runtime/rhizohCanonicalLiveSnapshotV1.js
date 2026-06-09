/**
 * Canonical live world snapshot — SSOT for fast speech reflex (weather / traffic / sports / news).
 * Observation only; never execution authority.
 */

import { readCastleNexusGeoV0, readUserCastleAnchorGeoV0 } from "./worldMapBootstrapGeoV0.js";
import { getCachedWeatherAtmosphereFeedV0, getWeatherAtmosphereProvenanceV0 } from "./worldPresenceStoreV0.js";
import { getWorldMapLiveFeedSnapshotV0 } from "./worldMapLiveFeedV0.js";
import { getWorldMapLiveContextSnapshotV0 } from "./worldMapLiveContextV0.js";
import { readCanonicalReflexSnapshotV1 } from "./rhizohCanonicalReflexSnapshotV1.js";

export const RHIZOH_CANONICAL_LIVE_SNAPSHOT_SCHEMA_V1 = "castle.rhizoh.canonical_live_snapshot.v1";
export const CANONICAL_LIVE_SNAPSHOT_VERSION_V1 = "2.1";
export const CANONICAL_LIVE_SNAPSHOT_SOURCE_V1 = "worldPresenceStoreV0+worldMapLiveFeedV0";

/**
 * @param {{ lat?: number, lon?: number, label?: string, source?: string }} [geo]
 * @param {string} [locale]
 */
export function resolveSnapshotGeoLabelV1(geo, locale = "tr") {
  const tr = String(locale).toLowerCase().startsWith("tr");
  const label = String(geo?.label || "").trim();
  if (label && !/serencebey|castle|seed|fallback/i.test(label)) return label;
  const nexus = readCastleNexusGeoV0();
  if (nexus?.label) return String(nexus.label);
  const castle = readUserCastleAnchorGeoV0();
  if (castle?.label) return String(castle.label);
  return tr ? "bölgen" : "your area";
}

/**
 * @param {number} [nowMs]
 * @param {string} [locale]
 */
export function readCanonicalLiveSnapshotV1(nowMs = Date.now(), locale = "tr") {
  const now = Number(nowMs) || Date.now();
  const ctx = getWorldMapLiveContextSnapshotV0(locale);
  const feed = getWorldMapLiveFeedSnapshotV0();
  const reflex = readCanonicalReflexSnapshotV1(now);
  const weatherProv = getWeatherAtmosphereProvenanceV0();
  const weatherFeed = ctx.weatherFeed || getCachedWeatherAtmosphereFeedV0();
  const sports = feed?.sports || null;
  const news = feed?.news || null;

  const liveMatches = Array.isArray(sports?.live) ? sports.live : [];
  const upcomingMatches = Array.isArray(sports?.upcoming) ? sports.upcoming : [];

  return Object.freeze({
    schema: RHIZOH_CANONICAL_LIVE_SNAPSHOT_SCHEMA_V1,
    version: CANONICAL_LIVE_SNAPSHOT_VERSION_V1,
    timestamp: now,
    source: CANONICAL_LIVE_SNAPSHOT_SOURCE_V1,
    geo: Object.freeze({
      lat: ctx.geo?.lat,
      lon: ctx.geo?.lon,
      label: resolveSnapshotGeoLabelV1(ctx.geo, locale),
      source: ctx.geo?.source || "bootstrap"
    }),
    weather: weatherFeed
      ? Object.freeze({
          temperature: weatherFeed.temperature,
          description: weatherFeed.description || weatherFeed.weatherMain,
          humidity: Math.round((Number(weatherFeed.humidity) || 0) * 100),
          windMs: Number(weatherFeed.wind) > 0 && Number(weatherFeed.wind) <= 1
            ? Math.round(Number(weatherFeed.wind) * 40)
            : Number(weatherFeed.wind) || 0,
          live: weatherProv?.source === "openweather/current",
          source: weatherProv?.source || "none",
          fetchedAt: weatherFeed.timestamp || now
        })
      : null,
    traffic: ctx.trafficFeed
      ? Object.freeze({
          level: ctx.trafficFeed.level,
          intensity: ctx.trafficFeed.intensity,
          density: Math.round((Number(ctx.trafficFeed.intensity) || 0) * 100),
          delayMinutes:
            Number.isFinite(ctx.trafficFeed.currentTravelTimeSec) &&
            Number.isFinite(ctx.trafficFeed.freeFlowTravelTimeSec)
              ? Math.max(
                  0,
                  Math.round(
                    (ctx.trafficFeed.currentTravelTimeSec - ctx.trafficFeed.freeFlowTravelTimeSec) / 60
                  )
                )
              : null,
          source: "tomtom/flow",
          fetchedAt: ctx.trafficFeed.timestamp || now
        })
      : null,
    sports: sports
      ? Object.freeze({
          source: sports.source || "none",
          liveMatches: Object.freeze(liveMatches),
          upcomingMatches: Object.freeze(upcomingMatches),
          fetchedAt: sports.fetchedAt || feed?.fetchedAt || now
        })
      : null,
    news: news
      ? Object.freeze({
          provider: news.provider || "none",
          headlines: Object.freeze(
            (Array.isArray(news.headlines) ? news.headlines : []).map((h) =>
              Object.freeze({
                title: String(h?.title || "").trim(),
                url: h?.url || null,
                source: h?.source || null
              })
            )
          ),
          country: news.country,
          language: news.language,
          fetchedAt: news.fetchedAt || feed?.fetchedAt || now
        })
      : null,
    reflex
  });
}
