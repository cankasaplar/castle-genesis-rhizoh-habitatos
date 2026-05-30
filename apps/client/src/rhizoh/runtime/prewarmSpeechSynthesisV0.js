/**
 * Chrome/Safari TTS cold-start mitigation — load voices early.
 */

let prewarmed = false;

function pickTurkishVoiceV0() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "tr-TR") ||
    voices.find((v) => String(v.lang || "").toLowerCase().startsWith("tr")) ||
    null
  );
}

export function resolveTurkishSpeechVoiceV0() {
  return pickTurkishVoiceV0();
}

export function prewarmSpeechSynthesisV0() {
  if (typeof window === "undefined" || prewarmed || !("speechSynthesis" in window)) return false;
  const run = () => {
    const voice = pickTurkishVoiceV0();
    if (!voice && window.speechSynthesis.getVoices().length === 0) return;
    prewarmed = true;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("\u200b");
      u.lang = "tr-TR";
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
