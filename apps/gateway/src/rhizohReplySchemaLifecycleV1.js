/**
 * Reply schema lifecycle simulation — gateway / CI / ops only.
 * State machine + registry live in rhizohReplySchemaRegistryV1.js
 * @see docs/RHIZOH_REPLY_SCHEMA_EVOLUTION_GOVERNANCE_V1.md
 */

import {
  RHIZOH_REPLY_SCHEMA_REGISTRY_V1,
  RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1,
  resolveSchemaLifecycleV1
} from "./rhizohReplySchemaRegistryV1.js";

export {
  resolveSchemaLifecycleV1,
  activeSchemaLifecycleSnapshotV1
} from "./rhizohReplySchemaRegistryV1.js";

export const RHIZOH_REPLY_SCHEMA_EVOLUTION_SIM_SCHEMA_V1 = "castle.rhizoh.reply_schema_evolution_sim.v1";

/**
 * @param {string} schemaId
 */
export function findReplySchemaRegistryEntryV1(schemaId) {
  const id = String(schemaId || "").trim();
  if (!id) return null;
  const hit = RHIZOH_REPLY_SCHEMA_REGISTRY_V1.entries.find((e) => e.id === id);
  if (!hit) return null;
  return Object.freeze({
    id: hit.id,
    lifecycle: hit.lifecycle,
    requiredFields: Object.freeze([...hit.requiredFields])
  });
}

/**
 * Counterfactual: would this gateway body violate target schema required fields?
 * @param {Record<string, unknown>} body
 * @param {string} targetSchemaId
 */
export function simulateReplySchemaEvolutionV1(body, targetSchemaId) {
  const target = findReplySchemaRegistryEntryV1(targetSchemaId);
  if (!target) {
    return Object.freeze({
      schema: RHIZOH_REPLY_SCHEMA_EVOLUTION_SIM_SCHEMA_V1,
      wouldBreak: true,
      violations: Object.freeze(["unknown_target_schema"]),
      targetSchemaId: String(targetSchemaId || ""),
      targetLifecycle: "unknown",
      currentRegistry: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
    });
  }
  if (target.lifecycle === "retired") {
    return Object.freeze({
      schema: RHIZOH_REPLY_SCHEMA_EVOLUTION_SIM_SCHEMA_V1,
      wouldBreak: true,
      violations: Object.freeze(["target_schema_retired"]),
      targetSchemaId: target.id,
      targetLifecycle: target.lifecycle,
      currentRegistry: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
    });
  }

  /** @type {string[]} */
  const violations = [];
  const src = body && typeof body === "object" ? body : {};
  for (const field of target.requiredFields) {
    const v = /** @type {Record<string, unknown>} */ (src)[field];
    if (v == null || (typeof v === "string" && !v.trim())) {
      violations.push(`missing_required:${field}`);
    }
  }

  return Object.freeze({
    schema: RHIZOH_REPLY_SCHEMA_EVOLUTION_SIM_SCHEMA_V1,
    wouldBreak: violations.length > 0,
    violations: Object.freeze([...violations]),
    targetSchemaId: target.id,
    targetLifecycle: target.lifecycle,
    currentRegistry: RHIZOH_REPLY_SCHEMA_REGISTRY_SCHEMA_V1
  });
}
