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
 * @param {string} [localeCode]
 * @returns {SpeechSynthesisVoice | null}
 */
export function resolveSpeechVoiceForUiLocaleV0(localeCode) {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const bcp47 = resolveSpeechBcp47ForUiLocaleV0(localeCode);
  const langPrefix = bcp47.split("-")[0].toLowerCase();
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => String(v.lang || "").toLowerCase() === bcp47.toLowerCase()) ||
    voices.find((v) => String(v.lang || "").toLowerCase().startsWith(`${langPrefix}-`)) ||
    voices.find((v) => String(v.lang || "").toLowerCase().startsWith(langPrefix)) ||
    null
  );
}
