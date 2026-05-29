/**
 * Dynamic WGS84 → satellite nodeId slug (EFIR-α onboarding).
 * No execution write — observation registry only.
 */

export const DYNAMIC_SATELLITE_NODE_SLUG_SCHEMA_V0 =
  "castle.rhizoh.dynamic_satellite_node_slug.v0";

/** @typedef {{ slug: string, lat: number, lon: number, radiusKm: number, nodeId?: string, displayName: string }} CityAnchorV0 */

/** @type {readonly CityAnchorV0[]} */
const CITY_ANCHOR_CATALOG_V0 = Object.freeze([
  Object.freeze({
    slug: "ankara",
    displayName: "Ankara",
    lat: 39.9334,
    lon: 32.8597,
    radiusKm: 90
  }),
  Object.freeze({
    slug: "istanbul_kadikoy",
    displayName: "Kadıköy",
    lat: 40.9909,
    lon: 29.0303,
    radiusKm: 28,
    nodeId: "node:kadikoy_satellite"
  }),
  Object.freeze({
    slug: "besiktas",
    displayName: "Beşiktaş",
    lat: 41.0422,
    lon: 29.0075,
    radiusKm: 18
  }),
  Object.freeze({
    slug: "barcelona",
    displayName: "Barcelona",
    lat: 41.3874,
    lon: 2.1686,
    radiusKm: 45,
    nodeId: "node:barcelona_satellite"
  }),
  Object.freeze({
    slug: "izmir",
    displayName: "İzmir",
    lat: 38.4192,
    lon: 27.1287,
    radiusKm: 55
  }),
  Object.freeze({
    slug: "antalya",
    displayName: "Antalya",
    lat: 36.8969,
    lon: 30.7133,
    radiusKm: 50
  }),
  Object.freeze({
    slug: "london",
    displayName: "London",
    lat: 51.5074,
    lon: -0.1278,
    radiusKm: 60
  }),
  Object.freeze({
    slug: "berlin",
    displayName: "Berlin",
    lat: 52.52,
    lon: 13.405,
    radiusKm: 55
  })
]);

function haversineKmV0(aLat, aLon, bLat, bLon) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * @param {string} raw
 */
export function slugifyPlaceLabelV0(raw) {
  const s = String(raw || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s || "place";
}

/**
 * @param {number} lat
 * @param {number} lon
 * @returns {CityAnchorV0 | null}
 */
export function resolveNearestCityAnchorV0(lat, lon) {
  let best = null;
  let bestKm = Infinity;
  for (const city of CITY_ANCHOR_CATALOG_V0) {
    const km = haversineKmV0(lat, lon, city.lat, city.lon);
    if (km <= city.radiusKm && km < bestKm) {
      best = city;
      bestKm = km;
    }
  }
  return best;
}

/**
 * @param {{ lat: number, lon: number, label?: string }} anchor
 */
export function enrichGeographicAnchorFromWgs84V0(anchor) {
  const lat = Number(anchor.lat);
  const lon = Number(anchor.lon);
  const labelHint = String(anchor.label || "").trim();
  const nearest = resolveNearestCityAnchorV0(lat, lon);

  if (labelHint) {
    const slug = slugifyPlaceLabelV0(labelHint);
    return {
      lat,
      lon,
      zoom: Number(anchor.zoom) || 14,
      label: labelHint,
      placeSlug: slug,
      dynamicSlug: `${slug}_satellite`
    };
  }

  if (nearest) {
    const satelliteSlug = nearest.nodeId
      ? nearest.nodeId.replace(/^node:/, "")
      : `${nearest.slug.replace(/^istanbul_/, "")}_satellite`;
    return {
      lat,
      lon,
      zoom: Number(anchor.zoom) || 14,
      label: nearest.displayName,
      placeSlug: nearest.slug,
      dynamicSlug: satelliteSlug
    };
  }

  const micro = `${lat.toFixed(2).replace(".", "p")}_${lon.toFixed(2).replace(".", "p")}`;
  return {
    lat,
    lon,
    zoom: Number(anchor.zoom) || 14,
    label: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    placeSlug: `geo_${micro}`,
    dynamicSlug: `geo_${micro}_satellite`
  };
}

/**
 * @param {{ lat: number, lon: number, label?: string, placeSlug?: string, dynamicSlug?: string }} anchor
 * @param {import('../continuity/__research__/epistemicIdentityContinuityV0.js').EpistemicFingerprintV0} [fingerprint]
 */
export function deriveDynamicSatelliteNodeIdV0(anchor, fingerprint) {
  const enriched = enrichGeographicAnchorFromWgs84V0(anchor);
  const nearest = resolveNearestCityAnchorV0(enriched.lat, enriched.lon);
  if (nearest?.nodeId) return nearest.nodeId;

  const label = String(anchor.label || enriched.label || "").toLowerCase();
  if (label.includes("kadikoy") || label.includes("kadıköy")) return "node:kadikoy_satellite";
  if (label.includes("barcelona")) return "node:barcelona_satellite";

  const slug = enriched.dynamicSlug?.replace(/_satellite$/, "") || slugifyPlaceLabelV0(label);
  return `node:${slug}_satellite`;
}

export function listCityAnchorCatalogV0() {
  return CITY_ANCHOR_CATALOG_V0;
}
