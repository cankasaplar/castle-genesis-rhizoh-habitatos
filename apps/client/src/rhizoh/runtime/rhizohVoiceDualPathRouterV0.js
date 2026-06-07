/**
 * Dual-path voice router — single decision spine.
 * SHOULD_SPEAK (silent | hold | speak) → HOW (fast_reflex | slow_llm).
 * Gray tier is a SLOW modifier only; VERIFY is execution UX, not routing.
 */

import { probeFastPrecheckMatchV0, runFastPrecheckFromTextV0 } from "./rhizohFastPrecheckV0.js";
import { resolveOutputLanguageCodeV0 } from "./rhizohOutputLanguagePolicyV0.js";
import { evaluateSlowPathGuardSnapshotV0 } from "./rhizohVoiceGuardSnapshotV0.js";
import { isUiChromeEchoTemplateV0, isPlatformOutroTemplateV0 } from "./voiceSttContaminationGuardV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";
import {
  hasMeaningfulSpeechSignalV0,
  isClearQuestionPatternV0,
  resolveUncertaintyHoldReplyV0,
  resolveVoiceConfidenceTierV0,
  resolveVoiceGrayFlagsV0,
  VOICE_CONFIDENCE_TIER_V0,
  VOICE_DROP_KIND_V0
} from "./rhizohVoiceGrayZoneVerifyV0.js";
import {
  getVoiceVerifyCountV0,
  isVoiceVerifyBudgetExhaustedV0
} from "./rhizohVoiceVerifyBudgetV0.js";
import { evaluateSttScriptAgainstUiLocaleV0 } from "./sttScriptLocaleGuardV0.js";
import { isVoiceIngestStrictV0 } from "./rhizohVoiceConversationAuthorityV0.js";
import { applyIntentFirstAcceptanceV0 } from "./rhizohVoiceIntentAcceptanceV0.js";

export const RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0 = "castle.rhizoh.voice_dual_path_router.v0";

/** @deprecated telemetry alias — prefer speakMode + execMode */
export const VOICE_PIPELINE_PATH_V0 = Object.freeze({
  FAST: "fast_path",
  GRAY: "gray_zone",
  SLOW: "slow_path"
});

export const VOICE_SPEAK_MODE_V0 = Object.freeze({
  SILENT: "silent",
  HOLD: "hold",
  SPEAK: "speak"
});

export const VOICE_EXEC_MODE_V0 = Object.freeze({
  FAST_REFLEX: "fast_reflex",
  SLOW_LLM: "slow_llm"
});

export const VOICE_FAST_INTENT_V0 = Object.freeze({
  GREETING: "greeting",
  QUESTION: "question",
  NOISE: "noise"
});

/** @deprecated telemetry alias — derived from speakMode + execMode */
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

function attachLegacyFields(decision) {
  let action = VOICE_PIPELINE_ACTION_V0.DROP;
  let path = VOICE_PIPELINE_PATH_V0.FAST;
  let reply;

  if (decision.speakMode === VOICE_SPEAK_MODE_V0.HOLD) {
    action = VOICE_PIPELINE_ACTION_V0.HOLD;
    path = VOICE_PIPELINE_PATH_V0.FAST;
    reply = resolveUncertaintyHoldReplyV0();
  } else if (decision.speakMode === VOICE_SPEAK_MODE_V0.SPEAK) {
    if (decision.execMode === VOICE_EXEC_MODE_V0.FAST_REFLEX) {
      action = VOICE_PIPELINE_ACTION_V0.REFLEX;
      path = VOICE_PIPELINE_PATH_V0.FAST;
    } else if (decision.execMode === VOICE_EXEC_MODE_V0.SLOW_LLM) {
      action = VOICE_PIPELINE_ACTION_V0.LLM;
      path = VOICE_PIPELINE_PATH_V0.SLOW;
    }
  }

  return Object.freeze({
    ...decision,
    action,
    path,
    reply,
    silent: decision.speakMode === VOICE_SPEAK_MODE_V0.SILENT
  });
}

function buildSilentDecision(fastIntent, reason, band, dropKind, extra = {}) {
  const gray = resolveVoiceGrayFlagsV0(VOICE_CONFIDENCE_TIER_V0.HARD_DROP, {
    semanticGray: false,
    uxGray: false
  });
  return attachLegacyFields(
    Object.freeze({
      schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
      speakMode: VOICE_SPEAK_MODE_V0.SILENT,
      execMode: null,
      ...gray,
      fastIntent,
      reason,
      dropKind,
      band,
      latencyClass: "0-150ms",
      ...extra
    })
  );
}

