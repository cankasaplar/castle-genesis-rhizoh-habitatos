/**
 * Epistemic Return Field v0 — pattern familiarity without memory or identity.
 * Mode B default: recognize behavior shape, not user.
 * @see docs/RHIZOH_EPISTEMIC_RETURN_FIELD_V0.md
 */

import { buildVisitorEpistemicFingerprintV0 } from "./visitorEpistemicFingerprintV0.js";
import { getVisitorEpistemicTraceV0 } from "./visitorEpistemicTraceV0.js";

export const EPISTEMIC_RETURN_FIELD_SCHEMA_V0 = "castle.rhizoh.epistemic_return_field.v0";

export const EPISTEMIC_RETURN_MODE_V0 = Object.freeze({
  STRICT_ANONYMOUS: "strict_anonymous",
  EPISTEMIC_FAMILIARITY: "epistemic_familiarity"
});

const PATTERN_ECHO_KEY_V0 = "rhizoh.epistemic_pattern_echo.v0";

/** @type {string} */
let activeModeV0 = EPISTEMIC_RETURN_MODE_V0.EPISTEMIC_FAMILIARITY;

function readPatternEchoV0() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(PATTERN_ECHO_KEY_V0);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writePatternEchoV0(row) {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(PATTERN_ECHO_KEY_V0, JSON.stringify(row));
    }
  } catch {
    /* noop */
  }
}

function cosineSimilarityV0(a, b, keys) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const key of keys) {
    const av = Number(a?.[key] ?? 0);
    const bv = Number(b?.[key] ?? 0);
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function computeFamiliarityV0(fingerprint, echo, visitor) {
  const keys = ["map", "chess", "castle", "media", "chat"];
  const patternSim = echo?.attention_pattern
    ? cosineSimilarityV0(fingerprint.attention_pattern, echo.attention_pattern, keys)
    : 0;

  const signatureMatch =
    echo?.last_session_signature && echo.last_session_signature === fingerprint.session_signature
      ? 0.35
      : 0;

  const sessions = Number(visitor?.sessions ?? 0) || 0;
  const sessionPrior = Math.min(0.35, Math.max(0, sessions - 1) * 0.12);
  const stability = Number(fingerprint.stability_index ?? 0) * 0.25;
  const likelihood = Number(fingerprint.return_likelihood ?? 0) * 0.2;

  const raw = patternSim * 0.45 + signatureMatch + sessionPrior + stability + likelihood;
  return Math.round(Math.min(0.98, raw) * 100) / 100;
}

function resolveRecognitionV0(familiarity) {
  if (familiarity >= 0.55) return "recurring_pattern";
  if (familiarity >= 0.22) return "pattern_only";
  return "none";
}

function mergeStatisticalEchoV0(echo, fingerprint, visitor) {
  const keys = ["map", "chess", "castle", "media", "chat"];
  const prior = echo?.attention_pattern || {};
  const blend = keys.reduce((acc, key) => {
    const p = Number(prior[key] ?? 0);
    const n = Number(fingerprint.attention_pattern?.[key] ?? 0);
    acc[key] = Math.round((p * 0.55 + n * 0.45) * 1000) / 1000;
    return acc;
  }, /** @type {Record<string, number>} */ ({}));

  return Object.freeze({
    schema: "castle.rhizoh.epistemic_pattern_echo.v0",
    attention_pattern: blend,
    last_session_signature: fingerprint.session_signature,
    sessions_seen: Number(visitor?.sessions ?? echo?.sessions_seen ?? 0) || 0,
    updatedAtMs: Date.now(),
    isMemory: false,
    isPatternEcho: true,
    statisticalOnly: true
  });
}

export function getEpistemicReturnModeV0() {
  return activeModeV0;
}

/**
 * @param {string} mode
 */
export function setEpistemicReturnModeV0(mode) {
  if (Object.values(EPISTEMIC_RETURN_MODE_V0).includes(mode)) {
    activeModeV0 = mode;
  }
  return activeModeV0;
}

/**
 * @param {object} [visitor]
 */
export function evaluateEpistemicReturnFieldV0(visitor) {
  const visitorSnap = visitor ?? getVisitorEpistemicTraceV0();
  const echo = readPatternEchoV0();
  const fingerprint = buildVisitorEpistemicFingerprintV0({
    visitor: visitorSnap,
    priorAttentionPattern: echo?.attention_pattern
  });

  if (activeModeV0 === EPISTEMIC_RETURN_MODE_V0.STRICT_ANONYMOUS) {
    return Object.freeze({
      schema: EPISTEMIC_RETURN_FIELD_SCHEMA_V0,
      mode: activeModeV0,
      familiarity: 0,
      recognition: "none",
      memory: false,
      continuity: "none",
      fingerprint,
      influencesCausalGraph: false,
      influencesIdentity: false,
      isMemory: false,
      reconstructionOnly: true
    });
  }

  const familiarity = computeFamiliarityV0(fingerprint, echo, visitorSnap);
  const recognition = resolveRecognitionV0(familiarity);
  writePatternEchoV0(mergeStatisticalEchoV0(echo, fingerprint, visitorSnap));

  return Object.freeze({
    schema: EPISTEMIC_RETURN_FIELD_SCHEMA_V0,
    mode: EPISTEMIC_RETURN_MODE_V0.EPISTEMIC_FAMILIARITY,
    familiarity,
    recognition,
    memory: false,
    continuity: familiarity > 0 ? "statistical" : "none",
    fingerprint,
    returnLikelihood: fingerprint.return_likelihood,
    stabilityIndex: fingerprint.stability_index,
    influencesCausalGraph: false,
    influencesIdentity: false,
    isMemory: false,
    reconstructionOnly: true
  });
}

export function clearEpistemicReturnFieldForTestV0() {
  activeModeV0 = EPISTEMIC_RETURN_MODE_V0.EPISTEMIC_FAMILIARITY;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(PATTERN_ECHO_KEY_V0);
    }
  } catch {
    /* noop */
  }
}

export function mountEpistemicReturnFieldConsoleV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.epistemicReturnField = Object.freeze({
    evaluate: evaluateEpistemicReturnFieldV0,
    getMode: getEpistemicReturnModeV0,
    setMode: setEpistemicReturnModeV0,
    modes: EPISTEMIC_RETURN_MODE_V0
  });
}
