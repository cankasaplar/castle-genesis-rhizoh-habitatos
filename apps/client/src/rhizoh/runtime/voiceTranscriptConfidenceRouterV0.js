/**
 * Unified voice transcript confidence router — single decision surface for sanity + turn gate.
 * Execution reject ≠ observation loss: shadowForward feeds witness / familiarity / attribution only.
 */

import {
  isPhantomSystemPromptUtteranceV3,
  sanitizeVoiceTranscriptForDispatchV3,
  VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3,
  isConversationalTurkishUtteranceV3
} from "./voiceEngineV3/voiceTranscriptSanityV3.js";
import { VOICE_MIN_SPEECH_RMS_V3 } from "./voiceEngineV3/voiceAudioLevelV3.js";
import {
  classifyVoiceDirectedSpeechBandV0,
  VOICE_DIRECTED_SPEECH_BAND
} from "./voiceDirectedSpeechObservationV0.js";
import { isDirectedSpeechGateReleaseEnabledV0 } from "./isDirectedSpeechGateReleaseEnabledV0.js";
import { resolveVoiceAttentionContextV0 } from "./voiceAttentionContextV0.js";
import { recordConversationMirrorVoiceRouteV0 } from "./rhizohConversationBehaviorMirrorV0.js";
import { buildVoiceConfidenceBreakdownV0 } from "./voiceConfidenceBreakdownV0.js";
import {
  FAST_PRECHECK_WAKE_INTENTS_V0,
  normalizeForFastPrecheckV0,
  probeFastPrecheckMatchV0
} from "./rhizohFastPrecheckV0.js";
import { isSubstantivePlanningUtteranceV1 } from "./rhizohCanonicalIntentV1.js";
import { evaluateAlertRecallRescueV0 } from "./rhizohVoiceOperatingModeV0.js";
import { notePartialTranscriptForEmergencyV0 } from "./rhizohEmergencySignalLayerV0.js";
import { probeStoryContinuationIntentV0 } from "./rhizohContinuityRecallIntentV0.js";
import { isVoiceSttDispatchGatewayBypassV0 } from "./rhizohVoiceIngestGateFlagsV0.js";

/** Known micro-intent phrases may execute below interaction threshold (not hallucinations). */
const REFLEX_PRECHECK_VOICE_CONF_FLOOR_V0 = 0.45;

export const VOICE_TRANSCRIPT_CONFIDENCE_ROUTER_SCHEMA =
  "castle.rhizoh.voice_transcript_confidence_router.v0";

/** Sanity fail reasons that may still reach LLM — only weak-default-conf on directed speech. */
const EXECUTION_OBSERVATION_PASS_REASONS_V0 = new Set(["whisper_default_conf"]);

/** Micro-reflex allowed on unknown band (short greeting/ack/hearing_check — not thanks/outro). */
const UNKNOWN_BAND_REFLEX_INTENTS_V0 = new Set([
  "greeting",
  "ack",
  "yes",
  "no",
  "wellbeing",
  "hearing_check",
  "date_today",
  "time_query",
  "system_status",
  "weather_stub",
  "weather_live",
  "traffic_query",
  "sports_live",
  "sports_fixture",
  "news_headlines",
  "map_context",
  "presence_query",
  "social_ack",
  "chat_invite"
]);

/** Live + utility reflex intents — allow longer unknown-band utterances (whisper 0.55). */
const EXTENDED_UNKNOWN_REFLEX_INTENTS_V0 = new Set([
  "hearing_check",
  "date_today",
  "time_query",
  "system_status",
  "weather_stub",
  "weather_live",
  "traffic_query",
  "sports_live",
  "sports_fixture",
  "news_headlines",
  "map_context",
  "presence_query",
  "chat_invite"
]);

const VOICE_SOURCES = new Set([
  "mic_v3",
  "mic",
  "mic_onend",
  "barge_in",
  "speech_recognition_onresult"
]);

/** Transparent router labeling — single gate, dual rejection semantics. */
export const VOICE_ROUTER_REJECTION_LAYER_V0 = Object.freeze({
  EXECUTION: "execution",
  SANITY: "sanity",
  INTERACTION: "interaction",
  NOOP: "noop"
});

const SANITY_REJECT_REASONS = new Set([
  "empty",
  "too_short",
  "low_confidence",
  "whisper_artifact",
  "internal_repetition",
  "repeated_hallucination",
  "whisper_default_conf",
  "quality_reject",
  "script_locale_mismatch",
  "temporal_script_outlier",
  "temporal_noise_spike",
  "platform_template_leak",
  "ui_chrome_echo",
  "stt_loop_artifact",
  "unknown_band_hold",
  "ambient_speech_hold"
]);

