/**
 * Pet spatial geo v0 — RCAL xy → WGS84 (Istanbul bootstrap window).
 * No local clock; height from T0 breathe via citizen read.
 */

import { ISTANBUL_GEO } from "../../castleFlight/geo.js";

export const PET_SPATIAL_GEO_SCHEMA_V0 = "castle.rhizoh.pet_spatial_geo.v0";

/**
 * @param {number} x RCAL normalized x
 * @param {number} y RCAL normalized y
 * @param {{ breathe01?: number }} [citizen]
 */
export function rcalXYToCartographicV0(x, y, citizen = null) {
  const latSpan = ISTANBUL_GEO.latMax - ISTANBUL_GEO.latMin;
  const lonSpan = ISTANBUL_GEO.lonMax - ISTANBUL_GEO.lonMin;
  const latMid = (ISTANBUL_GEO.latMin + ISTANBUL_GEO.latMax) / 2;
  const lonMid = (ISTANBUL_GEO.lonMin + ISTANBUL_GEO.lonMax) / 2;
  const breathe01 = Math.max(0, Math.min(1, Number(citizen?.breathe01) || 0));

  return Object.freeze({
    schema: PET_SPATIAL_GEO_SCHEMA_V0,
    lat: latMid + Number(y) * latSpan * 0.35,
    lon: lonMid + Number(x) * lonSpan * 0.35,
    heightM: 95 + breathe01 * 110,
    world_projection: true
  });
}

/**
 * @param {ReturnType<import("../runtime/rhizohPetCitizenRuntimeV0.js").readPetCitizenV0>} citizen
 */
export function buildPetSpatialBindingSnapshotV0(citizen) {
  if (!citizen?.inhabited || !citizen.position) {
    return Object.freeze({
      schema: PET_SPATIAL_GEO_SCHEMA_V0,
      bound: false,
      cesium_bound: false,
      cartographic: null
    });
  }
  const cartographic = rcalXYToCartographicV0(
    citizen.position.x,
    citizen.position.y,
    citizen
  );
  return Object.freeze({
    schema: PET_SPATIAL_GEO_SCHEMA_V0,
    bound: true,
    cesium_bound: false,
    cartographic,
    coherence_id: citizen.coherence_id,
    masterNowMs: citizen.masterNowMs
  });
}
