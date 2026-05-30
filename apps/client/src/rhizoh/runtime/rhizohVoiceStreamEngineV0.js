/**
 * Voice stream engine v0 — speech shape + early partial stream hints (voice-first UX).
 * Streaming first, completion second; no execution authority.
 */

import { runSpeechMeaningEngineV0 } from "./rhizohSpeechMeaningEngineV0.js";
import { normalizeConversationVoicingV0 } from "./rhizohConversationVoicingV0.js";
import {
  COMPANION_PRESENCE_MODE_V0,
  COMPANION_RELATIONAL_TONE_V0
} from "./rhizohCompanionLayerV0.js";
import { applyMicroRhythmBiasV0 } from "./rhizohMicroRhythmBiasV0.js";

export const RHIZOH_VOICE_STREAM_SCHEMA_V0 = "castle.rhizoh.voice_stream_engine.v0";

/**
 * @param {string} pacing
 * @param {number} targetFirstAudioMs
 */
function pacingToSpeedV0(pacing, targetFirstAudioMs) {
  if (targetFirstAudioMs <= 320) return "fast";
  if (pacing === "engaged" || pacing === "flowing") return "medium";
  if (targetFirstAudioMs >= 550) return "slow";
  return "medium";
}

/**
 * @param {ReturnType<import("./rhizohGlobalMeaningProjectorV0.js").projectMeaningFrameV0>} projection
 * @param {ReturnType<import("./rhizohMeaningFrameV0.js").extractMeaningFrameV0>} mf
 * @param {ReturnType<import("./rhizohCompanionLayerV0.js").resolveCompanionLayerV0> | null} [companion]
 */
function toneCurveFromFieldV0(projection, mf, companion = null) {
  const e = companion?.emotionalAttunement || mf?.emotionVector || {};
  const start =
    companion?.relationalTone === COMPANION_RELATIONAL_TONE_V0.REFLECTIVE
      ? "reflective"
      : e.tension > 0.5
        ? "attuned"
        : "calm";
  const mid =
    companion?.presenceMode === COMPANION_PRESENCE_MODE_V0.EXPRESSIVE
      ? "present"
      : e.curiosity > 0.55
        ? "engaged"
        : projection.pacing === "flowing"
          ? "warm"
          : "steady";
  const end = mf?.continuityHook ? "shared_continuity" : "open_field";
  return Object.freeze([start, mid, end]);
}

/**
 * @param {{
 *   text?: string,
 *   meaningFrame: ReturnType<import("./rhizohMeaningFrameV0.js").extractMeaningFrameV0>,
 *   projection: ReturnType<import("./rhizohGlobalMeaningProjectorV0.js").projectMeaningFrameV0>,
 *   route: ReturnType<import("./rhizohFastConversationRouterV0.js").routeFastConversationV0>,
 *   conversationBehavior?: Record<string, unknown> | null,
 *   companion?: ReturnType<import("./rhizohCompanionLayerV0.js").resolveCompanionLayerV0> | null,
 *   role?: "user"|"companion"|"assistant",
 *   userInterrupted?: boolean
 * }} input
 */
export function buildVoiceStreamShapeV0(input) {
  const text = String(input.text || "").trim();
  const route = input.route;
  const projection = input.projection;
  const mf = input.meaningFrame;

  const speechMeaning = text
    ? runSpeechMeaningEngineV0({
        text,
        conversationBehavior: input.conversationBehavior,
        role: normalizeConversationVoicingV0(input.role),
        traceId: mf?.traceId
      })
    : null;

  const segments = speechMeaning?.segmentation?.segments || [];
  const rhythm = speechMeaning?.rhythm;
  const pauseMult = projection?.pauseMultiplier ?? 1;

  const segmentation = segments.map((s) => s.text);
  const emphasisPoints = (speechMeaning?.emphasis?.segments || [])
    .filter((e) => e.stressTier === "peak" || e.emphasis01 >= 0.28)
    .map((e) => e.segmentId);

  const pauseMap = (rhythm?.cues || []).map((c) =>
    Object.freeze({
      segmentId: c.segmentId,
      pauseBeforeMs: Math.round(c.pauseBeforeMs * pauseMult)
    })
  );

  const pacing = pacingToSpeedV0(projection?.pacing, route?.targetFirstAudioMs ?? 480);
  const firstChunk = segmentation[0] || text.slice(0, 72) || "";
  const earlyTtsEligible = Boolean(firstChunk) && route?.fastPath !== false;

  const base = Object.freeze({
    schema: RHIZOH_VOICE_STREAM_SCHEMA_V0,
    pacing,
    segmentation: Object.freeze(segmentation),
    emphasisPoints: Object.freeze(emphasisPoints),
    pauseMap: Object.freeze(pauseMap),
    toneCurve: toneCurveFromFieldV0(projection, mf, input.companion),
    sharedSpeechField: true,
    stream: Object.freeze({
      partialChunks: Object.freeze(segmentation.slice(0, 3)),
      earlyTtsEligible,
      targetFirstAudioMs: route?.targetFirstAudioMs ?? 480,
      speakingStartsBeforeCompletion: earlyTtsEligible && segmentation.length > 1
    }),
    resonance: speechMeaning?.resonance ?? null
  });

  if (!input.companion) return base;

  return applyMicroRhythmBiasV0({
    speechShape: base,
    meaningFrame: mf,
    companion: input.companion,
    route,
    userInterrupted: input.userInterrupted === true
  });
}

/**
 * Collapsed surface for expression bundle.
 * @param {ReturnType<typeof buildVoiceStreamShapeV0>} shape
 */
export function collapseSpeechShapeV0(shape) {
  const feel = shape.microRhythm
    ? Object.freeze({
        whenYouHearMs: shape.microRhythm.targetFirstAudioMs,
        hesitationMs: shape.microRhythm.hesitationMs,
        canInterrupt: shape.microRhythm.interruptible
      })
    : null;
  return Object.freeze({
    pacing: shape.pacing,
    chunkCount: shape.segmentation.length,
    earlyTtsEligible: shape.stream.earlyTtsEligible,
    targetFirstAudioMs: shape.stream.targetFirstAudioMs,
    toneCurve: shape.toneCurve,
    microRhythmFeel: feel
  });
}
