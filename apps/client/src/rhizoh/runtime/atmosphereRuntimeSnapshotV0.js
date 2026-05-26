/**
 * PR-2.5 — Last **observation envelope** for UI-only consumers (`RhizohAtmosphereRenderer`).
 *
 * @see observationEnvelopeV0.js
 */

/** @type {null | Readonly<Record<string, unknown>>} */
let _envelope = null;

/**
 * @param {Readonly<Record<string, unknown>> | null} envelope
 */
export function setObservationEnvelopeForUiV0(envelope) {
  _envelope = envelope && typeof envelope === "object" ? envelope : null;
}

export function getObservationEnvelopeForUiV0() {
  return _envelope;
}

export function clearObservationEnvelopeForUiV0() {
  _envelope = null;
}

/** @deprecated use `clearObservationEnvelopeForUiV0` */
export function clearAtmosphereRuntimeLastTickForUiV0() {
  clearObservationEnvelopeForUiV0();
}
