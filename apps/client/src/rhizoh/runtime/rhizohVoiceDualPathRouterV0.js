/**
 * Dual-path voice router — decision BEFORE analysis.
 * Tiers: hard_drop (<0.35) | gray verify (0.35–0.55) | slow LLM (>0.55).
 */

import { probeFastPrecheckMatchV0, runFastPrecheckFromTextV0 } from "./rhizohFastPrecheckV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { evaluateSlowPathGuardSnapshotV0 } from "./rhizohVoiceGuardSnapshotV0.js";
import { isUiChromeEchoTemplateV0, isPlatformOutroTemplateV0 } from "./voiceSttContaminationGuardV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";
import {
  hasMeaningfulSpeechSignalV0,
  resolveGrayZoneVerifyReplyV0,
  resolveUncertaintyHoldReplyV0,
  resolveVoiceConfidenceTierV0,
  VOICE_CONFIDENCE_TIER_V0,
  VOICE_DROP_KIND_V0
} from "./rhizohVoiceGrayZoneVerifyV0.js";

export const RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0 = "castle.rhizoh.voice_dual_path_router.v0";

export const VOICE_PIPELINE_PATH_V0 = Object.freeze({
  FAST: "fast_path",
  GRAY: "gray_zone",
  SLOW: "slow_path"
});

export const VOICE_FAST_INTENT_V0 = Object.freeze({
  GREETING: "greeting",
  QUESTION: "question",
  NOISE: "noise"
});

export const VOICE_PIPELINE_ACTION_V0 = Object.freeze({
  REFLEX: "reflex",
  DROP: "drop",
  VERIFY: "verify",
  HOLD: "hold",
  LLM: "llm"
});

const QUESTION_HINT_RE_V0 =
  /\?\s*$|^(nasıl|nasil|neden|ne\s|kim|nerede|how|why|what|who|bunu|şunu|sunu)\b/i;
const TECH_QUESTION_RE_V0 = /\b(nasıl|nasil|how|düzelt|duzelt|fix|neden|why)\b/i;
const DIRECTED_HINT_RE_V0 =
  /\b(rhizoh|rizo|dostum|duyabiliyor\s+musun|beni\s+duy|sohbet)\b/i;

function buildDropDecision(fastIntent, reason, band, dropKind, extra = {}) {
  return Object.freeze({
    schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
    path: VOICE_PIPELINE_PATH_V0.FAST,
    action: VOICE_PIPELINE_ACTION_V0.DROP,
    fastIntent,
    reason,
    dropKind,
    silent: true,
    band,
    latencyClass: "0-150ms",
    ...extra
  });
}

function buildVerifyDecision(text, fastIntent, reason, band, tier, extra = {}) {
  const locale = resolveOutputLanguageCodeV0();
  const verify = resolveGrayZoneVerifyReplyV0(text, { locale, fastIntent });
  return Object.freeze({
    schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
    path: VOICE_PIPELINE_PATH_V0.GRAY,
    action: VOICE_PIPELINE_ACTION_V0.VERIFY,
    fastIntent,
    reason,
    band,
    confidenceTier: tier,
    verify,
    reply: verify.reply,
    silent: false,
    latencyClass: "gray_verify",
    ...extra
  });
}

function buildHoldDecision(fastIntent, reason, band, tier, extra = {}) {
  const locale = resolveOutputLanguageCodeV0();
  return Object.freeze({
    schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
    path: VOICE_PIPELINE_PATH_V0.GRAY,
    action: VOICE_PIPELINE_ACTION_V0.HOLD,
    fastIntent,
    reason,
    band,
    confidenceTier: tier,
    reply: resolveUncertaintyHoldReplyV0(locale),
    silent: false,
    latencyClass: "uncertainty_hold",
    ...extra
  });
}

/**
 * @param {string} text
 */
export function classifyVoiceFastIntentV0(text) {
  const t = String(text || "").trim();
  if (!t || t.length < 2) {
    return Object.freeze({ intent: VOICE_FAST_INTENT_V0.NOISE, confidence: 0.95 });
  }

  const precheck = probeFastPrecheckMatchV0(t);
  if (
    precheck &&
    ["greeting", "ack", "wellbeing", "yes", "no"].includes(String(precheck.intent || ""))
  ) {
    return Object.freeze({
      intent: VOICE_FAST_INTENT_V0.GREETING,
      confidence: 0.92,
      precheck
    });
  }

  if (
    QUESTION_HINT_RE_V0.test(t) ||
    TECH_QUESTION_RE_V0.test(t) ||
    (DIRECTED_HINT_RE_V0.test(t) && t.length >= 10)
  ) {
    return Object.freeze({ intent: VOICE_FAST_INTENT_V0.QUESTION, confidence: 0.74 });
  }

  return Object.freeze({ intent: VOICE_FAST_INTENT_V0.NOISE, confidence: 0.55 });
}

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   band?: string,
 *   maxRms?: number,
 *   strategy?: string,
 *   provenance?: object
 * }} input
 */
