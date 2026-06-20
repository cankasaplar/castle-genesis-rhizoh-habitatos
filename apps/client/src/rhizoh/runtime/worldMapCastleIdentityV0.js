/**
 * Castle identity map — HOME CASTLE (Serencebey) + MY CASTLE pair + memory surface.
 * RESEARCH-ONLY
 */

import { buildOriginHomeSerencebeyPinV0, isOriginHomeSerencebeyPinV0 } from "./worldMapOriginHomePinV0.js";
import { resolveUserCastleGeoForMapViewV0 } from "./worldMapBootstrapGeoV0.js";
import { readActiveSpatialMemoryMapPinsV1 } from "./rhizohSpatialMemoryAnchorV1.js";
import { isCastleRealityModeV0 } from "./spiralMapRealityModeV0.js";
import { readWorldMapMarkerLayerStateV0 } from "./worldMapMarkerLayerStateV0.js";

/**
 * Viewport fit nodes for castle identity mode (HOME + MY cluster).
 * @returns {readonly object[]}
 */
export function resolveCastleIdentityViewportNodesV0() {
  /** @type {object[]} */
  const nodes = [buildOriginHomeSerencebeyPinV0()];
  const userCastle = resolveUserCastleGeoForMapViewV0();
  if (userCastle && Number.isFinite(userCastle.lat) && Number.isFinite(userCastle.lon)) {
    nodes.push(
      Object.freeze({
        id: "my_castle",
        lat: userCastle.lat,
        lon: userCastle.lon,
        label: "MY CASTLE",
        castleIdentityPair: true
      })
    );
  }
  return Object.freeze(nodes);
}

/**
 * Memory beacon rows for Leaflet when castle reality or marker filter allows.
 * @param {object} [filterState]
 */
export function readCastleMemoryMapPinRowsV0(filterState) {
  const markerLayers = readWorldMapMarkerLayerStateV0();
  if (!markerLayers.memoryBeacons && !isCastleRealityModeV0(filterState)) {
    return Object.freeze([]);
  }
  return Object.freeze(
    readActiveSpatialMemoryMapPinsV1()
      .filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lon))
      .map((row) =>
        Object.freeze({
          id: row.id,
          name: row.label || "Memory",
          label: "MEMORY",
          type: "memory_beacon",
          pinType: "memory_beacon",
          lat: Number(row.lat),
          lon: Number(row.lon),
          color: "#c084fc",
          owner: "You",
          description: "Spatial memory node",
          spiralLayer: "castle"
        })
      )
  );
}

/**
 * Tag castle identity pair on sovereign pins for UI affordances.
 * @param {readonly object[]} pins
 */
export function annotateCastleIdentityPinsV0(pins) {
  if (!isCastleRealityModeV0()) return pins;
  return Object.freeze(
    pins.map((pin) => {
      if (pin.id === "my_castle" || isOriginHomeSerencebeyPinV0(pin)) {
        return Object.freeze({ ...pin, castleIdentityPair: true });
      }
      return pin;
    })
  );
}
