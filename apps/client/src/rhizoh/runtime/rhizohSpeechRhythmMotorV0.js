/**
 * Speech Meaning Engine v0 — conversation rhythm motor (konuşma ritim motoru).
 * Consumes collapsed conversationBehavior.rhythm only — no phase names on surface.
 */

import {
  normalizeConversationVoicingV0,
  RHIZOH_CONVERSATION_VOICING_V0
} from "./rhizohConversationVoicingV0.js";

export const RHIZOH_SPEECH_RHYTHM_SCHEMA_V0 = "castle.rhizoh.speech_rhythm_motor.v0";

const BREATH_BASE_MS_V0 = Object.freeze({
  inhale: 520,
  hold: 380,
  exhale: 280
});

const BREATH_RATE_V0 = Object.freeze({
  inhale: 0.92,
  hold: 0.88,
  exhale: 1.02
});

const PACING_PAUSE_MULT_V0 = Object.freeze({
  calm: 1.15,
  measured: 1,
  flowing: 0.82,
  engaged: 0.72
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @param {Record<string, unknown> | null | undefined} conversationBehavior
 */
function resolveBreathKeyV0(conversationBehavior) {
  const breath = String(conversationBehavior?.rhythm?.breath || "inhale").toLowerCase();
  if (breath === "hold" || breath === "exhale") return breath;
  return "inhale";
}

/**
 * @param {Record<string, unknown> | null | undefined} conversationBehavior
 */
function resolvePacingKeyV0(conversationBehavior) {
  const pacing = String(conversationBehavior?.rhythm?.pacing || "calm").toLowerCase();
  if (PACING_PAUSE_MULT_V0[pacing] != null) return pacing;
  return "calm";
}

/**
 * @param {{
 *   segmentation: ReturnType<import("./rhizohSpeechSentenceSegmenterV0.js").segmentSpeechTextV0>,
 *   emphasis: ReturnType<import("./rhizohSpeechEmphasisDistributorV0.js").distributeSpeechEmphasisV0>,
 *   densityMap: ReturnType<import("./rhizohSpeechMeaningDensityMapV0.js").buildMeaningDensityMapV0>,
 *   conversationBehavior?: Record<string, unknown> | null,
 *   role?: "user"|"companion"|"assistant"
 * }} input
 */
export function computeSpeechRhythmPlanV0(input) {
  const segments = input.segmentation?.segments || [];
  const breath = resolveBreathKeyV0(input.conversationBehavior);
  const pacing = resolvePacingKeyV0(input.conversationBehavior);
  const continuity01 = clamp01(input.conversationBehavior?.continuity01 ?? 0.45);
  const tone01 = clamp01(input.conversationBehavior?.toneStability01 ?? 0.8);

  const basePause = BREATH_BASE_MS_V0[breath] * PACING_PAUSE_MULT_V0[pacing];
  const baseRate = BREATH_RATE_V0[breath];
  const role = normalizeConversationVoicingV0(input.role);

  const emphasisById = new Map(
    (input.emphasis?.segments || []).map((e) => [e.segmentId, e])
  );
  const densityById = new Map(
    (input.densityMap?.segments || []).map((d) => [d.segmentId, d])
  );

  const cues = segments.map((seg, i) => {
    const emp = emphasisById.get(seg.id);
    const dens = densityById.get(seg.id);
    const emphasis01 = emp?.emphasis01 ?? 0.2;
    const density01 = dens?.density01 ?? 0.35;

    const pauseBeforeMs = Math.round(
      basePause *
        (1 - emphasis01 * 0.35) *
        (role === RHIZOH_CONVERSATION_VOICING_V0.USER ? 0.92 : 1.04) *
        (i === 0 ? 0.35 : 1)
    );

    const rate = clamp01(
      baseRate +
        emphasis01 * 0.06 -
        (tone01 > 0.85 ? 0.02 : 0) +
        (density01 > 0.6 ? 0.03 : 0)
    );

    const pitchDelta01 = clamp01(
      0.5 + emphasis01 * 0.35 + (seg.endsWithQuestion ? 0.12 : 0) - (breath === "hold" ? 0.08 : 0)
    );

    return Object.freeze({
      segmentId: seg.id,
      pauseBeforeMs: Math.max(80, pauseBeforeMs),
      rate: Math.max(0.82, Math.min(1.12, rate)),
      pitchDelta01,
      chunkBreakAfter: i < segments.length - 1 && (emphasis01 >= 0.22 || density01 >= 0.5)
    });
  });

  const meanPauseMs = cues.length
    ? Math.round(cues.reduce((s, c) => s + c.pauseBeforeMs, 0) / cues.length)
    : 0;

  return Object.freeze({
    schema: RHIZOH_SPEECH_RHYTHM_SCHEMA_V0,
    breathAlign: breath,
    pacing,
    continuity01,
    role,
    cues: Object.freeze(cues),
    meanPauseMs,
    meanRate:
      cues.length > 0
        ? Math.round((cues.reduce((s, c) => s + c.rate, 0) / cues.length) * 1000) / 1000
        : 1
  });
}
