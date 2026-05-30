/**
 * Voice Engine v3 — orchestrator (MediaRecorder → fast Google + Whisper merge → callback).
 * Chrome SpeechRecognition = optional UX trigger only (not ASR dependency).
 */

import { VOICE_ENGINE_STATE_V3 } from "./voiceEngineStateV3.js";
import {
  createVoiceAudioCaptureV3,
  buildFastPathAudioBlobV3,
  VOICE_CAPTURE_CHUNK_MS_V3
} from "./voiceAudioCaptureV3.js";
import { queryRhizohVoiceTranscribeV3 } from "./queryRhizohVoiceTranscribeV3.js";
import { resolveVoiceTranscriptV3 } from "./voiceTranscriptMergerV3.js";
import { emitVoiceEngineTelemetryV3, setVoiceEngineStateV3 } from "./voiceEngineTelemetryV3.js";

/**
 * @param {{
 *   languageCode?: string,
 *   traceId?: string,
 *   sessionId?: string,
 *   onFastTranscript?: (payload: { text: string, confidence: number, source: string }) => void,
 *   onFinalTranscript?: (payload: { text: string, confidence: number, source: string, strategy: string }) => void,
 *   onError?: (err: { code: string, detail?: string }) => void,
 *   fastPathAfterMs?: number
 * }} [opts]
 */
export function createVoiceEngineOrchestratorV3(opts = {}) {
  /** @type {ReturnType<typeof createVoiceAudioCaptureV3> extends Promise<infer T> ? T : never | null} */
  let capture = null;
  /** @type {Blob[]} */
  let chunkBuffer = [];
  let mimeType = "audio/webm";
  let fastSent = false;
  let fastTimer = null;
  let busy = false;

  const languageCode = opts.languageCode || "tr-TR";
  const sessionId = opts.sessionId || `v3_${Date.now().toString(36)}`;
  const fastPathAfterMs = Number(opts.fastPathAfterMs) > 0 ? Number(opts.fastPathAfterMs) : VOICE_CAPTURE_CHUNK_MS_V3;

  setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.IDLE, sessionId);

  async function sendFastPath() {
    if (fastSent || !chunkBuffer.length) return;
    const blob = buildFastPathAudioBlobV3(chunkBuffer, mimeType);
    if (!blob || blob.size < 400) return;
    fastSent = true;
    setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.FAST_TRANSCRIBE, sessionId);
    emitVoiceEngineTelemetryV3("FAST_TRANSCRIBE_START", { bytes: blob.size });
    try {
      const res = await queryRhizohVoiceTranscribeV3(blob, {
        path: "fast",
        mimeType,
        languageCode,
        traceId: opts.traceId,
        sessionId
      });
      if (!res.ok) {
        emitVoiceEngineTelemetryV3("FAST_TRANSCRIBE_FAIL", { error: res.error });
        return;
      }
      const merged = res.merged || resolveVoiceTranscriptV3(res.google || res.fast, null);
      if (merged.text) {
        setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.LLM_PREP, sessionId);
        opts.onFastTranscript?.({
          text: merged.text,
          confidence: merged.confidence,
          source: merged.source
        });
        emitVoiceEngineTelemetryV3("FAST_TRANSCRIBE_OK", { text: merged.text.slice(0, 120) });
      }
    } catch (e) {
      emitVoiceEngineTelemetryV3("FAST_TRANSCRIBE_ERR", { detail: String(e?.message || e) });
    }
  }

  return Object.freeze({
    sessionId,
    isBusy: () => busy,

    /** Mic tap — begin recording (sync after getUserMedia resolves). */
    async start() {
      if (busy) return { ok: false, error: "engine_busy" };
      busy = true;
      chunkBuffer = [];
      fastSent = false;
      try {
        capture = await createVoiceAudioCaptureV3({
          timesliceMs: VOICE_CAPTURE_CHUNK_MS_V3,
          onChunk: (blob) => {
            chunkBuffer.push(blob);
            if (!fastSent && !fastTimer) {
              fastTimer = setTimeout(() => {
                fastTimer = null;
                sendFastPath();
              }, fastPathAfterMs);
            }
          },
          onError: (err) => {
            opts.onError?.({ code: "capture_error", detail: String(err?.message || err) });
          }
        });
        mimeType = capture.mimeType;
        capture.start();
        setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.RECORDING, sessionId);
        emitVoiceEngineTelemetryV3("RECORDING_START", { mimeType });
        return { ok: true };
      } catch (e) {
        busy = false;
        setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.ERROR, sessionId);
        const code = String(e?.message || "capture_start_failed");
        opts.onError?.({ code });
        return { ok: false, error: code };
      }
    },

    /** Stop mic — run accurate path + merge. */
    async stop() {
      if (!capture) {
        busy = false;
        setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.IDLE, sessionId);
        return { ok: false, error: "not_recording" };
      }
      if (fastTimer) {
        clearTimeout(fastTimer);
        fastTimer = null;
      }
      setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.WAIT_WHISPER_FINAL, sessionId);
      emitVoiceEngineTelemetryV3("RECORDING_STOP");
      let fullBlob;
      try {
        fullBlob = await capture.stop();
      } catch (e) {
        busy = false;
        setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.ERROR, sessionId);
        opts.onError?.({ code: "capture_stop_failed", detail: String(e?.message || e) });
        return { ok: false, error: "capture_stop_failed" };
      }
      capture = null;

      if (!fullBlob || fullBlob.size < 200) {
        busy = false;
        setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.IDLE, sessionId);
        opts.onError?.({ code: "no_speech" });
        return { ok: false, error: "no_speech" };
      }

      setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.FINAL_TRANSCRIPT_RESOLVE, sessionId);
      try {
        const res = await queryRhizohVoiceTranscribeV3(fullBlob, {
          path: "both",
          mimeType,
          languageCode,
          traceId: opts.traceId,
          sessionId
        });
        if (!res.ok) {
          busy = false;
          setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.ERROR, sessionId);
          opts.onError?.({ code: res.error || "transcribe_failed" });
          return { ok: false, error: res.error };
        }
        const merged =
          res.merged || resolveVoiceTranscriptV3(res.google || res.fast, res.whisper);
        if (!merged.text) {
          busy = false;
          setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.IDLE, sessionId);
          opts.onError?.({ code: "no_transcript" });
          return { ok: false, error: "no_transcript" };
        }
        opts.onFinalTranscript?.({
          text: merged.text,
          confidence: merged.confidence,
          source: merged.source,
          strategy: merged.strategy
        });
        emitVoiceEngineTelemetryV3("FINAL_TRANSCRIPT", {
          text: merged.text.slice(0, 160),
          strategy: merged.strategy
        });
        setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.IDLE, sessionId);
        busy = false;
        return { ok: true, merged, google: res.google, whisper: res.whisper };
      } catch (e) {
        busy = false;
        setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.ERROR, sessionId);
        opts.onError?.({ code: "transcribe_network", detail: String(e?.message || e) });
        return { ok: false, error: "transcribe_network" };
      }
    },

    abort() {
      if (fastTimer) clearTimeout(fastTimer);
      fastTimer = null;
      capture?.abort?.();
      capture = null;
      chunkBuffer = [];
      busy = false;
      setVoiceEngineStateV3(VOICE_ENGINE_STATE_V3.IDLE, sessionId);
      emitVoiceEngineTelemetryV3("ABORT");
    }
  });
}
