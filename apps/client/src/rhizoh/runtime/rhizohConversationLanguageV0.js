/**
 * Voice session output locale + fast phrase binding.
 * Output Language Policy (OLP): rhizohOutputLanguagePolicyV0.js
 * STT input capture uses readSttInputLanguageCodeHintV0() ("auto" under ui_locked_output).
 */

import { resolveRhizohBcp47V0 } from "./rhizohMultilingualBridgeV0.js";
import {
  readOutputLanguagePolicyV0,
  readSttInputLanguageCodeHintV0,
  resolveOutputBcp47V0,
  resolveOutputLanguageCodeV0
} from "./rhizohOutputLanguagePolicyV0.js";
import { publishRhizohLanguageRuntimeSnapshotV0 } from "./rhizohLanguageRuntimeV0.js";
import { normalizeUiLocaleV0, readUiLocaleV0 } from "./rhizohUiLocaleV0.js";

export const RHIZOH_CONVERSATION_LANGUAGE_CONTRACT_V0 = "rhizoh.conversation_language.v0";

/** @type {{ locale: string, bcp47: string, sessionId: string, atMs: number } | null} */
let voiceLanguageLock = null;

/** @deprecated Use readUiLocaleV0 for chrome; resolveOutputLanguageCodeV0 for LLM/TTS. */
export function readConversationLanguageV0() {
  return readUiLocaleV0();
}

/** @deprecated Use resolveOutputBcp47V0 */
export function readConversationBcp47V0() {
  return resolveOutputBcp47V0();
}

/**
 * Immutable per voice session — set at V3_SESSION_BEGIN.
 * @param {{ locale?: string, sessionId?: string }} [opts]
 */
export function beginVoiceSessionLanguageLockV0(opts = {}) {
  const locale = normalizeUiLocaleV0(opts.locale ?? resolveOutputLanguageCodeV0());
  const bcp47 = resolveRhizohBcp47V0(locale);
  voiceLanguageLock = Object.freeze({
    locale,
    bcp47,
    sessionId: String(opts.sessionId || ""),
    atMs: Date.now()
  });
  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_VOICE_LANGUAGE_LOCK__ = voiceLanguageLock;
  }
  publishRhizohLanguageRuntimeSnapshotV0({ sessionId: voiceLanguageLock.sessionId });
  return voiceLanguageLock;
}

export function endVoiceSessionLanguageLockV0() {
  voiceLanguageLock = null;
  if (typeof window !== "undefined") {
    try {
      delete window.__CASTLE_RHIZOH_VOICE_LANGUAGE_LOCK__;
    } catch {
      /* noop */
    }
  }
}

/**
 * @returns {string}
 */
export function readVoiceLanguageLockV0() {
  return voiceLanguageLock?.locale ?? resolveOutputLanguageCodeV0();
}

/**
 * @returns {string}
 */
export function readVoiceLanguageLockBcp47V0() {
  return voiceLanguageLock?.bcp47 ?? resolveOutputBcp47V0();
}

/** STT input capture — not output policy (often "auto" for cross-lingual). */
export function readSttLanguageCodeHintV0() {
  return readSttInputLanguageCodeHintV0();
}

/**
 * Log-only — STT inference does not change OLP output locale.
 * @param {string} inferredCode
 */
export function recordSttInferredLanguageHintV0(inferredCode) {
  const hint = String(inferredCode || "").toLowerCase();
  const obs = Object.freeze({
    hint,
    outputPolicy: readOutputLanguagePolicyV0(),
    outputLocale: resolveOutputLanguageCodeV0(hint),
    outputBcp47: resolveOutputBcp47V0(hint)
  });
  publishRhizohLanguageRuntimeSnapshotV0({
    sttInferred: hint,
    sessionId: voiceLanguageLock?.sessionId || ""
  });
  return obs;
}

export { pickVoiceInstantAckPhraseV0, selectInstantAckV0 } from "./rhizohInstantAckSelectV0.js";

const SHADOW_ACK_LIGHT_V0 = Object.freeze({
  en: Object.freeze(["Okay.", "I hear you.", "Got it."]),
  tr: Object.freeze(["Tamam.", "Duyuyorum.", "Aldım."])
});

const SHADOW_ACK_DELAYED_V0 = Object.freeze({
  en: Object.freeze(["I hear you — one moment.", "Still with you.", "Listening."]),
  tr: Object.freeze(["Duyuyorum, bir saniye.", "Buradayım.", "Dinliyorum."])
});

const STT_EMPTY_PROMPTS_V0 = Object.freeze({
  en: Object.freeze({
    tab: "Speech stops when the tab is in the background. Return to Rhizoh and tap the mic again.",
    gesture: "Tap the mic again to continue speaking.",
    gesture_rebind: "Tap the mic again to continue speaking.",
    audio: "Audio context paused. Tap the mic again.",
    low_confidence: "I didn't catch that clearly. Speak a bit closer and a little longer.",
    silent: "No mic input detected. Check your device microphone, then try again.",
    retry: "No speech detected. Tap the mic and speak for at least a second."
  }),
  tr: Object.freeze({
    tab: "Sekme arka plandayken ses tanıma durur. Rhizoh sekmesine dönüp mikrofona tekrar bas.",
    gesture: "Konuşmaya devam etmek için mikrofona tekrar bas.",
    gesture_rebind: "Konuşmaya devam etmek için mikrofona tekrar bas.",
    audio: "Ses bağlamı askıda. Mikrofona tekrar dokun.",
    low_confidence: "Ses net duyulmadı. Mikrofona biraz daha yakın, biraz daha uzun konuş.",
    silent: "Mikrofon ses almıyor gibi. Cihazında doğru mikrofon seçili mi kontrol et, sonra tekrar dene.",
    retry: "Ses algılanmadı. Mikrofona tekrar basıp en az bir saniye konuş."
  })
});

function pickFromPool(pool, locale) {
  const loc = normalizeUiLocaleV0(locale);
  const list = pool[loc] || pool.en;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * @param {"light"|"delayed"} mode
 * @param {string} [locale]
 */
export function pickShadowAckPhraseV0(mode, locale) {
  const pool = mode === "delayed" ? SHADOW_ACK_DELAYED_V0 : SHADOW_ACK_LIGHT_V0;
  return pickFromPool(pool, locale ?? resolveOutputLanguageCodeV0());
}

/**
 * @param {string} [promptKey]
 * @param {string} [locale]
 */
export function voiceSttEmptyPromptForConversationV0(promptKey = "retry", locale) {
  const key = String(promptKey || "retry");
  const loc = normalizeUiLocaleV0(locale ?? resolveOutputLanguageCodeV0());
  const table = STT_EMPTY_PROMPTS_V0[loc] || STT_EMPTY_PROMPTS_V0.en;
  return table[key] || table.retry;
}

/** @internal vitest */
export function __resetVoiceLanguageLockForTestV0() {
  endVoiceSessionLanguageLockV0();
}
