/**
 * Lightweight intent router — greeting | command | question | micro_social | unknown.
 * LLM fallback only when confidence below threshold or route class unknown/question-deep.
 */

import { normalizeVoiceCommandSpaceV0, VOICE_INTENT_TYPE_V0 } from "./rhizohVoiceCommandRouterV0.js";
import { classifyVoiceIntentV0 } from "./rhizohVoiceCommandRouterV0.js";
import { classifyMicroIntentFromTextV0, MICRO_INTENT_V0 } from "./rhizohMicroIntentRouterV0.js";
import {
  pushContinuationFragmentV0,
  peekContinuationHoldV0
} from "./rhizohContinuationHoldV0.js";

export const RHIZOH_INTENT_ROUTER_SCHEMA_V0 = "castle.rhizoh.intent_router.v0";

/** User-facing route class (classifier output). */
export const INTENT_ROUTE_CLASS_V0 = Object.freeze({
  GREETING: "greeting",
  COMMAND: "command",
  MICRO_SOCIAL: "micro_social",
  AMBIENT: "ambient",
  CONTINUATION: "continuation",
  HYBRID: "hybrid",
  QUESTION: "question",
  UNKNOWN: "unknown"
});

const AMBIENT_RE_V0 =
  /^(şey|sey|eee|ıı|ii|hmm|hm|bilmiyorum ya|neyse|yani işte|uh|um|\.{2,})$/i;

const CONTINUATION_RE_V0 =
  /^(ve sonra|bir de|bir de şey|devam edeyim|şey vardı|aslında şöyle|so anyway|and then)\b/i;

const HYBRID_SOFT_RE_V0 =
  /(bana kısa|kısa anlat|ne düşünüyorsun|yardım eder misin|hızlıca söyle|quickly tell)/i;

/**
 * @param {string} text
 */
export function detectAmbientSpeechV0(text) {
  const n = String(text || "").trim();
  if (!n || n.length > 32) return false;
  const words = n.split(/\s+/).filter(Boolean);
  return words.length <= 4 && AMBIENT_RE_V0.test(n);
}

/**
 * @param {string} text
 */
export function detectContinuationSpeechV0(text) {
  const n = String(text || "").trim();
  return n.length >= 3 && n.length <= 120 && CONTINUATION_RE_V0.test(n);
}

/**
 * @param {string} [locale]
 */
export function resolveAmbientReplyV0(locale) {
  const loc = String(locale || "tr").toLowerCase().slice(0, 2);
  const table = {
    tr: ["", "Mm.", "Dinliyorum."],
    en: ["", "Mm.", "Listening."]
  };
  const list = table[loc] || table.en;
  return list[0] === "" && list.length > 1 ? list[Math.floor(Math.random() * (list.length - 1)) + 1] : list[0];
}

/**
 * @param {string} fragment
 * @param {string} [locale]
 */
export function resolveContinuationHoldReplyV0(fragment, locale) {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  pushContinuationFragmentV0(fragment);
  const buffer = peekContinuationHoldV0() || fragment;
  const loc = String(locale || "tr").toLowerCase().slice(0, 2);
  const reply =
    loc === "tr" ? "Dinliyorum, devam et." : "I'm listening — go on.";
  return Object.freeze({
    reply,
    buffer,
    latencyMs: Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0)
  });
}

export { LLM_FALLBACK_CONFIDENCE_MIN_V0 } from "./rhizohConfidenceDecayGateV0.js";
import { applyConfidenceDecayGateV0 } from "./rhizohConfidenceDecayGateV0.js";

const QUESTION_RE_V0 =
  /(\?|^(ne|nedir|nasıl|nasil|neden|niçin|nicin|kim|nerede|kaç|kac|what|why|how|who|where|when)\b)/i;

const DEEP_QUESTION_RE_V0 =
  /(açıkla|acikla|anlat|explain|describe|analiz|compare|karşılaştır|story|hikaye|çünkü|because)/i;

/**
 * Map micro intent id → route class.
 * @param {string} microId
 */
function microToRouteClass(microId) {
  if (microId === MICRO_INTENT_V0.GREETING) return INTENT_ROUTE_CLASS_V0.GREETING;
  if (microId === MICRO_INTENT_V0.WELLBEING) return INTENT_ROUTE_CLASS_V0.MICRO_SOCIAL;
  return INTENT_ROUTE_CLASS_V0.MICRO_SOCIAL;
}

/**
 * @param {string} normalized
 */
function scoreQuestionIntentV0(normalized) {
  const n = String(normalized || "").trim();
  if (!n) return 0;
  const words = n.split(/\s+/).filter(Boolean);
  let score = 0;
  if (QUESTION_RE_V0.test(n)) score += 0.55;
  if (n.includes("?")) score += 0.2;
  if (words.length >= 5) score += 0.15;
  if (DEEP_QUESTION_RE_V0.test(n)) score += 0.35;
  return Math.min(0.98, score);
}

/**
 * Unified classifier (no LLM).
 * @param {string} input
 * @param {{ sttInferred?: string }} [ctx]
 */
function finalizeIntentPlanV0(base, normalized, opts = {}) {
  return applyConfidenceDecayGateV0({
    normalized,
    basePlan: base,
    localFailed: opts.localFailed === true,
    reflexLatencyMs: opts.reflexLatencyMs
  });
}

/**
 * Unified classifier (no LLM) + confidence decay gate.
 * @param {string} input
 * @param {{ sttInferred?: string, localFailed?: boolean, reflexLatencyMs?: number }} [ctx]
 */