/**
 * @param {string} reason
 * @param {boolean} [sanityAccepted]
 */
export function classifyVoiceRouterRejectionLayerV0(reason, sanityAccepted = false) {
  const r = String(reason || "");
  if (r === "non_voice" || r === "voice_ok") {
    return VOICE_ROUTER_REJECTION_LAYER_V0.EXECUTION;
  }
  if (r === "audio_silent" || r === "junk") {
    return VOICE_ROUTER_REJECTION_LAYER_V0.NOOP;
  }
  if (r === "directed_speech_required") {
    return VOICE_ROUTER_REJECTION_LAYER_V0.INTERACTION;
  }
  if (r === "low_confidence") {
    return sanityAccepted === true
      ? VOICE_ROUTER_REJECTION_LAYER_V0.INTERACTION
      : VOICE_ROUTER_REJECTION_LAYER_V0.SANITY;
  }
  if (sanityAccepted === false || SANITY_REJECT_REASONS.has(r)) {
    return VOICE_ROUTER_REJECTION_LAYER_V0.SANITY;
  }
  return VOICE_ROUTER_REJECTION_LAYER_V0.INTERACTION;
}

/**
 * @param {object} route
 */
function finalizeRouteV0(route) {
  const rejectionLayer =
    route.executionAccepted === true
      ? VOICE_ROUTER_REJECTION_LAYER_V0.EXECUTION
      : classifyVoiceRouterRejectionLayerV0(route.reason, route.sanityAccepted !== false);
  const finalized = Object.freeze({ ...route, rejectionLayer });
  recordConversationMirrorVoiceRouteV0({
    executionAccepted: finalized.executionAccepted,
    reason: finalized.reason,
    rejectionLayer: finalized.rejectionLayer,
    preview: route.preview,
    source: finalized.source
  });
  return finalized;
}

/**
 * @param {string} text
 * @param {string} [band]
 */
function allowFastPrecheckReflexV0(text, band) {
  const hit = probeFastPrecheckMatchV0(text);
  if (!hit) return false;
  if (!UNKNOWN_BAND_REFLEX_INTENTS_V0.has(hit.intent)) return false;
  const words = normalizeForFastPrecheckV0(text).split(/\s+/).filter(Boolean).length;
  if (EXTENDED_UNKNOWN_REFLEX_INTENTS_V0.has(hit.intent)) {
    return words <= 12;
  }
  if (band === VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE) return words <= 8;
  if (band === VOICE_DIRECTED_SPEECH_BAND.UNKNOWN) return words <= 3;
  return false;
}

/** @deprecated alias */
function allowUnknownBandMicroReflexV0(text, band) {
  return allowFastPrecheckReflexV0(text, band);
}

/** Cohort T0: direct_listen — adaptive endpoint often ends at 2–4s; 5s gate was blocking real questions. */
const DIRECT_LISTEN_UNKNOWN_MIN_RECORD_MS_V0 = 2200;
const DIRECT_LISTEN_QUESTION_MIN_RECORD_MS_V0 = 1800;
const DIRECT_LISTEN_UNKNOWN_MIN_CHARS_V0 = 8;
const WHISPER_DEFAULT_CONF_CONVERSATIONAL_MIN_MS_V0 = 900;

/**
 * @param {string} text
 * @param {number | undefined} recordedMs
 * @param {{ confidence?: number, voiceGatewaySessionActive?: boolean, source?: string }} relaxMeta
 */
function shouldPassWhisperDefaultConfExecutionV0(text, recordedMs, relaxMeta = {}) {
  const conf = Number(relaxMeta.confidence);
  if (!Number.isFinite(conf) || conf < 0.48) return false;

  if (
    relaxMeta.voiceGatewaySessionActive === true &&
    isVoiceSttDispatchGatewayBypassV0() &&
    text.length >= 4
  ) {
    return true;
  }

  const ms = Number(recordedMs);
  if (isConversationalTurkishUtteranceV3(text)) {
    if (Number.isFinite(ms) && ms >= WHISPER_DEFAULT_CONF_CONVERSATIONAL_MIN_MS_V0) return true;
  }

  const hit = probeFastPrecheckMatchV0(text);
  if (
    hit &&
    ["hearing_check", "presence_query", "chat_invite", "wellbeing"].includes(String(hit.intent || ""))
  ) {
    return true;
  }

  return false;
}

/**
 * @param {string} text
 * @param {number | undefined} recordedMs
 * @param {{ band?: string, ambientScore?: number, directedScore?: number }} classified
 * @param {{ source?: string }} [relaxMeta]
 */
