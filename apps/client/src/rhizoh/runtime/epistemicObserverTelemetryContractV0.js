/**
 * Phase 9.4.4a — Observer telemetry contract (read-only; no witness write).
 */

export const OBSERVER_TELEMETRY_SCHEMA_V0 = "castle.rhizoh.observer_telemetry.v0.4.4a";

export const OBSERVER_TELEMETRY_EVENT_KIND_V0 = Object.freeze({
  OBSERVER_ACTION: "observer_action"
});

export const OBSERVER_ACTION_KIND_V0 = Object.freeze({
  MANIFOLD_NAV: "manifold_nav",
  CAMERA_KEY: "camera_key",
  POI_SELECT: "poi_select"
});

/**
 * @typedef {Object} ObserverActionPayloadV0
 * @property {string} schema
 * @property {string} action
 * @property {string} source
 * @property {Record<string, unknown>} meta
 * @property {boolean} witnessWrite
 * @property {boolean} feedbackLoop
 */
