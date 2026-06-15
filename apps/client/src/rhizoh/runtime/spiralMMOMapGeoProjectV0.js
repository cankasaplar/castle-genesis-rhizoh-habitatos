/**
 * SpiralMMO map ↔ overlay geo projection (shared percent space).
 */

/** Shift overlay + cube targets downward so northern pins stay visible. */
export const SPIRAL_MMO_MAP_VIEW_Y_BIAS_PCT_V0 = 6;

/**
 * @param {number} lat
 * @param {number} lon
 */
export function spiralMMOMapGeoToPercentV0(lat, lon) {
  const x = ((Number(lon) + 180) / 360) * 100;
  const clampedLat = Math.max(-70, Math.min(70, Number(lat)));
  const y = ((70 - clampedLat) / 140) * 100 + SPIRAL_MMO_MAP_VIEW_Y_BIAS_PCT_V0;
  return {
    x: Math.max(4, Math.min(96, x)),
    y: Math.max(12, Math.min(88, y))
  };
}
