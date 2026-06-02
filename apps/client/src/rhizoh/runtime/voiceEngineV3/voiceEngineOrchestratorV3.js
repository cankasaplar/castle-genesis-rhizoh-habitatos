/**
 * Voice Engine v3 — orchestrator (MediaRecorder → transcribe on STOP only).
 */

import { VOICE_ENGINE_STATE_V3 } from "./voiceEngineStateV3.js";
import { createVoiceAudioCaptureV3, VOICE_CAPTURE_CHUNK_MS_V3 } from "./voiceAudioCaptureV3.js";
import { hasVoiceCaptureSpeechEnergyV3 } from "./voiceAudioLevelV3.js";
import { queryRhizohVoiceTranscribeResilientV3 } from "./voiceTranscribeTransportV3.js";
import { resolveVoiceTranscriptV3 } from "./voiceTranscriptMergerV3.js";
import {
  runVoiceTranscriptWitnessPipelineV0,
  witnessVoiceStreamLifecycleV0
} from "../voiceTranscriptWitnessPipelineV0.js";
import {
  beginVoiceSessionLanguageLockV0,
  endVoiceSessionLanguageLockV0,
  readSttLanguageCodeHintV0
} from "../rhizohConversationLanguageV0.js";
import { prepareRhizohLlmTurnV0 } from "../rhizohLlmTurnHotWireV0.js";
import { rescoreVoiceTranscriptAfterMergeV0 } from "../rhizohPostMergeTranscriptRescoreV0.js";
import { emitVoiceEngineTelemetryV3, setVoiceEngineStateV3 } from "./voiceEngineTelemetryV3.js";
import { noteVoiceRuntimePressureV1 } from "../gatewaySessionKeeperV1.js";
import {
  beginRecordingWarmProbeV1,
  finalizeRecordingWarmProbeV1
} from "../voiceTranscribePredictivePreflightV1.js";

export const VOICE_MIN_RECORD_MS_V3 = 1200;
export const VOICE_MIN_AUDIO_BYTES_V3 = 25000;

/**
 * @param {{
 *   languageCode?: string,
 *   traceId?: string,
 *   sessionId?: string,
 *   onFinalTranscript?: (payload: { text: string, confidence: number, source: string, strategy: string }) => void,
 *   onError?: (err: { code: string, detail?: string }) => void
 * }} [opts]
 */
