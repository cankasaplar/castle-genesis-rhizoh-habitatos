/**
 * Land-safe camera targets — keep viewport over shore/city, not Bosphorus channel.
 * Marker GPS may stay on water; camera fly targets clamp inland.
 */

import { getOriginSeedAnchorV0 } from "./memoryAnchorSystemV0.js";
import { resolveWorldMapBootstrapGeoV0 } from "./worldMapBootstrapGeoV0.js";

/** Rough mid-channel band — camera should not spawn here. */
const BOSPHORUS_CHANNEL_V0 = Object.freeze({
  latMin: 40.99,
  latMax: 41.13,
  lonMin: 29.012,
  lonMax: 29.095
});

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {boolean}
 */
export function isLikelyBosphorusWaterV0(lat, lon) {
  const la = Number(lat);
  const lo = Number(lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return false;
  if (
    la < BOSPHORUS_CHANNEL_V0.latMin ||
    la > BOSPHORUS_CHANNEL_V0.latMax ||
    lo < BOSPHORUS_CHANNEL_V0.lonMin ||
    lo > BOSPHORUS_CHANNEL_V0.lonMax
  ) {
    return false;
  }
  // European shore pocket (Beşiktaş / Serencebey)
  if (lo <= 29.011 && la >= 41.02 && la <= 41.07) return false;
  // Asian shore pocket (Üsküdar / Bebek approach)
  if (lo >= 29.096 && la >= 41.02 && la <= 41.11) return false;
  return true;
}

/**
 * @param {{ lat?: number, lon?: number }} [geo]
 * @returns {{ lat: number, lon: number, clamped: boolean, source: string }}
 */
export function resolveWorldMapCameraTargetV0(geo = {}) {
  const la = Number(geo.lat);
  const lo = Number(geo.lon);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) {
    const boot = resolveWorldMapBootstrapGeoV0();
    return Object.freeze({
      lat: boot.lat,
      lon: boot.lon,
      clamped: false,
      source: boot.source
    });
  }

  if (!isLikelyBosphorusWaterV0(la, lo)) {
    return Object.freeze({
      lat: la,
      lon: lo,
      clamped: false,
      source: "raw_geo"
    });
  }

  const seed = getOriginSeedAnchorV0();
  if (seed?.location && Number.isFinite(seed.location.lat) && Number.isFinite(seed.location.lon)) {
    return Object.freeze({
      lat: Number(seed.location.lat),
      lon: Number(seed.location.lon),
      clamped: true,
      source: "land_clamp_serencebey"
    });
  }

  const boot = resolveWorldMapBootstrapGeoV0();
  return Object.freeze({
    lat: boot.lat,
    lon: boot.lon,
    clamped: true,
    source: "land_clamp_bootstrap"
  });
}
