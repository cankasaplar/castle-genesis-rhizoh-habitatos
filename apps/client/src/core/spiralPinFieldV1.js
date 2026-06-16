/**
 * Spiral pin field v1 — pins are event generators, not raw events.
 */

import { listSpiralMMOContinentMapPinsV0 } from "../rhizoh/runtime/spiralMMOContinentPinsV0.js";
import { deriveDeterministicLayerSeedV0 } from "./simulationDeviceParityV0.js";

export const RHIZOH_SPIRAL_PIN_FIELD_SCHEMA_V1 = "castle.rhizoh.spiral_pin_field.v1";

export const SPIRAL_PIN_EMITS_V1 = Object.freeze([
  "GHOST_SPAWN",
  "GHOST_DEATH",
  "DIMENSIONAL_COLLAPSE",
  "AWAKEN"
]);

/**
 * @returns {ReadonlyArray<object>}
 */
export function listSpiralPinFieldV1() {
  const pins = listSpiralMMOContinentMapPinsV0();
  return Object.freeze(
    pins.map((pin, index) =>
      Object.freeze({
        schema: RHIZOH_SPIRAL_PIN_FIELD_SCHEMA_V1,
        id: pin.id || `spiral_pin_${index}`,
        type: "SPIRAL_ANCHOR",
        continent: pin.continent || "",
        seed: deriveDeterministicLayerSeedV0(88291, index + 1),
        emits: SPIRAL_PIN_EMITS_V1,
        lat: pin.lat,
        lon: pin.lon
      })
    )
  );
}

/**
 * @param {string} pinId
 */
export function resolveSpiralPinGeneratorV1(pinId) {
  const field = listSpiralPinFieldV1();
  return field.find((p) => p.id === pinId) || null;
}

/**
 * Generate canonical event payloads from a pin interaction (deterministic).
 * @param {string} pinId
 * @param {string} interaction
 */
export function generatePinEventsV1(pinId, interaction = "click") {
  const pin = resolveSpiralPinGeneratorV1(pinId);
  if (!pin) return Object.freeze({ ok: false, reason: "unknown_pin", events: [] });

  const events = [
    Object.freeze({
      type: "AWAKEN",
      payload: Object.freeze({
        pin: pin.continent,
        triggerPinId: pin.id,
        cycleSeed: pin.seed,
        interaction
      })
    })
  ];

  return Object.freeze({ ok: true, pin, events: Object.freeze(events) });
}