function shouldRelaxUnknownBandForDirectListenV0(text, recordedMs, classified, relaxMeta = {}) {
  if (classified.band !== VOICE_DIRECTED_SPEECH_BAND.UNKNOWN) return false;
  if ((classified.ambientScore || 0) >= 2) return false;
  const ms = Number(recordedMs);
  const hasQuestion = text.includes("?");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const minMs = hasQuestion
    ? DIRECT_LISTEN_QUESTION_MIN_RECORD_MS_V0
    : DIRECT_LISTEN_UNKNOWN_MIN_RECORD_MS_V0;
  if (!Number.isFinite(ms) || ms < minMs) return false;
  if (text.length < DIRECT_LISTEN_UNKNOWN_MIN_CHARS_V0) return false;

  if (resolveVoiceAttentionContextV0().directedSpeechRelaxed) {
    if ((classified.directedScore || 0) >= 1) return true;
    if (hasQuestion) return true;
    // Long mic capture + multi-word statement (English/Turkish) — not phantom "Result." chips.
    if (wordCount >= 4 && text.length >= 20 && ms >= DIRECT_LISTEN_UNKNOWN_MIN_RECORD_MS_V0) {
      return true;
    }
    return false;
  }

  // moving_context / observer — explicit mic_v3 with substantive question or story continuation.
  if (String(relaxMeta.source || "") !== "mic_v3") return false;
  if (probeStoryContinuationIntentV0(text).active) return true;
  if (hasQuestion && wordCount >= 4 && text.length >= 20) return true;
  return false;
}

/**
 * @param {typeof observation} observation
 * @param {string} text
 * @param {{ recordedMs?: number, confidence?: number, strategy?: string, maxRms?: number, source?: string }} [relaxMeta]
 */
function rejectNonDirectedVoiceBandV0(observation, text, relaxMeta = {}) {
  const band = observation.band;
  if (band === VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE) return null;
  if (allowUnknownBandMicroReflexV0(text, band)) return null;

  if (band === VOICE_DIRECTED_SPEECH_BAND.AMBIENT) {
    return Object.freeze({
      executionAccepted: false,
      observationForward: text.length >= 3,
      reason: "ambient_speech_hold",
      shadowForward: true,
      sanityAccepted: true
    });
  }

  if (band === VOICE_DIRECTED_SPEECH_BAND.UNKNOWN) {
    const classified =
      observation.directedScore != null
        ? observation
        : classifyVoiceDirectedSpeechBandV0({
            text,
            confidence: relaxMeta.confidence,
            strategy: relaxMeta.strategy,
            maxRms: relaxMeta.maxRms,
            source: relaxMeta.source
          });
    if (shouldRelaxUnknownBandForDirectListenV0(text, relaxMeta.recordedMs, classified, relaxMeta)) {
      return null;
    }
    return Object.freeze({
      executionAccepted: false,
      observationForward: text.length >= 3,
      reason: "unknown_band_hold",
      shadowForward: true,
      sanityAccepted: true
    });
  }

  return null;
}

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   maxRms?: number,
 *   source?: string,
 *   recordedMs?: number,
 *   silent?: boolean,
 *   junk?: boolean,
 *   checkRepeat?: boolean,
 *   band?: string,
 *   voiceGatewaySessionActive?: boolean
 * }} [meta]
 */
