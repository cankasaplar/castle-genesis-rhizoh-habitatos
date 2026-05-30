/**
 * Voice turn acceptance gate — observation contamination firewall.
 * Junk/silent/low-confidence voice must not advance userTurnCount or phase bond inputs.
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

export const VOICE_TURN_ACCEPTANCE_SCHEMA = "castle.rhizoh.voice_turn_acceptance.v0";
export const VOICE_TURN_MIN_CONFIDENCE_V0 = VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3;

const VOICE_SOURCES = new Set(["mic_v3", "mic", "mic_onend", "barge_in", "speech_recognition_onresult"]);

/**
 * @param {{
 *   source?: string,
 *   text?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   maxRms?: number,
 *   silent?: boolean,
 *   junk?: boolean
 * }} [meta]
 */
export function evaluateVoiceTurnAcceptanceV0(meta = {}) {
  const source = String(meta.source || "text");
  if (!VOICE_SOURCES.has(source)) {
    return Object.freeze({ accepted: true, reason: "non_voice", source });
  }

  if (meta.silent === true) {
    return Object.freeze({ accepted: false, reason: "audio_silent", source });
  }
  if (meta.junk === true) {
    return Object.freeze({ accepted: false, reason: "junk", source });
  }

  const text = String(meta.text || "").trim();
  const conf = Number(meta.confidence);
  const strategy = String(meta.strategy || "");
  const maxRms = Number(meta.maxRms);

  if (Number.isFinite(maxRms) && maxRms > 0 && maxRms < 0.012) {
    return Object.freeze({ accepted: false, reason: "audio_silent", source, maxRms });
  }

  const sane = sanitizeVoiceTranscriptForDispatchV3(text, {
    confidence: Number.isFinite(conf) ? conf : undefined,
    strategy,
    checkRepeat: false
  });
  if (!sane.ok) {
    return Object.freeze({
      accepted: false,
      reason: sane.reason || "quality_reject",
      source,
      confidence: sane.confidence,
      strategy
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
      return Object.freeze({
        accepted: false,
        reason: "directed_speech_required",
        source,
        band: directedObs.band,
        hints: directedObs.hints,
        confidence: Number.isFinite(conf) ? conf : undefined,
        strategy: strategy || undefined
      });
    }
  }

  if (Number.isFinite(conf) && conf < VOICE_TURN_MIN_CONFIDENCE_V0) {
    return Object.freeze({
      accepted: false,
      reason: "low_confidence",
      source,
      confidence: conf,
      threshold: VOICE_TURN_MIN_CONFIDENCE_V0
    });
  }

  return Object.freeze({
    accepted: true,
    reason: "voice_ok",
    source,
    confidence: Number.isFinite(conf) ? conf : undefined,
    strategy: strategy || undefined
  });
}

/**
 * @param {ReturnType<typeof evaluateVoiceTurnAcceptanceV0>} acceptance
 */
export function voiceTurnAcceptanceLogDetailV0(acceptance) {
  return Object.freeze({
    accepted: acceptance.accepted === true,
    reason: acceptance.reason,
    source: acceptance.source,
    confidence: acceptance.confidence,
    threshold: acceptance.threshold
  });
}
