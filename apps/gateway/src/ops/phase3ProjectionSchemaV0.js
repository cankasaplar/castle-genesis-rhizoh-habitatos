/**
 * Phase 3 modeled projection — strict schema boundary for G4 "key dimensions".
 * Prevents semantic drift: expanding dimensions loosens gate; narrowing increases false containment.
 * @see docs/ops/PHASE3_OVER_GATING_AND_SCHEMA_BOUNDARY_V1.0.md
 */

export const MODELED_PROJECTION_SCHEMA_V0 = "rhizoh.phase3.modeled_projection.v0.1";

/** Frozen required keys — schema bump required to add/remove. */
export const REQUIRED_MODELED_DIMENSIONS_V0 = Object.freeze([
  "stressClass",
  "responseAction",
  "stressConfidence",
  "actionConfidence"
]);

/** Frozen optional keys (must be declared here to be present). */
export const OPTIONAL_MODELED_DIMENSIONS_V0 = Object.freeze(["modelVariance"]);

export const ALLOWED_MODELED_DIMENSIONS_V0 = Object.freeze([
  ...REQUIRED_MODELED_DIMENSIONS_V0,
  ...OPTIONAL_MODELED_DIMENSIONS_V0
]);

/**
 * @param {Record<string, unknown>} dimensions
 */
export function validateModeledProjectionDimensionsV0(dimensions = {}) {
  const present = Object.keys(dimensions);
  const missing = REQUIRED_MODELED_DIMENSIONS_V0.filter(
    (k) => dimensions[k] === undefined || dimensions[k] === null || dimensions[k] === ""
  );
  const unknown = present.filter((k) => !ALLOWED_MODELED_DIMENSIONS_V0.includes(k));
  const pass = missing.length === 0 && unknown.length === 0;

  return Object.freeze({
    schema: MODELED_PROJECTION_SCHEMA_V0,
    pass,
    missing: Object.freeze([...missing]),
    unknown: Object.freeze([...unknown]),
    allowed: ALLOWED_MODELED_DIMENSIONS_V0,
    reason: !pass
      ? unknown.length
        ? "unknown_dimension_not_in_schema"
        : "required_dimension_missing"
      : null
  });
}

/**
 * @param {object} modeledFields from modelProjectionPhase3V0
 */
export function extractModeledKeyDimensionsV0(modeledFields) {
  return Object.freeze({
    stressClass: modeledFields.stressClass,
    responseAction: modeledFields.responseAction,
    stressConfidence: modeledFields.stressConfidence,
    actionConfidence: modeledFields.actionConfidence,
    modelVariance: modeledFields.modelVariance
  });
}
