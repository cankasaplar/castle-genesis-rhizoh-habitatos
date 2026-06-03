/**
 * Voice Engine v3 — orchestrator (MediaRecorder → transcribe on STOP only).
 */

import { VOICE_ENGINE_STATE_V3 } from "./voiceEngineStateV3.js";
import { createVoiceAudioCaptureV3, VOICE_CAPTURE_CHUNK_MS_V3 } from "./voiceAudioCaptureV3.js";
import {
  evaluatePreSttInputSanitizationV0,
  estimatePreSttSpeechProbabilityV0,
  PRE_STT_GATE_ACTION_V0,
  publishPreSttSanitizationDebugV0
} from "../rhizohVoicePreSttInputSanitizationGateV0.js";
import { isVoicePreSttGateEnabledV0 } from "../rhizohVoiceIngestGateFlagsV0.js";
import { hasVoiceCaptureSpeechEnergyV3 } from "./voiceAudioLevelV3.js";
import { publishPostSttOriginFilterDebugV0 } from "../rhizohVoicePostSttSemanticOriginFilterV0.js";
import { queryRhizohVoiceTranscribeResilientV3 } from "./voiceTranscribeTransportV3.js";
import { resolveVoiceTranscriptV3 } from "./voiceTranscriptMergerV3.js";
import { witnessVoiceStreamLifecycleV0 } from "../voiceTranscriptWitnessPipelineV0.js";
import {
  beginVoiceSessionLanguageLockV0,
  endVoiceSessionLanguageLockV0,
  readSttLanguageCodeHintV0,
  readVoiceLanguageLockBcp47V0,
  readVoiceLanguageLockV0
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
import { rescoreVoiceTranscriptAfterMergeV0 } from "../rhizohPostMergeTranscriptRescoreV0.js";
import { noteVoiceRuntimePressureV1 } from "../gatewaySessionKeeperV1.js";
import {
  noteOriginRetryConsumedV0,
  peekOriginRetryBudgetV0,
  resetOriginRetryBudgetForSessionV0
} from "../rhizohSttOriginRetryBudgetV0.js";
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
      resetOriginRetryBudgetForSessionV0(sessionId);

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
      let levelSampleCount = 0;
      try {
        maxRms = capture?.getMaxRms?.() ?? 0;
        levelSampleCount = capture?.getLevelSampleCount?.() ?? 0;
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

      const warmProbe = finalizeRecordingWarmProbeV1(sessionId);
      const preSttInput = {
        maxRms,
        recordedMs,
        bytes,
        warmProbe,
        sampleCount: levelSampleCount
      };
      let preSttSpeechProbability = null;

      if (isVoicePreSttGateEnabledV0()) {
        const preStt = evaluatePreSttInputSanitizationV0(preSttInput);
        preSttSpeechProbability = preStt.speechProbability;
        publishPreSttSanitizationDebugV0(preStt);

        if (!preStt.pass) {
          busy = false;
          setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
          const skipReason = preStt.reason || "pre_stt_blocked";
          witnessVoiceStreamLifecycleV0({
            code: skipReason,
            stage: "pre_stt_gate",
            source: "mic_v3",
            detail: {
              recordedMs,
              bytes,
              maxRms,
              action: preStt.action,
              speechProbability: preStt.speechProbability,
              acousticEntropy: preStt.acousticEntropy
            }
          });
          emitVoiceEngineTelemetryV3("PRE_STT_GATE", {
            action: preStt.action,
            reason: skipReason,
            recordedMs,
            bytes,
            maxRms,
            speechProbability: preStt.speechProbability,
            acousticEntropy: preStt.acousticEntropy
          });
          if (preStt.action === PRE_STT_GATE_ACTION_V0.HOLD) {
            opts.onError?.({ code: skipReason, detail: "hold_no_transcription" });
            return {
              ok: false,
              error: skipReason,
              preSttHold: true,
              shadowDrop: true,
              maxRms,
              recordedMs
            };
          }
          opts.onError?.({ code: skipReason, detail: String(maxRms) });
          return {
            ok: false,
            error: skipReason === "pre_stt_low_energy" ? "audio_silent" : skipReason,
            shadowDrop: true,
            maxRms,
            recordedMs,
            preStt
          };
        }
      } else if (!hasVoiceCaptureSpeechEnergyV3(maxRms)) {
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
      emitVoiceEngineTelemetryV3("FINAL_TRANSCRIBE_START", {
        bytes,
        recordedMs,
        chunkCount: captureChunks.length,
        warmScore: warmProbe.avgWarmScore,
        minWarmScore: warmProbe.minWarmScore,
        speechProbability:
          preSttSpeechProbability ??
          estimatePreSttSpeechProbabilityV0(preSttInput)
      });

      try {
        const res = await queryRhizohVoiceTranscribeResilientV3(fullBlob, {
          mimeType,
          languageCode: readVoiceLanguageLockBcp47V0() || languageCode,
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

        let merged = res.merged || resolveVoiceTranscriptV3(res.google || res.fast, res.whisper);
        let scored = rescoreVoiceTranscriptAfterMergeV0({
          text: merged.text,
          confidence: merged.confidence,
          strategy: merged.strategy,
          maxRms,
          recordedMs,
          languageHint: readVoiceLanguageLockV0()
        });

        if (scored.originRetry) {
          const retryBudget = peekOriginRetryBudgetV0({
            sessionId,
            recordedMs,
            strategy: merged.strategy
          });
          if (!retryBudget.allowed) {
            busy = false;
            setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
            emitVoiceEngineTelemetryV3("ORIGIN_RETRY_SKIPPED", {
              reason: retryBudget.reason,
              preview: String(merged.text || "").slice(0, 96),
              sessionId
            });
            return {
              ok: false,
              error: retryBudget.reason,
              shadowDrop: true,
              originRetrySkipped: true,
              merged,
              scored,
              maxRms,
              recordedMs
            };
          }
          noteOriginRetryConsumedV0(sessionId);
          emitVoiceEngineTelemetryV3("ORIGIN_QUARANTINE_RETRY", {
            reason: scored.skipReasons?.[0] || "post_stt_template_quarantine",
            preview: String(merged.text || "").slice(0, 96),
            sessionId
          });
          const retryRes = await queryRhizohVoiceTranscribeResilientV3(fullBlob, {
            mimeType,
            languageCode: readVoiceLanguageLockBcp47V0() || languageCode,
            traceId: opts.traceId,
            sessionId,
            bytes,
            recordedMs,
            chunks: captureChunks,
            chunkCount: captureChunks.length,
            warmProbe,
            originReeval: true
          });
          if (retryRes.ok) {
            const retryMerged =
              retryRes.merged || resolveVoiceTranscriptV3(retryRes.google || retryRes.fast, retryRes.whisper);
            const retryScored = rescoreVoiceTranscriptAfterMergeV0({
              text: retryMerged.text,
              confidence: retryMerged.confidence,
              strategy: retryMerged.strategy || "origin_reeval_direct",
              maxRms,
              recordedMs,
              languageHint: readVoiceLanguageLockV0(),
              originReevalPass: true
            });
            if (!retryScored.skip) {
              merged = Object.freeze({
                ...retryMerged,
                text: retryScored.text || retryMerged.text,
                confidence: Number.isFinite(Number(retryScored.confidence))
                  ? Number(retryScored.confidence)
                  : retryMerged.confidence,
                strategy: retryMerged.strategy || "origin_reeval_direct"
              });
              scored = retryScored;
            } else if (retryScored.terminalDrop) {
              publishPostSttOriginFilterDebugV0(retryScored.originFilter);
              emitVoiceEngineTelemetryV3("FINAL_TRANSCRIPT_SHADOW_DROP", {
                reason: retryScored.skipReasons?.[0] || "stt_quarantine",
                preview: String(retryMerged.text || "").slice(0, 96),
                postSttOrigin: retryScored.originFilter?.reason,
                originRetryFailed: true
              });
              return {
                ok: false,
                error: "stt_quarantine",
                shadowDrop: true,
                merged: retryMerged,
                scored: retryScored,
                maxRms
              };
            } else {
              emitVoiceEngineTelemetryV3("ORIGIN_QUARANTINE_RETRY_EXHAUSTED", {
                preview: String(merged.text || "").slice(0, 96)
              });
              return {
                ok: false,
                error: "origin_quarantine_retry_exhausted",
                shadowDrop: true,
                maxRms,
                recordedMs
              };
            }
          } else {
            return {
              ok: false,
              error: retryRes.error || "origin_reeval_failed",
              shadowDrop: true,
              maxRms,
              recordedMs
            };
          }
        }

        if (scored.quarantine && scored.terminalDrop) {
          busy = false;
          setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
          publishPostSttOriginFilterDebugV0(scored.originFilter);
          emitVoiceEngineTelemetryV3("FINAL_TRANSCRIPT_SHADOW_DROP", {
            reason: scored.skipReasons?.[0] || "stt_quarantine",
            dropKind: "noise_drop",
            preview: String(merged.text || "").slice(0, 96),
            quarantineId: scored.quarantineId,
            silent: true,
            postSttOrigin: scored.originFilter?.reason
          });
          return {
            ok: false,
            error: "stt_quarantine",
            shadowDrop: true,
            merged,
            scored,
            maxRms
          };
        }

        merged = Object.freeze({
          ...merged,
          text: scored.text || merged.text,
          confidence: Number.isFinite(Number(scored.confidence))
            ? Number(scored.confidence)
            : merged.confidence
        });

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
