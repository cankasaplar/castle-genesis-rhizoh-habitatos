/**
 * Map viewport bootstrap — regional fit vs world pins; no unsolicited Sarıyer on World · Space.
 */

import { SOVEREIGN_MAP_DEFAULT_HOME_V0 } from "./sovereignWorldMapNodesV0.js";
import {
  resolveUserCastleGeoForMapViewV0,
  resolveWorldMapBootstrapGeoV0
} from "./worldMapBootstrapGeoV0.js";
import { resolvePinSpiralLayerV0 } from "./rhizohMapPinOwnerV0.js";

/** Neutral world view when World · Space has no user anchor. */
export const RHIZOH_WORLD_SPACE_NEUTRAL_VIEW_V0 = Object.freeze({
  lat: 20,
  lon: 0,
  zoom: 3
});

const VIEWPORT_LAT_RADIUS_V0 = 6;
const VIEWPORT_LON_RADIUS_V0 = 10;

/**
 * Nodes used for first fitBounds — excludes distant spiral pins.
 * @param {ReadonlyArray<{ id?: string, type?: string, lat?: number, lon?: number }>} nodes
 * @param {{ worldSpaceNeutral?: boolean, userCastle?: { lat?: number, lon?: number } | null }} [opts]
 */
export function resolveMapViewportFitNodesV0(nodes = [], opts = {}) {
  const userCastle =
    opts.userCastle ?? nodes.find((n) => n.id === "my_castle" || n.type === "my_castle");
  if (
    userCastle &&
    Number.isFinite(Number(userCastle.lat)) &&
    Number.isFinite(Number(userCastle.lon))
  ) {
    const anchorLat = Number(userCastle.lat);
    const anchorLon = Number(userCastle.lon);
    const regional = nodes.filter((n) => {
      const lat = Number(n.lat);
      const lon = Number(n.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
      if (n.id === "my_castle" || n.type === "my_castle") return true;
      if (n.id === "rhizoh_portal" || n.type === "portal") return true;
      if (String(n.type || "") === "spiralmmo" && n.continent === "bootstrap") return true;
      return (
        Math.abs(lat - anchorLat) <= VIEWPORT_LAT_RADIUS_V0 &&
        Math.abs(lon - anchorLon) <= VIEWPORT_LON_RADIUS_V0
      );
    });
    if (regional.length >= 2) return Object.freeze(regional);
    return Object.freeze([userCastle]);
  }
  if (opts.worldSpaceNeutral) {
    return Object.freeze([]);
  }
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

/**
 * World · Space recenter — user castle → bootstrap seed → neutral world (never demo Istanbul cluster).
 */
export function resolveWorldSpaceMapRecenterHomeV0() {
  const castle = resolveUserCastleGeoForMapViewV0();
  if (castle && Number.isFinite(castle.lat) && Number.isFinite(castle.lon)) {
    return Object.freeze({ lat: castle.lat, lon: castle.lon, zoom: 15 });
  }
  const bootstrap = resolveWorldMapBootstrapGeoV0();
  if (bootstrap?.source && bootstrap.source !== "besiktas_fallback") {
    return Object.freeze({ lat: bootstrap.lat, lon: bootstrap.lon, zoom: 14 });
  }
  return RHIZOH_WORLD_SPACE_NEUTRAL_VIEW_V0;
}

/**
 * Fit arena / prism population pins around observation origin (not global sovereign mesh).
 * @param {readonly object[]} nodes
 * @param {{ spiralLayerFilter?: object }} [opts]
 */
export function resolveArenaPopulationViewportFitNodesV0(nodes = [], opts = {}) {
  const populationPins = nodes.filter((n) => resolvePinSpiralLayerV0(n));
  if (populationPins.length >= 1) {
    return Object.freeze(populationPins);
  }
  const anchor = resolveWorldMapBootstrapGeoV0();
  return Object.freeze([{ lat: anchor.lat, lon: anchor.lon }]);
}