export function routeVoiceTranscriptConfidenceV0(meta = {}) {
  const source = String(meta.source || "text");
  const text = String(meta.text || "").trim();

  if (!VOICE_SOURCES.has(source)) {
    return finalizeRouteV0({
      executionAccepted: true,
      observationForward: false,
      reason: "non_voice",
      source,
      band: VOICE_DIRECTED_SPEECH_BAND.UNKNOWN
    });
  }

  if (meta.silent === true) {
    return finalizeRouteV0({
      executionAccepted: false,
      observationForward: false,
      reason: "audio_silent",
      source
    });
  }
  if (meta.junk === true) {
    return finalizeRouteV0({
      executionAccepted: false,
      observationForward: false,
      reason: "junk",
      source
    });
  }

  const alertRescue = evaluateAlertRecallRescueV0({ text, source, confidence: meta.confidence });
  if (alertRescue.recallFirst) {
    notePartialTranscriptForEmergencyV0({
      text,
      confidence: alertRescue.score,
      source: source || "alert_recall_first"
    });
    return finalizeRouteV0({
      executionAccepted: true,
      observationForward: true,
      reason: "alert_recall_first",
      source,
      band: meta.band || VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      confidence: Math.max(Number(meta.confidence) || 0, alertRescue.score),
      alertLabel: alertRescue.label
    });
  }

  const conf = Number(meta.confidence);
  const strategy = String(meta.strategy || "");
  const maxRms = Number(meta.maxRms);
  const recordedMs = Number(meta.recordedMs);

  if (Number.isFinite(maxRms) && maxRms > 0 && maxRms < VOICE_MIN_SPEECH_RMS_V3) {
    const quietGatewayBypass =
      meta.voiceGatewaySessionActive === true &&
      isVoiceSttDispatchGatewayBypassV0() &&
      maxRms > 0 &&
      Number.isFinite(recordedMs) &&
      recordedMs >= 1200;
    if (!quietGatewayBypass) {
      return finalizeRouteV0({
        executionAccepted: false,
        observationForward: false,
        reason: "audio_silent",
        source,
        maxRms
      });
    }
  }

  const observation =
    meta.band && Object.values(VOICE_DIRECTED_SPEECH_BAND).includes(meta.band)
      ? Object.freeze({
          band: meta.band,
          preview: text.slice(0, 96),
          confidence: Number.isFinite(conf) ? conf : undefined,
          strategy: strategy || undefined,
          source
        })
      : classifyVoiceDirectedSpeechBandV0({
          text,
          confidence: conf,
          strategy,
          maxRms,
          source
        });

  const sane = sanitizeVoiceTranscriptForDispatchV3(text, {
    confidence: Number.isFinite(conf) ? conf : undefined,
    strategy,
    checkRepeat: meta.checkRepeat !== false,
    recordedMs: Number.isFinite(recordedMs) ? recordedMs : undefined,
    sttLanguageHint: meta.sttLanguageHint,
    vepmConfidence: meta.vepmConfidence,
    phantomLikely: meta.phantomLikely === true,
    band: observation.band
  });

  if (!sane.ok) {
    const reason = String(sane.reason || "quality_reject");
    const confNum = Number.isFinite(conf) ? conf : Number(sane.confidence);
    const observationForward =
      text.length >= 3 &&
      (sane.shadowForward === true || sane.softScriptMismatch === true);
    const classifiedForRelax =
      observation.directedScore != null
        ? observation
        : classifyVoiceDirectedSpeechBandV0({
            text,
            confidence: conf,
            strategy,
            maxRms,
            source
          });
    if (isPhantomSystemPromptUtteranceV3(text)) {
      return finalizeRouteV0({
        executionAccepted: false,
        observationForward: text.length >= 3,
        reason: "whisper_artifact",
        source,
        band: observation.band,
        confidence: Number.isFinite(confNum) ? confNum : sane.confidence,
        strategy: strategy || undefined,
        shadowForward: true,
        sanityAccepted: false,
        phantomSystemPrompt: true
      });
    }

    if (isSubstantivePlanningUtteranceV1(text)) {
      return finalizeRouteV0({
        executionAccepted: true,
        observationForward: false,
        reason: "substantive_planning_sanity_bypass",
        source,
        band: observation.band,
        confidence: Number.isFinite(confNum) ? confNum : sane.confidence,
        strategy: strategy || undefined,
        sanityAccepted: false,
        substantivePlanning: true
      });
    }

    const wakeHit = probeFastPrecheckMatchV0(text);
    if (wakeHit && FAST_PRECHECK_WAKE_INTENTS_V0.has(String(wakeHit.intent || ""))) {
      return finalizeRouteV0({
        executionAccepted: true,
        observationForward: false,
        reason: "fast_precheck_sanity_bypass",
        source,
        band: observation.band,
        confidence: Number.isFinite(confNum) ? confNum : sane.confidence,
        strategy: strategy || undefined,
        reflexPrecheck: true,
        sanityAccepted: false,
        fastPrecheckIntent: wakeHit.intent
      });
    }

    const observationPassThrough =
      EXECUTION_OBSERVATION_PASS_REASONS_V0.has(reason) &&
      ((text.length >= 6 &&
        Number.isFinite(confNum) &&
        confNum >= 0.48 &&
        observation.band === VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE) ||
        shouldRelaxUnknownBandForDirectListenV0(text, recordedMs, classifiedForRelax, {
          source
        }) ||
        shouldPassWhisperDefaultConfExecutionV0(text, recordedMs, {
          confidence: confNum,
          voiceGatewaySessionActive: meta.voiceGatewaySessionActive,
          source
        }));

    if (observationPassThrough) {
      return finalizeRouteV0({
        executionAccepted: true,
        observationForward: true,
        reason,
        source,
        band: observation.band,
        confidence: confNum,
        strategy: strategy || undefined,
        shadowForward: true,
        sanityAccepted: false,
        observationPass: true
      });
    }

    return finalizeRouteV0({
      executionAccepted: false,
      observationForward,
      reason,
      source,
      band: observation.band,
      confidence: sane.confidence,
      strategy: strategy || undefined,
      shadowForward: sane.shadowForward === true || observationForward,
      sanityAccepted: false
    });
  }

  const relaxMeta = {
    recordedMs: Number.isFinite(recordedMs) ? recordedMs : undefined,
    confidence: conf,
    strategy,
    maxRms,
    source
  };

  const bandHold = rejectNonDirectedVoiceBandV0(observation, text, relaxMeta);
  if (bandHold) {
    return finalizeRouteV0({
      ...bandHold,
      source,
      band: observation.band,
      confidence: Number.isFinite(conf) ? conf : undefined,
      strategy: strategy || undefined
    });
  }

  if (isDirectedSpeechGateReleaseEnabledV0()) {
    const directedObs = classifyVoiceDirectedSpeechBandV0({
      text,
      confidence: conf,
      strategy,
      maxRms,
      source
    });
    if (directedObs.band !== VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE) {
      return finalizeRouteV0({
        executionAccepted: false,
        observationForward: text.length >= 3,
        reason: "directed_speech_required",
        source,
        band: directedObs.band,
        hints: directedObs.hints,
        confidence: Number.isFinite(conf) ? conf : undefined,
        strategy: strategy || undefined,
        shadowForward: true,
        sanityAccepted: true
      });
    }
  }

  if (Number.isFinite(conf) && conf < VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3) {
    if (
      conf >= REFLEX_PRECHECK_VOICE_CONF_FLOOR_V0 &&
      allowFastPrecheckReflexV0(text, observation.band)
    ) {
      const reflexHit = probeFastPrecheckMatchV0(text);
      return finalizeRouteV0({
        executionAccepted: true,
        observationForward: false,
        reason: "reflex_precheck_bypass",
        source,
        band: observation.band,
        confidence: conf,
        threshold: VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3,
        reflexPrecheck: true,
        sanityAccepted: true,
        fastPrecheckIntent: reflexHit?.intent
      });
    }
    return finalizeRouteV0({
      executionAccepted: false,
      observationForward: text.length >= 3,
      reason: "low_confidence",
      source,
      band: observation.band,
      confidence: conf,
      threshold: VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3,
      shadowForward: true,
      sanityAccepted: true
    });
  }

  const highConfHold = rejectNonDirectedVoiceBandV0(observation, text, relaxMeta);
  if (highConfHold) {
    return finalizeRouteV0({
      ...highConfHold,
      source,
      band: observation.band,
      confidence: Number.isFinite(conf) ? conf : undefined,
      strategy: strategy || undefined
    });
  }

  const wakeProbe = probeFastPrecheckMatchV0(text);
  const wakeIntent =
    wakeProbe && FAST_PRECHECK_WAKE_INTENTS_V0.has(String(wakeProbe.intent || ""))
      ? wakeProbe.intent
      : undefined;

  return finalizeRouteV0({
    executionAccepted: true,
    observationForward: false,
    reason: "voice_ok",
    source,
    band: observation.band,
    confidence: Number.isFinite(conf) ? conf : undefined,
    strategy: strategy || undefined,
    sanityAccepted: true,
    reflexPrecheck: Boolean(wakeIntent),
    fastPrecheckIntent: wakeIntent
  });
}

/**
 * @param {ReturnType<typeof routeVoiceTranscriptConfidenceV0>} route
 */
export function voiceConfidenceRouterLogDetailV0(route, meta = {}) {
  const breakdown = buildVoiceConfidenceBreakdownV0(
    {
      confidence: route.confidence ?? meta.confidence,
      strategy: route.strategy ?? meta.strategy,
      directedScore: meta.directedScore,
      ambientScore: meta.ambientScore,
      band: route.band ?? meta.band,
      source: route.source ?? meta.source
    },
    route
  );
  return Object.freeze({
    executionAccepted: route.executionAccepted === true,
    observationForward: route.observationForward === true,
    reason: route.reason,
    rejectionLayer: route.rejectionLayer,
    sanityAccepted: route.sanityAccepted,
    source: route.source,
    confidence: route.confidence,
    threshold: route.threshold,
    band: route.band,
    shadowForward: route.shadowForward === true,
    whisperConfidence: breakdown.whisperConfidence,
    semanticConfidence: breakdown.semanticConfidence,
    attentionConfidence: breakdown.attentionConfidence,
    finalConfidence: breakdown.finalConfidence
  });
}
