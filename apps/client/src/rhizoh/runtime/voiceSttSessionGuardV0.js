/**
 * STT session guards — empty onend (no onresult), tab visibility, AudioContext suspend.
 * Gesture truth = voiceUserGestureAnchor decay curve — NOT navigator.userActivation (always false on onend).
 *
 * Restart policy: STT events only; onend+no-result = silent abort (hard block); decay is advisory.
 */

import { getVoiceGestureTrustV0, hasActiveVoiceUserGestureV0 } from "./voiceUserGestureAnchorV0.js";

/** Cooldown after Chrome silent abort (onend without onresult). Manual gesture clears. */
export const VOICE_STT_SILENT_ABORT_COOLDOWN_MS = 10_000;
export const VOICE_STT_SILENT_ABORT_COOLDOWN_MEDIUM_MS = 2_500;

/** STT event contexts that may request mic auto-restart (never bare onend silent abort). */
const STT_RESTART_CONTEXTS = new Set(["after_tts", "onresult_empty", "onend_ambiguous", "v3_empty_retry"]);

let autoRestartBlockedUntilMs = 0;

/** @param {number} [cooldownMs] */
export function blockVoiceSttAutoRestartV0(cooldownMs = VOICE_STT_SILENT_ABORT_COOLDOWN_MS) {
  autoRestartBlockedUntilMs = Date.now() + Math.max(1000, cooldownMs);
}

export function clearVoiceSttAutoRestartBlockV0() {
  autoRestartBlockedUntilMs = 0;
}

/** @param {number} [nowMs] */
export function isVoiceSttAutoRestartBlockedV0(nowMs = Date.now()) {
  return nowMs < autoRestartBlockedUntilMs;
}

/** @param {number} [nowMs] */
export function getVoiceSttAutoRestartBlockRemainingMsV0(nowMs = Date.now()) {
  return Math.max(0, autoRestartBlockedUntilMs - nowMs);
}

/**
 * Gate auto-restart — STT events only; gesture = binary window; decay is never authoritative.
 * @param {{
 *   context?: string,
 *   lastSessionHadResult?: boolean,
 *   keepAlive?: boolean
 * }} opts
 */
export function canRequestVoiceSttAutoRestartV0(opts = {}) {
  const context = String(opts.context || "unknown");
  const lastSessionHadResult = opts.lastSessionHadResult === true || context === "after_tts";
  const keepAlive = opts.keepAlive === true;

  if (!keepAlive) {
    return { ok: false, reason: "keep_alive_off" };
  }
  if (!STT_RESTART_CONTEXTS.has(context)) {
    return { ok: false, reason: context === "onend" ? "onend_silent_abort" : "context_not_stt" };
  }
  if (isVoiceSttAutoRestartBlockedV0()) {
    return {
      ok: false,
      reason: "silent_abort_cooldown",
      remainingMs: getVoiceSttAutoRestartBlockRemainingMsV0()
    };
  }
  if (!hasActiveVoiceUserGestureV0()) {
    if (keepAlive && context === "after_tts") {
      return {
        ok: true,
        reason: "after_tts_gesture_soft",
        softDegrade: true,
        gestureExpired: true
      };
    }
    return { ok: false, reason: "gesture_expired" };
  }
  if (context === "onresult_empty" && !lastSessionHadResult) {
    return { ok: false, reason: "onresult_empty_no_prior_result" };
  }
  if (context === "v3_empty_retry") {
    return { ok: true, reason: "v3_empty_retry" };
  }
  return {
    ok: true,
    reason:
      context === "after_tts" ? "after_tts" : context === "onend_ambiguous" ? "onend_ambiguous" : "onresult_empty"
  };
}

/**
 * Confidence score for onend without onresult — avoids over-blocking ambiguous Chrome exits.
 * @param {{
 *   sessionDurationMs?: number,
 *   gestureAgeMs?: number,
 *   hadInterimActivity?: boolean,
 *   lastSttError?: string,
 *   audioState?: string,
 *   gatewayDegraded?: boolean
 * }} opts
 */