export function createVoiceEngineOrchestratorV3(opts = {}) {
  /** @type {ReturnType<typeof createVoiceAudioCaptureV3> extends Promise<infer T> ? T : never | null} */
  let capture = null;
  let mimeType = "audio/webm";
  let busy = false;
  let generation = 0;
  let sessionState = VOICE_ENGINE_STATE_V3.IDLE;
  let recordStartAtMs = 0;

  const sessionId = opts.sessionId || `v3_${Date.now().toString(36)}`;
  beginVoiceSessionLanguageLockV0({ sessionId, locale: opts.locale });
  const languageCode = opts.languageCode || readSttLanguageCodeHintV0();

  setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.IDLE, sessionId);

  function setSessionState(next) {
    sessionState = String(next || VOICE_ENGINE_STATE_V3.IDLE);
    setVoiceEngineStateV3(sessionState, sessionId);
    noteVoiceRuntimePressureV1(
      sessionState === VOICE_ENGINE_STATE_V3.RECORDING ||
        sessionState === VOICE_ENGINE_STATE_V3.WAIT_WHISPER_FINAL
    );
  }

  return Object.freeze({
    sessionId,
    isBusy: () => busy,
    getState: () => sessionState,

    async start() {
      if (sessionState !== VOICE_ENGINE_STATE_V3.IDLE) {
        emitVoiceEngineTelemetryV3("START_BLOCKED", { state: sessionState });
        return { ok: false, error: "session_not_idle", state: sessionState };
      }
      if (busy) return { ok: false, error: "engine_busy" };

      generation += 1;
      busy = true;
      recordStartAtMs = Date.now();

      try {
        capture = await createVoiceAudioCaptureV3({
          timesliceMs: VOICE_CAPTURE_CHUNK_MS_V3,
          onError: (err) => {
            opts.onError?.({ code: "capture_error", detail: String(err?.message || err) });
          }
        });
        mimeType = capture.mimeType;
        capture.start();
        beginRecordingWarmProbeV1(sessionId);
        setSessionState(VOICE_ENGINE_STATE_V3.RECORDING);
        emitVoiceEngineTelemetryV3("RECORDING_START", { mimeType });
        return { ok: true };
      } catch (e) {
        busy = false;
        setSessionState(VOICE_ENGINE_STATE_V3.ERROR);
        const code = String(e?.message || "capture_start_failed");
        opts.onError?.({ code });
        setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
        return { ok: false, error: code };
      }
    },

    async stop() {
      const activeGen = generation;
      if (!capture) {
        busy = false;
        setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
        return { ok: false, error: "not_recording" };
      }

      setSessionState(VOICE_ENGINE_STATE_V3.WAIT_WHISPER_FINAL);
      emitVoiceEngineTelemetryV3("RECORDING_STOP");

      let fullBlob;
      /** @type {Blob[]} */
      let captureChunks = [];
      let maxRms = 0;
      try {
        maxRms = capture?.getMaxRms?.() ?? 0;
        const captureResult = await capture.stop();
        fullBlob = captureResult?.blob || captureResult;
        captureChunks = Array.isArray(captureResult?.chunks) ? captureResult.chunks : [];
      } catch (e) {
        busy = false;
        setSessionState(VOICE_ENGINE_STATE_V3.ERROR);
        opts.onError?.({ code: "capture_stop_failed", detail: String(e?.message || e) });
        setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
        return { ok: false, error: "capture_stop_failed" };
      }
      capture = null;

      const recordedMs = Math.max(0, Date.now() - recordStartAtMs);
      const bytes = fullBlob?.size || 0;

      if (recordedMs < VOICE_MIN_RECORD_MS_V3) {
        busy = false;
        setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
        witnessVoiceStreamLifecycleV0({
          code: "recording_too_short",
          stage: "transcribe_skip",
          source: "mic_v3",
          detail: { recordedMs, bytes }
        });
        emitVoiceEngineTelemetryV3("TRANSCRIBE_SKIP", { reason: "recording_too_short", recordedMs, bytes });
        opts.onError?.({ code: "recording_too_short", detail: String(recordedMs) });
        return { ok: false, error: "recording_too_short", recordedMs };
      }

      if (!fullBlob || bytes < VOICE_MIN_AUDIO_BYTES_V3) {
        busy = false;
        setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
        emitVoiceEngineTelemetryV3("TRANSCRIBE_WAIT", { reason: "audio_too_small", recordedMs, bytes });
        opts.onError?.({ code: "audio_too_small", detail: String(bytes) });
        return { ok: false, error: "audio_too_small", bytes, recordedMs };
      }

      if (!hasVoiceCaptureSpeechEnergyV3(maxRms)) {
        busy = false;
        setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
        witnessVoiceStreamLifecycleV0({
          code: "audio_silent",
          stage: "transcribe_skip",
          source: "mic_v3",
          detail: { recordedMs, bytes, maxRms }
        });
        emitVoiceEngineTelemetryV3("TRANSCRIBE_SKIP", { reason: "audio_silent", recordedMs, bytes, maxRms });
        opts.onError?.({ code: "audio_silent", detail: String(maxRms) });
        return { ok: false, error: "audio_silent", maxRms, recordedMs };
      }

      if (activeGen !== generation) {
        busy = false;
        setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
        return { ok: false, error: "stale_session" };
      }

      setSessionState(VOICE_ENGINE_STATE_V3.FINAL_TRANSCRIPT_RESOLVE);
      const warmProbe = finalizeRecordingWarmProbeV1(sessionId);
      emitVoiceEngineTelemetryV3("FINAL_TRANSCRIBE_START", {
        bytes,
        recordedMs,
        chunkCount: captureChunks.length,
        warmScore: warmProbe.avgWarmScore,
        minWarmScore: warmProbe.minWarmScore
      });

      try {
        const res = await queryRhizohVoiceTranscribeResilientV3(fullBlob, {
          mimeType,
          languageCode,
          traceId: opts.traceId,
          sessionId,
          bytes,
          recordedMs,
          chunks: captureChunks,
          chunkCount: captureChunks.length,
          warmProbe
        });

        if (activeGen !== generation) {
          busy = false;
          setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
          return { ok: false, error: "stale_session" };
        }

        if (!res.ok) {
          busy = false;
          setSessionState(VOICE_ENGINE_STATE_V3.ERROR);
          const failCode = res.error || "transcribe_failed";
          opts.onError?.({ code: failCode, detail: res.detail ? String(res.detail) : undefined });
          setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
          return { ok: false, error: failCode, transportAttempt: res.transportAttempt };
        }

        const merged = res.merged || resolveVoiceTranscriptV3(res.google || res.fast, res.whisper);
        const rescored = rescoreVoiceTranscriptAfterMergeV0({
          text: merged.text,
          confidence: merged.confidence,
          strategy: merged.strategy,
          languageHint: readSttLanguageCodeHintV0()
        });
        const pipe = runVoiceTranscriptWitnessPipelineV0({
          text: rescored.text,
          confidence: rescored.confidence ?? merged.confidence,
          strategy: merged.strategy,
          source: "mic_v3",
          maxRms,
          recordedMs,
          stage: "v3_orchestrator_raw",
          checkRepeat: false,
          runTurnGate: false,
          shadowForwardOnReject: true,
          sttLanguageHint: rescored.languageHint,
          vepmConfidence: rescored.vepmConfidence,
          phantomLikely: rescored.phantomLikely,
          postMergeRescore: rescored
        });

        if (!pipe.route?.executionAccepted) {
          busy = false;
          setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
          const shadowDrop =
            pipe.sane?.shadowForward === true ||
            pipe.sane?.softScriptMismatch === true ||
            pipe.route?.observationForward === true;
          emitVoiceEngineTelemetryV3(
            shadowDrop ? "FINAL_TRANSCRIPT_SHADOW_DROP" : "FINAL_TRANSCRIPT_REJECT",
            {
              reason: pipe.sane.reason,
              preview: String(pipe.sane.text || rescored.text).slice(0, 96),
              confidence: pipe.sane.confidence,
              band: pipe.witnessed.observation.band,
              phantomLikely: rescored.phantomLikely === true,
              vepmLowConfidence: rescored.vepmLowConfidence === true
            }
          );
          if (!shadowDrop) {
            opts.onError?.({ code: pipe.sane.reason || "no_transcript" });
          }
          return {
            ok: false,
            error: pipe.sane.reason || "no_transcript",
            shadowDrop,
            merged,
            rescored,
            sane: pipe.sane,
            witnessed: pipe.witnessed
          };
        }

        prepareRhizohLlmTurnV0({
          message: pipe.sane.text,
          traceId: opts.traceId,
          sessionId,
          voiceTurn: true,
          speakInstantAck: false,
          sourcePath: "voice_engine_v3"
        });

        opts.onFinalTranscript?.({
          text: pipe.sane.text,
          confidence: merged.confidence,
          source: merged.source,
          strategy: merged.strategy,
          witnessed: pipe.witnessed
        });
        emitVoiceEngineTelemetryV3("FINAL_TRANSCRIPT", {
          text: pipe.sane.text.slice(0, 160),
          strategy: merged.strategy,
          confidence: merged.confidence,
          band: pipe.witnessed.observation.band
        });
        busy = false;
        setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
        return {
          ok: true,
          merged: { ...merged, text: pipe.sane.text },
          google: res.google,
          whisper: res.whisper,
          maxRms,
          witnessed: pipe.witnessed,
          temporal: pipe.temporal
        };
      } catch (e) {
        busy = false;
        setSessionState(VOICE_ENGINE_STATE_V3.ERROR);
        const detail = String(e?.message || e);
        opts.onError?.({ code: "transcribe_network", detail });
        setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
        return { ok: false, error: "transcribe_network", detail };
      }
    },

    abort(opts = {}) {
      generation += 1;
      capture?.abort?.();
      capture = null;
      busy = false;
      endVoiceSessionLanguageLockV0();
      setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
      const reason = String(opts.reason || "abort");
      if (!opts.layerSynced) {
        witnessVoiceStreamLifecycleV0({
          code: reason,
          stage: "stream_lifecycle",
          source: "mic_v3",
          detail: opts.detail || null
        });
      }
      emitVoiceEngineTelemetryV3("ABORT", { reason });
    }
  });
}
