/**
 * Presence → Intent → Transcript — intent-first acceptance rescue.
 * Noisy-world companion: imperfect transcript may still open a turn when
 * user-directed engagement signals are strong (listening, RMS, grounding).
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { getContinuityKernelSnapshotV0, CONTINUITY_STATE_V0 } from "./rhizohContinuityKernelV0.js";
import { getGroundingLayerSnapshotV1 } from "./rhizohGroundingLayerV1.js";
import { hasMeaningfulSpeechSignalV0 } from "./rhizohVoiceGrayZoneVerifyV0.js";

export const RHIZOH_VOICE_INTENT_ACCEPTANCE_SCHEMA_V0 = "rhizoh.voice_intent_acceptance.v0";

const DIRECTED_HINT_RE_V0 =
  /\b(rhizoh|rizo|rizoh|dostum|duyabiliyor\s+musun|beni\s+duy|sohbet)\b/i;
const QUESTION_HINT_RE_V0 =
  /\?\s*$|^(nasıl|nasil|neden|ne\s|kim|nerede|how|why|what|who|bunu|şunu|sunu|hava)\b/i;

const NOISE_RESCUE_REASONS_V0 = new Set([
  "fast_noise_drop",
  "hard_drop_noise",
  "strict_hold_suppressed",
  "noise_drop",
  "stt_phantom_polite"
]);

const ECHO_RESCUE_REASONS_V0 = new Set(["ui_chrome_echo", "platform_template_leak"]);

/**
 * Score whether a human is trying to talk to Rhizoh (not transcript quality).
 * @param {{ text?: string, maxRms?: number, recordedMs?: number, band?: string, confidence?: number }} input
 */
export function assessUserDirectedIntentV0(input = {}) {
  const text = String(input.text || "").trim();
  const maxRms = Number(input.maxRms);
  const recordedMs = Number(input.recordedMs);
  const continuity = getContinuityKernelSnapshotV0();
  const grounding = getGroundingLayerSnapshotV1();

  /** @type {string[]} */
  const signals = [];
  let score = 0;

  if (
    continuity.state === CONTINUITY_STATE_V0.LISTENING ||
    continuity.state === CONTINUITY_STATE_V0.THINKING
  ) {
    score += 0.22;
    signals.push("continuity_engaged");
  }

  if (grounding.worldAnchored === true) {
    score += 0.1;
    signals.push("grounding_world_anchored");
  }
  if (Number(grounding.externalMass) >= 0.45) {
    score += 0.08;
    signals.push("grounding_external_mass");
  }

  if (Number.isFinite(maxRms)) {
    if (maxRms >= 0.025) {
      score += 0.1;
      signals.push("rms_present");
    }
    if (maxRms >= 0.05) {
      score += 0.14;
      signals.push("rms_strong");
    }
    if (maxRms >= 0.1) {
      score += 0.08;
      signals.push("rms_very_strong");
    }
  }

  if (Number.isFinite(recordedMs)) {
    if (recordedMs >= 2000) {
      score += 0.08;
      signals.push("duration_speech");
    }
    if (recordedMs >= 5000) {
      score += 0.1;
      signals.push("duration_extended");
    }
  }

  if (DIRECTED_HINT_RE_V0.test(text)) {
    score += 0.3;
    signals.push("directed_lexeme");
  }
  if (QUESTION_HINT_RE_V0.test(text)) {
    score += 0.14;
    signals.push("question_shape");
  }
  if (hasMeaningfulSpeechSignalV0(text)) {
    score += 0.12;
    signals.push("meaningful_text");
  }

  const directedAttempt = score >= 0.48;
  return Object.freeze({
    schema: RHIZOH_VOICE_INTENT_ACCEPTANCE_SCHEMA_V0,
    score: Number(Math.min(1, score).toFixed(3)),
    signals: Object.freeze(signals),
    directedAttempt,
    continuityState: continuity.state,
    externalMass: grounding.externalMass ?? null
  });
}

/**
 * @param {string} reason
 * @param {object} assessment
 * @param {object} input
 */
