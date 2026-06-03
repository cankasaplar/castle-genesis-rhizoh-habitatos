/**
 * Conversation Authority v1 — single speak gate for voice ingest (strict mode).
 * Pipeline proposes; authority disposes. No shadow/fallback/hold second voices in strict.
 */

import { isVoiceEngineV3EnabledV0 } from "./voiceEngineV3/isVoiceEngineV3EnabledV0.js";

export const RHIZOH_VOICE_CONVERSATION_AUTHORITY_SCHEMA_V0 =
  "castle.rhizoh.voice_conversation_authority.v0";

export const VOICE_CONVERSATION_AUTHORITY_PATH_V0 = Object.freeze({
  NONE: "none",
  FAST_REFLEX: "fast_reflex",
  SLOW_LLM: "slow_llm",
  HOLD: "hold"
});

function readEnvFlagV0(name, defaultWhenUnset) {
  if (typeof import.meta === "undefined" || !import.meta.env) return defaultWhenUnset;
  const v = String(import.meta.env[name] || "").trim().toLowerCase();
  if (!v) return defaultWhenUnset;
  if (v === "0" || v === "false" || v === "off") return false;
  return v === "1" || v === "true" || v === "on";
}

/**
 * Strict ingest: one authority, no template/hold/shadow speak paths.
 * Default ON when Voice Engine v3 is enabled (opt-out via VITE_RHIZOH_VOICE_INGEST_STRICT=0).
 */
export function isVoiceIngestStrictV0() {
  if (!isVoiceEngineV3EnabledV0()) return false;
  return readEnvFlagV0("VITE_RHIZOH_VOICE_INGEST_STRICT", true);
}

export function shouldSuppressShadowObservationAckV0() {
  return isVoiceIngestStrictV0();
}

export function shouldSuppressUxFallbackV0() {
  return isVoiceIngestStrictV0();
}

/**
 * Single speak authority — execution gate after pipeline decision.
 * @param {{ decision?: object, band?: string, pipelinePath?: string, text?: string }} [ctx]
 */
export function resolveConversationAuthorityV0(ctx = {}) {
  const decision = ctx.decision;
  const strict = isVoiceIngestStrictV0();

  if (!decision) {
    return Object.freeze({
      schema: RHIZOH_VOICE_CONVERSATION_AUTHORITY_SCHEMA_V0,
      maySpeak: false,
      path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.NONE,
      reason: "no_decision",
      strict,
      authority: "blocked"
    });
  }

  if (decision.speakMode === "silent") {
    return Object.freeze({
      schema: RHIZOH_VOICE_CONVERSATION_AUTHORITY_SCHEMA_V0,
      maySpeak: false,
      path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.NONE,
      reason: decision.reason || "silent_drop",
      strict,
      authority: "silent_drop"
    });
  }

  if (!strict) {
    const hold = decision.speakMode === "hold";
    const slow = decision.speakMode === "speak" && decision.execMode === "slow_llm";
    const fast = decision.speakMode === "speak" && decision.execMode === "fast_reflex";
    return Object.freeze({
      schema: RHIZOH_VOICE_CONVERSATION_AUTHORITY_SCHEMA_V0,
      maySpeak: hold || slow || fast,
      path: slow
        ? VOICE_CONVERSATION_AUTHORITY_PATH_V0.SLOW_LLM
        : fast
          ? VOICE_CONVERSATION_AUTHORITY_PATH_V0.FAST_REFLEX
          : hold
            ? VOICE_CONVERSATION_AUTHORITY_PATH_V0.HOLD
            : VOICE_CONVERSATION_AUTHORITY_PATH_V0.NONE,
      reason: "legacy_multi_voice",
      strict: false,
      authority: "legacy"
    });
  }

  if (decision.speakMode === "hold") {
    return Object.freeze({
      schema: RHIZOH_VOICE_CONVERSATION_AUTHORITY_SCHEMA_V0,
      maySpeak: false,
      path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.NONE,
      reason: "strict_hold_suppressed",
      strict,
      authority: "noise_suppression"
    });
  }

  if (decision.speakMode === "speak" && decision.execMode === "fast_reflex") {
    return Object.freeze({
      schema: RHIZOH_VOICE_CONVERSATION_AUTHORITY_SCHEMA_V0,
      maySpeak: true,
      path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.FAST_REFLEX,
      reason: decision.reason || "strict_fast_reflex",
      strict,
      authority: "pipeline"
    });
  }

  if (decision.speakMode === "speak" && decision.execMode === "slow_llm") {
    if (decision.guards?.allowSlow === false) {
      return Object.freeze({
        schema: RHIZOH_VOICE_CONVERSATION_AUTHORITY_SCHEMA_V0,
        maySpeak: false,
        path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.NONE,
        reason: "strict_guard_block",
        strict,
        authority: "noise_suppression"
      });
    }
    return Object.freeze({
      schema: RHIZOH_VOICE_CONVERSATION_AUTHORITY_SCHEMA_V0,
      maySpeak: true,
      path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.SLOW_LLM,
      reason: decision.reason || "strict_slow_llm",
      strict,
      authority: "pipeline"
    });
  }

  return Object.freeze({
    schema: RHIZOH_VOICE_CONVERSATION_AUTHORITY_SCHEMA_V0,
    maySpeak: false,
    path: VOICE_CONVERSATION_AUTHORITY_PATH_V0.NONE,
    reason: "strict_unhandled",
    strict,
    authority: "noise_suppression"
  });
}

/**
 * @param {ReturnType<typeof resolveConversationAuthorityV0>} authority
 */
export function publishConversationAuthorityDebugV0(authority) {
  if (typeof window === "undefined" || !authority) return;
  try {
    window.__CASTLE_RHIZOH_CONVERSATION_AUTHORITY__ = Object.freeze({
      ...authority,
      atMs: Date.now()
    });
  } catch {
    /* noop */
  }
}
