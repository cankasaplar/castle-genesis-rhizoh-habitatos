/**
 * Chrome Web Speech API tuning — continuous listen + lang fallback + no-speech retry.
 */

export const VOICE_STT_LANG_PRIMARY = "tr-TR";
export const VOICE_STT_LANG_FALLBACK = "en-US";
export const VOICE_STT_NO_SPEECH_RETRY_MAX = 3;

const NO_SPEECH_RETRY_MS_MIN = 220;
const NO_SPEECH_RETRY_MS_MAX = 420;

/**
 * @param {{ langAttempt?: number }} [opts]
 * @returns {string}
 */
export function resolveVoiceSttLangV0(opts = {}) {
  const attempt = Math.max(0, Number(opts.langAttempt) || 0);
  return attempt >= 1 ? VOICE_STT_LANG_FALLBACK : VOICE_STT_LANG_PRIMARY;
}

/** keepAlive loop needs continuous recognition — single-shot fails VAD on tr-TR. */
export function resolveVoiceSttContinuousV0(keepAlive) {
  return keepAlive === true;
}

export function jitterVoiceSttNoSpeechRetryMsV0() {
  return NO_SPEECH_RETRY_MS_MIN + Math.floor(Math.random() * (NO_SPEECH_RETRY_MS_MAX - NO_SPEECH_RETRY_MS_MIN + 1));
}

/**
 * @param {{ retryCount?: number, langAttempt?: number, keepAlive?: boolean }} opts
 */
export function planVoiceSttNoSpeechRetryV0(opts = {}) {
  const retryCount = Math.max(0, Number(opts.retryCount) || 0);
  const keepAlive = opts.keepAlive === true;
  if (!keepAlive || retryCount >= VOICE_STT_NO_SPEECH_RETRY_MAX) {
    return { ok: false, reason: keepAlive ? "max_retries" : "keep_alive_off" };
  }
  const nextRetryCount = retryCount + 1;
  const langAttempt = nextRetryCount >= 2 ? 1 : Number(opts.langAttempt) || 0;
  return {
    ok: true,
    nextRetryCount,
    langAttempt,
    delayMs: jitterVoiceSttNoSpeechRetryMsV0()
  };
}
