/**
 * Map viewport bootstrap — regional fit (Istanbul cluster) vs world pins.
 * Spiral continent pins must not collapse initial camera to planet scale.
 */

import { SOVEREIGN_MAP_DEFAULT_HOME_V0 } from "./sovereignWorldMapNodesV0.js";

const VIEWPORT_LAT_RADIUS_V0 = 6;
const VIEWPORT_LON_RADIUS_V0 = 10;

/**
 * Nodes used for first fitBounds — excludes distant spiral pins.
 * @param {ReadonlyArray<{ id?: string, type?: string, lat?: number, lon?: number }>} nodes
 */
export function resolveMapViewportFitNodesV0(nodes = []) {
  const home = SOVEREIGN_MAP_DEFAULT_HOME_V0;
  const regional = nodes.filter((n) => {
    const lat = Number(n.lat);
    const lon = Number(n.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
    if (String(n.type || "") === "spiralmmo") return false;
    if (n.id === "my_castle" || n.id === "rhizoh_portal" || n.type === "portal") return true;
    return (
      Math.abs(lat - home.lat) <= VIEWPORT_LAT_RADIUS_V0 &&
      Math.abs(lon - home.lon) <= VIEWPORT_LON_RADIUS_V0
    );
  });
  if (regional.length >= 2) return Object.freeze(regional);
  const nonSpiral = nodes.filter((n) => String(n.type || "") !== "spiralmmo");
  if (nonSpiral.length >= 2) return Object.freeze(nonSpiral.slice(0, 12));
  return Object.freeze([{ lat: home.lat, lon: home.lon }]);
}

export function resolveMapViewportHomeV0(userCastle = null) {
  if (userCastle && Number.isFinite(userCastle.lat) && Number.isFinite(userCastle.lon)) {
    return Object.freeze({ lat: userCastle.lat, lon: userCastle.lon, zoom: 15 });
  }
  return Object.freeze({ ...SOVEREIGN_MAP_DEFAULT_HOME_V0 });
}
