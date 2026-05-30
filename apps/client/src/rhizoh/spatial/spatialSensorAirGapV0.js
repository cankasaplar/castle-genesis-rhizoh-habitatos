/**
 * PR-4 — Sensor air-gap: spatial sensor path cannot mutate epistemic authority stores.
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * **Law:** `SPATIAL_SENSOR_LAYER` cannot mutate `EPISTEMIC_RUNTIME` (or continuity / identity / governance truth).
 *
 * Allowed influences stay in render, projection, spatial audio, and ambient reaction surfaces —
 * never identity overwrite, emotional overwrite, or continuity mutation.
 *
 * PR-4-C (hardware coupling): coarse effect ids above are routed through
 * `spatialHardwareEffectContractV0.js`, rate limits (`spatialProjectionRateLimiterV0.js`),
 * and provenance (`spatialProjectionProvenanceV0.js`) before device adapters.
 */

import { SPATIAL_LAYERS_V0 } from "./spatialPresenceConstitutionV0.js";

export const SPATIAL_SENSOR_AIR_GAP_LAW_V0 =
  "SPATIAL_SENSOR_LAYER cannot mutate epistemic runtime, continuity memory, identity truth, or governance fact.";

/** Effects the sensor layer may *request* (downstream must still respect constitution). */
export const ALLOWED_SPATIAL_SENSOR_EFFECTS_V0 = Object.freeze([
  "render",
  "projection",
  "spatial_audio",
  "ambient_reaction"
]);

/** Hard reject if code tries to route spatial sensor output into these sinks. */
export const FORBIDDEN_SPATIAL_SENSOR_MUTATION_TARGETS_V0 = Object.freeze([
  "epistemic_runtime",
  "continuity_memory",
  "identity_truth",
  "governance_fact",
  "memory_fact"
]);

/**
 * @param {string} effectId
 * @returns {{ ok: true } | { ok: false, code: "SPATIAL_EFFECT_REJECTED", effectId: string }}
 */
export function assertSpatialSensorEffectAllowedV0(effectId) {
  const id = String(effectId || "").trim();
  if (!id) return { ok: false, code: "SPATIAL_EFFECT_REJECTED", effectId: String(effectId) };
  if (!ALLOWED_SPATIAL_SENSOR_EFFECTS_V0.includes(id)) {
    return { ok: false, code: "SPATIAL_EFFECT_REJECTED", effectId: id };
  }
  return { ok: true };
}

/**
 * @param {string} sinkOrStoreId
 * @returns {{ ok: true } | { ok: false, code: "SPATIAL_SENSOR_MUTATION_REJECTED", target: string }}
 */
export function assertSpatialSensorCannotMutateTargetV0(sinkOrStoreId) {
  const t = String(sinkOrStoreId || "").trim();
  if (!t) return { ok: false, code: "SPATIAL_SENSOR_MUTATION_REJECTED", target: String(sinkOrStoreId) };
  if (FORBIDDEN_SPATIAL_SENSOR_MUTATION_TARGETS_V0.includes(t)) {
    return { ok: false, code: "SPATIAL_SENSOR_MUTATION_REJECTED", target: t };
  }
  return { ok: true };
}

/** Witness for logs / audits. */
export function spatialSensorLayerIdV0() {
  return SPATIAL_LAYERS_V0.SPATIAL_SENSOR_LAYER;
}
