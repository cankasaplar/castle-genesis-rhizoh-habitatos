/**
 * Voice v3 adaptive recording endpoint — trailing silence cut (companion / noisy room).
 * Replaces fixed max-record wait when user finishes speaking.
 */

import { VOICE_MIN_SPEECH_RMS_V3 } from "./voiceAudioLevelV3.js";
import { readVoiceOperatingModeV0, VOICE_OPERATING_MODE_V0 } from "../rhizohVoiceOperatingModeV0.js";

export const VOICE_ADAPTIVE_ENDPOINT_SCHEMA_V3 = "castle.rhizoh.voice_adaptive_endpoint.v3";

export const VOICE_V3_MAX_RECORD_MS_COMPANION_V3 = 5500;
export const VOICE_V3_MAX_RECORD_MS_NORMAL_V3 = 8000;

const COMPANION_ENDPOINT_V3 = Object.freeze({
  pollMs: 100,
  minRecordMs: 900,
  minSpeechMs: 380,
  trailingSilenceMs: 580,
  speechRmsFloor: VOICE_MIN_SPEECH_RMS_V3,
  speechRmsMultiplier: 2.4,
  silenceRmsMultiplier: 1.65
});

const NORMAL_ENDPOINT_V3 = Object.freeze({
  pollMs: 120,
  minRecordMs: 900,
  minSpeechMs: 450,
  trailingSilenceMs: 920,
  speechRmsFloor: VOICE_MIN_SPEECH_RMS_V3,
  speechRmsMultiplier: 2.8,
  silenceRmsMultiplier: 1.5
});

/**
 * @returns {typeof COMPANION_ENDPOINT_V3}
 */
export function resolveAdaptiveEndpointProfileV3() {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_ADAPTIVE_ENDPOINT_V3 === "0") {
    return null;
  }
  return readVoiceOperatingModeV0() === VOICE_OPERATING_MODE_V0.COMPANION
    ? COMPANION_ENDPOINT_V3
    : NORMAL_ENDPOINT_V3;
}

/**
 * @returns {number}
 */
export function resolveVoiceMaxRecordMsV3() {
  return readVoiceOperatingModeV0() === VOICE_OPERATING_MODE_V0.COMPANION
    ? VOICE_V3_MAX_RECORD_MS_COMPANION_V3
    : VOICE_V3_MAX_RECORD_MS_NORMAL_V3;
}

/**
 * @param {{
 *   getLastRms: () => number,
 *   getMaxRms?: () => number,
 *   getElapsedMs: () => number,
 *   onEndpoint: (detail: { reason: string, elapsedMs: number, speechMs: number, noiseFloor: number }) => void,
 *   profile?: typeof COMPANION_ENDPOINT_V3 | null
 * }} opts
 */
export function attachAdaptiveRecordingEndpointV3(opts = {}) {
  const profile = opts.profile ?? resolveAdaptiveEndpointProfileV3();
  if (!profile || typeof window === "undefined") {
    return { stop: () => {}, active: false };
  }

  let noiseFloor = profile.speechRmsFloor * 0.75;
  let speechMs = 0;
  let trailingSilenceMs = 0;
  let inSpeech = false;
  let peakRms = 0;
  let fired = false;
  let lastTickAt = Date.now();

  const timer = window.setInterval(() => {
    if (fired) return;
    const now = Date.now();
    const dt = Math.max(0, now - lastTickAt);
    lastTickAt = now;
    const elapsedMs = Number(opts.getElapsedMs?.()) || 0;
    const rms = Math.max(0, Number(opts.getLastRms?.()) || 0);
    peakRms = Math.max(peakRms, rms);

    if (!inSpeech) {
      noiseFloor = noiseFloor * 0.92 + rms * 0.08;
    }

    const speechThreshold = Math.max(
      profile.speechRmsFloor,
      noiseFloor * profile.speechRmsMultiplier
    );
    const silenceThreshold = Math.max(
      profile.speechRmsFloor * 0.85,
      noiseFloor * profile.silenceRmsMultiplier
    );

    if (rms >= speechThreshold) {
      inSpeech = true;
      speechMs += dt;
      trailingSilenceMs = 0;
    } else if (inSpeech && rms <= silenceThreshold) {
      trailingSilenceMs += dt;
    } else if (!inSpeech) {
      trailingSilenceMs = 0;
    }

    const maxRms = Math.max(peakRms, Number(opts.getMaxRms?.()) || 0);
    const speechDetected = maxRms >= profile.speechRmsFloor;

    if (
      speechDetected &&
      elapsedMs >= profile.minRecordMs &&
      speechMs >= profile.minSpeechMs &&
      trailingSilenceMs >= profile.trailingSilenceMs
    ) {
      fired = true;
      opts.onEndpoint?.({
        reason: "trailing_silence",
        elapsedMs,
        speechMs,
        noiseFloor,
        maxRms
      });
    }
  }, profile.pollMs);

  return {
    active: true,
    profile,
    stop() {
      if (timer) window.clearInterval(timer);
    }
  };
}
