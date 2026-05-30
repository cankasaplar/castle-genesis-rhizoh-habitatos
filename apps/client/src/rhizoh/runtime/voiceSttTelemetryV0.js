/**
 * STT session telemetry — boot-time install + live window.__rhizoh.voiceStt getter.
 */

import {
  getVoiceGestureAnchorSnapshotV0,
  publishVoiceGestureAnchorToWindowV0
} from "./voiceUserGestureAnchorV0.js";

/** @type {{
 *   sessionId: number,
 *   lastEvent: object | null,
 *   startAtMs: number,
 *   onstartAtMs: number,
 *   resultCount: number,
 *   interimCount: number,
 *   finalCount: number,
 *   lastError: string | null,
 *   lang: string,
 *   continuous: boolean,
 *   keepAlive: boolean,
 *   handlersAttached: boolean
 * }} */
const state = {
  sessionId: 0,
  lastEvent: null,
  startAtMs: 0,
  onstartAtMs: 0,
  resultCount: 0,
  interimCount: 0,
  finalCount: 0,
  lastError: null,
  lang: "tr-TR",
  continuous: false,
  keepAlive: false,
  handlersAttached: false
};

let telemetryInstalled = false;
/** @type {null | (() => object)} */
let voiceEngineV3SnapshotProvider = null;

/**
 * @param {() => object} provider
 */
export function registerCastleVoiceEngineV3SnapshotProviderV0(provider) {
  voiceEngineV3SnapshotProvider = typeof provider === "function" ? provider : null;
  bindWindowTelemetryExportsV0();
}

export function refreshCastleVoiceNamespaceV0() {
  bindWindowTelemetryExportsV0();
}

function getSpeechRecognitionCtorV0() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function getVoiceInitSnapshotV0() {
  const Ctor = getSpeechRecognitionCtorV0();
  return Object.freeze({
    telemetryInstalled,
    handlersAttached: state.handlersAttached,
    hasSpeechRecognition: !!Ctor,
    speechRecognitionName: Ctor?.name || null,
    voiceStt: getVoiceSttTelemetrySnapshotV0(),
    voiceGestureAnchor: getVoiceGestureAnchorSnapshotV0()
  });
}

function bindWindowTelemetryExportsV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  try {
    Object.defineProperty(window.__rhizoh, "voiceStt", {
      configurable: true,
      enumerable: true,
      get() {
        return getVoiceSttTelemetrySnapshotV0();
      }
    });
  } catch {
    window.__rhizoh.voiceStt = getVoiceSttTelemetrySnapshotV0();
  }
  window.__rhizoh.voiceInit = () => getVoiceInitSnapshotV0();
  /** @type {Record<string, unknown>} */
  const ns = {
    voiceStt: () => getVoiceSttTelemetrySnapshotV0(),
    voiceInit: () => getVoiceInitSnapshotV0(),
    install: installVoiceSttTelemetryV0
  };
  if (voiceEngineV3SnapshotProvider) {
    ns.voiceEngineV3 = () => voiceEngineV3SnapshotProvider();
  }
  window.__CASTLE_VOICE__ = Object.freeze(ns);
}

/** Idempotent — call from main.jsx before React mount and before any recognition.start(). */
export function installVoiceSttTelemetryV0() {
  if (telemetryInstalled) {
    bindWindowTelemetryExportsV0();
    return getVoiceSttTelemetrySnapshotV0();
  }
  telemetryInstalled = true;
  bindWindowTelemetryExportsV0();
  publishVoiceGestureAnchorToWindowV0();
  noteVoiceSttEventV0("STT_TELEMETRY_READY", { schema: "voiceSttTelemetryV0", phase: "boot" });
  return getVoiceSttTelemetrySnapshotV0();
}

/**
 * @param {string} tag
 * @param {Record<string, unknown>} [detail]
 */
export function noteVoiceSttEventV0(tag, detail = {}) {
  if (!telemetryInstalled) installVoiceSttTelemetryV0();
  const row = Object.freeze({ tag: String(tag), atMs: Date.now(), ...detail });
  state.lastEvent = row;

  if (tag === "STT_SESSION_BEGIN") {
    state.sessionId += 1;
    state.startAtMs = row.atMs;
    state.onstartAtMs = 0;
    state.resultCount = 0;
    state.interimCount = 0;
    state.finalCount = 0;
    state.lastError = null;
    state.handlersAttached = false;
    state.lang = String(detail.lang || state.lang);
    state.continuous = detail.continuous === true;
    state.keepAlive = detail.keepAlive === true;
  }
  if (tag === "STT_HANDLERS_ATTACHED") state.handlersAttached = true;
  if (tag === "STT_START") state.onstartAtMs = row.atMs;
  if (tag === "STT_INTERIM") state.interimCount += 1;
  if (tag === "STT_FINAL") state.finalCount += 1;
  if (tag === "STT_RESULT") state.resultCount += 1;
  if (tag === "STT_ERROR_BENIGN" || tag === "STT_ERROR") {
    state.lastError = String(detail.code || detail.reason || "unknown");
  }

  bindWindowTelemetryExportsV0();
  return row;
}

export function getVoiceSttTelemetrySnapshotV0() {
  const now = Date.now();
  return Object.freeze({
    telemetryInstalled,
    sessionId: state.sessionId,
    lastEvent: state.lastEvent,
    startAtMs: state.startAtMs,
    onstartAtMs: state.onstartAtMs,
    msSinceStart: state.startAtMs ? now - state.startAtMs : 0,
    msToOnstart: state.onstartAtMs && state.startAtMs ? state.onstartAtMs - state.startAtMs : null,
    resultCount: state.resultCount,
    interimCount: state.interimCount,
    finalCount: state.finalCount,
    lastError: state.lastError,
    lang: state.lang,
    continuous: state.continuous,
    keepAlive: state.keepAlive,
    handlersAttached: state.handlersAttached,
    hasOnstart: state.onstartAtMs > 0,
    hasAnyResult: state.resultCount > 0,
    voiceGestureAnchor: getVoiceGestureAnchorSnapshotV0()
  });
}

export function resetVoiceSttTelemetryForTestV0() {
  telemetryInstalled = false;
  state.sessionId = 0;
  state.lastEvent = null;
  state.startAtMs = 0;
  state.onstartAtMs = 0;
  state.resultCount = 0;
  state.interimCount = 0;
  state.finalCount = 0;
  state.lastError = null;
  state.handlersAttached = false;
}
