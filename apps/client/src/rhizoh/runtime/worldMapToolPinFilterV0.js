/**
 * Map-tool pin visibility — SpiralMMO pins only on satellite layer.
 * SPECFLOW: RESEARCH-ONLY
 */

/**
 * @param {object} pin
 * @returns {boolean}
 */
export function isSpiralMMOMapPinV0(pin) {
  return String(pin?.type || "") === "spiralmmo";
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
    return Object.freeze(pins.filter((pin) => isSpiralMMOMapPinV0(pin)));
  }
  return Object.freeze(pins.filter((pin) => !isSpiralMMOMapPinV0(pin)));
}
