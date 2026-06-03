/**
 * Gray zone verify — borderline confidence (0.35–0.55): heuristic confirm, NOT full LLM.
 * UX fallback only — never a routing decision (see resolveVoiceUxFallbackV0).
 */

import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import {
  getVoiceVerifyCountV0,
  isVoiceVerifyBudgetExhaustedV0
} from "./rhizohVoiceVerifyBudgetV0.js";

export const RHIZOH_VOICE_GRAY_ZONE_VERIFY_SCHEMA_V0 = "castle.rhizoh.voice_gray_zone_verify.v0";

export const VOICE_CONFIDENCE_TIER_V0 = Object.freeze({
  HARD_DROP: "hard_drop",
  GRAY_ZONE: "gray_zone",
  SLOW_READY: "slow_ready"
});

export const VOICE_DROP_KIND_V0 = Object.freeze({
  NOISE: "noise_drop",
  UI: "ui_drop"
});

export const VOICE_CONFIDENCE_HARD_DROP_MAX_V0 = 0.35;
export const VOICE_CONFIDENCE_GRAY_MAX_V0 = 0.55;

export const VOICE_SEMANTIC_GRAY_LLM_TEMPERATURE_CAP_V0 = 0.55;
export const VOICE_SEMANTIC_GRAY_MAX_TOKENS_V0 = 512;

/**
 * Split gray: semantic (LLM shaping) vs ux (verify/hold fallback).
 * @param {string} tier
 * @param {{ semanticGray?: boolean, uxGray?: boolean }} [extra]
 */
export function resolveVoiceGrayFlagsV0(tier, extra = {}) {
  const inGrayTier = tier === VOICE_CONFIDENCE_TIER_V0.GRAY_ZONE;
  const semanticGray =
    typeof extra.semanticGray === "boolean" ? extra.semanticGray : inGrayTier;
  const uxGray = typeof extra.uxGray === "boolean" ? extra.uxGray : semanticGray && inGrayTier;
  return Object.freeze({
    semanticGray,
    uxGray,
    /** @deprecated telemetry alias — prefer uxGray */
    grayModifier: uxGray
  });
}

/**
 * LLM shaping when semanticGray — cautious, brief responses on weak STT.
 * @param {object} [decision]
 */
export function resolveSemanticGrayLlmShapingV0(decision) {
  if (!decision?.semanticGray) return null;
  return Object.freeze({
    schema: RHIZOH_VOICE_GRAY_ZONE_VERIFY_SCHEMA_V0,
    band: "semantic_gray",
    responseStyle: "cautious_brief",
    temperatureCap: VOICE_SEMANTIC_GRAY_LLM_TEMPERATURE_CAP_V0,
    maxTokens: VOICE_SEMANTIC_GRAY_MAX_TOKENS_V0,
    sttTrust: "low"
  });
}

/**
 * Dual threshold: <0.35 hard drop band, 0.35–0.55 gray, >=0.55 slow-ready.
 * @param {number} [confidence]
 */
export function resolveVoiceConfidenceTierV0(confidence) {
  const c = Number(confidence);
  if (!Number.isFinite(c)) return VOICE_CONFIDENCE_TIER_V0.GRAY_ZONE;
  if (c < VOICE_CONFIDENCE_HARD_DROP_MAX_V0) return VOICE_CONFIDENCE_TIER_V0.HARD_DROP;
  if (c < VOICE_CONFIDENCE_GRAY_MAX_V0) return VOICE_CONFIDENCE_TIER_V0.GRAY_ZONE;
  return VOICE_CONFIDENCE_TIER_V0.SLOW_READY;
}

/**
 * @param {string} [locale]
 */
export function resolveUncertaintyHoldReplyV0(locale) {
  const loc = String(locale || resolveOutputLanguageCodeV0() || "tr").slice(0, 2);
  return loc === "tr"
    ? "Tam duyamadım — bir kez daha söyler misin?"
    : "I didn't catch that — could you say it once more?";
}

/**
 * @param {string} text
 * @param {{ locale?: string, fastIntent?: string }} [opts]
 */