const ENGAGEMENT_SIGNALS_V0 = new Set([
  "continuity_engaged",
  "rms_present",
  "rms_strong",
  "rms_very_strong",
  "duration_speech",
  "duration_extended",
  "grounding_world_anchored",
  "grounding_external_mass"
]);

function hasEngagementSignalV0(assessment) {
  return (assessment?.signals || []).some((s) => ENGAGEMENT_SIGNALS_V0.has(s));
}

export function shouldAttemptIntentRescueV0(reason, assessment, input = {}) {
  const r = String(reason || "");
  const maxRms = Number(input.maxRms);
  if (!assessment?.directedAttempt) return false;
  if (!hasEngagementSignalV0(assessment)) return false;

  if (r === "strict_hold_suppressed") {
    const hasQuestion =
      assessment.signals?.includes("question_shape") ||
      assessment.signals?.includes("meaningful_text");
    return hasQuestion ? assessment.score >= 0.35 : assessment.score >= 0.48;
  }

  if (NOISE_RESCUE_REASONS_V0.has(r)) {
    return assessment.score >= 0.45;
  }

  if (ECHO_RESCUE_REASONS_V0.has(r)) {
    const hasDirected = assessment.signals?.includes("directed_lexeme");
    const hasStrongRms = Number.isFinite(maxRms) && maxRms >= 0.04;
    const hasDuration = Number(input.recordedMs) >= 3000;
    if (hasDirected) return assessment.score >= 0.42;
    return assessment.score >= 0.55 && (hasStrongRms || hasDuration);
  }

  return false;
}

/**
 * Convert silent drop → hold/slow when user-directed intent is strong.
 * @param {object} decision
 * @param {object} input
 * @param {object} spineCtx
 * @param {function} builders — injected to avoid circular imports in tests
 */
export function applyIntentFirstAcceptanceV0(
  decision,
  input = {},
  spineCtx = {},
  builders = null
) {
  if (!decision || decision.speakMode !== "silent") return decision;

  const assessment = assessUserDirectedIntentV0(input);
  const reason = String(decision.reason || "");
  if (!shouldAttemptIntentRescueV0(reason, assessment, input)) {
    return decision;
  }

  const {
    buildHoldDecision,
    buildSpeakSlowDecision,
    classifyVoiceFastIntentV0,
    trySlowPathEligibilityV0,
    VOICE_CONFIDENCE_TIER_V0
  } = builders || spineCtx.builders || {};

  if (!buildHoldDecision || !classifyVoiceFastIntentV0) return decision;

  const text = String(input.text || "");
  const fast = spineCtx.fast || classifyVoiceFastIntentV0(text);
  const tier =
    decision.confidenceTier ||
    spineCtx.tier ||
    VOICE_CONFIDENCE_TIER_V0?.SLOW_READY ||
    "slow_ready";
  const band = decision.band || spineCtx.band;
  const guards = decision.guards || spineCtx.guards;
  const verifyCount = decision.verifyCount ?? spineCtx.verifyCount;

  const slowEligible =
    typeof trySlowPathEligibilityV0 === "function"
      ? trySlowPathEligibilityV0(text, {
          guards,
          directed: band === "directed_candidate",
          intent: fast.intent,
          band,
          tier,
          meaningful: hasMeaningfulSpeechSignalV0(text, { fastIntent: fast.intent })
        })
      : false;

  let rescued;
  if (assessment.score >= 0.62 && slowEligible && buildSpeakSlowDecision) {
    rescued = buildSpeakSlowDecision(
      fast.intent,
      "presence_intent_slow",
      band,
      tier,
      guards,
      { verifyCount, intentRescue: assessment, priorReason: reason }
    );
  } else {
    rescued = buildHoldDecision(fast.intent, "presence_intent_hold", band, tier, {
      guards,
      verifyCount,
      intentRescue: assessment,
      priorReason: reason
    });
  }

  logVoiceInfoV0("INTENT_FIRST_RESCUE", {
    priorReason: reason,
    rescueReason: rescued.reason,
    speakMode: rescued.speakMode,
    score: assessment.score,
    signals: assessment.signals,
    maxRms: input.maxRms,
    recordedMs: input.recordedMs,
    preview: text.slice(0, 96)
  });

  return rescued;
}
