/**
 * Observability ↔ cognition firewall (v0).
 * Influence measurement must NOT steer LLM/depth/memory unless explicitly enabled.
 */

export const RHIZOH_INFLUENCE_OBSERVABILITY_SCHEMA_V0 = "castle.rhizoh.influence_observability.v0";
export const RHIZOH_INFLUENCE_FEEDBACK_SCHEMA_V0 = "castle.rhizoh.influence_feedback_signal.v0";

/** Cognitive path may read observability; observability must never write cognitive state (default). */
export const RHIZOH_OBSERVATION_EXECUTION_BOUNDARY_V0 = Object.freeze({
  observabilityMutatesExecution: false,
  cognitiveReadsObservability: false,
  feedbackLoopDefault: "off"
});

/**
 * @returns {boolean}
 */
export function isInfluenceObservabilityVerboseV0() {
  try {
    if (import.meta.env?.DEV) return true;
    return String(import.meta.env?.VITE_RHIZOH_INFLUENCE_VERBOSE || "") === "1";
  } catch {
    return false;
  }
}

/**
 * Experimental — default OFF. When off, feedback signal is computed but never applied.
 * @returns {boolean}
 */
export function isInfluenceFeedbackToCognitionEnabledV0() {
  try {
    return String(import.meta.env?.VITE_RHIZOH_INFLUENCE_FEEDBACK || "") === "1";
  } catch {
    return false;
  }
}

/**
 * @param {Record<string, number>} scores
 * @returns {Record<string, number>}
 */
function normalizeLayerWeightsV0(scores) {
  const entries = Object.entries(scores || {}).filter(([, v]) => Number(v) > 0);
  const sum = entries.reduce((a, [, v]) => a + Number(v), 0) || 1;
  const out = {};
  for (const [k, v] of entries) {
    out[k] = Math.round((Number(v) / sum) * 1000) / 1000;
  }
  return out;
}

/**
 * Future turn weights — derived from measurement only; not applied unless feedback flag on.
 * @param {ReturnType<import("./rhizohConversationInfluenceInstrumentationV0.js").buildRhizohTurnInfluencePreLlmV0>} pre
 * @param {ReturnType<import("./rhizohConversationInfluenceInstrumentationV0.js").buildRhizohInfluenceDeltaV0> | null} [post]
 */
export function buildInfluenceFeedbackSignalV0(pre, post = null) {
  const scores = post?.shaperScores || pre?.shaperScores || {};
  const layerWeights = normalizeLayerWeightsV0({
    depth: scores.depth,
    narrative: scores.narrative,
    academy: scores.academy,
    continuity: scores.continuity,
    router: scores.router
  });
  const enabled = isInfluenceFeedbackToCognitionEnabledV0();
  return Object.freeze({
    schema: RHIZOH_INFLUENCE_FEEDBACK_SCHEMA_V0,
    traceId: pre?.traceId ?? null,
    enabled,
    appliedToNextTurn: false,
    layerWeights,
    dominantShaper: post?.dominantShaper ?? pre?.dominantShaper ?? null,
    note: enabled
      ? "EXPERIMENTAL_FEEDBACK_ON"
      : "MEASUREMENT_ONLY_NOT_APPLIED_TO_COGNITION"
  });
}

/**
 * @template T
 * @param {T} cognitiveInput
 * @param {ReturnType<typeof buildInfluenceFeedbackSignalV0>} signal
 * @returns {T}
 */
export function applyInfluenceFeedbackToCognitionV0(cognitiveInput, signal) {
  if (!signal?.enabled || !isInfluenceFeedbackToCognitionEnabledV0()) {
    return cognitiveInput;
  }
  // Experimental hook only — v0 does not mutate depth/memory when flag is on either (next sprint).
  return cognitiveInput;
}
