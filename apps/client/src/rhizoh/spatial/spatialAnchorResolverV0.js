/**
 * Deterministic spatial anchor resolver (v0).
 *
 * Replaces implicit “nearest anchor wins” floating toggles: camera lon/lat are quantized,
 * influence weights use the same kernel as legacy perception blend, and dominance ties
 * break on anchor `id` lexicographic order.
 *
 * Does **not** produce world truth or authority decisions — local projection / observation weights only.
 *
 * @see docs/RHIZOH_SPATIAL_EMBODIMENT_FINAL_LOCK_V1.md
 * @see geographicAnchorsV0.js
 */

import { getGeographicSemanticAnchorsV0 } from "./geographicAnchorsV0.js";
import { haversineDistanceKmV0 } from "./spatialHaversineV0.js";

export const SPATIAL_ANCHOR_RESOLVER_SCHEMA_V0 = "spatialAnchorResolver.v0";

/** ~1.1 m at mid-lat — dampens Cesium float jitter before anchor weights */
const QUANT_LON_LAT_DECIMALS = 5;

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {{ lat: number, lon: number }}
 */
export function quantizeLonLatForAnchorResolveV0(lat, lon) {
  const f = 10 ** QUANT_LON_LAT_DECIMALS;
  return {
    lat: Math.round(lat * f) / f,
    lon: Math.round(lon * f) / f
  };
}

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {number} clamped 0–1 divergence pressure (legacy-compatible blend)
 */
export function resolveAnchorFieldDistortion01V0(lat, lon) {
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 0;

  const { lat: qlat, lon: qlon } = quantizeLonLatForAnchorResolveV0(lat, lon);
  const anchors = getGeographicSemanticAnchorsV0();
  let wSum = 0;
  let divSum = 0;
  for (const a of anchors) {
    const distKm = haversineDistanceKmV0(qlat, qlon, a.lat, a.lon);
    const w = Math.max(0, 1 - distKm / Math.max(0.5, a.influenceRadiusKm * 2.4));
    const div = typeof a.epistemicProfile?.divergence === "number" ? a.epistemicProfile.divergence : 0.2;
    wSum += w;
    divSum += div * w;
  }
  return wSum > 1e-6 ? clamp01(divSum / wSum) : 0;
}

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {{
 *   schema: string,
 *   quantizedLat: number,
 *   quantizedLon: number,
 *   entries: ReadonlyArray<{ id: string, distKm: number, weight: number, divergence: number }>,
 *   dominantAnchorId: string | null
 * }}
 */
export function resolveDeterministicAnchorInfluenceBundleV0(lat, lon) {
  const { lat: qlat, lon: qlon } = quantizeLonLatForAnchorResolveV0(lat, lon);
  const anchors = getGeographicSemanticAnchorsV0();

  /** @type {{ id: string, distKm: number, rawW: number, divergence: number }[]} */
  const rows = [];
  for (const a of anchors) {
    const distKm = haversineDistanceKmV0(qlat, qlon, a.lat, a.lon);
    const rawW = Math.max(0, 1 - distKm / Math.max(0.5, a.influenceRadiusKm * 2.4));
    const divergence = typeof a.epistemicProfile?.divergence === "number" ? a.epistemicProfile.divergence : 0.2;
    rows.push({ id: a.id, distKm, rawW, divergence });
  }

  const wSum = rows.reduce((s, r) => s + r.rawW, 0);
  const entries = Object.freeze(
    rows.map((r) =>
      Object.freeze({
        id: r.id,
        distKm: r.distKm,
        weight: wSum > 1e-12 ? r.rawW / wSum : 0,
        divergence: r.divergence
      })
    )
  );

  let dominantAnchorId = null;
  let bestW = -1;
  for (const r of rows) {
    if (r.rawW > bestW || (r.rawW === bestW && (dominantAnchorId == null || r.id < dominantAnchorId))) {
      bestW = r.rawW;
      dominantAnchorId = r.id;
    }
  }

  return Object.freeze({
    schema: SPATIAL_ANCHOR_RESOLVER_SCHEMA_V0,
    quantizedLat: qlat,
    quantizedLon: qlon,
    entries,
    dominantAnchorId
  });
}