export function resolveVoicePipelineDecisionV0(input = {}) {
  const text = String(input.text || "").trim();
  const confidence = Number(input.confidence);
  const band = String(input.band || VOICE_DIRECTED_SPEECH_BAND.UNKNOWN);
  const fast = classifyVoiceFastIntentV0(text);
  const tier = resolveVoiceConfidenceTierV0(confidence);
  const directed = band === VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE;
  const meaningful = hasMeaningfulSpeechSignalV0(text, { fastIntent: fast.intent });
  const locale = resolveOutputLanguageCodeV0();

  if (isUiChromeEchoTemplateV0(text)) {
    return buildDropDecision(fast.intent, "ui_chrome_echo", band, VOICE_DROP_KIND_V0.UI);
  }
  if (isPlatformOutroTemplateV0(text)) {
    return buildDropDecision(fast.intent, "platform_template_leak", band, VOICE_DROP_KIND_V0.NOISE);
  }

  if (fast.intent === VOICE_FAST_INTENT_V0.GREETING && fast.precheck) {
    const hit = runFastPrecheckFromTextV0(text, { locale });
    return Object.freeze({
      schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
      path: VOICE_PIPELINE_PATH_V0.FAST,
      action: VOICE_PIPELINE_ACTION_V0.REFLEX,
      fastIntent: VOICE_FAST_INTENT_V0.GREETING,
      reason: directed ? "fast_greeting_reflex" : "unknown_band_fast_reflex_only",
      band,
      confidenceTier: tier,
      precheck: hit,
      silent: false,
      latencyClass: "0-150ms"
    });
  }

  const guards = evaluateSlowPathGuardSnapshotV0(text, {
    confidence,
    strategy: input.strategy,
    band,
    provenance: input.provenance
  });

  if (guards.contamination?.kind === "ui_chrome_echo") {
    return buildDropDecision(fast.intent, guards.reason || "ui_chrome_echo", band, VOICE_DROP_KIND_V0.UI, {
      guards
    });
  }
  if (!guards.allowSlow && guards.contamination) {
    return buildDropDecision(fast.intent, guards.reason || "noise_drop", band, VOICE_DROP_KIND_V0.NOISE, {
      guards
    });
  }

  if (tier === VOICE_CONFIDENCE_TIER_V0.SLOW_READY) {
    const slowEligible =
      guards.allowSlow === true &&
      directed &&
      (fast.intent === VOICE_FAST_INTENT_V0.QUESTION || text.split(/\s+/).filter(Boolean).length >= 4);
    if (slowEligible) {
      return Object.freeze({
        schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
        path: VOICE_PIPELINE_PATH_V0.SLOW,
        action: VOICE_PIPELINE_ACTION_V0.LLM,
        fastIntent: fast.intent,
        reason: "directed_slow_llm",
        band,
        confidenceTier: tier,
        guards,
        silent: false,
        latencyClass: "llm_when_needed"
      });
    }
  }

  if (tier === VOICE_CONFIDENCE_TIER_V0.GRAY_ZONE) {
    if (fast.intent === VOICE_FAST_INTENT_V0.QUESTION || meaningful) {
      return buildVerifyDecision(text, fast.intent, "gray_zone_micro_verify", band, tier, { guards });
    }
    if (meaningful) {
      return buildHoldDecision(fast.intent, "gray_zone_uncertainty_hold", band, tier, { guards });
    }
  }

  if (tier === VOICE_CONFIDENCE_TIER_V0.HARD_DROP) {
    if (meaningful || fast.intent === VOICE_FAST_INTENT_V0.QUESTION) {
      return buildHoldDecision(fast.intent, "hard_drop_meaningful_hold", band, tier, { guards });
    }
    if (fast.intent === VOICE_FAST_INTENT_V0.NOISE) {
      return buildDropDecision(fast.intent, "fast_noise_drop", band, VOICE_DROP_KIND_V0.NOISE, { guards });
    }
  }

  if (meaningful) {
    return buildHoldDecision(fast.intent, "uncertainty_hold", band, tier, { guards });
  }

  return buildDropDecision(
    fast.intent,
    tier === VOICE_CONFIDENCE_TIER_V0.HARD_DROP ? "hard_drop_noise" : "fast_noise_drop",
    band,
    VOICE_DROP_KIND_V0.NOISE,
    { guards, confidenceTier: tier }
  );
}

/**
 * @param {ReturnType<typeof resolveVoicePipelineDecisionV0>} decision
 */
export function publishVoicePipelineDecisionDebugV0(decision) {
  if (typeof window === "undefined" || !decision) return;
  try {
    window.__CASTLE_RHIZOH_PIPELINE_DECISION__ = Object.freeze({
      ...decision,
      atMs: Date.now()
    });
  } catch {
    /* noop */
  }
}
