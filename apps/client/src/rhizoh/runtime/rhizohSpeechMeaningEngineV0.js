/**
 * Speech Meaning Engine v0 — stable conversational resonance (read-side).
 * Pipeline: segment → density map → emphasis → rhythm.
 * User sees only collapsed speechResonance on conversationBehavior.
 */

import { logCastleLifecycleV0 } from "./rhizohProductionLogNamespacesV0.js";
import { segmentSpeechTextV0 } from "./rhizohSpeechSentenceSegmenterV0.js";
import { buildMeaningDensityMapV0 } from "./rhizohSpeechMeaningDensityMapV0.js";
import { distributeSpeechEmphasisV0 } from "./rhizohSpeechEmphasisDistributorV0.js";
import { computeSpeechRhythmPlanV0 } from "./rhizohSpeechRhythmMotorV0.js";
import { normalizeConversationVoicingV0 } from "./rhizohConversationVoicingV0.js";
function isSpeechMeaningVerboseV0() {
  try {
    if (import.meta.env?.DEV) return true;
    return String(import.meta.env?.VITE_RHIZOH_STABILITY_VERBOSE || "") === "1";
  } catch {
    return false;
  }
}

export const RHIZOH_SPEECH_MEANING_ENGINE_SCHEMA_V0 = "castle.rhizoh.speech_meaning_engine.v0";

/** @type {object | null} */
let lastSpeechMeaningSnapshotV0 = null;

/**
 * @param {ReturnType<typeof runSpeechMeaningEngineV0>} snapshot
 */
function collapseSpeechResonanceV0(snapshot) {
  return Object.freeze({
    segmentCount: snapshot.segmentation.segments.length,
    sentenceCount: snapshot.segmentation.sentenceCount,
    utteranceDensity01: snapshot.densityMap.utteranceDensity01,
    peakEmphasis01: snapshot.emphasis.peakEmphasis01,
    meanPauseMs: snapshot.rhythm.meanPauseMs,
    rhythmPacing: snapshot.rhythm.pacing,
    breathAlign: snapshot.rhythm.breathAlign
  });
}

/**
 * @param {{
 *   text?: string,
 *   conversationBehavior?: Record<string, unknown> | null,
 *   role?: "user"|"companion"|"assistant",
 *   traceId?: string | null,
 *   maxClauseChars?: number
 * }} input
 */
export function runSpeechMeaningEngineV0(input = {}) {
  const text = String(input.text || "").trim();
  const segmentation = segmentSpeechTextV0(text, { maxClauseChars: input.maxClauseChars });
  const densityMap = buildMeaningDensityMapV0(segmentation);
  const emphasis = distributeSpeechEmphasisV0(segmentation, densityMap);
  const rhythm = computeSpeechRhythmPlanV0({
    segmentation,
    emphasis,
    densityMap,
    conversationBehavior: input.conversationBehavior,
    role: input.role
  });

  const snapshot = Object.freeze({
    schema: RHIZOH_SPEECH_MEANING_ENGINE_SCHEMA_V0,
    traceId: input.traceId ?? null,
    role: normalizeConversationVoicingV0(input.role),
    textPreview: text.slice(0, 160),
    segmentation,
    densityMap,
    emphasis,
    rhythm,
    resonance: collapseSpeechResonanceV0({
      segmentation,
      densityMap,
      emphasis,
      rhythm
    })
  });

  lastSpeechMeaningSnapshotV0 = snapshot;

  logCastleLifecycleV0("speech_meaning", Object.freeze({
    traceId: snapshot.traceId,
    role: snapshot.role,
    segmentCount: snapshot.resonance.segmentCount,
    utteranceDensity01: snapshot.resonance.utteranceDensity01,
    peakEmphasis01: snapshot.resonance.peakEmphasis01,
    meanPauseMs: snapshot.resonance.meanPauseMs,
    breathAlign: snapshot.resonance.breathAlign
  }));

  if (typeof window !== "undefined" && isSpeechMeaningVerboseV0()) {
    window.__CASTLE_RHIZOH_SPEECH_MEANING_INTERNAL__ = snapshot;
  }

  return snapshot;
}

export function getLastSpeechMeaningSnapshotV0() {
  return lastSpeechMeaningSnapshotV0;
}

export function resetSpeechMeaningEngineV0() {
  lastSpeechMeaningSnapshotV0 = null;
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_RHIZOH_SPEECH_MEANING_INTERNAL__;
    } catch {
      /* noop */
    }
  }
}

/**
 * Attach collapsed resonance to conversation behavior (feel-only surface).
 * @param {Record<string, unknown>} conversationBehavior
 * @param {ReturnType<typeof runSpeechMeaningEngineV0>} speechMeaning
 */
export function mergeSpeechResonanceIntoBehaviorV0(conversationBehavior, speechMeaning) {
  if (!conversationBehavior || typeof conversationBehavior !== "object") return conversationBehavior;
  if (!speechMeaning?.resonance) return conversationBehavior;
  return Object.freeze({
    ...conversationBehavior,
    speechResonance: speechMeaning.resonance
  });
}
