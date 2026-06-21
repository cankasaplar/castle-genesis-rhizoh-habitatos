/**
 * Map-tool pin visibility — SpiralMMO pins only on satellite layer.
 * SPECFLOW: RESEARCH-ONLY
 */

import { listSpiralMMOContinentMapPinsV0 } from "./spiralMMOContinentPinsV0.js";

/**
 * @param {string} [activeMapTool]
 * @returns {boolean}
 */
export function isSatelliteWorldMapToolV0(activeMapTool = "city_map") {
  return String(activeMapTool || "city_map") === "satellite";
}

/**
 * @param {object} pin
 * @returns {boolean}
 */
export function isSpiralMMOMapPinV0(pin) {
  return String(pin?.type || "") === "spiralmmo";
}

/**
 * Authoritative satellite pin set — bypasses sovereign / prism merge paths.
 * @returns {ReadonlyArray<object>}
 */
export function listSatelliteSpiralMapPinsV0() {
  return listSpiralMMOContinentMapPinsV0();
}

/**
 * V11 city/streets: regional sovereign mesh (no SpiralMMO).
 * Satellite: SpiralMMO continent + bootstrap pins only.
 * @param {readonly object[]} pins
 * @param {string} [activeMapTool]
 */
export function filterPinsForWorldMapToolV0(pins, activeMapTool = "city_map") {
  const tool = String(activeMapTool || "city_map");
  if (tool === "satellite") {
    return listSatelliteSpiralMapPinsV0();
  }
  return Object.freeze(pins.filter((pin) => !isSpiralMMOMapPinV0(pin)));
}
