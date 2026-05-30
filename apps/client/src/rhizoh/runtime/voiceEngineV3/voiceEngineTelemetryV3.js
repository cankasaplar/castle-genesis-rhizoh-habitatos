/**
 * Voice Engine v3 — lightweight telemetry (window.__CASTLE_VOICE__ merge-safe).
 */

import { VOICE_ENGINE_V3_SCHEMA } from "./voiceEngineStateV3.js";
import { refreshCastleVoiceNamespaceV0 } from "../voiceSttTelemetryV0.js";

/** @type {{ events: object[], state: string, sessionId: string | null, atMs: number }} */
const ring = {
  events: [],
  state: "IDLE",
  sessionId: null,
  atMs: 0
};

const RING_MAX = 48;

/**
 * @param {string} type
 * @param {Record<string, unknown>} [detail]
 */
export function emitVoiceEngineTelemetryV3(type, detail = {}) {
  const entry = Object.freeze({
    type: String(type || "unknown"),
    atMs: Date.now(),
    ...detail
  });
  ring.events.push(entry);
  if (ring.events.length > RING_MAX) ring.events.shift();
  ring.atMs = entry.atMs;

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    refreshCastleVoiceNamespaceV0();
  }

  try {
    console.info(`[VOICE_V3] ${entry.type}`, detail);
  } catch {
    /* noop */
  }
  return entry;
}

/** @param {string} state @param {string} [sessionId] */
export function setVoiceEngineStateV3(state, sessionId) {
  ring.state = String(state || "IDLE");
  if (sessionId !== undefined) ring.sessionId = sessionId ? String(sessionId) : null;
  emitVoiceEngineTelemetryV3("STATE", { state: ring.state, sessionId: ring.sessionId });
}

export function getVoiceEngineTelemetrySnapshotV3() {
  return Object.freeze({
    schema: VOICE_ENGINE_V3_SCHEMA,
    state: ring.state,
    sessionId: ring.sessionId,
    events: [...ring.events],
    atMs: ring.atMs
  });
}

export function resetVoiceEngineTelemetryForTestV3() {
  ring.events.length = 0;
  ring.state = "IDLE";
  ring.sessionId = null;
  ring.atMs = 0;
}
