/**
 * Micro-rhythm bias v0 — NOT a new pipeline layer.
 * Tweaks timing/hesitation/pre-emption/smoothing on existing speech shape output.
 * Goal: rhythm = speed illusion; less "fluent monologue", more human micro-pauses.
 */

import { MF0_INTENT_V0 } from "./rhizohMeaningFrameV0.js";
import { COMPANION_RELATIONAL_TONE_V0 } from "./rhizohCompanionLayerV0.js";
import { getLastContinuityFrameV0 } from "./rhizohContinuityCacheV0.js";

export const RHIZOH_MICRO_RHYTHM_BIAS_SCHEMA_V0 = "castle.rhizoh.micro_rhythm_bias.v0";

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * Deterministic micro jitter from trace (no Math.random in prod path).
 * @param {string | null | undefined} seed
 * @param {number} salt
 */
function deterministicMicroJitter01V0(seed, salt = 0) {
  const s = String(seed || "rhizoh");
  let h = salt;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return clamp01((Math.abs(h) % 1000) / 1000);
}

/**
 * @param {number} warmthNow
 * @param {number | null} warmthPrior
 */
function smoothEmotionalWarmthV0(warmthNow, warmthPrior) {
  if (warmthPrior == null || !Number.isFinite(warmthPrior)) return warmthNow;
  return clamp01(warmthNow * 0.62 + warmthPrior * 0.38);
}

/**
 * @param {{
 *   speechShape: ReturnType<import("./rhizohVoiceStreamEngineV0.js").buildVoiceStreamShapeV0>,
 *   meaningFrame: ReturnType<import("./rhizohMeaningFrameV0.js").extractMeaningFrameV0>,
 *   companion: ReturnType<import("./rhizohCompanionLayerV0.js").resolveCompanionLayerV0>,
 *   route: ReturnType<import("./rhizohFastConversationRouterV0.js").routeFastConversationV0>,
 *   userInterrupted?: boolean
 * }} input
 */
export function applyMicroRhythmBiasV0(input) {
  const shape = input.speechShape;
  const mf = input.meaningFrame;
  const companion = input.companion;
  const route = input.route;
  const jitter = deterministicMicroJitter01V0(mf?.traceId, 17);

  const lastFrame = getLastContinuityFrameV0();
  const priorWarmth = lastFrame?.collapsed?.emotion?.calm ?? null;
  const warmthSmoothed = smoothEmotionalWarmthV0(
    companion?.emotionalAttunement?.warmth ?? 0.5,
    priorWarmth
  );

  const isQuestion = mf?.intent === MF0_INTENT_V0.ASK;
  const reflective = companion?.relationalTone === COMPANION_RELATIONAL_TONE_V0.REFLECTIVE;

  const hesitationMs = Math.round(
    (reflective ? 95 : 55) +
      (isQuestion ? 45 : 20) +
      jitter * 40 -
      (route?.fastPath ? 25 : 0)
  );

  const breathGapMs = Math.round(
    shape.pauseMap.length
      ? shape.pauseMap.reduce((s, p) => s + p.pauseBeforeMs, 0) / shape.pauseMap.length
      : 180
  );

  const preempt01 = clamp01(
    route?.fastPath && isQuestion ? 0.22 + jitter * 0.12 : route?.fastPath ? 0.14 : 0.06
  );

  const targetFirstAudioMs = Math.max(
    220,
    Math.round((shape.stream?.targetFirstAudioMs ?? 480) * (1 - preempt01 * 0.35))
  );

  const pauseMap = shape.pauseMap.map((p, i) => {
    let pause = p.pauseBeforeMs;
    if (i > 0 && isQuestion) pause += Math.round(hesitationMs * 0.35);
    if (reflective && i === shape.pauseMap.length - 1) pause += 60;
    if (input.userInterrupted && i === 0) pause = Math.max(60, Math.round(pause * 0.55));
    return Object.freeze({ ...p, pauseBeforeMs: pause });
  });

  const interruptible =
    isQuestion || companion?.initiativeBias === "co-led" || Boolean(input.userInterrupted);

  const toneCurve = [...(shape.toneCurve || [])];
  if (toneCurve.length >= 2 && warmthSmoothed > 0.55) {
    toneCurve[1] = warmthSmoothed > 0.72 ? "warm" : toneCurve[1];
  }

  const microRhythm = Object.freeze({
    schema: RHIZOH_MICRO_RHYTHM_BIAS_SCHEMA_V0,
    targetFirstAudioMs,
    breathGapMs,
    hesitationMs,
    preemptiveStart01: preempt01,
    warmthSmoothed01: warmthSmoothed,
    interruptible,
    sentenceBreakBias: reflective ? "longer_reflective" : isQuestion ? "question_hold" : "natural",
    emotionalDriftSmoothing: true
  });

  return Object.freeze({
    ...shape,
    pauseMap: Object.freeze(pauseMap),
    toneCurve: Object.freeze(toneCurve),
    stream: Object.freeze({
      ...shape.stream,
      targetFirstAudioMs,
      hesitationBeforeSpeakMs: hesitationMs,
      preemptiveStart01: preempt01,
      speakingStartsBeforeCompletion:
        shape.stream?.speakingStartsBeforeCompletion === true || preempt01 >= 0.18
    }),
    microRhythm
  });
}

/**
 * Concrete UX-facing collapse (less abstract than raw MF).
 * @param {ReturnType<typeof applyMicroRhythmBiasV0>} shape
 */
export function collapseMicroRhythmFeelV0(shape) {
  const m = shape.microRhythm;
  if (!m) return null;
  return Object.freeze({
    whenYouHearMs: m.targetFirstAudioMs,
    breathGapMs: m.breathGapMs,
    hesitationMs: m.hesitationMs,
    canInterrupt: m.interruptible,
    preemptiveStart01: m.preemptiveStart01,
    breakStyle: m.sentenceBreakBias
  });
}

/**
 * @param {Record<string, unknown>} conversationBehavior
 * @param {ReturnType<typeof collapseMicroRhythmFeelV0>} feel
 */
export function mergeMicroRhythmFeelIntoBehaviorV0(conversationBehavior, feel) {
  if (!conversationBehavior || !feel) return conversationBehavior;
  return Object.freeze({
    ...conversationBehavior,
    microRhythmFeel: feel
  });
}
