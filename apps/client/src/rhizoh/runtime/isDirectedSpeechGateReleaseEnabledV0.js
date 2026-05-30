/**
 * Faz 3 — controlled release: directed_candidate + sanity + confidence required for voice turns.
 * Default off; observation + shadow always safe to run without this flag.
 */

export function isDirectedSpeechGateReleaseEnabledV0() {
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_DIRECTED_SPEECH_GATE === "1";
  } catch {
    return false;
  }
}

export function isVoiceWitnessShadowEnabledV0() {
  try {
    const v = String(import.meta.env?.VITE_RHIZOH_VOICE_WITNESS_SHADOW ?? "1").trim();
    return v !== "0";
  } catch {
    return true;
  }
}
