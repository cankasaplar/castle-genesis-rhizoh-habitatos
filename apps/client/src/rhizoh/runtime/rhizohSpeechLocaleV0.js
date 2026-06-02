/**
 * Browser TTS voice selection aligned with UI locale (not hardcoded tr-TR).
 */

import { resolveRhizohBcp47V0 } from "./rhizohMultilingualBridgeV0.js";
import { readUiLocaleV0 } from "./rhizohUiLocaleV0.js";

/**
 * @param {string} [localeCode]
 * @returns {string}
 */
export function resolveSpeechBcp47ForUiLocaleV0(localeCode) {
  const code = String(localeCode || readUiLocaleV0() || "en").toLowerCase();
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
  const norm = (v) => String(v?.lang || "").toLowerCase();

  const exact = list.find((v) => norm(v) === bcp47.toLowerCase());
  if (exact) return exact;

  const region = list.find((v) => norm(v).startsWith(`${langPrefix}-`));
  if (region) return region;

  const prefix = list.find((v) => norm(v).startsWith(langPrefix));
  if (prefix) return prefix;

  if (langPrefix === "en") {
    const anyEn = list.find((v) => norm(v).startsWith("en"));
    if (anyEn) return anyEn;
  }

  const sysDefault = list.find((v) => v.default === true);
  if (sysDefault && (langPrefix === "tr" || !norm(sysDefault).startsWith("tr"))) {
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
