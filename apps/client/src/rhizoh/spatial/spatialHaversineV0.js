/**
 * Shared haversine distance (v0) for Rhizoh spatial modules.
 * Pure numeric; no Cesium / DOM.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} km
 */
export function haversineDistanceKmV0(lat1, lon1, lat2, lon2) {
  const r = (Math.PI / 180) / 1;
  const φ1 = lat1 * r;
  const φ2 = lat2 * r;
  const Δφ = (lat2 - lat1) * r;
  const Δλ = (lon2 - lon1) * r;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}
