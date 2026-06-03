/**
 * Voice Engine v3 — orchestrator (MediaRecorder → transcribe on STOP only).
 */

import { VOICE_ENGINE_STATE_V3 } from "./voiceEngineStateV3.js";
import { createVoiceAudioCaptureV3, VOICE_CAPTURE_CHUNK_MS_V3 } from "./voiceAudioCaptureV3.js";
import { hasVoiceCaptureSpeechEnergyV3 } from "./voiceAudioLevelV3.js";
import { queryRhizohVoiceTranscribeResilientV3 } from "./voiceTranscribeTransportV3.js";
import { resolveVoiceTranscriptV3 } from "./voiceTranscriptMergerV3.js";
import { witnessVoiceStreamLifecycleV0 } from "../voiceTranscriptWitnessPipelineV0.js";
import {
  beginVoiceSessionLanguageLockV0,
  endVoiceSessionLanguageLockV0,
  readSttLanguageCodeHintV0
} from "../rhizohConversationLanguageV0.js";
import { prepareRhizohLlmTurnV0 } from "../rhizohLlmTurnHotWireV0.js";
import { classifyVoiceDirectedSpeechBandV0 } from "../voiceDirectedSpeechObservationV0.js";
import {
  resolveVoicePipelineDecisionV0,
  publishVoicePipelineDecisionDebugV0,
  VOICE_EXEC_MODE_V0,
  VOICE_SPEAK_MODE_V0
} from "../rhizohVoiceDualPathRouterV0.js";
import { noteVoiceVerifyAttemptV0, resetVoiceVerifyBudgetV0 } from "../rhizohVoiceVerifyBudgetV0.js";
import { shouldNoteVoiceVerifyBudgetV0 } from "../rhizohVoiceGrayZoneVerifyV0.js";
import {
  buildInputProvenanceEnvelopeV0,
  RHIZOH_INPUT_MODALITY_V0,
  RHIZOH_INPUT_SOURCE_V0
} from "../rhizohInputProvenanceV0.js";
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
      resetVoiceVerifyBudgetV0(sessionId);

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
        const bandObs = classifyVoiceDirectedSpeechBandV0({
          text: merged.text,
          confidence: merged.confidence,
          strategy: merged.strategy,
          maxRms,
          source: "mic_v3"
        });
        const provenance = buildInputProvenanceEnvelopeV0({
          text: merged.text,
          source: RHIZOH_INPUT_SOURCE_V0.MIC_V3,
          modality: RHIZOH_INPUT_MODALITY_V0.STT,
          confidence: merged.confidence,
          strategy: merged.strategy,
          band: bandObs.band
        });
        const decision = resolveVoicePipelineDecisionV0({
          text: merged.text,
          confidence: merged.confidence,
          strategy: merged.strategy,
          maxRms,
          recordedMs,
          band: bandObs.band,
          provenance,
          sessionId
        });
        publishVoicePipelineDecisionDebugV0(decision);
        emitVoiceEngineTelemetryV3("PIPELINE_DECISION", {
          speakMode: decision.speakMode,
          execMode: decision.execMode,
          semanticGray: decision.semanticGray === true,
          uxGray: decision.uxGray === true,
          grayModifier: decision.uxGray === true,
          path: decision.path,
          action: decision.action,
          reason: decision.reason,
          fastIntent: decision.fastIntent,
          band: bandObs.band,
          confidenceTier: decision.confidenceTier,
          dropKind: decision.dropKind,
          verifyCount: decision.verifyCount,
          preview: String(merged.text || "").slice(0, 96)
        });

        if (decision.speakMode === VOICE_SPEAK_MODE_V0.SILENT) {
          busy = false;
          setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
          emitVoiceEngineTelemetryV3("FINAL_TRANSCRIPT_SHADOW_DROP", {
            reason: decision.reason,
            dropKind: decision.dropKind,
            preview: String(merged.text || "").slice(0, 96),
            band: bandObs.band,
            confidenceTier: decision.confidenceTier,
            silent: true
          });
          return {
            ok: false,
            error: decision.reason,
            shadowDrop: true,
            fastPath: true,
            merged,
            decision,
            bandObs
          };
        }

        if (decision.speakMode === VOICE_SPEAK_MODE_V0.HOLD) {
          busy = false;
          setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
          if (shouldNoteVoiceVerifyBudgetV0(decision, sessionId)) {
            noteVoiceVerifyAttemptV0(sessionId);
          }
          opts.onFinalTranscript?.({
            text: merged.text,
            confidence: merged.confidence,
            source: merged.source || "mic_v3",
            strategy: merged.strategy,
            pipelinePath: "hold",
            band: bandObs.band,
            decision,
            sessionId
          });
          emitVoiceEngineTelemetryV3("FINAL_TRANSCRIPT_UX_FALLBACK", {
            speakMode: decision.speakMode,
            reason: decision.reason,
            preview: String(merged.text || "").slice(0, 96),
            band: bandObs.band,
            confidenceTier: decision.confidenceTier
          });
          return {
            ok: true,
            merged,
            google: res.google,
            whisper: res.whisper,
            maxRms,
            holdPath: true,
            decision,
            bandObs
          };
        }

        if (
          decision.speakMode === VOICE_SPEAK_MODE_V0.SPEAK &&
          decision.execMode === VOICE_EXEC_MODE_V0.FAST_REFLEX
        ) {
          busy = false;
          setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
          opts.onFinalTranscript?.({
            text: merged.text,
            confidence: merged.confidence,
            source: merged.source || "mic_v3",
            strategy: merged.strategy,
            pipelinePath: "fast",
            band: bandObs.band,
            decision
          });
          emitVoiceEngineTelemetryV3("FINAL_TRANSCRIPT", {
            text: String(merged.text || "").slice(0, 160),
            strategy: merged.strategy,
            confidence: merged.confidence,
            band: bandObs.band,
            pipelinePath: "fast"
          });
          return {
            ok: true,
            merged,
            google: res.google,
            whisper: res.whisper,
            maxRms,
            fastPath: true,
            decision,
            bandObs
          };
        }

        if (
          decision.speakMode === VOICE_SPEAK_MODE_V0.SPEAK &&
          decision.execMode === VOICE_EXEC_MODE_V0.SLOW_LLM
        ) {
          prepareRhizohLlmTurnV0({
            message: merged.text,
            traceId: opts.traceId,
            sessionId,
            voiceTurn: true,
            speakInstantAck: false,
            sourcePath: "voice_engine_v3_slow"
          });

          opts.onFinalTranscript?.({
            text: merged.text,
            confidence: merged.confidence,
            source: merged.source || "mic_v3",
            strategy: merged.strategy,
            pipelinePath: "slow",
            band: bandObs.band,
            provenance,
            decision,
            sessionId
          });
          emitVoiceEngineTelemetryV3("FINAL_TRANSCRIPT", {
            text: String(merged.text || "").slice(0, 160),
            strategy: merged.strategy,
            confidence: merged.confidence,
            band: bandObs.band,
            pipelinePath: "slow",
            grayModifier: decision.uxGray === true,
            semanticGray: decision.semanticGray === true,
            uxGray: decision.uxGray === true
          });
          busy = false;
          setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
          return {
            ok: true,
            merged,
            google: res.google,
            whisper: res.whisper,
            maxRms,
            slowPath: true,
            decision,
            bandObs,
            provenance
          };
        }

        busy = false;
        setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
        return { ok: false, error: "pipeline_decision_unhandled", decision, merged, bandObs };
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
