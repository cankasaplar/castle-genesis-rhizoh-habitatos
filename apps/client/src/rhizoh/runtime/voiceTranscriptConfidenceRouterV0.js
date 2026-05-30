/**
 * Unified voice transcript confidence router — single decision surface for sanity + turn gate.
 * Execution reject ≠ observation loss: shadowForward feeds witness / familiarity / attribution only.
 */

import {
  sanitizeVoiceTranscriptForDispatchV3,
  VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3
} from "./voiceEngineV3/voiceTranscriptSanityV3.js";
import {
  classifyVoiceDirectedSpeechBandV0,
  VOICE_DIRECTED_SPEECH_BAND
} from "./voiceDirectedSpeechObservationV0.js";
import { isDirectedSpeechGateReleaseEnabledV0 } from "./isDirectedSpeechGateReleaseEnabledV0.js";

export const VOICE_TRANSCRIPT_CONFIDENCE_ROUTER_SCHEMA =
  "castle.rhizoh.voice_transcript_confidence_router.v0";

/** Reasons that still emit shadow-forward observation (no STT dispatch / no turn count). */
const SHADOW_FORWARD_REASONS = new Set([
  "whisper_default_conf",
  "low_confidence",
  "whisper_artifact",
  "internal_repetition",
  "repeated_hallucination"
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
  "quality_reject"
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
  return Object.freeze({ ...route, rejectionLayer });
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
 *   band?: string
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

  const conf = Number(meta.confidence);
  const strategy = String(meta.strategy || "");
  const maxRms = Number(meta.maxRms);
  const recordedMs = Number(meta.recordedMs);

  if (Number.isFinite(maxRms) && maxRms > 0 && maxRms < 0.012) {
    return finalizeRouteV0({
      executionAccepted: false,
      observationForward: false,
      reason: "audio_silent",
      source,
      maxRms
    });
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
    recordedMs: Number.isFinite(recordedMs) ? recordedMs : undefined
  });

  if (!sane.ok) {
    const observationForward =
      text.length >= 3 && SHADOW_FORWARD_REASONS.has(String(sane.reason || ""));
    return finalizeRouteV0({
      executionAccepted: false,
      observationForward,
      reason: sane.reason || "quality_reject",
      source,
      band: observation.band,
      confidence: sane.confidence,
      strategy: strategy || undefined,
      shadowForward: sane.shadowForward === true || observationForward,
      sanityAccepted: false
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

  return finalizeRouteV0({
    executionAccepted: true,
    observationForward: false,
    reason: "voice_ok",
    source,
    band: observation.band,
    confidence: Number.isFinite(conf) ? conf : undefined,
    strategy: strategy || undefined,
    sanityAccepted: true
  });
}

/**
 * @param {ReturnType<typeof routeVoiceTranscriptConfidenceV0>} route
 */
export function voiceConfidenceRouterLogDetailV0(route) {
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
    shadowForward: route.shadowForward === true
  });
}
