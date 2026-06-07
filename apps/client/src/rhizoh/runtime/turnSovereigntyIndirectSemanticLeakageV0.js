/**
 * Indirect semantic leakage firewall — observation must not reach execution surfaces
 * via prompt composition, debug injection, or consistency-hint string concatenation.
 * @see apps/client/docs/RHIZOH_BEHAVIORAL_TURN_SOVEREIGNTY_V0.md §16
 */

import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import { FORBIDDEN_AUTHORITY_INPUT_KEYS_V0 } from "./turnSovereigntyObservationExecutionInvariantV0.js";
import { SOVEREIGNTY_VIOLATION_V0 } from "./behavioralTurnSovereigntyV0.js";

export const INDIRECT_SEMANTIC_LEAKAGE_SCHEMA_V0 =
  "castle.rhizoh.turn_sovereignty.indirect_semantic_leakage.v0";

/** Context keys that must never appear on LLM / system prompt execution paths. */
export const FORBIDDEN_EXECUTION_CONTEXT_KEYS_V0 = Object.freeze([
  ...FORBIDDEN_AUTHORITY_INPUT_KEYS_V0,
  "behavioralDrift",
  "turnBehaviorConsistency",
  "calibrationGovernor",
  "calibrationProposals",
  "selfExplanation",
  "sevenDayPattern",
  "identityCoherenceMetric",
  "authorityVolatilityScore",
  "presenceStabilityIndex",
  "cubeFoxInfluenceDecay",
  "observationDebug",
  "consistencyHint",
  "driftReport",
  "behaviorConsistencyRates"
]);

/** Substrings that indicate observation layer text leaked into prompt composition. */
export const OBSERVATION_SEMANTIC_MARKERS_V0 = Object.freeze([
  /elevated_silent_observe/i,
  /no_lock_escape_pressure/i,
  /low_llm_conversation_share/i,
  /identity\s*coherence/i,
  /presence\s*stability/i,
  /authority\s*volatility/i,
  /behavioral\s*drift/i,
  /turn\s*behavior\s*consistency/i,
  /selfExplanation/i,
  /observation\s*layer\s*does\s*not\s*influence/i,
  /consistency\s*hint/i,
  /driftSignals/i,
  /silentOverrideHeatmap/i,
  /calibration\s*governor/i,
  /ben\s*neden\s*böyle\s*davran/i
]);

const REDACTED_V0 = "[OBSERVATION_STRIPPED]";

/**
 * @param {string} text
 */
function scanTextMarkersV0(text) {
  const s = String(text || "");
  if (!s) return [];
  return OBSERVATION_SEMANTIC_MARKERS_V0.filter((re) => re.test(s)).map((re) => re.source);
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {string[]} hits
 */
function walkForLeakageV0(value, path, hits) {
  if (value == null) return;
  if (typeof value === "string") {
    const markers = scanTextMarkersV0(value);
    if (markers.length) hits.push(`${path}:marker(${markers.join("|")})`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => walkForLeakageV0(item, `${path}[${i}]`, hits));
    return;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (FORBIDDEN_EXECUTION_CONTEXT_KEYS_V0.includes(k)) {
        hits.push(`${path}.${k}:forbidden_key`);
      }
      walkForLeakageV0(v, `${path}.${k}`, hits);
    }
  }
}

/**
 * @param {unknown} payload
 */
export function scanIndirectSemanticLeakageV0(payload) {
  const hits = [];
  walkForLeakageV0(payload, "root", hits);
  return Object.freeze({
    clean: hits.length === 0,
    hits: Object.freeze([...hits])
  });
}

/**
 * Deep-sanitize execution payload — strip forbidden keys and redact marker substrings in strings.
 * @param {unknown} payload
 */
export function sanitizeExecutionPayloadV0(payload) {
  if (payload == null) return payload;
  if (typeof payload === "string") {
    let out = payload;
    for (const re of OBSERVATION_SEMANTIC_MARKERS_V0) {
      if (re.test(out)) out = out.replace(re, REDACTED_V0);
    }
    return out;
  }
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeExecutionPayloadV0(item));
  }
  if (typeof payload !== "object") return payload;

  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    if (FORBIDDEN_EXECUTION_CONTEXT_KEYS_V0.includes(k)) continue;
    out[k] = sanitizeExecutionPayloadV0(v);
  }
  return out;
}

/**
 * Audit + sanitize before writing to execution surfaces (LLM context, system prompt, TTS text).
 * @param {{
 *   surface: string,
 *   payload: unknown,
 *   moduleId?: string,
 *   turnId?: string
 * }} input
 */
export function guardExecutionSurfaceAgainstObservationLeakageV0(input = {}) {
  const surface = String(input.surface || "unknown");
  const moduleId = String(input.moduleId || "unknown");
  const turnId = String(input.turnId || "");
  const scan = scanIndirectSemanticLeakageV0(input.payload);
  const sanitized = sanitizeExecutionPayloadV0(input.payload);

  if (!scan.clean) {
    logCastleLifecycleV0("TURN_SOVEREIGNTY_SEMANTIC_LEAK", {
      schema: INDIRECT_SEMANTIC_LEAKAGE_SCHEMA_V0,
      turnId,
      surface,
      moduleId,
      hits: scan.hits,
      violation: {
        code: SOVEREIGNTY_VIOLATION_V0.SHADOW_LEAK,
        reason: "indirect_semantic_observation_leakage"
      },
      stripped: true
    });
  }

  return Object.freeze({
    allowed: true,
    sanitized,
    scan,
    violation: scan.clean
      ? null
      : Object.freeze({
          code: SOVEREIGNTY_VIOLATION_V0.SHADOW_LEAK,
          reason: "indirect_semantic_observation_leakage",
          hits: scan.hits
        })
  });
}
