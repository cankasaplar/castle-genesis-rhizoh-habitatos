/**
 * Gray zone verify — borderline confidence (0.35–0.55): heuristic confirm, NOT full LLM.
 */

import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";

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
