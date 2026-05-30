/**
 * Voice input adapter registry — browser STT guard + text fallback truth surface.
 * STT = Web Speech API (Google cloud in Chrome); not Rhizoh gateway.
 * Voice Engine v3 (`VITE_RHIZOH_VOICE_ENGINE_V3=1`): hybrid gateway ASR — Chrome optional trigger only.
 *
 * Hydration contract: consumers must distinguish `unknown` (pre-probe) from `unavailable` (probed, absent).
 * Chrome "No available adapters" is WebGPU — unrelated; see swarmGpuBridge / studioCapabilityProbeV0.
 */

import { logVoiceInfoV0, logVoiceWarnV0 } from "./rhizohProductionLogNamespacesV0.js";
import { isVoiceEngineV3EnabledV0 } from "./voiceEngineV3/isVoiceEngineV3EnabledV0.js";
export const VOICE_INPUT_ADAPTER_SCHEMA = "castle.voice_input_adapter_registry.v0";
export const VOICE_STT_NETWORK_RETRY_MAX = 2;
export const VOICE_ADAPTER_UPDATED_EVENT = "rhizoh:voice-adapter:updated";

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

let hydrated = false;
/** @type {Promise<ReturnType<typeof getVoiceAdapterRegistrySnapshot>> | null} */
let readyPromise = null;
/** @type {((snap: ReturnType<typeof getVoiceAdapterRegistrySnapshot>) => void) | null} */
let readyResolve = null;
/** @type {Set<(snap: ReturnType<typeof getVoiceAdapterRegistrySnapshot>) => void>} */
const listeners = new Set();

function completeHydrationProbe() {
  if (hydrated) return;
  hydrated = true;
}

function resolveReadyWaiters(snap) {
  readyResolve?.(snap);
  readyResolve = null;
}

function emitAdapterUpdated(snap) {
  for (const listener of listeners) {
    try {
      listener(snap);
    } catch {
      /* noop */
    }
  }
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(VOICE_ADAPTER_UPDATED_EVENT, { detail: snap }));
    } catch {
      /* noop */
    }
  }
}

function publishDebugTruth() {
  const snap = getVoiceAdapterRegistrySnapshot();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.voiceAdapter = snap;
    window.__rhizoh.inputAdapters = getRhizohInputAdaptersV0();
  }
  emitAdapterUpdated(snap);
  return snap;
}

export function isVoiceAdapterRegistryHydratedV0() {
  return hydrated;
}

/**
 * Resolves after the first STT capability probe completes (sync probe; promise for ordering gates).
 * @returns {Promise<ReturnType<typeof getVoiceAdapterRegistrySnapshot>>}
 */
export function awaitVoiceAdapterRegistryReadyV0() {
  if (hydrated) return Promise.resolve(getVoiceAdapterRegistrySnapshot());
  if (!readyPromise) {
    readyPromise = new Promise((resolve) => {
      readyResolve = resolve;
    });
    ensureVoiceAdapterRegistered();
  }
  return readyPromise;
}

/**
 * @param {(snap: ReturnType<typeof getVoiceAdapterRegistrySnapshot>) => void} listener
 * @returns {() => void}
 */
export function subscribeVoiceAdapterRegistryV0(listener) {
  listeners.add(listener);
  if (hydrated) {
    try {
      listener(getVoiceAdapterRegistrySnapshot());
    } catch {
      /* noop */
    }
  }
  return () => listeners.delete(listener);
}

/**
 * Voice adapter truth: `undefined` = probe pending, `null` = confirmed absent, object = available.
 * @returns {undefined | null | { id: string, provider: string }}
 */
export function getRhizohVoiceInputAdapterV0() {
  if (!hydrated) return undefined;
  return state.voice;
}

export function getRhizohInputAdaptersV0() {
  const voiceAvailability = !hydrated ? "unknown" : state.voice ? "available" : "unavailable";
  return Object.freeze({
    hydrated,
    voiceAvailability,
    voice: hydrated ? state.voice : undefined,
    text: Object.freeze({ id: "dom-text-input", provider: "dom", alwaysAvailable: true })
  });
}

export function getVoiceAdapterRegistrySnapshot() {
  return Object.freeze({
    schema: VOICE_INPUT_ADAPTER_SCHEMA,
    hydrated,
    voiceRegistered: hydrated ? Boolean(state.voice) : null,
    voice: hydrated ? state.voice : undefined,
    voiceAvailability: !hydrated ? "unknown" : state.voice ? "available" : "unavailable",
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
    completeHydrationProbe();
    const snap = publishDebugTruth();
    resolveReadyWaiters(snap);
    return snap;
  }
  if (isVoiceEngineV3EnabledV0()) {
    state.voice = Object.freeze({ id: "rhizoh-voice-engine-v3", provider: "hybrid-google-whisper" });
    state.sttProvider = "rhizoh-voice-engine-v3";
    state.sttStatus = "engine_v3_registered";
    state.fallbackMode = false;
    completeHydrationProbe();
    const snap = publishDebugTruth();
    resolveReadyWaiters(snap);
    logVoiceInfoV0("ADAPTER_REGISTRY_V3", snap);
    return snap;
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
  completeHydrationProbe();
  const snap = publishDebugTruth();
  resolveReadyWaiters(snap);
  logVoiceInfoV0("ADAPTER_REGISTRY", snap);
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
  logVoiceWarnV0("FALLBACK", snap);
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
  hydrated = false;
  readyPromise = null;
  readyResolve = null;
  listeners.clear();
}
