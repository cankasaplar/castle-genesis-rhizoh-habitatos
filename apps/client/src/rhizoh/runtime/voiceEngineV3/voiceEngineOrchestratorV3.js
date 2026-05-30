/**
 * Voice Engine v3 — orchestrator (MediaRecorder → transcribe on STOP only).
 */

import { VOICE_ENGINE_STATE_V3 } from "./voiceEngineStateV3.js";
import { createVoiceAudioCaptureV3, VOICE_CAPTURE_CHUNK_MS_V3 } from "./voiceAudioCaptureV3.js";
import { hasVoiceCaptureSpeechEnergyV3 } from "./voiceAudioLevelV3.js";
import { queryRhizohVoiceTranscribeV3 } from "./queryRhizohVoiceTranscribeV3.js";
import { resolveVoiceTranscriptV3 } from "./voiceTranscriptMergerV3.js";
import {
  runVoiceTranscriptWitnessPipelineV0,
  witnessVoiceStreamLifecycleV0
} from "../voiceTranscriptWitnessPipelineV0.js";
import { emitVoiceEngineTelemetryV3, setVoiceEngineStateV3 } from "./voiceEngineTelemetryV3.js";

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

  const languageCode = opts.languageCode || "tr-TR";
  const sessionId = opts.sessionId || `v3_${Date.now().toString(36)}`;

  setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.IDLE, sessionId);

  function setSessionState(next) {
    sessionState = String(next || VOICE_ENGINE_STATE_V3.IDLE);
    setVoiceEngineStateV3(sessionState, sessionId);
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
      let maxRms = 0;
      try {
        maxRms = capture?.getMaxRms?.() ?? 0;
        fullBlob = await capture.stop();
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
      emitVoiceEngineTelemetryV3("FINAL_TRANSCRIBE_START", { bytes, recordedMs });

      try {
        const res = await queryRhizohVoiceTranscribeV3(fullBlob, {
          path: "both",
          mimeType,
          languageCode,
          traceId: opts.traceId,
          sessionId
        });

        if (activeGen !== generation) {
          busy = false;
          setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
          return { ok: false, error: "stale_session" };
        }

        if (!res.ok) {
          busy = false;
          setSessionState(VOICE_ENGINE_STATE_V3.ERROR);
          opts.onError?.({ code: res.error || "transcribe_failed" });
          setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
          return { ok: false, error: res.error };
        }

        const merged = res.merged || resolveVoiceTranscriptV3(res.google || res.fast, res.whisper);
        const pipe = runVoiceTranscriptWitnessPipelineV0({
          text: merged.text,
          confidence: merged.confidence,
          strategy: merged.strategy,
          source: "mic_v3",
          maxRms,
          recordedMs,
          stage: "v3_orchestrator_raw",
          checkRepeat: false,
          runTurnGate: false,
          shadowForwardOnReject: true
        });

        if (!pipe.route?.executionAccepted) {
          busy = false;
          setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
          emitVoiceEngineTelemetryV3("FINAL_TRANSCRIPT_REJECT", {
            reason: pipe.sane.reason,
            preview: String(pipe.sane.text || merged.text).slice(0, 96),
            confidence: pipe.sane.confidence,
            band: pipe.witnessed.observation.band
          });
          opts.onError?.({ code: pipe.sane.reason || "no_transcript" });
          return {
            ok: false,
            error: pipe.sane.reason || "no_transcript",
            merged,
            sane: pipe.sane,
            witnessed: pipe.witnessed
          };
        }

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
          witnessed: pipe.witnessed
        };
      } catch (e) {
        busy = false;
        setSessionState(VOICE_ENGINE_STATE_V3.ERROR);
        opts.onError?.({ code: "transcribe_network", detail: String(e?.message || e) });
        setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
        return { ok: false, error: "transcribe_network" };
      }
    },

    abort() {
      generation += 1;
      capture?.abort?.();
      capture = null;
      busy = false;
      setSessionState(VOICE_ENGINE_STATE_V3.IDLE);
      witnessVoiceStreamLifecycleV0({ code: "abort", stage: "stream_lifecycle", source: "mic_v3" });
      emitVoiceEngineTelemetryV3("ABORT");
    }
  });
}