export function classifyRhizohIntentV0(input, ctx = {}) {
  const raw = String(input || "").trim();
  const space = normalizeVoiceCommandSpaceV0(raw);
  const voiceIntent = classifyVoiceIntentV0(raw, ctx);

  if (voiceIntent.type === VOICE_INTENT_TYPE_V0.COMMAND) {
    return finalizeIntentPlanV0(
      {
        schema: RHIZOH_INTENT_ROUTER_SCHEMA_V0,
        routeClass: INTENT_ROUTE_CLASS_V0.COMMAND,
        confidence: Number(voiceIntent.confidence) || 0.97,
        useLlm: false,
        useLocal: true,
        voiceIntent,
        microIntent: null,
        reason: "registry_command"
      },
      space.normalized,
      ctx
    );
  }

  if (voiceIntent.type === VOICE_INTENT_TYPE_V0.MICRO && voiceIntent.microIntent) {
    const conf = Number(voiceIntent.confidence) || 0.94;
    return finalizeIntentPlanV0(
      {
        schema: RHIZOH_INTENT_ROUTER_SCHEMA_V0,
        routeClass: microToRouteClass(voiceIntent.microIntent),
        confidence: conf,
        useLlm: false,
        useLocal: true,
        voiceIntent,
        microIntent: voiceIntent.microIntent,
        reason: "micro_social_fast"
      },
      space.normalized,
      ctx
    );
  }

  const qScore = scoreQuestionIntentV0(space.normalized);
  if (qScore >= 0.65 || DEEP_QUESTION_RE_V0.test(space.normalized)) {
    return finalizeIntentPlanV0(
      {
        schema: RHIZOH_INTENT_ROUTER_SCHEMA_V0,
        routeClass: INTENT_ROUTE_CLASS_V0.QUESTION,
        confidence: qScore,
        useLlm: true,
        useLocal: false,
        voiceIntent,
        microIntent: null,
        reason: "question_needs_llm"
      },
      space.normalized,
      ctx
    );
  }

  if (detectAmbientSpeechV0(raw)) {
    return finalizeIntentPlanV0(
      {
        schema: RHIZOH_INTENT_ROUTER_SCHEMA_V0,
        routeClass: INTENT_ROUTE_CLASS_V0.AMBIENT,
        confidence: 0.88,
        useLlm: false,
        useLocal: true,
        voiceIntent,
        microIntent: null,
        reason: "ambient_speech"
      },
      space.normalized,
      ctx
    );
  }

  if (detectContinuationSpeechV0(space.normalized)) {
    return finalizeIntentPlanV0(
      {
        schema: RHIZOH_INTENT_ROUTER_SCHEMA_V0,
        routeClass: INTENT_ROUTE_CLASS_V0.CONTINUATION,
        confidence: 0.86,
        useLlm: false,
        useLocal: true,
        voiceIntent,
        microIntent: null,
        reason: "continuation_hold"
      },
      space.normalized,
      ctx
    );
  }

  if (voiceIntent.type === VOICE_INTENT_TYPE_V0.HYBRID || HYBRID_SOFT_RE_V0.test(space.normalized)) {
    const conf = Number(voiceIntent.confidence) || 0.55;
    return finalizeIntentPlanV0(
      {
        schema: RHIZOH_INTENT_ROUTER_SCHEMA_V0,
        routeClass: INTENT_ROUTE_CLASS_V0.HYBRID,
        confidence: conf,
        useLlm: true,
        useLocal: false,
        voiceIntent,
        microIntent: null,
        reason: "hybrid_pattern"
      },
      space.normalized,
      ctx
    );
  }

  const conf = Number(voiceIntent.confidence) || 0.5;
  const useLlm =
    conf < LLM_FALLBACK_CONFIDENCE_MIN_V0 || space.normalized.split(/\s+/).length > 6;

  return finalizeIntentPlanV0(
    {
      schema: RHIZOH_INTENT_ROUTER_SCHEMA_V0,
      routeClass: useLlm ? INTENT_ROUTE_CLASS_V0.UNKNOWN : INTENT_ROUTE_CLASS_V0.MICRO_SOCIAL,
      confidence: conf,
      useLlm,
      useLocal: !useLlm,
      voiceIntent,
      microIntent: null,
      reason: useLlm ? "low_confidence_llm_fallback" : "short_unknown_local_ack"
    },
    space.normalized,
    ctx
  );
}

/**
 * Pre-LLM transition ack (only when LLM path — not chatter on every turn).
 * @param {string} [locale]
 */
export function resolveLlmTransitionAckV0(locale) {
  const loc = String(locale || "tr").toLowerCase().slice(0, 2);
  const table = {
    tr: ["Tamam, hazırlıyorum.", "Bir saniye, düşünüyorum.", "Devam ediyorum."],
    en: ["Okay, one moment.", "Let me think that through.", "Continuing."]
  };
  const list = table[loc] || table.en;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * @param {ReturnType<typeof classifyRhizohIntentV0>} intent
 */
export function shouldInvokeRhizohLlmV0(intent) {
  if (!intent) return true;
  if (intent.escalateToLlm === true) return true;
  if (intent.routeClass === INTENT_ROUTE_CLASS_V0.COMMAND) return false;
  if (intent.routeClass === INTENT_ROUTE_CLASS_V0.HYBRID) return true;
  if (intent.useLlm === true) return true;
  if (
    intent.routeClass === INTENT_ROUTE_CLASS_V0.GREETING ||
    intent.routeClass === INTENT_ROUTE_CLASS_V0.MICRO_SOCIAL ||
    intent.routeClass === INTENT_ROUTE_CLASS_V0.AMBIENT ||
    intent.routeClass === INTENT_ROUTE_CLASS_V0.CONTINUATION
  ) {
    return false;
  }
  return intent.confidence < LLM_FALLBACK_CONFIDENCE_MIN_V0;
}
