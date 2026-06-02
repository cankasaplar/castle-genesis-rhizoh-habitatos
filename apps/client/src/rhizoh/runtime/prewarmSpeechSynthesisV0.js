/**
 * Chrome/Safari TTS cold-start mitigation — load voices early.
 */

import { readSpeechLocaleForVoiceV0 } from "./rhizohSpeechLocaleV0.js";
import {
  resolveSpeechBcp47ForUiLocaleV0,
  resolveSpeechVoiceForUiLocaleV0
} from "./rhizohSpeechLocaleV0.js";

let prewarmed = false;

/** @deprecated use resolveSpeechVoiceForUiLocaleV0 */
export function resolveTurkishSpeechVoiceV0() {
  return resolveSpeechVoiceForUiLocaleV0("tr");
}

export function prewarmSpeechSynthesisV0(localeCode) {
  if (typeof window === "undefined" || prewarmed || !("speechSynthesis" in window)) return false;
  const run = () => {
    const locale = localeCode || readSpeechLocaleForVoiceV0();
    const voice = resolveSpeechVoiceForUiLocaleV0(locale);
    if (!voice && window.speechSynthesis.getVoices().length === 0) return;
    prewarmed = true;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("\u200b");
      u.lang = resolveSpeechBcp47ForUiLocaleV0(locale);
      u.volume = 0.01;
      u.rate = 1;
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    } catch {
      /* noop */
    }
  };
  run();
  window.speechSynthesis.onvoiceschanged = run;
  return true;
}
