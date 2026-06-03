/**
 * Pre-STT Input Sanitization Gate — block bad audio before Whisper/Google sees it.
 * DROP: silence / low energy / low speech probability
 * HOLD: high acoustic ambiguity (entropy) — no transcription attempt
 */

import { VOICE_MIN_SPEECH_RMS_V3 } from "./voiceEngineV3/voiceAudioLevelV3.js";

export const RHIZOH_VOICE_PRE_STT_SANITIZATION_SCHEMA_V0 =
  "castle.rhizoh.voice_pre_stt_input_sanitization.v0";

export const PRE_STT_GATE_ACTION_V0 = Object.freeze({
  PROCEED: "proceed",
  DROP: "drop",
  HOLD: "hold"
});

/** User-facing threshold — below this, do not upload to STT. */
export const PRE_STT_MIN_SPEECH_PROBABILITY_V0 = 0.6;

/** Acoustic ambiguity threshold — only meaningful with low speech probability. */
export const PRE_STT_ACOUSTIC_ENTROPY_HOLD_V0 = 0.65;

/** Entropy HOLD requires speech probability below this (avoids punishing quiet valid speech). */
export const PRE_STT_HOLD_SPEECH_PROB_MAX_V0 = 0.55;

/** HOLD only when clip longer than this — short "tamam/evet" exempt. */
export const PRE_STT_HOLD_MIN_DURATION_MS_V0 = 900;

/** Short directed utterances may proceed with lower speech probability floor. */
export const PRE_STT_SHORT_UTTERANCE_EXEMPT_MS_V0 = 900;
export const PRE_STT_SHORT_UTTERANCE_MIN_SPEECH_PROB_V0 = 0.45;

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/**
 * Estimate likelihood that clip contains directed speech (not silence/tab hum).
 * @param {{ maxRms?: number, recordedMs?: number, bytes?: number, warmProbe?: object, sampleCount?: number }} input
 */
export function estimatePreSttSpeechProbabilityV0(input = {}) {
  const maxRms = Number(input.maxRms);
  const recordedMs = Math.max(0, Number(input.recordedMs) || 0);
  const bytes = Math.max(0, Number(input.bytes) || 0);
  const sampleCount = Math.max(0, Number(input.sampleCount) || 0);
  const avgWarm = Number(input.warmProbe?.avgWarmScore);
  const minWarm = Number(input.warmProbe?.minWarmScore);

  const energyScore = clamp01((maxRms - 0.008) / (0.055 - 0.008));
  const durationScore = clamp01(recordedMs / 2800);
  const payloadScore = clamp01(bytes / 80000);
  const warmScore = Number.isFinite(avgWarm) ? clamp01(avgWarm) : 0.48;
  const warmStability =
    Number.isFinite(avgWarm) && Number.isFinite(minWarm)
      ? clamp01(1 - Math.max(0, avgWarm - minWarm) * 2.2)
      : 0.55;
  const probeSamples = sampleCount >= 4 ? 1 : sampleCount >= 2 ? 0.82 : 0.65;

  return clamp01(
    energyScore * 0.42 +
      durationScore * 0.12 +
      payloadScore * 0.08 +
      warmScore * 0.18 +
      warmStability * 0.12 +
      probeSamples * 0.08
  );
}

/**
 * Pre-text acoustic entropy — unstable warm probe + borderline RMS → STT hallucination bait.
 * @param {{ maxRms?: number, recordedMs?: number, warmProbe?: object, speechProbability?: number }} input
 */
export function measurePreSttAcousticEntropyV0(input = {}) {
  const maxRms = Number(input.maxRms);
  const recordedMs = Math.max(0, Number(input.recordedMs) || 0);
  const avgWarm = Number(input.warmProbe?.avgWarmScore);
  const minWarm = Number(input.warmProbe?.minWarmScore);
  const speechProbability = Number(input.speechProbability);

  const warmSpread =
    Number.isFinite(avgWarm) && Number.isFinite(minWarm) ? clamp01((avgWarm - minWarm) * 3.2) : 0;
  const borderlineEnergy =
    maxRms >= VOICE_MIN_SPEECH_RMS_V3 && maxRms < 0.022 ? 0.38 : maxRms < VOICE_MIN_SPEECH_RMS_V3 ? 0.55 : 0;
  const longAmbiguous =
    recordedMs > 5500 && maxRms < 0.02 && Number.isFinite(speechProbability) && speechProbability < 0.72
      ? 0.28
      : 0;
  const coldGateway = Number.isFinite(minWarm) && minWarm < 0.34 ? 0.22 : 0;

  return clamp01(warmSpread * 0.45 + borderlineEnergy * 0.35 + longAmbiguous + coldGateway);
}

/** Encoded silence / tab hum — large payload but near-zero RMS. */
export const PRE_STT_SILENT_CAPTURE_MAX_RMS_V0 = 0.004;
export const PRE_STT_SILENT_CAPTURE_MIN_BYTES_V0 = 96_000;
export const PRE_STT_SILENT_CAPTURE_MIN_MS_V0 = 6000;

/** Borderline mic energy — proceed when warm probe proves live signal (prod log ~0.0104). */
export const PRE_STT_BORDERLINE_RMS_MIN_V0 = 0.0095;
export const PRE_STT_BORDERLINE_WARM_MIN_V0 = 0.72;
export const PRE_STT_BORDERLINE_MIN_SAMPLES_V0 = 4;
export const PRE_STT_BORDERLINE_MIN_MS_V0 = 1200;

