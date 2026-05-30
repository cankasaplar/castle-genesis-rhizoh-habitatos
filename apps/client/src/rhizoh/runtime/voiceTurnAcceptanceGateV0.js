/**
 * Voice turn acceptance gate — observation contamination firewall.
 * Junk/silent/low-confidence voice must not advance userTurnCount or phase bond inputs.
 */

import { VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3 } from "./voiceEngineV3/voiceTranscriptSanityV3.js";
import {
  routeVoiceTranscriptConfidenceV0,
  voiceConfidenceRouterLogDetailV0
} from "./voiceTranscriptConfidenceRouterV0.js";

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
  const route = routeVoiceTranscriptConfidenceV0({
    ...meta,
    checkRepeat: false,
    band: meta.band
  });
  if (route.reason === "non_voice") {
    return Object.freeze({ accepted: true, reason: "non_voice", source: route.source });
  }
  return Object.freeze({
    accepted: route.executionAccepted === true,
    reason: route.reason,
    source: route.source,
    confidence: route.confidence,
    strategy: route.strategy,
    threshold: route.threshold,
    band: route.band,
    observationForward: route.observationForward === true,
    shadowForward: route.shadowForward === true
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
    threshold: acceptance.threshold,
    observationForward: acceptance.observationForward === true,
    shadowForward: acceptance.shadowForward === true
  });
}

/** @deprecated Prefer routeVoiceTranscriptConfidenceV0 */
export { voiceConfidenceRouterLogDetailV0 };
