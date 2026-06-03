/**
 * Dual-path voice router — decision BEFORE analysis.
 * FAST (0–150ms target): greeting reflex OR drop — no guards chain, no LLM.
 * SLOW: mic-only provenance + guard snapshot → LLM when eligible.
 */

import { probeFastPrecheckMatchV0, runFastPrecheckFromTextV0 } from "./rhizohFastPrecheckV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { evaluateSlowPathGuardSnapshotV0 } from "./rhizohVoiceGuardSnapshotV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";

export const RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0 = "castle.rhizoh.voice_dual_path_router.v0";

export const VOICE_PIPELINE_PATH_V0 = Object.freeze({
  FAST: "fast_path",
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
  LLM: "llm"
});

const QUESTION_HINT_RE_V0 =
  /\?\s*$|^(nasıl|nasil|neden|ne\s|kim|nerede|how|why|what|who)\b/i;
const DIRECTED_HINT_RE_V0 =
  /\b(rhizoh|rizo|dostum|duyabiliyor\s+musun|beni\s+duy|sohbet)\b/i;

/**
 * Lightweight 3-class intent — no witness / template / repetition chain.
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

  if (QUESTION_HINT_RE_V0.test(t) || (DIRECTED_HINT_RE_V0.test(t) && t.length >= 10)) {
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
  const maxRms = Number(input.maxRms);
  const fast = classifyVoiceFastIntentV0(text);
  const directed = band === VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE;
  const unknownish =
    band === VOICE_DIRECTED_SPEECH_BAND.UNKNOWN || band === VOICE_DIRECTED_SPEECH_BAND.AMBIENT;

  /** unknown band → fast reflex only (greeting) or drop — never slow analysis */
  if (unknownish) {
    if (fast.intent === VOICE_FAST_INTENT_V0.GREETING && fast.precheck) {
      const locale = resolveOutputLanguageCodeV0();
      const hit = runFastPrecheckFromTextV0(text, { locale });
      return Object.freeze({
        schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
        path: VOICE_PIPELINE_PATH_V0.FAST,
        action: VOICE_PIPELINE_ACTION_V0.REFLEX,
        fastIntent: VOICE_FAST_INTENT_V0.GREETING,
        reason: "unknown_band_fast_reflex_only",
        band,
        precheck: hit,
        latencyClass: "0-150ms"
      });
    }
    return Object.freeze({
      schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
      path: VOICE_PIPELINE_PATH_V0.FAST,
      action: VOICE_PIPELINE_ACTION_V0.DROP,
      fastIntent: fast.intent,
      reason: "unknown_band_fast_reflex_only",
      band,
      latencyClass: "0-150ms"
    });
  }

  if (fast.intent === VOICE_FAST_INTENT_V0.GREETING && fast.precheck) {
    const locale = resolveOutputLanguageCodeV0();
    const hit = runFastPrecheckFromTextV0(text, { locale });
    return Object.freeze({
      schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
      path: VOICE_PIPELINE_PATH_V0.FAST,
      action: VOICE_PIPELINE_ACTION_V0.REFLEX,
      fastIntent: VOICE_FAST_INTENT_V0.GREETING,
      reason: "fast_greeting_reflex",
      band,
      precheck: hit,
      latencyClass: "0-150ms"
    });
  }

  const guards = evaluateSlowPathGuardSnapshotV0(text, {
    confidence,
    strategy: input.strategy,
    band,
    provenance: input.provenance
  });

  const slowEligible =
    guards.allowSlow === true &&
    directed &&
    Number.isFinite(confidence) &&
    confidence >= 0.55 &&
    (fast.intent === VOICE_FAST_INTENT_V0.QUESTION || text.split(/\s+/).length >= 4);

  if (slowEligible) {
    return Object.freeze({
      schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
      path: VOICE_PIPELINE_PATH_V0.SLOW,
      action: VOICE_PIPELINE_ACTION_V0.LLM,
      fastIntent: fast.intent,
      reason: "directed_slow_llm",
      band,
      guards,
      latencyClass: "llm_when_needed"
    });
  }

  if (fast.intent === VOICE_FAST_INTENT_V0.NOISE) {
    return Object.freeze({
      schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
      path: VOICE_PIPELINE_PATH_V0.FAST,
      action: VOICE_PIPELINE_ACTION_V0.DROP,
      fastIntent: VOICE_FAST_INTENT_V0.NOISE,
      reason: "fast_noise_drop",
      band,
      guards,
      latencyClass: "0-150ms"
    });
  }

  return Object.freeze({
    schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
    path: VOICE_PIPELINE_PATH_V0.FAST,
    action: VOICE_PIPELINE_ACTION_V0.DROP,
    fastIntent: fast.intent,
    reason: guards.allowSlow ? "fast_fallback" : guards.reason || "slow_guard_reject",
    band,
    guards,
    latencyClass: "0-150ms"
  });
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
