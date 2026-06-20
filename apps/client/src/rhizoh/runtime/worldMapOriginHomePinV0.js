/**
 * Permanent Serencebey origin_home pin — immutable world seed, independent of user castle.
 * RESEARCH-ONLY
 * @see docs/RHIZOH_EXPLORER_MAP_OBSERVER_ORIGIN_V0.md
 */

import { ORIGIN_SEED_SERENCEBEY_V0 } from "./memoryAnchorSystemV0.js";

export const ORIGIN_HOME_SERENCEBEY_PIN_ID_V0 = "origin_home_serencebey";

/**
 * Kalıcı Serencebey home castle — always visible on V11 map (explorer-only included).
 * @returns {object}
 */
export function buildOriginHomeSerencebeyPinV0() {
  const seed = ORIGIN_SEED_SERENCEBEY_V0;
  const lat = Number(seed.location?.lat);
  const lon = Number(seed.location?.lon);
  return Object.freeze({
    id: ORIGIN_HOME_SERENCEBEY_PIN_ID_V0,
    anchorId: seed.anchor_id,
    name: seed.label || "Serencebey Castle",
    label: "HOME CASTLE",
    type: "origin_home",
    pinRole: "semantic_gravity_seed",
    lat,
    lon,
    color: "#eab308",
    owner: "Rhizoh",
    immutable: true,
    description:
      "Kalıcı Serencebey home castle — evren tohumu. Explorer gözlemin buradan bağımsızdır."
  });
}

/**
 * @param {object} pin
 * @returns {boolean}
 */
export function isOriginHomeSerencebeyPinV0(pin) {
  if (!pin || typeof pin !== "object") return false;
  return (
    pin.id === ORIGIN_HOME_SERENCEBEY_PIN_ID_V0 ||
    String(pin.type || "") === "origin_home" ||
    pin.anchorId === ORIGIN_SEED_SERENCEBEY_V0.anchor_id
  );
}
