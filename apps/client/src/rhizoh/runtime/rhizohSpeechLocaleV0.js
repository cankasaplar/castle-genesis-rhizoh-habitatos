/**
 * Browser TTS voice selection aligned with UI locale (not hardcoded tr-TR).
 */

import { resolveRhizohBcp47V0 } from "./rhizohMultilingualBridgeV0.js";
import { readVoiceLanguageLockV0 } from "./rhizohConversationLanguageV0.js";

/** Voice/TTS locale — prefers per-session lock, else UI conversation language. */
export function readSpeechLocaleForVoiceV0() {
  return readVoiceLanguageLockV0();
}

/**
 * @param {SpeechSynthesisVoice} voice
 * @param {string} langPrefix
 * @param {string} bcp47
 */
function scoreSpeechVoiceForLocaleV0(voice, langPrefix, bcp47) {
  const norm = String(voice?.lang || "").toLowerCase();
  const name = String(voice?.name || "").toLowerCase();
  let score = 0;
  if (norm === bcp47.toLowerCase()) score += 100;
  else if (norm.startsWith(`${langPrefix}-`)) score += 70;
  else if (norm.startsWith(langPrefix)) score += 50;

  if (langPrefix === "tr") {
    if (name.includes("google") && name.includes("turkish")) score += 24;
    if (name.includes("yelda")) score += 18;
    if (name.includes("meltem")) score += 12;
    if (name.includes("compact")) score -= 8;
    if (name.includes("enhanced") && !name.includes("google")) score -= 6;
  }

  if (voice?.default === true) score += 4;
  return score;
}

/**
 * @param {string} [localeCode]
 * @returns {{ rate: number, pitch: number, volume: number }}
 */
export function resolveSpeechProsodyForLocaleV0(localeCode) {
  const loc = String(localeCode || readSpeechLocaleForVoiceV0() || "en").toLowerCase();
  if (loc.startsWith("tr")) {
    return Object.freeze({ rate: 1.03, pitch: 1.06, volume: 0.94 });
  }
  return Object.freeze({ rate: 1.02, pitch: 1.04, volume: 0.92 });
}

/**
 * Prefer the actual visible text language for TTS when it is obvious.
 * This prevents Turkish text from being spoken with an English voice after an
 * earlier English/auto session lock.
 * @param {string} text
 * @param {string} [fallbackLocale]
 */
export function resolveSpeechLocaleForTextV0(text, fallbackLocale = readSpeechLocaleForVoiceV0()) {
  const raw = String(text || "");
  const folded = raw.toLowerCase();
  const fallback = String(fallbackLocale || "en").toLowerCase();
  if (/[çğıöşü]/i.test(raw)) return "tr";
  if (
    /\b(merhaba|günaydın|gunaydin|buradayım|buradayim|harita|kale|oluştur|olustur|açıyorum|aciyorum|açılıyor|aciliyor|devam|tamam|dinliyorum|konum|dünya|dunya|geçiyorum|geciyorum|satranç|satranc|arenası|arenasi|portal|kulesi|noktasına|noktasina)\b/i.test(
      folded
    )
  ) {
    return "tr";
  }
  if (fallback === "tr") {
    const latinWords = folded.match(/\b[a-z']+\b/g) || [];
    if (!latinWords.length) return "tr";
    const englishOnly = latinWords.filter((w) =>
      /^(opening|chess|arena|warping|heading|the|to|tower|neural|mistral|gemini|claude|done|playing)$/i.test(
        w
      )
    );
    if (englishOnly.length < latinWords.length * 0.45) return "tr";
  }
  return fallback;
}

/**
 * @param {string} [localeCode]
 * @returns {string}
 */
export function resolveSpeechBcp47ForUiLocaleV0(localeCode) {
  const code = String(localeCode || readSpeechLocaleForVoiceV0() || "en").toLowerCase();
  return resolveRhizohBcp47V0(code);
}

/**
 * Pure picker — never cross-fallback to tr-TR when UI locale is not Turkish.
 * Order: exact BCP-47 → lang region → lang prefix → (en only) any en-* → non-TR default voice.
 * @param {SpeechSynthesisVoice[]} voices
 * @param {string} [localeCode]
 * @returns {SpeechSynthesisVoice | null}
 */
export function pickSpeechVoiceForLocaleV0(voices, localeCode) {
  const list = Array.isArray(voices) ? voices : [];
  if (!list.length) return null;
  const bcp47 = resolveSpeechBcp47ForUiLocaleV0(localeCode);
  const langPrefix = bcp47.split("-")[0].toLowerCase();

  const candidates = list
    .map((v) => ({ v, score: scoreSpeechVoiceForLocaleV0(v, langPrefix, bcp47) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  if (candidates.length) return candidates[0].v;

  if (langPrefix === "en") {
    const anyEn = list.find((v) => String(v?.lang || "").toLowerCase().startsWith("en"));
    if (anyEn) return anyEn;
  }

  const sysDefault = list.find((v) => v.default === true);
  if (sysDefault && (langPrefix === "tr" || !String(sysDefault.lang || "").toLowerCase().startsWith("tr"))) {
    return sysDefault;
  }

  return null;
}

/**
 * @param {string} [localeCode]
 * @returns {SpeechSynthesisVoice | null}
 */
export function resolveSpeechVoiceForUiLocaleV0(localeCode) {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  return pickSpeechVoiceForLocaleV0(window.speechSynthesis.getVoices(), localeCode);
}
