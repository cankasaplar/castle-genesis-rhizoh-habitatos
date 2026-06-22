/**
 * Canary toggles for Pre-STT / Post-STT ingest gates (independent rollout).
 */

import { isVoiceEngineV3EnabledV0 } from "./voiceEngineV3/isVoiceEngineV3EnabledV0.js";
import { isVoiceOriginRetryEnabledV0 } from "./rhizohSttOriginRetryBudgetV0.js";

function readEnvFlagV0(name, defaultWhenUnset) {
  if (typeof import.meta === "undefined" || !import.meta.env) return defaultWhenUnset;
  const v = String(import.meta.env[name] || "").trim().toLowerCase();
  if (!v) return defaultWhenUnset;
  if (v === "0" || v === "false" || v === "off") return false;
  return v === "1" || v === "true" || v === "on";
}

/** Phase A canary — block bad audio before STT. Default ON when v3 enabled. */
export function isVoicePreSttGateEnabledV0() {
  if (!isVoiceEngineV3EnabledV0()) return false;
  return readEnvFlagV0("VITE_RHIZOH_VOICE_PRE_STT_GATE", true);
}

/**
 * Debug/proof bypass — allow low-energy clips when gateway voice session is live.
 * Default ON; set VITE_RHIZOH_VOICE_GATE_BYPASS_PRE_STT=0 to disable.
 */
export function isVoicePreSttGatewaySessionBypassV0() {
  return readEnvFlagV0("VITE_RHIZOH_VOICE_GATE_BYPASS_PRE_STT", true);
}

/**
 * Post-STT dispatch bypass — allow whisper_default_conf execution when gateway voice is live.
 * Default ON; set VITE_RHIZOH_VOICE_GATE_BYPASS_STT_DISPATCH=0 to disable.
 */
export function isVoiceSttDispatchGatewayBypassV0() {
  return readEnvFlagV0("VITE_RHIZOH_VOICE_GATE_BYPASS_STT_DISPATCH", true);
}

/** Phase B canary — post-STT origin filter. Default OFF until explicitly enabled. */
export function isVoicePostSttOriginFilterEnabledV0() {
  if (!isVoiceEngineV3EnabledV0()) return false;
  return readEnvFlagV0("VITE_RHIZOH_VOICE_POST_STT_ORIGIN", false);
}

export function readVoiceIngestGateRolloutV0() {
  return Object.freeze({
    preSttGate: isVoicePreSttGateEnabledV0(),
    preSttGatewaySessionBypass: isVoicePreSttGatewaySessionBypassV0(),
    sttDispatchGatewayBypass: isVoiceSttDispatchGatewayBypassV0(),
    postSttOrigin: isVoicePostSttOriginFilterEnabledV0(),
    originRetry: isVoiceOriginRetryEnabledV0(),
    voiceV3: isVoiceEngineV3EnabledV0()
  });
}
