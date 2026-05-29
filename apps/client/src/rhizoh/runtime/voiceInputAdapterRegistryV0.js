/**
 * Voice input adapter registry — browser STT guard + text fallback truth surface.
 * STT = Web Speech API (Google cloud in Chrome); not Rhizoh gateway.
 */

export const VOICE_INPUT_ADAPTER_SCHEMA = "castle.voice_input_adapter_registry.v0";
export const VOICE_STT_NETWORK_RETRY_MAX = 2;

/** @type {{
 *   voice: null | { id: string, provider: string },
 *   sttProvider: string,
 *   sttStatus: string,
 *   fallbackMode: boolean,
 *   lastError: string | null,
 *   networkRetryCount: number
 * }} */
const state = {
  voice: null,
  sttProvider: "none",
  sttStatus: "unregistered",
  fallbackMode: false,
  lastError: null,
  networkRetryCount: 0
};

function publishDebugTruth() {
  const snap = getVoiceAdapterRegistrySnapshot();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.voiceAdapter = snap;
    window.__rhizoh.inputAdapters = getRhizohInputAdaptersV0();
  }
  return snap;
}

export function getRhizohInputAdaptersV0() {
  return Object.freeze({
    voice: state.voice,
    text: Object.freeze({ id: "dom-text-input", provider: "dom", alwaysAvailable: true })
  });
}

export function getVoiceAdapterRegistrySnapshot() {
  return Object.freeze({
    schema: VOICE_INPUT_ADAPTER_SCHEMA,
    voiceRegistered: Boolean(state.voice),
    voice: state.voice,
    sttProvider: state.sttProvider,
    sttStatus: state.sttStatus,
    fallbackMode: state.fallbackMode,
    lastError: state.lastError,
    networkRetryCount: state.networkRetryCount,
    atMs: Date.now()
  });
}

export function ensureVoiceAdapterRegistered() {
  if (typeof window === "undefined") {
    state.sttStatus = "no_window";
    state.fallbackMode = true;
    state.voice = null;
    return publishDebugTruth();
  }
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (Ctor) {
    state.voice = Object.freeze({ id: "browser-web-speech", provider: "webkit-speech-api" });
    state.sttProvider = "browser-web-speech";
    if (!state.fallbackMode) state.sttStatus = "adapter_registered";
  } else {
    state.voice = null;
    state.sttProvider = "none";
    state.sttStatus = "no_speech_api";
    state.fallbackMode = true;
  }
  const snap = publishDebugTruth();
  console.info("[VOICE_ADAPTER] registry", snap);
  return snap;
}

/**
 * @param {string} code
 * @param {string} [message]
 */
export function recordVoiceSttErrorV0(code, message = "") {
  const err = String(code || "unknown").trim();
  const msg = String(message || "").trim();
  state.lastError = msg ? `${err}:${msg}` : err;

  if (err === "network") {
    state.networkRetryCount += 1;
    state.sttStatus =
      state.networkRetryCount >= VOICE_STT_NETWORK_RETRY_MAX ? "network_exhausted" : "network_retry";
  } else if (err === "not-allowed" || err === "service-not-allowed") {
    state.sttStatus = "permission_denied";
  } else if (err === "audio-capture") {
    state.sttStatus = "audio_capture_failed";
  } else if (err === "language-not-supported") {
    state.sttStatus = "language_unsupported";
  } else if (err !== "aborted" && err !== "no-speech") {
    state.sttStatus = `error_${err}`;
  }

  const snap = publishDebugTruth();
  const benign = err === "aborted" || err === "no-speech";
  const shouldRetryNetwork = err === "network" && state.networkRetryCount < VOICE_STT_NETWORK_RETRY_MAX;
  const shouldFallback =
    !benign &&
    (shouldRetryNetwork
      ? false
      : err === "network" ||
        err === "not-allowed" ||
        err === "service-not-allowed" ||
        err === "audio-capture" ||
        err === "language-not-supported" ||
        (err !== "aborted" && err !== "no-speech"));

  return Object.freeze({ shouldRetryNetwork, shouldFallback, snapshot: snap, code: err });
}

/** @param {string} [reason] */
export function activateVoiceFallbackModeV0(reason = "stt_unavailable") {
  state.fallbackMode = true;
  state.voice = null;
  state.sttStatus = reason.startsWith("fallback_") ? reason : `fallback_${reason}`;
  const snap = publishDebugTruth();
  console.warn("[VOICE_ADAPTER] fallback active", snap);
  return snap;
}

export function clearVoiceSttRecoveryV0() {
  state.networkRetryCount = 0;
  state.lastError = null;
  if (!state.fallbackMode && state.voice) state.sttStatus = "adapter_registered";
  publishDebugTruth();
}

export function resetVoiceInputAdapterRegistryForTestV0() {
  state.voice = null;
  state.sttProvider = "none";
  state.sttStatus = "unregistered";
  state.fallbackMode = false;
  state.lastError = null;
  state.networkRetryCount = 0;
}
