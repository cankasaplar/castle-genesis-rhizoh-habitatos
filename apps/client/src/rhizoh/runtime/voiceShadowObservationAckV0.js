/**
 * Shadow-aware minimal acknowledgment — UX only (no LLM, no turn count, no gateway).
 * Contextual modes: none | light | delayed
 */

import { logCastleLifecycleV0, logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import { resolveTurkishSpeechVoiceV0 } from "./prewarmSpeechSynthesisV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";
import { VOICE_ROUTER_REJECTION_LAYER_V0 } from "./voiceTranscriptConfidenceRouterV0.js";

export const VOICE_SHADOW_OBSERVATION_ACK_SCHEMA = "castle.rhizoh.voice_shadow_observation_ack.v0";

export const SHADOW_ACK_MODE_V0 = Object.freeze({
  NONE: "none",
  LIGHT: "light",
  DELAYED: "delayed"
});

const SHADOW_ACK_PHRASES_LIGHT_TR = Object.freeze(["Tamam.", "Duyuyorum.", "Aldım."]);
const SHADOW_ACK_PHRASES_DELAYED_TR = Object.freeze([
  "Duyuyorum, bir saniye.",
  "Buradayım, işliyorum."
]);

const SHADOW_ACK_MIN_GAP_MS = 8000;
const SHADOW_ACK_DELAYED_MS = 1500;

let lastShadowAckAtMs = 0;
let shadowAckSession = 0;
let shadowAckTimer = 0;

export function isVoiceShadowObservationAckEnabledV0() {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const v = import.meta.env.VITE_RHIZOH_VOICE_SHADOW_OBS_ACK;
    if (v === "0" || v === "false") return false;
  }
  return true;
}

/**
 * Contextual ACK mode — not threshold-based.
 * @param {{
 *   band?: string,
 *   reason?: string,
 *   rejectionLayer?: string
 * }} [meta]
 */
export function resolveShadowAckModeV0(meta = {}) {
  const band = String(meta.band || "");
  const layer = String(meta.rejectionLayer || "");

  if (band === VOICE_DIRECTED_SPEECH_BAND.AMBIENT) return SHADOW_ACK_MODE_V0.NONE;
  if (layer === VOICE_ROUTER_REJECTION_LAYER_V0.NOOP) return SHADOW_ACK_MODE_V0.NONE;

  if (layer === VOICE_ROUTER_REJECTION_LAYER_V0.INTERACTION) {
    return SHADOW_ACK_MODE_V0.DELAYED;
  }
  if (meta.reason === "low_confidence") return SHADOW_ACK_MODE_V0.DELAYED;

  if (layer === VOICE_ROUTER_REJECTION_LAYER_V0.SANITY) {
    return SHADOW_ACK_MODE_V0.LIGHT;
  }

  return SHADOW_ACK_MODE_V0.LIGHT;
}

/**
 * @param {string} mode
 */
function pickPhraseForModeV0(mode) {
  const pool =
    mode === SHADOW_ACK_MODE_V0.DELAYED ? SHADOW_ACK_PHRASES_DELAYED_TR : SHADOW_ACK_PHRASES_LIGHT_TR;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * @param {{
 *   band?: string,
 *   reason?: string,
 *   rejectionLayer?: string,
 *   preview?: string
 * }} [meta]
 */
export function shouldSpeakShadowObservationAckV0(meta = {}) {
  if (!isVoiceShadowObservationAckEnabledV0()) return false;
  if (resolveShadowAckModeV0(meta) === SHADOW_ACK_MODE_V0.NONE) return false;
  const now = Date.now();
  if (now - lastShadowAckAtMs < SHADOW_ACK_MIN_GAP_MS) return false;
  return true;
}

function speakShadowAckUtteranceV0(text, meta, mode, session) {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "tr-TR";
  const voice = resolveTurkishSpeechVoiceV0();
  if (voice) utterance.voice = voice;
  utterance.rate = mode === SHADOW_ACK_MODE_V0.LIGHT ? 1.05 : 1.02;
  utterance.volume = mode === SHADOW_ACK_MODE_V0.LIGHT ? 0.75 : 0.88;

  utterance.onstart = () => {
    if (session !== shadowAckSession) return;
    const payload = Object.freeze({
      kind: "shadow_observation_ack",
      ackMode: mode,
      phrase: text,
      band: meta.band,
      reason: meta.reason,
      rejectionLayer: meta.rejectionLayer,
      preview: String(meta.preview || "").slice(0, 48)
    });
    logVoiceInfoV0("SHADOW_OBSERVATION_ACK", payload);
    logCastleLifecycleV0("shadow_observation_ack", payload);
    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.voiceShadowObservationAck = Object.freeze({
        ...payload,
        schema: VOICE_SHADOW_OBSERVATION_ACK_SCHEMA,
        atMs: Date.now()
      });
    }
  };

  try {
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {{
 *   band?: string,
 *   reason?: string,
 *   rejectionLayer?: string,
 *   preview?: string
 * }} [meta]
 */
export function speakShadowObservationAckV0(meta = {}) {
  const mode = resolveShadowAckModeV0(meta);
  if (mode === SHADOW_ACK_MODE_V0.NONE) return false;
  if (!shouldSpeakShadowObservationAckV0(meta)) return false;

  if (shadowAckTimer) {
    window.clearTimeout(shadowAckTimer);
    shadowAckTimer = 0;
  }

  const session = (shadowAckSession += 1);
  const text = pickPhraseForModeV0(mode);
  const delayMs = mode === SHADOW_ACK_MODE_V0.DELAYED ? SHADOW_ACK_DELAYED_MS : 0;

  const fire = () => {
    if (session !== shadowAckSession) return;
    lastShadowAckAtMs = Date.now();
    speakShadowAckUtteranceV0(text, meta, mode, session);
  };

  if (delayMs > 0) {
    shadowAckTimer = window.setTimeout(fire, delayMs);
    logVoiceInfoV0("SHADOW_OBSERVATION_ACK_SCHEDULED", {
      ackMode: mode,
      delayMs,
      reason: meta.reason,
      rejectionLayer: meta.rejectionLayer
    });
    return true;
  }

  fire();
  return true;
}

export function resetShadowObservationAckForTestV0() {
  lastShadowAckAtMs = 0;
  shadowAckSession = 0;
  if (shadowAckTimer) {
    window.clearTimeout(shadowAckTimer);
    shadowAckTimer = 0;
  }
}
