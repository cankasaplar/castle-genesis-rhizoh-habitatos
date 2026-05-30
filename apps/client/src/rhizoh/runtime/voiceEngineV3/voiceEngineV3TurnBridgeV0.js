import { createVoiceEngineOrchestratorV3 } from "./voiceEngineOrchestratorV3.js";
import { isVoiceEngineV3EnabledV0 } from "./isVoiceEngineV3EnabledV0.js";
import { VOICE_ENGINE_STATE_V3 } from "./voiceEngineStateV3.js";
import { noteVoiceSttEventV0 } from "../voiceSttTelemetryV0.js";
import { logVoiceInfoV0, logVoiceWarnV0 } from "../rhizohProductionLogNamespacesV0.js";
import { stampVoiceUserGestureV0 } from "../voiceUserGestureAnchorV0.js";
import { handleRhizohVoiceTranscriptV0 } from "../rhizohVoiceLlmDispatchV0.js";
export const VOICE_V3_MAX_RECORD_MS = 8000;

let v3SessionLockActive = false;
let v3LastStartedSessionId = null;
let v3StopInFlight = null;
let v3LastEmptyRetryAtMs = 0;

const V3_EMPTY_RETRY_DEBOUNCE_MS = 1400;

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
  "whisper_default_conf",
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

  function abortTurn() {
    const sessionId = refs.voiceEngineV3.current?.sessionId;
    clearMaxRecordTimer();
    refs.voiceEngineV3.current?.abort?.();
    refs.voiceEngineV3.current = null;
    refs.voiceSttStartInFlight.current = false;
    releaseSessionLock(sessionId);
    callbacks.setMicListening(false);
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

    if (result.ok && result.merged?.text) {
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
      const transcriptOpts = {
        manageVoiceTurn: keepAlive,
        source: "mic_v3",
        confidence: result.merged.confidence,
        strategy: result.merged.strategy,
        maxRms: result.maxRms,
        witnessed: result.witnessed,
        witnessCompleted: true
      };
      const handler = callbacks.handleVoiceTranscriptRef?.current;
      if (typeof handler === "function") {
        await handler(result.merged.text, transcriptOpts);
      } else {
        await handleRhizohVoiceTranscriptV0(result.merged.text, transcriptOpts);
      }
      return { ok: true };
    }

    const err = String(result.error || "transcribe_failed");
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

    if (err === "session_not_idle") {
      callbacks.setRhizohFieldState("IDLE");
      return { ok: false, error: err };
    }

    logVoiceWarnV0("V3_TRANSCRIBE_FAIL", { error: err });
    callbacks.setRhizohFieldState("IDLE");
    return { ok: false, error: err };
  }

  async function startTurn(keepAlive = false) {
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
    callbacks.setRhizohFieldState("LISTENING");
    callbacks.setMicListening(true);
    noteVoiceSttEventV0("V3_SESSION_BEGIN", { keepAlive });
    logVoiceInfoV0("V3_SESSION_BEGIN", { keepAlive });

    const engine = createVoiceEngineOrchestratorV3({
      onError: ({ code }) => {
        if (RETRYABLE_EMPTY_CODES.has(String(code || ""))) return;
        logVoiceWarnV0("V3_ERROR", { code });
      }
    });

    if (engine.sessionId === v3LastStartedSessionId && v3SessionLockActive) {
      logVoiceWarnV0("V3_DUPLICATE_SESSION", { sessionId: engine.sessionId });
      refs.voiceSttStartInFlight.current = false;
      callbacks.setMicListening(false);
      callbacks.setRhizohFieldState("IDLE");
      return { ok: false, error: "duplicate_session", sessionId: engine.sessionId };
    }

    v3SessionLockActive = true;
    v3LastStartedSessionId = engine.sessionId;
    refs.voiceEngineV3.current = engine;
    stampVoiceUserGestureV0("v3_session_begin");

    const startRes = await engine.start();
    if (!startRes.ok) {
      abortTurn();
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
