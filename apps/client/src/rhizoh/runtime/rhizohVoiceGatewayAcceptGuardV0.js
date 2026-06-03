/**
 * FILTER 3 — Gateway state guard for voice transcribe + transcript accept.
 */

import {
  getGatewaySessionKeeperSnapshotV1,
  isGatewaySessionStableV1
} from "./gatewaySessionKeeperV1.js";
import { getActiveTranscribeVoiceSessionIdV1 } from "./voiceTranscribeSessionCoordinatorV1.js";

export const RHIZOH_VOICE_GATEWAY_ACCEPT_GUARD_SCHEMA_V0 =
  "castle.rhizoh.voice_gateway_accept_guard.v0";

const OFFLINE_PHASES_V0 = new Set(["offline", "offline_dns"]);

/**
 * @param {string} [phase]
 */
export function isGatewayPhaseOfflineV0(phase) {
  return OFFLINE_PHASES_V0.has(String(phase || "").trim());
}

/**
 * Before STT upload — skip transcribe when gateway cannot accept work.
 * @param {{ gatewayPhase?: string, sessionId?: string }} [opts]
 */
export function evaluateVoiceGatewayTranscribeGuardV0(opts = {}) {
  const snap = getGatewaySessionKeeperSnapshotV1();
  const phase = String(opts.gatewayPhase || snap.lastPhase || "");
  if (isGatewayPhaseOfflineV0(phase)) {
    return Object.freeze({
      schema: RHIZOH_VOICE_GATEWAY_ACCEPT_GUARD_SCHEMA_V0,
      allowTranscribe: false,
      allowAccept: false,
      reason: "gateway_offline",
      phase
    });
  }
  if (!isGatewaySessionStableV1()) {
    return Object.freeze({
      schema: RHIZOH_VOICE_GATEWAY_ACCEPT_GUARD_SCHEMA_V0,
      allowTranscribe: false,
      allowAccept: false,
      reason: "gateway_unstable",
      phase
    });
  }
  return Object.freeze({
    schema: RHIZOH_VOICE_GATEWAY_ACCEPT_GUARD_SCHEMA_V0,
    allowTranscribe: true,
    allowAccept: true,
    reason: "gateway_ok",
    phase
  });
}

/**
 * After STT — accept transcript only if gateway online + session still matches.
 * @param {{ gatewayPhase?: string, sessionId?: string, transcribeSessionId?: string }} [opts]
 */
export function evaluateVoiceTranscriptAcceptGuardV0(opts = {}) {
  const base = evaluateVoiceGatewayTranscribeGuardV0(opts);
  if (!base.allowAccept) return base;

  const voiceSessionId = String(opts.sessionId || "").trim();
  const activeVoice = getActiveTranscribeVoiceSessionIdV1();
  if (activeVoice && voiceSessionId && activeVoice !== voiceSessionId) {
    return Object.freeze({
      schema: RHIZOH_VOICE_GATEWAY_ACCEPT_GUARD_SCHEMA_V0,
      allowTranscribe: false,
      allowAccept: false,
      reason: "session_mismatch",
      activeVoiceSessionId: activeVoice,
      requestedSessionId: voiceSessionId
    });
  }

  return base;
}

/**
 * @param {ReturnType<typeof evaluateVoiceGatewayTranscribeGuardV0>} guard
 */
export function publishVoiceGatewayAcceptGuardDebugV0(guard) {
  if (typeof window === "undefined" || !guard) return;
  try {
    window.__CASTLE_RHIZOH_VOICE_GATEWAY_GUARD__ = Object.freeze({
      ...guard,
      atMs: Date.now()
    });
  } catch {
    /* noop */
  }
}
