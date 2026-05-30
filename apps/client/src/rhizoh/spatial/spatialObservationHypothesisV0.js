/**
 * PR-4-A1 — Sensor observation **hypothesis** ingest (shape + guard; no camera SDK here).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * Sensor → hypothesis only. Never emit definitive user predicates (e.g. `userIsAtDesk: true`)
 * as truth for continuity, memory, or governance.
 */

export const SPATIAL_OBSERVATION_HYPOTHESIS_SCHEMA_V0 = "spatialObservationHypothesis.v0";

/** Keys that must never appear on a hypothesis payload (definitive truth smuggling). */
export const FORBIDDEN_DEFINITIVE_PRESENCE_KEYS_V0 = Object.freeze([
  "userIsAtDesk",
  "userIsPresent",
  "truth",
  "definitive",
  "governanceFact",
  "continuityFact",
  "memoryFact"
]);

/**
 * @typedef {Object} SpatialObservationHypothesisV0
 * @property {string} [inferredUserZone] — registry key or anchor id hint, not truth
 * @property {number} confidence — 0..1
 * @property {string} provenance — e.g. `camera_depth_v0`
 */

/**
 * @param {unknown} h
 * @returns {{ ok: true, hypothesis: SpatialObservationHypothesisV0 } | { ok: false, errors: string[] }}
 */
export function validateSpatialObservationHypothesisV0(h) {
  if (!h || typeof h !== "object" || Array.isArray(h)) {
    return { ok: false, errors: ["hypothesis_not_object"] };
  }
  const o = /** @type {Record<string, unknown>} */ (h);
  for (const banned of FORBIDDEN_DEFINITIVE_PRESENCE_KEYS_V0) {
    if (Object.prototype.hasOwnProperty.call(o, banned)) {
      return { ok: false, errors: [`forbidden_definitive_key:${banned}`] };
    }
  }
  const conf = o.confidence;
  if (typeof conf !== "number" || !Number.isFinite(conf) || conf < 0 || conf > 1) {
    return { ok: false, errors: ["confidence_0_1_required"] };
  }
  const provenance = o.provenance;
  if (typeof provenance !== "string" || provenance.length === 0) {
    return { ok: false, errors: ["provenance_non_empty_string_required"] };
  }
  const inferredUserZone = o.inferredUserZone;
  if (inferredUserZone !== undefined && inferredUserZone !== null && typeof inferredUserZone !== "string") {
    return { ok: false, errors: ["inferredUserZone_string_or_omit"] };
  }
  return {
    ok: true,
    hypothesis: {
      inferredUserZone: typeof inferredUserZone === "string" ? inferredUserZone : undefined,
      confidence: conf,
      provenance
    }
  };
}
