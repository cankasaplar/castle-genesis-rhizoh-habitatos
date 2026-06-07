import { createVoiceEngineOrchestratorV3 } from "./voiceEngineOrchestratorV3.js";
import { isVoiceEngineV3EnabledV0 } from "./isVoiceEngineV3EnabledV0.js";
import { VOICE_ENGINE_STATE_V3 } from "./voiceEngineStateV3.js";
import { noteVoiceSttEventV0 } from "../voiceSttTelemetryV0.js";
import { logVoiceInfoV0, logVoiceWarnV0 } from "../rhizohProductionLogNamespacesV0.js";
import { emitRhizohSttHeardSurfaceV1 } from "../../experience/rhizohLivingConversationSurfaceV1.js";
import { stampVoiceUserGestureV0 } from "../voiceUserGestureAnchorV0.js";
import { endVoiceSessionLanguageLockV0 } from "../rhizohConversationLanguageV0.js";
import { endOriginConfidenceEmaSessionV0 } from "../rhizohSttOriginConfidenceEmaV0.js";
import { handleRhizohVoiceTranscriptV0 } from "../rhizohVoiceLlmDispatchV0.js";
import { castleLayerDecisionTraceLogDetailV1 } from "../../../castle/layers/castleLayerDecisionTraceV1.js";
import {
  acquireVoiceStreamLayerLockV1,
  bindVoiceStreamLayerLockSessionV1,
  releaseVoiceStreamLayerLockV1,
  VOICE_STREAM_ABORT_REASON_V1
} from "../../../castle/layers/voiceStreamLifecycleControllerV1.js";
import { deferRecordingUntilGatewayWarmV1 } from "../voiceTranscribePredictivePreflightV1.js";
import { emitVoiceEngineTelemetryV3 } from "./voiceEngineTelemetryV3.js";
import {
  VOICE_EXEC_MODE_V0,
  VOICE_SPEAK_MODE_V0
} from "../rhizohVoiceDualPathRouterV0.js";
import {
  publishConversationAuthorityDebugV0,
  resolveConversationAuthorityV0
} from "../rhizohVoiceConversationAuthorityV0.js";
import { noteMicListeningContinuityV0 } from "../rhizohContinuityKernelV0.js";
import { emitMicListenPrimitiveV1 } from "../rhizohPresencePrimitiveV1.js";
export const VOICE_V3_MAX_RECORD_MS = 8000;

let v3SessionLockActive = false;
let v3LastStartedSessionId = null;
let v3StopInFlight = null;
let v3LastEmptyRetryAtMs = 0;

const RETRYABLE_NETWORK_CODES = new Set([
  "transcribe_network",
  "fetch_timeout",
  "fetch_failed",
  "http_502",
  "http_503",
  "http_504",
  "http_429"
]);

let v3LastNetworkRetryAtMs = 0;
const V3_EMPTY_RETRY_DEBOUNCE_MS = 1400;
const V3_NETWORK_RETRY_DEBOUNCE_MS = 2200;

const RETRYABLE_EMPTY_CODES = new Set([
  "no_speech",
  "no_transcript",
  "too_short",
  "recording_too_short",
  "audio_too_small",
  "audio_silent",
  "low_confidence",
  "whisper_artifact",
  "repeated_hallucination",
  "internal_repetition",
  "empty"
]);

function emptyPromptKey(error) {
  if (error === "recording_too_short" || error === "audio_too_small") return "retry";
  if (error === "audio_silent") return "silent";
  if (error === "low_confidence" || error === "whisper_artifact" || error === "repeated_hallucination") {
    return "low_confidence";
  }
  return "empty";
}

