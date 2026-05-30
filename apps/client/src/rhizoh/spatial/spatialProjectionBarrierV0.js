/**
 * PR-4-B — Projection / presence render barrier (not an agent renderer).
 * SPECFLOW: **RESEARCH-ONLY**
 *
 * **Law:** Projection systems may express spatial state, but may not infer human intent.
 *
 * Prevents drift toward “Can is working / sad / left the room” when gaze, pose, or occupancy
 * arrive later — those stay hypotheses upstream; this layer stays render-only numeric cues.
 *
 * Also: projection artifacts must not carry continuity truth, semantic cognition payloads, or
 * identity truth keys (enforced by forbidden key sets + optional strict bundles).
 *
 * **PR-4-C — One-way sensor ingress:** telemetry may carry occupancy / light level / temperature;
 * it must not carry inferred emotional or social “truth” (`assertSensorTelemetryHasNoTruthInferenceV0`).
 */

/** Sensor → runtime path: forbidden “truth inference” smuggling (not raw physics). */
export const FORBIDDEN_SENSOR_TRUTH_INFERENCE_KEYS_V0 = Object.freeze([
  "emotionalTruth",
  "relationshipStatus",
  "productivityState",
  "vulnerabilityInference",
  "inferredMood",
  "inferredIntention",
  "behavioralManipulationPlan"
]);

export const ONE_WAY_SENSOR_PROJECTION_LAW_V0 =
  "Sensor telemetry may report physics and occupancy; it must not assert emotional truth, social status, or vulnerability.";

/**
 * @param {unknown} record
 * @returns {{ ok: true } | { ok: false, code: "SENSOR_TRUTH_INFERENCE_FORBIDDEN", key: string }}
 */
export function assertSensorTelemetryHasNoTruthInferenceV0(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return { ok: true };
  const o = /** @type {Record<string, unknown>} */ (record);
  for (const k of Object.keys(o)) {
    if (FORBIDDEN_SENSOR_TRUTH_INFERENCE_KEYS_V0.includes(k)) {
      return { ok: false, code: "SENSOR_TRUTH_INFERENCE_FORBIDDEN", key: k };
    }
  }
  return { ok: true };
}

/** Constitutional sentence for audits and agent context. */
export const PROJECTION_INTENT_BARRIER_LAW_V0 =
  "Projection systems may express spatial state, but may not infer human intent.";

/** Keys that must never appear on projection / field / spatial-audio runtime outputs. */
export const FORBIDDEN_HUMAN_INTENT_KEYS_V0 = Object.freeze([
  "humanIntent",
  "userIsWorking",
  "userMood",
  "userLeftRoom",
  "userIsAtDesk",
  "detectedEmotion",
  "semanticUserState",
  "conversationalContext",
  "identityTruth",
  "continuityTruth",
  "governanceFact",
  "memoryFact"
]);

/**
 * @param {unknown} record
 * @returns {{ ok: true } | { ok: false, code: "INTENT_INFERENCE_FORBIDDEN", key: string }}
 */
export function assertNoHumanIntentInferenceInArtifactV0(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return { ok: true };
  const o = /** @type {Record<string, unknown>} */ (record);
  for (const k of Object.keys(o)) {
    if (FORBIDDEN_HUMAN_INTENT_KEYS_V0.includes(k)) {
      return { ok: false, code: "INTENT_INFERENCE_FORBIDDEN", key: k };
    }
  }
  return { ok: true };
}

/**
 * @param {unknown} record
 * @param {readonly string[]} allowedKeys — strict surface for a subsystem bundle
 */
export function assertProjectionBundleKeyAllowlistV0(record, allowedKeys) {
  const allow = new Set(allowedKeys);
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { ok: false, code: "PROJECTION_BUNDLE_INVALID", key: "" };
  }
  const o = /** @type {Record<string, unknown>} */ (record);
  for (const k of Object.keys(o)) {
    if (!allow.has(k)) return { ok: false, code: "PROJECTION_KEY_NOT_ALLOWLISTED", key: k };
  }
  const intent = assertNoHumanIntentInferenceInArtifactV0(record);
  if (!intent.ok) return intent;
  return { ok: true };
}
