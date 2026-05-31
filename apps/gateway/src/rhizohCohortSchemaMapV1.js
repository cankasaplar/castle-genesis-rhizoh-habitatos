/**
 * Cohort schema pin map v1 — gateway SSOT routing layer.
 * CI controls WHETHER deploy; cohort controls WHICH reality slice is negotiated.
 * @see docs/RHIZOH_REPLY_SCHEMA_EVOLUTION_GOVERNANCE_V1.md
 */

import { RHIZOH_REPLY_SCHEMA_REGISTRY_V1, RHIZOH_REPLY_SCHEMA_V1 } from "./rhizohReplySchemaRegistryV1.js";

export const RHIZOH_COHORT_SCHEMA_MAP_SCHEMA_V1 = "castle.rhizoh.cohort_schema_map.v1";

/** Observation-only pin — v1 body served, shadow metadata only (no render fork). */
export const RHIZOH_REPLY_SCHEMA_V2_SHADOW_V1 = "castle.rhizoh.reply_schema.v2_shadow";

export const COHORT_SCHEMA_MAP_V1 = Object.freeze({
  schema: RHIZOH_COHORT_SCHEMA_MAP_SCHEMA_V1,
  map: Object.freeze({
    cohort_alpha: RHIZOH_REPLY_SCHEMA_V1,
    cohort_beta: RHIZOH_REPLY_SCHEMA_V1,
    cohort_canary: RHIZOH_REPLY_SCHEMA_V2_SHADOW_V1
  })
});

export function currentSchemaV1() {
  return RHIZOH_REPLY_SCHEMA_REGISTRY_V1.current;
}

/**
 * @param {unknown} schemaId
 */
export function isShadowSchemaPinV1(schemaId) {
  return String(schemaId || "").trim() === RHIZOH_REPLY_SCHEMA_V2_SHADOW_V1;
}

/**
 * Single-line resolution: cohort pin → schema id, else current.
 * @param {{ cohortId?: unknown }} input
 */
export function resolveSchemaForRequestV1(input = {}) {
  const cohortId = String(input.cohortId ?? "").trim();
  if (!cohortId) return currentSchemaV1();
  const pinned = COHORT_SCHEMA_MAP_V1.map[cohortId];
  return pinned ?? currentSchemaV1();
}

/**
 * @param {unknown} cohortId
 */
export function resolveCohortPinV1(cohortId) {
  const id = String(cohortId ?? "").trim();
  if (!id) return null;
  const pinnedSchema = COHORT_SCHEMA_MAP_V1.map[id];
  if (!pinnedSchema) {
    return Object.freeze({
      cohortId: id,
      pinnedSchema: null,
      resolvedSchema: currentSchemaV1(),
      unknownCohort: true
    });
  }
  return Object.freeze({
    cohortId: id,
    pinnedSchema,
    resolvedSchema: pinnedSchema,
    unknownCohort: false,
    observationOnly: isShadowSchemaPinV1(pinnedSchema)
  });
}
