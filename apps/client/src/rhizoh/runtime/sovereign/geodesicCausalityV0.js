/**
 * Phase 21a — Geodesic causality (world curvature + epistemic field lift).
 * Visual only — not navigation or execution physics.
 */

import * as Cesium from "cesium";

export const GEODESIC_CAUSALITY_SCHEMA_V0 = "castle.rhizoh.geodesic_causality.v0.21a";

/**
 * Ellipsoid geodesic arc with epistemic altitude bulge (field coupling visual).
 *
 * @param {number} lon1
 * @param {number} lat1
 * @param {number} lon2
 * @param {number} lat2
 * @param {{ steps?: number, baseAltM?: number, bulgeAltM?: number, fieldCoupling?: number }} [opts]
 * @returns {import("cesium").Cartesian3[]}
 */
export function buildGeodesicArcPositionsV0(lon1, lat1, lon2, lat2, opts = {}) {
  const steps = Number(opts.steps) || 64;
  const baseAltM = Number(opts.baseAltM) || 6000;
  const bulgeAltM = Number(opts.bulgeAltM) || 20000;
  const fieldCoupling = Math.min(1, Math.max(0, Number(opts.fieldCoupling) ?? 0.5));

  const start = Cesium.Cartographic.fromDegrees(lon1, lat1, 0);
  const end = Cesium.Cartographic.fromDegrees(lon2, lat2, 0);
  const geodesic = new Cesium.EllipsoidGeodesic(start, end, Cesium.Ellipsoid.WGS84);

  const positions = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const carto = geodesic.interpolateUsingFraction(t);
    const bulge = Math.sin(t * Math.PI);
    carto.height = baseAltM + bulge * bulgeAltM * fieldCoupling;
    positions.push(Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto));
  }
  return positions;
}

/**
 * @param {import("cesium").Cartesian3[]} positions
 */
export function geodesicArcLengthMetersV0(positions) {
  if (!positions || positions.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < positions.length; i += 1) {
    sum += Cesium.Cartesian3.distance(positions[i - 1], positions[i]);
  }
  return sum;
}
