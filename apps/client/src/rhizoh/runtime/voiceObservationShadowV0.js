/**
 * Faz 2 — shadow directed speech release (counterfactual; no execution authority).
 */

import {
  sanitizeVoiceTranscriptForDispatchV3,
  VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3
} from "./voiceEngineV3/voiceTranscriptSanityV3.js";
import {
  classifyVoiceDirectedSpeechBandV0,
  VOICE_DIRECTED_SPEECH_BAND
} from "./voiceDirectedSpeechObservationV0.js";

export const VOICE_OBSERVATION_SHADOW_SCHEMA = "castle.rhizoh.voice_observation_shadow.v0.1";

/** Atlas / shadow analytics — use weighted* to avoid witness inflation from ambient TV. */
export const VOICE_WITNESS_BAND_WEIGHT_V0 = Object.freeze({
  [VOICE_DIRECTED_SPEECH_BAND.AMBIENT]: 0.15,
  [VOICE_DIRECTED_SPEECH_BAND.UNKNOWN]: 0.45,
  [VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE]: 1
});

const counters = {
  witnessed: 0,
  ambient: 0,
  unknown: 0,
  directed_candidate: 0,
  shadowWouldAccept: 0,
  shadowFalsePositive: 0,
  shadowMissedWhileActualAccepted: 0,
  actualAccepted: 0,
  actualRejected: 0
};

const weighted = {
  witnessed: 0,
  ambient: 0,
  unknown: 0,
  directed_candidate: 0,
  shadowWouldAccept: 0,
  shadowFalsePositive: 0,
  actualAccepted: 0,
  actualRejected: 0
};

/**
 * @param {string} band
 */
export function voiceWitnessBandWeightV0(band) {
  const w = VOICE_WITNESS_BAND_WEIGHT_V0[String(band || "")];
  return Number.isFinite(w) ? w : VOICE_WITNESS_BAND_WEIGHT_V0[VOICE_DIRECTED_SPEECH_BAND.UNKNOWN];
}

/**
 * Phase 3 rule (shadow only unless gate flag on): directed_candidate + sanity + confidence.
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   maxRms?: number,
 *   source?: string
 * }} meta
 */
export function evaluateVoiceShadowReleaseV0(meta = {}) {
  const observation = classifyVoiceDirectedSpeechBandV0(meta);
  const text = String(meta.text || "").trim();
  const conf = Number(meta.confidence);
  const strategy = String(meta.strategy || "");

  const sane = sanitizeVoiceTranscriptForDispatchV3(text, {
    confidence: Number.isFinite(conf) ? conf : undefined,
    strategy,
    checkRepeat: false
  });

  const sanityPass = sane.ok === true;
  const confidencePass = !Number.isFinite(conf) || conf >= VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3;
  const directedPass = observation.band === VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE;

  const shadowWouldOpenTurn = directedPass && sanityPass && confidencePass;
  /** Heuristic mis-label risk: would open as directed but ambient cues also present (e.g. TV). */
  const shadowFalsePositive =
    shadowWouldOpenTurn &&
    observation.band === VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE &&
    observation.ambientScore >= 1;

  const noiseWeight = voiceWitnessBandWeightV0(observation.band);

  return Object.freeze({
    observation,
    noiseWeight,
    sanityPass,
    sanityReason: sane.ok ? null : sane.reason || "quality_reject",
    confidencePass,
    confidence: Number.isFinite(conf) ? conf : undefined,
    threshold: VOICE_TRANSCRIPT_SUSPICIOUS_CONF_V3,
    directedPass,
    shadowWouldOpenTurn,
    shadowFalsePositive
  });
}

/**
 * @param {ReturnType<typeof evaluateVoiceShadowReleaseV0>} shadow
 * @param {{ accepted?: boolean, reason?: string } | null} [actualGate]
 */
export function recordVoiceObservationShadowV0(shadow, actualGate = null) {
  const band = shadow.observation.band;
  const w = voiceWitnessBandWeightV0(band);

  counters.witnessed += 1;
  weighted.witnessed += w;
  if (band === VOICE_DIRECTED_SPEECH_BAND.AMBIENT) {
    counters.ambient += 1;
    weighted.ambient += w;
  } else if (band === VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE) {
    counters.directed_candidate += 1;
    weighted.directed_candidate += w;
  } else {
    counters.unknown += 1;
    weighted.unknown += w;
  }

  if (shadow.shadowWouldOpenTurn) {
    counters.shadowWouldAccept += 1;
    weighted.shadowWouldAccept += w;
  }
  if (shadow.shadowFalsePositive) {
    counters.shadowFalsePositive += 1;
    weighted.shadowFalsePositive += w;
  }

  const actualAccepted = actualGate?.accepted === true;
  if (actualAccepted) {
    counters.actualAccepted += 1;
    weighted.actualAccepted += w;
  } else if (actualGate) {
    counters.actualRejected += 1;
    weighted.actualRejected += w;
  }

  if (actualAccepted && !shadow.shadowWouldOpenTurn) {
    counters.shadowMissedWhileActualAccepted += 1;
  }

  publishShadowToWindowV0(shadow, actualGate, w);
  return getVoiceObservationShadowSnapshotV0();
}

function publishShadowToWindowV0(shadow, actualGate, noiseWeight) {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.voiceWitnessShadow = getVoiceObservationShadowSnapshotV0();
  window.__rhizoh.voiceWitnessLast = Object.freeze({
    atMs: Date.now(),
    band: shadow.observation.band,
    noiseWeight,
    shadowWouldOpenTurn: shadow.shadowWouldOpenTurn,
    shadowFalsePositive: shadow.shadowFalsePositive,
    actualAccepted: actualGate?.accepted === true,
    actualReason: actualGate?.reason || null
  });
}

export function getVoiceObservationShadowSnapshotV0() {
  const directedSignal = weighted.directed_candidate;
  const noiseMass = weighted.ambient + weighted.unknown * 0.5;
  const signalToNoise =
    noiseMass > 0 ? Math.round((directedSignal / noiseMass) * 1000) / 1000 : directedSignal > 0 ? 999 : 0;

  return Object.freeze({
    schema: VOICE_OBSERVATION_SHADOW_SCHEMA,
    raw: Object.freeze({ ...counters }),
    weighted: Object.freeze({ ...weighted }),
    bandWeights: VOICE_WITNESS_BAND_WEIGHT_V0,
    /** Prefer this for Atlas dashboards — raw `witnessed` inflates on ambient rejects. */
    analyticsHint: "use_weighted_counters_for_distribution",
    directedSignalWeighted: directedSignal,
    signalToNoiseWeighted: signalToNoise,
    shadowAcceptRateWeighted:
      weighted.witnessed > 0
        ? Math.round((weighted.shadowWouldAccept / weighted.witnessed) * 1000) / 1000
        : 0,
    ...counters,
    atMs: Date.now()
  });
}

export function resetVoiceObservationShadowForTestV0() {
  for (const k of Object.keys(counters)) counters[k] = 0;
  for (const k of Object.keys(weighted)) weighted[k] = 0;
}