/**
 * @param {{
 *   refs: {
 *     voiceEngineV3: { current: ReturnType<typeof createVoiceEngineOrchestratorV3> | null },
 *     voiceSttStartInFlight: { current: boolean },
 *     voiceSttMaxRecordTimer: { current: number },
 *     voiceSttGotAnyResult: { current: boolean }
 *   },
 *   callbacks: {
 *     setRhizohFieldState: (s: string) => void,
 *     setMicListening: (v: boolean) => void,
 *     handleVoiceTranscriptRef: { current: (text: string, opts: object) => Promise<void> },
 *     scheduleVoiceMicRestart: (keepAlive: boolean, opts?: object) => void,
 *     restartVoiceTurnV3?: (keepAlive: boolean) => void,
 *     urgentStart?: boolean
 *   }
 *     maybeWarnVoiceSilentStop: (key: string) => void,
 *     speakRhizoh?: (text: string, opts?: object) => void
 *   }
 * }} ctx
 */
export function createVoiceEngineV3TurnBridgeV0(ctx) {
  const { refs, callbacks } = ctx;

  function clearMaxRecordTimer() {
    if (refs.voiceSttMaxRecordTimer.current) {
      window.clearTimeout(refs.voiceSttMaxRecordTimer.current);
      refs.voiceSttMaxRecordTimer.current = 0;
    }
  }

  function releaseSessionLock(sessionId) {
    if (!sessionId || v3LastStartedSessionId === sessionId) {
      v3SessionLockActive = false;
    }
  }

  function abortTurn(reason = VOICE_STREAM_ABORT_REASON_V1.LIFECYCLE_ABORT, detail = {}) {
    const sessionId = refs.voiceEngineV3.current?.sessionId;
    clearMaxRecordTimer();
    refs.voiceEngineV3.current?.abort?.({ reason, layerSynced: true, ...detail });
    refs.voiceEngineV3.current = null;
    refs.voiceSttStartInFlight.current = false;
    releaseSessionLock(sessionId);
    endVoiceSessionLanguageLockV0();
    endOriginConfidenceEmaSessionV0();
    callbacks.setMicListening(false);
    releaseVoiceStreamLayerLockV1(reason, { sessionId, source: "mic_v3", ...detail });
  }

  async function finishTurn(keepAlive) {
    if (v3StopInFlight) {
      return v3StopInFlight;
    }
    const engine = refs.voiceEngineV3.current;
    if (!engine) {
      refs.voiceSttStartInFlight.current = false;
      v3SessionLockActive = false;
      return { ok: false, error: "no_engine" };
    }
    const sessionId = engine.sessionId;
    clearMaxRecordTimer();
    callbacks.setRhizohFieldState("INTERPRETING");
    callbacks.setMicListening(false);
    noteVoiceSttEventV0("V3_STOP", {});
    logVoiceInfoV0("V3_STOP", { keepAlive });

    v3StopInFlight = engine
      .stop()
      .finally(() => {
        if (v3StopInFlight) v3StopInFlight = null;
      });
    const result = await v3StopInFlight;
    refs.voiceEngineV3.current = null;
    refs.voiceSttStartInFlight.current = false;
    releaseSessionLock(sessionId);
    endVoiceSessionLanguageLockV0();
    endOriginConfidenceEmaSessionV0();

    if (result.ok && result.merged?.text) {
      releaseVoiceStreamLayerLockV1(VOICE_STREAM_ABORT_REASON_V1.FINISH_OK, {
        sessionId,
        source: "mic_v3"
      });
      refs.voiceSttGotAnyResult.current = true;
      noteVoiceSttEventV0("V3_FINAL", {
        chars: result.merged.text.length,
        strategy: result.merged.strategy
      });
      logVoiceInfoV0("V3_FINAL", {
        chars: result.merged.text.length,
        strategy: result.merged.strategy,
        preview: result.merged.text.slice(0, 96)
      });
      const pipelinePath =
        result.decision?.execMode === VOICE_EXEC_MODE_V0.SLOW_LLM
          ? "slow"
          : result.decision?.speakMode === VOICE_SPEAK_MODE_V0.HOLD
            ? "hold"
            : "fast";
      const transcriptOpts = {
        manageVoiceTurn: keepAlive,
        source: "mic_v3",
        confidence: result.merged.confidence,
        strategy: result.merged.strategy,
        maxRms: result.maxRms,
        pipelinePath,
        decision: result.decision,
        sessionId,
        band: result.bandObs?.band,
        witnessed: result.witnessed,
        witnessCompleted: true,
        temporal: result.temporal,
        recordedMs: result.recordedMs
      };

      const authority = resolveConversationAuthorityV0({
        decision: result.decision,
        band: result.bandObs?.band,
        pipelinePath,
        text: result.merged.text
      });
      publishConversationAuthorityDebugV0(authority);
      transcriptOpts.authority = authority;

      if (!authority.maySpeak) {
        logVoiceInfoV0("VOICE_AUTHORITY_SILENT", {
          reason: authority.reason,
          path: authority.path,
          strict: authority.strict,
          preview: result.merged.text.slice(0, 96),
          decisionReason: result.decision?.reason
        });
        if (keepAlive) {
          callbacks.scheduleVoiceMicRestart(keepAlive, {
            context: "v3_authority_silent",
            lastSessionHadResult: refs.voiceSttGotAnyResult.current
          });
        } else {
          callbacks.setRhizohFieldState("IDLE");
        }
        return { ok: true, authoritySilent: true, reason: authority.reason };
      }

      const handler = callbacks.handleVoiceTranscriptRef?.current;
      if (typeof handler === "function") {
        await handler(result.merged.text, transcriptOpts);
      } else {
        await handleRhizohVoiceTranscriptV0(result.merged.text, transcriptOpts);
      }
      return { ok: true };
    }

    if (result.shadowDrop) {
      releaseVoiceStreamLayerLockV1(VOICE_STREAM_ABORT_REASON_V1.FINISH_OK, {
        sessionId,
        source: "mic_v3",
        shadowDrop: true,
        reason: result.error
      });
      const restartCtx = result.preSttDrop ? "v3_pre_stt_drop" : "v3_shadow_drop";
      logVoiceInfoV0("V3_SHADOW_DROP", {
        reason: result.error,
        preview: String(result.merged?.text || "").slice(0, 96),
        dropKind: result.decision?.dropKind,
        restartCtx,
        maxRms: result.maxRms,
        preSttReason: result.preStt?.reason
      });
      emitRhizohSttHeardSurfaceV1({
        text: String(result.merged?.text || ""),
        reason: String(result.error || "shadow_drop"),
        source: "mic_v3",
        executionAccepted: false,
        showTranscript: false,
        tr: typeof document !== "undefined" && document.documentElement?.lang === "tr"
      });
      if (keepAlive) {
        if (
          result.preSttDrop &&
          (result.preStt?.reason === "pre_stt_silent_capture" ||
            result.preStt?.reason === "pre_stt_low_energy") &&
          typeof callbacks.speakRhizoh === "function"
        ) {
          callbacks.speakRhizoh(
            result.preStt?.silentCapture === true
              ? "Mikrofon ses almıyor gibi — kulaklık kullanın veya Windows mikrofon seviyesini yükseltin."
              : "Sesinizi duyamadım — mikrofona biraz daha yakın konuşun.",
            { voiceTurn: true, instantAck: true }
          );
        }
        callbacks.scheduleVoiceMicRestart(keepAlive, {
          context: restartCtx,
          lastSessionHadResult: refs.voiceSttGotAnyResult.current
        });
      } else {
        callbacks.setRhizohFieldState("IDLE");
      }
      return { ok: true, shadowDrop: true, reason: result.error };
    }

    const err = String(result.error || "transcribe_failed");
    releaseVoiceStreamLayerLockV1(
      RETRYABLE_EMPTY_CODES.has(err) ? VOICE_STREAM_ABORT_REASON_V1.FINISH_OK : err,
      { sessionId, source: "mic_v3", error: err }
    );
    if (RETRYABLE_EMPTY_CODES.has(err)) {
      callbacks.maybeWarnVoiceSilentStop(emptyPromptKey(err));
      if (keepAlive) {
        const now = Date.now();
        if (now - v3LastEmptyRetryAtMs < V3_EMPTY_RETRY_DEBOUNCE_MS) {
          logVoiceInfoV0("V3_RETRY_DEBOUNCED", { error: err, ageMs: now - v3LastEmptyRetryAtMs });
          callbacks.setRhizohFieldState("IDLE");
          return { ok: false, error: err, debounced: true };
        }
        v3LastEmptyRetryAtMs = now;
        callbacks.scheduleVoiceMicRestart(keepAlive, {
          context: "v3_empty_retry",
          lastSessionHadResult: refs.voiceSttGotAnyResult.current
        });
      } else {
        callbacks.setRhizohFieldState("IDLE");
      }
      return { ok: false, error: err };
    }

    if (RETRYABLE_NETWORK_CODES.has(err) && keepAlive) {
      const now = Date.now();
      if (now - v3LastNetworkRetryAtMs >= V3_NETWORK_RETRY_DEBOUNCE_MS) {
        v3LastNetworkRetryAtMs = now;
        logVoiceWarnV0("V3_NETWORK_RETRY", { error: err });
        callbacks.speakRhizoh?.("Bağlantı koptu, bir kez daha deniyorum.", {
          voiceTurn: true,
          instantAck: true
        });
        if (typeof callbacks.restartVoiceTurnV3 === "function") {
          callbacks.restartVoiceTurnV3(keepAlive);
        } else {
          callbacks.scheduleVoiceMicRestart(keepAlive, {
            context: "v3_network_retry",
            lastSessionHadResult: refs.voiceSttGotAnyResult.current
          });
        }
        callbacks.setRhizohFieldState("IDLE");
        return { ok: false, error: err, networkRetry: true };
      }
    }

    if (err === "session_not_idle") {
      callbacks.setRhizohFieldState("IDLE");
      return { ok: false, error: err };
    }

    logVoiceWarnV0("V3_TRANSCRIBE_FAIL", { error: err });
    callbacks.setRhizohFieldState("IDLE");
    return { ok: false, error: err };
  }

  async function startTurn(keepAlive = false, startOpts = {}) {
    if (v3StopInFlight) {
      logVoiceWarnV0("V3_START_BLOCKED", { reason: "stop_in_flight" });
      refs.voiceSttStartInFlight.current = false;
      return { ok: false, error: "stop_in_flight" };
    }
    if (v3SessionLockActive) {
      const busyEngine = refs.voiceEngineV3.current;
      logVoiceWarnV0("V3_START_BLOCKED", {
        reason: "session_lock",
        sessionId: busyEngine?.sessionId,
        state: busyEngine?.getState?.()
      });
      refs.voiceSttStartInFlight.current = false;
      return { ok: false, error: "session_lock", state: busyEngine?.getState?.() };
    }

    const existing = refs.voiceEngineV3.current;
    if (existing) {
      const state = existing.getState?.() || VOICE_ENGINE_STATE_V3.IDLE;
      if (state === VOICE_ENGINE_STATE_V3.RECORDING) {
        return finishTurn(keepAlive);
      }
      if (state !== VOICE_ENGINE_STATE_V3.IDLE) {
        refs.voiceSttStartInFlight.current = false;
        logVoiceWarnV0("V3_START_BLOCKED", { state });
        return { ok: false, error: "session_not_idle", state };
      }
    }

    if (existing?.sessionId && existing.sessionId === v3LastStartedSessionId && refs.voiceSttStartInFlight.current) {
      logVoiceWarnV0("V3_DUPLICATE_SESSION", { sessionId: existing.sessionId });
      refs.voiceSttStartInFlight.current = false;
      return { ok: false, error: "duplicate_session", sessionId: existing.sessionId };
    }

    refs.voiceSttGotAnyResult.current = false;

    const lockRes = acquireVoiceStreamLayerLockV1({ source: "mic_v3" });
    if (!lockRes.acquired) {
      refs.voiceSttStartInFlight.current = false;
      callbacks.setMicListening(false);
      callbacks.setRhizohFieldState("IDLE");
      logVoiceWarnV0("V3_LAYER_STREAM_DENIED", {
        error: lockRes.error || "layer_stream_denied",
        ...castleLayerDecisionTraceLogDetailV1(lockRes.gate?.trace)
      });
      return { ok: false, error: lockRes.error || "layer_stream_denied" };
    }

    callbacks.setRhizohFieldState("LISTENING");
    callbacks.setMicListening(true);
    noteMicListeningContinuityV0();
    emitMicListenPrimitiveV1({ traceId: lockRes.gate?.trace?.traceId || lockRes.lock?.lockId });
    noteVoiceSttEventV0("V3_SESSION_BEGIN", { keepAlive });
    logVoiceInfoV0("V3_SESSION_BEGIN", {
      keepAlive,
      streamLockId: lockRes.lock?.lockId,
      ...castleLayerDecisionTraceLogDetailV1(lockRes.gate?.trace)
    });

    const engine = createVoiceEngineOrchestratorV3({
      micDeviceId: startOpts.micDeviceId,
      gatewayPhase: startOpts.gatewayPhase,
      onError: ({ code }) => {
        if (RETRYABLE_EMPTY_CODES.has(String(code || ""))) return;
        logVoiceWarnV0("V3_ERROR", { code });
      }
    });

    if (engine.sessionId === v3LastStartedSessionId && v3SessionLockActive) {
      releaseVoiceStreamLayerLockV1(VOICE_STREAM_ABORT_REASON_V1.LIFECYCLE_ABORT, {
        sessionId: engine.sessionId,
        error: "duplicate_session"
      });
      logVoiceWarnV0("V3_DUPLICATE_SESSION", { sessionId: engine.sessionId });
      refs.voiceSttStartInFlight.current = false;
      callbacks.setMicListening(false);
      callbacks.setRhizohFieldState("IDLE");
      return { ok: false, error: "duplicate_session", sessionId: engine.sessionId };
    }

    v3SessionLockActive = true;
    v3LastStartedSessionId = engine.sessionId;
    refs.voiceEngineV3.current = engine;
    bindVoiceStreamLayerLockSessionV1(engine.sessionId);
    stampVoiceUserGestureV0("v3_session_begin");

    const warmDefer = await deferRecordingUntilGatewayWarmV1({
      urgent: startOpts.urgent === true
    });
    if (warmDefer.deferredMs > 0) {
      logVoiceInfoV0("V3_GATEWAY_WARM_DEFER", {
        deferredMs: warmDefer.deferredMs,
        reason: warmDefer.reason,
        warmScore: warmDefer.warmScore
      });
      emitVoiceEngineTelemetryV3("GATEWAY_WARM_DEFER", warmDefer);
    }

    const startRes = await engine.start();
    if (!startRes.ok) {
      abortTurn(VOICE_STREAM_ABORT_REASON_V1.CAPTURE_START_FAILED, { error: startRes.error });
      callbacks.setRhizohFieldState("IDLE");
      if (startRes.error === "session_not_idle") {
        logVoiceWarnV0("V3_START_BLOCKED", { state: startRes.state });
        return startRes;
      }
      callbacks.maybeWarnVoiceSilentStop("audio");
      return startRes;
    }

    stampVoiceUserGestureV0("v3_recording");
    refs.voiceSttMaxRecordTimer.current = window.setTimeout(() => {
      void finishTurn(keepAlive);
    }, VOICE_V3_MAX_RECORD_MS);

    return { ok: true };
  }

  return Object.freeze({ startTurn, finishTurn, abortTurn, enabled: isVoiceEngineV3EnabledV0 });
}

export { isVoiceEngineV3EnabledV0 };