export function scoreSilentSttOnEndV0(opts = {}) {
  const sessionMs = Math.max(0, Number(opts.sessionDurationMs) || 0);
  const gestureAgeMs = Math.max(0, Number(opts.gestureAgeMs) || 0);
  const hadInterim = opts.hadInterimActivity === true;
  const lastSttError = String(opts.lastSttError || "").trim();
  const audioState = String(opts.audioState || "running");
  const gatewayDegraded = opts.gatewayDegraded === true;

  let score = 30;

  if (sessionMs >= 5000) score += 30;
  else if (sessionMs >= 2000) score += 10;
  else if (sessionMs < 800) score -= 25;

  if (gestureAgeMs < 1500) score -= 10;

  if (hadInterim) score -= 35;

  if (lastSttError === "network") score -= 30;
  else if (lastSttError === "no-speech") score -= 15;

  if (audioState === "suspended") score += 15;

  if (gatewayDegraded) score -= 20;

  /** @type {'low' | 'medium' | 'high'} */
  let confidence;
  if (score >= 45) confidence = "high";
  else if (score >= 15) confidence = "medium";
  else confidence = "low";

  const cooldownMs =
    confidence === "high"
      ? VOICE_STT_SILENT_ABORT_COOLDOWN_MS
      : confidence === "medium"
        ? VOICE_STT_SILENT_ABORT_COOLDOWN_MEDIUM_MS
        : 0;

  return Object.freeze({
    type: "silent_end",
    confidence,
    score,
    sessionMs,
    gestureAgeMs,
    hadInterim,
    lastSttError: lastSttError || null,
    audioState,
    gatewayDegraded,
    cooldownMs,
    shouldSoftRestart: confidence !== "high",
    shouldPrompt: confidence === "high",
    blockAutoRestart: confidence === "high"
  });
}

/**
 * @param {AudioContext | null | undefined} ambientCtx
 * @returns {Promise<string>}
 */
export async function resumeVoiceAudioContextV0(ambientCtx) {
  if (!ambientCtx) return "none";
  if (ambientCtx.state === "suspended") {
    try {
      await ambientCtx.resume();
    } catch {
      /* noop */
    }
  }
  return ambientCtx.state;
}

/**
 * @param {AudioContext | null | undefined} ambientCtx
 * @returns {{ ok: boolean, reason: string, visibility: string, trustLevel: string, strength: number, audioState: string }}
 */
/**
 * @param {AudioContext | null | undefined} ambientCtx
 * @param {{ softGesture?: boolean }} [opts]
 */
export function probeVoiceSttStartPreconditionsV0(ambientCtx, opts = {}) {
  const visibility = typeof document !== "undefined" ? String(document.visibilityState || "visible") : "visible";
  const trust = getVoiceGestureTrustV0();
  const audioState = ambientCtx?.state ? String(ambientCtx.state) : "none";
  const softGesture = opts.softGesture === true;

  if (visibility !== "visible") {
    return {
      ok: false,
      reason: "tab_hidden",
      visibility,
      trustLevel: trust.level,
      strength: trust.strength,
      audioState
    };
  }
  if (!hasActiveVoiceUserGestureV0()) {
    if (softGesture) {
      return {
        ok: true,
        reason: "gesture_soft_degrade",
        visibility,
        trustLevel: trust.level,
        strength: trust.strength,
        audioState,
        softDegrade: true,
        gestureExpired: true
      };
    }
    return {
      ok: false,
      reason: "gesture_expired",
      visibility,
      trustLevel: trust.level,
      strength: trust.strength,
      audioState
    };
  }
  if (audioState === "suspended") {
    return {
      ok: false,
      reason: "audio_suspended",
      visibility,
      trustLevel: trust.level,
      strength: trust.strength,
      audioState
    };
  }
  return {
    ok: true,
    reason: "ready",
    visibility,
    trustLevel: trust.level,
    strength: trust.strength,
    audioState
  };
}