/**
 * @param {{ maxRms?: number, recordedMs?: number, warmProbe?: object, sampleCount?: number }} input
 * @param {number} energy
 */
export function isPreSttBorderlineWarmProceedV0(input = {}, energy) {
  const avgWarm = Number(input.warmProbe?.avgWarmScore);
  const sampleCount = Math.max(0, Number(input.sampleCount) || 0);
  const recordedMs = Math.max(0, Number(input.recordedMs) || 0);
  return (
    Number.isFinite(energy) &&
    energy >= PRE_STT_BORDERLINE_RMS_MIN_V0 &&
    energy < VOICE_MIN_SPEECH_RMS_V3 &&
    recordedMs >= PRE_STT_BORDERLINE_MIN_MS_V0 &&
    sampleCount >= PRE_STT_BORDERLINE_MIN_SAMPLES_V0 &&
    Number.isFinite(avgWarm) &&
    avgWarm >= PRE_STT_BORDERLINE_WARM_MIN_V0
  );
}

/**
 * @param {{
 *   maxRms?: number,
 *   recordedMs?: number,
 *   bytes?: number,
 *   warmProbe?: { avgWarmScore?: number, minWarmScore?: number, samples?: number },
 *   sampleCount?: number
 * }} input
 */
export function evaluatePreSttInputSanitizationV0(input = {}) {
  const maxRms = Number(input.maxRms);
  const recordedMs = Math.max(0, Number(input.recordedMs) || 0);
  const bytes = Math.max(0, Number(input.bytes) || 0);
  const energy = maxRms;
  const speechProbability = estimatePreSttSpeechProbabilityV0(input);
  const acousticEntropy = measurePreSttAcousticEntropyV0({ ...input, speechProbability });
  const shortUtterance = recordedMs > 0 && recordedMs <= PRE_STT_SHORT_UTTERANCE_EXEMPT_MS_V0;

  const base = Object.freeze({
    schema: RHIZOH_VOICE_PRE_STT_SANITIZATION_SCHEMA_V0,
    energy: Number.isFinite(energy) ? energy : 0,
    recordedMs,
    speechProbability,
    acousticEntropy,
    shortUtterance,
    minEnergy: VOICE_MIN_SPEECH_RMS_V3,
    minSpeechProbability: PRE_STT_MIN_SPEECH_PROBABILITY_V0,
    entropyHoldThreshold: PRE_STT_ACOUSTIC_ENTROPY_HOLD_V0,
    holdSpeechProbMax: PRE_STT_HOLD_SPEECH_PROB_MAX_V0,
    holdMinDurationMs: PRE_STT_HOLD_MIN_DURATION_MS_V0
  });

  if (!Number.isFinite(energy) || energy < VOICE_MIN_SPEECH_RMS_V3) {
    if (isPreSttBorderlineWarmProceedV0(input, energy)) {
      return Object.freeze({
        ...base,
        pass: true,
        action: PRE_STT_GATE_ACTION_V0.PROCEED,
        reason: "pre_stt_borderline_warm_ok",
        borderlineWarm: true
      });
    }
    const silentCapture =
      bytes >= PRE_STT_SILENT_CAPTURE_MIN_BYTES_V0 &&
      recordedMs >= PRE_STT_SILENT_CAPTURE_MIN_MS_V0 &&
      energy < PRE_STT_SILENT_CAPTURE_MAX_RMS_V0;
    return Object.freeze({
      ...base,
      pass: false,
      action: PRE_STT_GATE_ACTION_V0.DROP,
      reason: silentCapture ? "pre_stt_silent_capture" : "pre_stt_low_energy",
      silentCapture
    });
  }

  if (
    acousticEntropy >= PRE_STT_ACOUSTIC_ENTROPY_HOLD_V0 &&
    speechProbability < PRE_STT_HOLD_SPEECH_PROB_MAX_V0 &&
    recordedMs > PRE_STT_HOLD_MIN_DURATION_MS_V0
  ) {
    return Object.freeze({
      ...base,
      pass: false,
      action: PRE_STT_GATE_ACTION_V0.HOLD,
      reason: "pre_stt_acoustic_entropy"
    });
  }

  if (
    shortUtterance &&
    Number.isFinite(energy) &&
    energy >= VOICE_MIN_SPEECH_RMS_V3 &&
    speechProbability >= PRE_STT_SHORT_UTTERANCE_MIN_SPEECH_PROB_V0
  ) {
    return Object.freeze({
      ...base,
      pass: true,
      action: PRE_STT_GATE_ACTION_V0.PROCEED,
      reason: "pre_stt_short_utterance_ok"
    });
  }

  if (speechProbability < PRE_STT_MIN_SPEECH_PROBABILITY_V0) {
    return Object.freeze({
      ...base,
      pass: false,
      action: PRE_STT_GATE_ACTION_V0.DROP,
      reason: "pre_stt_low_speech_probability"
    });
  }

  return Object.freeze({
    ...base,
    pass: true,
    action: PRE_STT_GATE_ACTION_V0.PROCEED,
    reason: "pre_stt_ok"
  });
}

/**
 * @param {ReturnType<typeof evaluatePreSttInputSanitizationV0>} verdict
 */
export function publishPreSttSanitizationDebugV0(verdict) {
  if (typeof window === "undefined" || !verdict) return;
  try {
    window.__CASTLE_RHIZOH_PRE_STT_SANITIZATION__ = Object.freeze({
      ...verdict,
      atMs: Date.now()
    });
  } catch {
    /* noop */
  }
}