export function resolveGrayZoneVerifyReplyV0(text, opts = {}) {
  const t = String(text || "").trim();
  const loc = String(opts.locale || resolveOutputLanguageCodeV0() || "tr").slice(0, 2);
  const intent = String(opts.fastIntent || "");

  if (/nasıl|nasil|how|düzelt|duzelt|fix|neden|why/i.test(t)) {
    return Object.freeze({
      schema: RHIZOH_VOICE_GRAY_ZONE_VERIFY_SCHEMA_V0,
      reply:
        loc === "tr"
          ? "Bunu tam net duyamadım — kısaca tekrar eder misin?"
          : "I didn't get that clearly — could you repeat it briefly?",
      kind: "micro_verify_technical",
      llmBypass: true
    });
  }

  if (intent === "question" || /\?\s*$/.test(t)) {
    return Object.freeze({
      schema: RHIZOH_VOICE_GRAY_ZONE_VERIFY_SCHEMA_V0,
      reply:
        loc === "tr"
          ? "Sorunu tam yakalayamadım — bir kez daha söyler misin?"
          : "I didn't quite catch your question — once more?",
      kind: "micro_verify_question",
      llmBypass: true
    });
  }

  return Object.freeze({
    schema: RHIZOH_VOICE_GRAY_ZONE_VERIFY_SCHEMA_V0,
    reply: resolveUncertaintyHoldReplyV0(loc),
    kind: "micro_verify_generic",
    llmBypass: true
  });
}

/**
 * Meaningful speech signal — avoid silent drop on short but intentional utterances.
 * @param {string} text
 * @param {{ fastIntent?: string }} [opts]
 */
export function hasMeaningfulSpeechSignalV0(text, opts = {}) {
  const t = String(text || "").trim();
  if (t.length < 4) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 3) return true;
  const intent = String(opts.fastIntent || "");
  return (
    intent === "question" ||
    /\?\s*$/.test(t) ||
    /^(nasıl|nasil|neden|ne|how|why|bunu|şunu|sunu)\b/i.test(t)
  );
}

const CLEAR_QUESTION_DIRECTED_RE_V0 =
  /\b(rhizoh|rizo|dostum|duyabiliyor\s+musun|beni\s+duy|sohbet)\b/i;
const CLEAR_TECH_QUESTION_RE_V0 =
  /\b(nasıl|nasil|how|düzelt|duzelt|fix|neden|why|ne\s+zaman)\b/i;

/**
 * Intent override — clear question shape independent of STT confidence.
 * @param {string} text
 */
export function isClearQuestionPatternV0(text) {
  const t = String(text || "").trim();
  if (t.length < 8) return false;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 3) return false;

  if (/\?\s*$/.test(t)) {
    if (CLEAR_TECH_QUESTION_RE_V0.test(t) || CLEAR_QUESTION_DIRECTED_RE_V0.test(t)) return true;
    if (words.length >= 4) return true;
  }

  if (words.length >= 3 && CLEAR_TECH_QUESTION_RE_V0.test(t)) return true;
  if (CLEAR_QUESTION_DIRECTED_RE_V0.test(t) && words.length >= 4) return true;

  return false;
}

/**
 * Execution-layer UX fallback — derived from a single spine decision, not routing.
 * @param {object} decision
 * @param {string} text
 * @param {{ locale?: string, sessionId?: string }} [opts]
 */
export function resolveVoiceUxFallbackV0(decision, text, opts = {}) {
  if (!decision || decision.speakMode === "silent") return null;

  const locale = String(opts.locale || resolveOutputLanguageCodeV0() || "tr").slice(0, 2);
  const sessionId = String(opts.sessionId || "");

  if (decision.speakMode === "hold") {
    if (isVoiceVerifyBudgetExhaustedV0(sessionId)) return null;
    return Object.freeze({
      schema: RHIZOH_VOICE_GRAY_ZONE_VERIFY_SCHEMA_V0,
      reply: resolveUncertaintyHoldReplyV0(locale),
      kind: "uncertainty_hold",
      llmBypass: true
    });
  }

  if (
    decision.speakMode === "speak" &&
    decision.execMode === "slow_llm" &&
    decision.uxGray === true &&
    !isVoiceVerifyBudgetExhaustedV0(sessionId)
  ) {
    return resolveGrayZoneVerifyReplyV0(text, {
      locale,
      fastIntent: decision.fastIntent
    });
  }

  return null;
}

/**
 * @param {object} decision
 * @param {string} [sessionId]
 */
export function shouldNoteVoiceVerifyBudgetV0(decision, sessionId) {
  if (!decision || isVoiceVerifyBudgetExhaustedV0(sessionId)) return false;
  if (decision.speakMode === "hold") return true;
  if (decision.speakMode === "speak" && decision.execMode === "slow_llm" && decision.uxGray === true) {
    return true;
  }
  return false;
}

export function getVoiceVerifyCountForDecisionV0(sessionId) {
  return getVoiceVerifyCountV0(sessionId);
}
