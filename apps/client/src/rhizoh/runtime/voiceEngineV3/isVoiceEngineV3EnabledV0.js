/**
 * Voice Engine v3 feature gate — Chrome STT deprecated as primary ASR when enabled.
 */

export function isVoiceEngineV3EnabledV0() {
  try {
    return typeof import.meta !== "undefined" && import.meta.env?.VITE_RHIZOH_VOICE_ENGINE_V3 === "1";
  } catch {
    return false;
  }
}

export function isVoiceEngineV3ChromeTriggerOnlyV0() {
  try {
    const v = String(import.meta.env?.VITE_RHIZOH_VOICE_ENGINE_V3_CHROME_TRIGGER || "1").trim();
    return isVoiceEngineV3EnabledV0() && v !== "0";
  } catch {
    return false;
  }
}