function buildHoldDecision(fastIntent, reason, band, tier, extra = {}) {
  const gray = resolveVoiceGrayFlagsV0(tier, { uxGray: false });
  return attachLegacyFields(
    Object.freeze({
      schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
      speakMode: VOICE_SPEAK_MODE_V0.HOLD,
      execMode: null,
      semanticGray: gray.semanticGray,
      uxGray: false,
      grayModifier: false,
      fastIntent,
      reason,
      band,
      confidenceTier: tier,
      latencyClass: "uncertainty_hold",
      ...extra
    })
  );
}

function buildSpeakFastDecision(fastIntent, reason, band, tier, precheck, extra = {}) {
  const gray = resolveVoiceGrayFlagsV0(tier, { semanticGray: false, uxGray: false });
  return attachLegacyFields(
    Object.freeze({
      schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
      speakMode: VOICE_SPEAK_MODE_V0.SPEAK,
      execMode: VOICE_EXEC_MODE_V0.FAST_REFLEX,
      ...gray,
      fastIntent,
      reason,
      band,
      confidenceTier: tier,
      precheck,
      latencyClass: "0-150ms",
      ...extra
    })
  );
}

function buildSpeakSlowDecision(fastIntent, reason, band, tier, guards, extra = {}) {
  const gray = resolveVoiceGrayFlagsV0(tier, extra);
  return attachLegacyFields(
    Object.freeze({
      schema: RHIZOH_VOICE_DUAL_PATH_ROUTER_SCHEMA_V0,
      speakMode: VOICE_SPEAK_MODE_V0.SPEAK,
      execMode: VOICE_EXEC_MODE_V0.SLOW_LLM,
      semanticGray: gray.semanticGray,
      uxGray: gray.uxGray,
      grayModifier: gray.grayModifier,
      fastIntent,
      reason,
      band,
      confidenceTier: tier,
      guards,
      latencyClass: gray.uxGray ? "slow_ux_gray" : gray.semanticGray ? "slow_semantic_gray" : "llm_when_needed",
      ...extra
    })
  );
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
    ["greeting", "ack", "wellbeing", "yes", "no", "hearing_check"].includes(String(precheck.intent || ""))
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
 * @param {string} text
 * @param {{
 *   intent?: string,
 *   band?: string,
 *   tier?: string,
 *   guards?: object,
 *   directed?: boolean,
 *   meaningful?: boolean
 * }} ctx
 */
function getIntentAcceptanceBuildersV0() {
  return {
    buildHoldDecision,
    buildSpeakSlowDecision,
    classifyVoiceFastIntentV0,
    trySlowPathEligibilityV0,
    VOICE_CONFIDENCE_TIER_V0
  };
}

function finalizeVoicePipelineDecisionV0(decision, input, spineCtx = {}) {
  let out = decision;
  if (spineCtx.skipStrict !== true) {
    out = applyStrictIngestDecisionClampV0(out, {
      band: spineCtx.band || out?.band,
      text: spineCtx.text || input.text
    });
  }
  return applyIntentFirstAcceptanceV0(out, input, {
    ...spineCtx,
    builders: getIntentAcceptanceBuildersV0()
  });
}

function trySlowPathEligibilityV0(text, ctx = {}) {
  const guards = ctx.guards;
  if (!guards?.allowSlow) return false;
  const directed = ctx.directed === true;
  const words = text.split(/\s+/).filter(Boolean).length;
  const clearQuestion = isClearQuestionPatternV0(text);
  if (clearQuestion) return true;
  const band = String(ctx.band || "");
  if (
    band === VOICE_DIRECTED_SPEECH_BAND.UNKNOWN &&
    ctx.tier === VOICE_CONFIDENCE_TIER_V0.SLOW_READY &&
    ctx.meaningful === true &&
    words >= 4
  ) {
    return true;
  }
  return directed && (ctx.intent === VOICE_FAST_INTENT_V0.QUESTION || words >= 4);
}

/**
 * Single spine: intent + confidence + guards → one decision.
 * @param {object} ctx
 */
function resolveDecisionSpineV0(ctx) {
  const {
    text,
    fast,
    tier,
    directed,
    meaningful,
    guards,
    band,
    verifyCount,
    verifyBudgetExhausted,
    locale
  } = ctx;

  if (fast.intent === VOICE_FAST_INTENT_V0.GREETING && fast.precheck) {
    const hit = runFastPrecheckFromTextV0(text, { locale });
    return buildSpeakFastDecision(
      VOICE_FAST_INTENT_V0.GREETING,
      directed ? "fast_greeting_reflex" : "unknown_band_fast_reflex_only",
      band,
      tier,
      hit
    );
  }

  const slowEligible = trySlowPathEligibilityV0(text, {
    guards,
    directed,
    intent: fast.intent,
    band,
    tier,
    meaningful
  });
  const clearQuestion = isClearQuestionPatternV0(text);

  if (
    tier !== VOICE_CONFIDENCE_TIER_V0.HARD_DROP &&
    clearQuestion &&
    slowEligible
  ) {
    return buildSpeakSlowDecision(fast.intent, "intent_override_slow_ready", band, tier, guards, {
      intentOverride: true,
      verifyCount,
      uxGray: false
    });
  }

  if (tier === VOICE_CONFIDENCE_TIER_V0.SLOW_READY && slowEligible) {
    const slowReason =
      band === VOICE_DIRECTED_SPEECH_BAND.UNKNOWN && !directed
        ? "unknown_band_slow_completion"
        : "directed_slow_llm";
    return buildSpeakSlowDecision(fast.intent, slowReason, band, tier, guards, {
      verifyCount
    });
  }

  if (tier === VOICE_CONFIDENCE_TIER_V0.GRAY_ZONE) {
    if (verifyBudgetExhausted && slowEligible) {
      return buildSpeakSlowDecision(fast.intent, "verify_budget_force_slow", band, tier, guards, {
        verifyCount,
        verifyBudgetExhausted: true,
        uxGray: false
      });
    }
    if (slowEligible && (fast.intent === VOICE_FAST_INTENT_V0.QUESTION || meaningful)) {
      return buildSpeakSlowDecision(fast.intent, "gray_slow_modifier", band, tier, guards, {
        verifyCount
      });
    }
    if (meaningful || fast.intent === VOICE_FAST_INTENT_V0.QUESTION) {
      return buildHoldDecision(fast.intent, "gray_uncertainty_hold", band, tier, {
        guards,
        verifyCount
      });
    }
  }

  if (tier === VOICE_CONFIDENCE_TIER_V0.HARD_DROP) {
    if (meaningful || fast.intent === VOICE_FAST_INTENT_V0.QUESTION) {
      return buildHoldDecision(fast.intent, "hard_drop_meaningful_hold", band, tier, { guards });
    }
    if (fast.intent === VOICE_FAST_INTENT_V0.NOISE) {
      return buildSilentDecision(fast.intent, "fast_noise_drop", band, VOICE_DROP_KIND_V0.NOISE, {
        guards
      });
    }
  }

  if (verifyBudgetExhausted && slowEligible) {
    return buildSpeakSlowDecision(fast.intent, "verify_budget_force_slow", band, tier, guards, {
      verifyCount,
      verifyBudgetExhausted: true,
      uxGray: false
    });
  }

  if (meaningful) {
    return buildHoldDecision(fast.intent, "uncertainty_hold", band, tier, { guards, verifyCount });
  }

  return buildSilentDecision(
    fast.intent,
    tier === VOICE_CONFIDENCE_TIER_V0.HARD_DROP ? "hard_drop_noise" : "fast_noise_drop",
    band,
    VOICE_DROP_KIND_V0.NOISE,
    { guards, confidenceTier: tier }
  );
}

/**
 * @param {{
 *   text?: string,
 *   confidence?: number,
 *   band?: string,
 *   maxRms?: number,
 *   strategy?: string,
 *   provenance?: object,
 *   sessionId?: string
 * }} input
 */
export function resolveVoicePipelineDecisionV0(input = {}) {
  const text = String(input.text || "").trim();
  const confidence = Number(input.confidence);
  const band = String(input.band || VOICE_DIRECTED_SPEECH_BAND.UNKNOWN);
  const sessionId = String(input.sessionId || "");
  const fast = classifyVoiceFastIntentV0(text);
  const tier = resolveVoiceConfidenceTierV0(confidence);
  const directed = band === VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE;
  const meaningful = hasMeaningfulSpeechSignalV0(text, { fastIntent: fast.intent });
  const locale = resolveOutputLanguageCodeV0();
  const verifyCount = getVoiceVerifyCountV0(sessionId);
  const verifyBudgetExhausted = isVoiceVerifyBudgetExhaustedV0(sessionId);

  const spineCtx = {
    text,
    band,
    tier,
    fast,
    meaningful,
    verifyCount,
    guards: null
  };

  if (isUiChromeEchoTemplateV0(text)) {
    return finalizeVoicePipelineDecisionV0(
      buildSilentDecision(fast.intent, "ui_chrome_echo", band, VOICE_DROP_KIND_V0.UI),
      input,
      { ...spineCtx, skipStrict: true }
    );
  }
  if (isPlatformOutroTemplateV0(text)) {
    return finalizeVoicePipelineDecisionV0(
      buildSilentDecision(fast.intent, "platform_template_leak", band, VOICE_DROP_KIND_V0.NOISE),
      input,
      { ...spineCtx, skipStrict: true }
    );
  }

  const guards = evaluateSlowPathGuardSnapshotV0(text, {
    confidence,
    strategy: input.strategy,
    band,
    provenance: input.provenance
  });
  spineCtx.guards = guards;

  if (guards.contamination?.kind === "ui_chrome_echo") {
    return finalizeVoicePipelineDecisionV0(
      buildSilentDecision(
        fast.intent,
        guards.reason || "ui_chrome_echo",
        band,
        VOICE_DROP_KIND_V0.UI,
        { guards }
      ),
      input,
      { ...spineCtx, skipStrict: true }
    );
  }
  if (!guards.allowSlow && guards.contamination) {
    return finalizeVoicePipelineDecisionV0(
      buildSilentDecision(fast.intent, guards.reason || "noise_drop", band, VOICE_DROP_KIND_V0.NOISE, {
        guards
      }),
      input,
      { ...spineCtx, skipStrict: true }
    );
  }

  const scriptGuard = evaluateSttScriptAgainstUiLocaleV0(text, {
    confidence,
    strategy: input.strategy
  });
  if (!scriptGuard.ok) {
    return buildSilentDecision(fast.intent, "script_locale_mismatch", band, VOICE_DROP_KIND_V0.NOISE, {
      guards,
      scriptGuard
    });
  }

  return finalizeVoicePipelineDecisionV0(
    resolveDecisionSpineV0({
      text,
      fast,
      tier,
      directed,
      meaningful,
      guards,
      band,
      verifyCount,
      verifyBudgetExhausted,
      locale
    }),
    input,
    spineCtx
  );
}

function shouldStrictPromoteUncertaintyToSlowV0(decision, ctx = {}) {
  if (!decision || decision.speakMode !== VOICE_SPEAK_MODE_V0.HOLD) return false;
  if (decision.confidenceTier !== VOICE_CONFIDENCE_TIER_V0.SLOW_READY) return false;
  const band = String(decision.band || ctx.band || "");
  if (band !== VOICE_DIRECTED_SPEECH_BAND.UNKNOWN) return false;
  if (!decision.guards?.allowSlow) return false;
  const text = String(ctx.text || "").trim();
  if (!text) return false;
  const meaningful = hasMeaningfulSpeechSignalV0(text, {
    fastIntent: decision.fastIntent || VOICE_FAST_INTENT_V0.NOISE
  });
  const words = text.split(/\s+/).filter(Boolean).length;
  return meaningful && words >= 4;
}

function applyStrictIngestDecisionClampV0(decision, ctx = {}) {
  if (!isVoiceIngestStrictV0() || !decision) return decision;
  if (decision.speakMode === VOICE_SPEAK_MODE_V0.SILENT) return decision;

  if (decision.speakMode === VOICE_SPEAK_MODE_V0.HOLD) {
    if (shouldStrictPromoteUncertaintyToSlowV0(decision, ctx)) {
      return buildSpeakSlowDecision(
        decision.fastIntent || VOICE_FAST_INTENT_V0.NOISE,
        "unknown_band_slow_completion",
        decision.band || ctx.band,
        decision.confidenceTier || VOICE_CONFIDENCE_TIER_V0.SLOW_READY,
        decision.guards,
        { verifyCount: decision.verifyCount, strictPromoted: true }
      );
    }
    return buildSilentDecision(
      decision.fastIntent || VOICE_FAST_INTENT_V0.NOISE,
      "strict_hold_suppressed",
      decision.band || ctx.band,
      VOICE_DROP_KIND_V0.NOISE,
      { confidenceTier: decision.confidenceTier, guards: decision.guards }
    );
  }

  if (
    decision.speakMode === VOICE_SPEAK_MODE_V0.SPEAK &&
    decision.execMode === VOICE_EXEC_MODE_V0.SLOW_LLM
  ) {
    if (decision.guards && decision.guards.allowSlow === false) {
      return buildSilentDecision(
        decision.fastIntent || VOICE_FAST_INTENT_V0.NOISE,
        "strict_guard_block",
        decision.band || ctx.band,
        VOICE_DROP_KIND_V0.NOISE,
        { guards: decision.guards }
      );
    }
    if (decision.uxGray) {
      const gray = resolveVoiceGrayFlagsV0(decision.confidenceTier, {
        semanticGray: decision.semanticGray === true,
        uxGray: false
      });
      return attachLegacyFields(
        Object.freeze({
          ...decision,
          ...gray,
          uxGray: false,
          grayModifier: decision.semanticGray === true
        })
      );
    }
  }

  return decision;
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
