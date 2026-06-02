/**
 * Voice stream lifecycle controller v1.1 — hard sync with castle layer resolver.
 * Pre-stream layer lock: deny capture before RECORDING if scope/L2 rejects.
 * @see docs/RHIZOH_CASTLE_LAYERS_EVOLUTION_PIPELINE_V1.md
 */

import { castleLayerDecisionTraceLogDetailV1 } from "./castleLayerDecisionTraceV1.js";
import { evaluateCastleLayerVoiceExecutionV1 } from "./castleLayerVoiceExecutionGateV1.js";
import { witnessVoiceStreamLifecycleV0 } from "../../rhizoh/runtime/voiceTranscriptWitnessPipelineV0.js";

export const VOICE_STREAM_LIFECYCLE_CONTROLLER_SCHEMA_V1 = "castle.voice_stream_lifecycle.v1";

/** Normalized abort / release reasons (layer ↔ stream causal chain). */
export const VOICE_STREAM_ABORT_REASON_V1 = Object.freeze({
  LAYER_STREAM_DENIED: "layer_stream_denied",
  USER_LOOP_STOP: "user_loop_stop",
  CAPTURE_START_FAILED: "capture_start_failed",
  LIFECYCLE_ABORT: "lifecycle_abort",
  FINISH_OK: "finish_ok",
  TAB_HIDDEN: "tab_hidden"
});

/** @type {null | { lockId: string, sessionId: string | null, traceId: string, voiceContext: object, atMs: number }} */
let activeStreamLock = null;

/** @type {ReturnType<typeof evaluateCastleLayerVoiceExecutionV1> | null} */
let lastStreamGate = null;

function publishStreamLockSnapshot() {
  if (typeof window === "undefined") return;
  window.__CASTLE_VOICE_STREAM_LOCK__ = Object.freeze({
    schema: VOICE_STREAM_LIFECYCLE_CONTROLLER_SCHEMA_V1,
    active: activeStreamLock,
    lastGate: lastStreamGate
      ? {
          allowExecution: lastStreamGate.allowExecution,
          outcome: lastStreamGate.outcome,
          traceId: lastStreamGate.trace?.traceId
        }
      : null
  });
}

/**
 * Pre-stream gate — must pass before MediaRecorder starts.
 * @param {{ eventTag?: string, source?: string, uiDomain?: string }} [input]
 */
export function evaluateVoiceStreamLayerStartV1(input = {}) {
  const gate = evaluateCastleLayerVoiceExecutionV1({
    eventTag: input.eventTag || "VOICE_V3_SESSION_BEGIN",
    source: input.source || "mic_v3",
    uiDomain: input.uiDomain,
    eligibility: {
      hasText: true,
      scopeMatch: true,
      sanityAccepted: true,
      routerAccepted: true,
      commitmentAllowed: true,
      dedupOk: true
    }
  });
  lastStreamGate = gate;
  publishStreamLockSnapshot();
  return gate;
}

/**
 * Acquire pre-stream layer lock. Returns { acquired: false } before any capture.
 * @param {{ sessionId?: string, source?: string, uiDomain?: string }} [input]
 */
export function acquireVoiceStreamLayerLockV1(input = {}) {
  if (activeStreamLock) {
    return Object.freeze({
      acquired: false,
      error: "stream_lock_held",
      lock: activeStreamLock
    });
  }

  const gate = evaluateVoiceStreamLayerStartV1(input);
  if (!gate.allowExecution) {
    witnessVoiceStreamLifecycleV0({
      code: VOICE_STREAM_ABORT_REASON_V1.LAYER_STREAM_DENIED,
      stage: "pre_stream_gate",
      source: input.source || "mic_v3",
      detail: {
        layerSynced: true,
        outcome: gate.outcome,
        scopeDrop: gate.scopeDrop,
        ...castleLayerDecisionTraceLogDetailV1(gate.trace)
      }
    });
    return Object.freeze({ acquired: false, gate, error: "layer_stream_denied" });
  }

  activeStreamLock = Object.freeze({
    lockId: `vsl_${Date.now().toString(36)}`,
    sessionId: input.sessionId ? String(input.sessionId) : null,
    traceId: gate.trace.traceId,
    voiceContext: gate.voiceContext,
    atMs: Date.now()
  });
  publishStreamLockSnapshot();
  return Object.freeze({ acquired: true, lock: activeStreamLock, gate });
}

/** @param {string} sessionId */
export function bindVoiceStreamLayerLockSessionV1(sessionId) {
  if (!activeStreamLock || !sessionId) return activeStreamLock;
  activeStreamLock = Object.freeze({
    ...activeStreamLock,
    sessionId: String(sessionId)
  });
  publishStreamLockSnapshot();
  return activeStreamLock;
}

/**
 * Normalized stream abort — layer lock released with causal reason.
 * @param {string} reason @param {Record<string, unknown>} [detail]
 */
export function releaseVoiceStreamLayerLockV1(reason, detail = {}) {
  const lock = activeStreamLock;
  const code = String(reason || VOICE_STREAM_ABORT_REASON_V1.LIFECYCLE_ABORT);
  if (code !== VOICE_STREAM_ABORT_REASON_V1.FINISH_OK) {
    witnessVoiceStreamLifecycleV0({
      code,
      stage: "stream_lifecycle",
      source: String(detail.source || "mic_v3"),
      detail: {
        layerSynced: true,
        lockId: lock?.lockId || null,
        sessionId: lock?.sessionId || detail.sessionId || null,
        traceId: lock?.traceId || detail.traceId || null,
        ...detail
      }
    });
  }
  activeStreamLock = null;
  publishStreamLockSnapshot();
  return Object.freeze({ released: true, reason: code, lockId: lock?.lockId || null });
}

export function getVoiceStreamLayerLockSnapshotV1() {
  return Object.freeze({
    active: activeStreamLock,
    lastGate: lastStreamGate
  });
}

export function resetVoiceStreamLayerLockForTestV1() {
  activeStreamLock = null;
  lastStreamGate = null;
  if (typeof window !== "undefined") {
    delete window.__CASTLE_VOICE_STREAM_LOCK__;
  }
}