/**
 * onend with no dispatchable transcript — never use navigator.userActivation here.
 * @param {{
 *   pending?: string,
 *   gotAnyResult?: boolean,
 *   keepAlive?: boolean,
 *   visibility?: string,
 *   audioState?: string,
 *   sessionDurationMs?: number,
 *   gestureAgeMs?: number,
 *   hadInterimActivity?: boolean,
 *   lastSttError?: string,
 *   gatewayDegraded?: boolean
 * }} opts
 */
export function classifyEmptySttOnEndV0(opts = {}) {
  const pending = String(opts.pending || "").trim();
  if (pending) {
    return { kind: "flush", reason: "pending_on_end", shouldFlush: true, shouldAutoRestart: false, shouldPrompt: false };
  }

  const gotAnyResult = opts.gotAnyResult === true;
  const visibility = String(opts.visibility || "visible");
  const audioState = String(opts.audioState || "unknown");
  const keepAlive = opts.keepAlive === true;

  if (gotAnyResult) {
    return {
      kind: "empty_final",
      reason: "empty_after_result",
      shouldFlush: false,
      shouldAutoRestart: false,
      shouldPrompt: false,
      blockAutoRestart: false
    };
  }

  if (visibility !== "visible") {
    return {
      kind: "silent_stop",
      reason: "tab_inactive",
      shouldFlush: false,
      shouldAutoRestart: false,
      shouldPrompt: keepAlive,
      blockAutoRestart: true,
      promptKey: "tab"
    };
  }
  if (audioState === "suspended") {
    return {
      kind: "silent_stop",
      reason: "audio_suspended",
      shouldFlush: false,
      shouldAutoRestart: false,
      shouldPrompt: keepAlive,
      blockAutoRestart: true,
      promptKey: "audio"
    };
  }

  // Chrome onend without onresult — confidence-scored (not always true silent stop).
  const silentEnd = scoreSilentSttOnEndV0({
    sessionDurationMs: opts.sessionDurationMs,
    gestureAgeMs: opts.gestureAgeMs ?? getVoiceGestureTrustV0().ageMs,
    hadInterimActivity: opts.hadInterimActivity,
    lastSttError: opts.lastSttError,
    audioState,
    gatewayDegraded: opts.gatewayDegraded
  });

  return {
    kind: "silent_stop",
    reason: "onend_without_onresult",
    silentEnd,
    shouldFlush: false,
    shouldAutoRestart: false,
    shouldPrompt: keepAlive && silentEnd.shouldPrompt,
    shouldSoftRestart: keepAlive && silentEnd.shouldSoftRestart,
    blockAutoRestart: silentEnd.blockAutoRestart,
    applySilentAbortCooldown: silentEnd.cooldownMs > 0,
    cooldownMs: silentEnd.cooldownMs,
    promptKey: silentEnd.confidence === "high" ? "gesture_rebind" : "retry"
  };
}

export function resetVoiceSttSessionGuardForTestV0() {
  autoRestartBlockedUntilMs = 0;
}

/** @param {string} [promptKey] */
export function voiceSttEmptyPromptTrV0(promptKey = "retry") {
  const key = String(promptKey || "retry");
  if (key === "tab") return "Sekme arka plandayken ses tanıma durur. Rhizoh sekmesine dönüp mikrofona tekrar bas.";
  if (key === "gesture" || key === "gesture_rebind") return "Konuşmaya devam etmek için mikrofona tekrar bas.";
  if (key === "audio") return "Ses bağlamı askıda. Mikrofona tekrar dokun.";
  if (key === "low_confidence") return "Ses net duyulmadı. Mikrofona biraz daha yakın, biraz daha uzun konuş.";
  if (key === "silent") return "Mikrofon ses almıyor gibi. Cihazında doğru mikrofon seçili mi kontrol et, sonra tekrar dene.";
  return "Ses algılanmadı. Mikrofona tekrar basıp en az bir saniye konuş.";
}
