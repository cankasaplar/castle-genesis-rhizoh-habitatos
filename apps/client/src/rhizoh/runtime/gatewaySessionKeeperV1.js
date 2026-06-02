/**
 * Gateway session keeper v1 — session continuity over transient HTTP health misses.
 * Defers heartbeat during voice pressure; exponential reconnect backoff; idle-scheduled polls.
 * @see docs/RHIZOH_RUNTIME_FRAME_CORRELATION_V0.md
 */

import { computeGatewayFlapPressure, recordGatewayPhaseForTimeline } from "./runtimeFrameCorrelationV0.js";
import { getVoiceEngineTelemetrySnapshotV3 } from "./voiceEngineV3/voiceEngineTelemetryV3.js";

export const GATEWAY_SESSION_KEEPER_SCHEMA_V1 = "castle.gateway_session_keeper.v1";

const VOICE_BUSY_STATES = new Set(["RECORDING", "WAIT_WHISPER_FINAL"]);

/** @type {{
 *   connectionId: string | null,
 *   lastHealthOkAt: number,
 *   lastPhase: string | null,
 *   reconnectAttempts: number,
 *   deferredTicks: number,
 *   voicePressure: boolean
 * }} */
let session = {
  connectionId: null,
  lastHealthOkAt: 0,
  lastPhase: null,
  reconnectAttempts: 0,
  deferredTicks: 0,
  voicePressure: false
};

function publishSessionKeeperSnapshot(extra = {}) {
  if (typeof window === "undefined") return;
  try {
    window.__CASTLE_GATEWAY_SESSION_KEEPER__ = Object.freeze({
      schema: GATEWAY_SESSION_KEEPER_SCHEMA_V1,
      connectionId: session.connectionId,
      lastHealthOkAt: session.lastHealthOkAt,
      lastPhase: session.lastPhase,
      reconnectAttempts: session.reconnectAttempts,
      deferredTicks: session.deferredTicks,
      voicePressure: session.voicePressure,
      sessionStable: isGatewaySessionStableV1(),
      atMs: Date.now(),
      ...extra
    });
  } catch {
    /* noop */
  }
}

export function isVoiceRuntimePressureActiveV1() {
  if (session.voicePressure) return true;
  try {
    const snap = getVoiceEngineTelemetrySnapshotV3();
    return VOICE_BUSY_STATES.has(String(snap?.state || ""));
  } catch {
    return false;
  }
}

/** @param {boolean} active */
export function noteVoiceRuntimePressureV1(active) {
  session.voicePressure = active === true;
  publishSessionKeeperSnapshot();
}

export function isGatewaySessionStableV1() {
  return session.lastHealthOkAt > 0 && Date.now() - session.lastHealthOkAt < 90_000;
}

/**
 * @param {{ connectionId?: string | null, atMs?: number }} [input]
 */
export function noteGatewaySessionHealthOkV1(input = {}) {
  session.lastHealthOkAt = Number(input.atMs) > 0 ? Number(input.atMs) : Date.now();
  session.reconnectAttempts = 0;
  if (input.connectionId) session.connectionId = String(input.connectionId);
  publishSessionKeeperSnapshot({ lastStatus: "health_ok" });
}

/**
 * @param {string} phase
 * @param {Record<string, unknown>} [detail]
 */
export function noteGatewayPhaseTransitionV1(phase, detail = {}) {
  const next = String(phase || "");
  const prev = session.lastPhase;
  session.lastPhase = next;
  if (/offline|offline_dns/.test(next) && prev && !/offline|offline_dns/.test(prev)) {
    session.reconnectAttempts += 1;
  }
  if (next === "connected" || next === "uncertain") {
    recordGatewayPhaseForTimeline(next, detail);
  }
  publishSessionKeeperSnapshot({ previousPhase: prev });
}

export function noteGatewayReconnectRequestedV1() {
  session.reconnectAttempts += 1;
  publishSessionKeeperSnapshot({ lastStatus: "reconnect_requested" });
}

/** Defer HTTP health while voice capture/transcribe saturates the main thread. */
export function shouldDeferGatewayHealthTickV1() {
  return isVoiceRuntimePressureActiveV1();
}

/** @param {number} [baseMs] */
export function computeGatewayHeartbeatDelayV1(baseMs = 12_000) {
  const flap = computeGatewayFlapPressure();
  let delay = baseMs + flap.suggestedPollExtraMs + Math.floor(Math.random() * 2200);
  if (shouldDeferGatewayHealthTickV1()) delay += 8_000;
  delay += Math.min(30_000, session.reconnectAttempts * 4_000);
  return delay;
}

export function getGatewayOfflineDebounceThresholdV1() {
  const stable = isGatewaySessionStableV1();
  if (shouldDeferGatewayHealthTickV1()) return stable ? 4 : 3;
  return stable ? 3 : 2;
}

export function shouldPreserveSessionOnTransientFailureV1() {
  return isGatewaySessionStableV1();
}

/** @param {number} attemptIndex */
export function getGatewayReconnectBackoffMsV1(attemptIndex = 1) {
  const exp = Math.min(24_000, 1_200 * 2 ** Math.max(0, attemptIndex - 1));
  return exp + Math.min(12_000, session.reconnectAttempts * 800);
}

/**
 * Schedule work off the hot path — idle first, hard timeout fallback.
 * @param {() => void} fn
 * @param {{ timeoutMs?: number }} [opts]
 */
export function scheduleGatewayHeartbeatTaskV1(fn, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs) > 0 ? Number(opts.timeoutMs) : 3_500;
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => fn(), { timeout: timeoutMs });
    return;
  }
  window.setTimeout(fn, 0);
}

export function noteGatewayHealthTickDeferredV1() {
  session.deferredTicks += 1;
  publishSessionKeeperSnapshot({ lastStatus: "deferred_voice_pressure" });
}

export function getGatewaySessionKeeperSnapshotV1() {
  return Object.freeze({
    connectionId: session.connectionId,
    lastHealthOkAt: session.lastHealthOkAt,
    lastPhase: session.lastPhase,
    reconnectAttempts: session.reconnectAttempts,
    deferredTicks: session.deferredTicks,
    voicePressure: session.voicePressure,
    sessionStable: isGatewaySessionStableV1()
  });
}

/** @internal vitest */
export function resetGatewaySessionKeeperForTestV1() {
  session = {
    connectionId: null,
    lastHealthOkAt: 0,
    lastPhase: null,
    reconnectAttempts: 0,
    deferredTicks: 0,
    voicePressure: false
  };
  if (typeof window !== "undefined") {
    delete window.__CASTLE_GATEWAY_SESSION_KEEPER__;
  }
}

if (typeof window !== "undefined") {
  publishSessionKeeperSnapshot({ lastStatus: "boot" });
}
