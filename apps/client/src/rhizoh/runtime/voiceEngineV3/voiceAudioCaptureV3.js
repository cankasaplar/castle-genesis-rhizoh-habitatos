/**
 * Voice Engine v3 — MediaRecorder audio capture (Chrome STT-independent).
 */

export const VOICE_AUDIO_CAPTURE_V3_SCHEMA = "castle.rhizoh.voice_audio_capture.v3";
export const VOICE_CAPTURE_CHUNK_MS_V3 = 1500;

/**
 * @param {{ timesliceMs?: number, mimeType?: string, onChunk?: (blob: Blob) => void, onError?: (err: Error) => void }} [opts]
 */
export async function createVoiceAudioCaptureV3(opts = {}) {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("getUserMedia_unavailable");
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType =
    opts.mimeType ||
    (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm");

  /** @type {Blob[]} */
  const chunks = [];
  let recorder = null;
  let stopped = false;

  const recorderOpts = MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : undefined;
  recorder = new MediaRecorder(stream, recorderOpts);

  recorder.ondataavailable = (ev) => {
    if (!ev.data || ev.data.size <= 0) return;
    chunks.push(ev.data);
    opts.onChunk?.(ev.data);
  };

  recorder.onerror = () => {
    opts.onError?.(new Error("media_recorder_error"));
  };

  const timesliceMs = Number(opts.timesliceMs) > 0 ? Number(opts.timesliceMs) : VOICE_CAPTURE_CHUNK_MS_V3;

  return Object.freeze({
    stream,
    mimeType: recorder.mimeType || mimeType,
    start() {
      if (stopped) throw new Error("capture_already_stopped");
      chunks.length = 0;
      recorder.start(timesliceMs);
    },
    stop() {
      return new Promise((resolve, reject) => {
        if (stopped) {
          resolve(buildBlob(chunks, recorder?.mimeType || mimeType));
          return;
        }
        stopped = true;
        recorder.onstop = () => {
          for (const track of stream.getTracks()) track.stop();
          resolve(buildBlob(chunks, recorder?.mimeType || mimeType));
        };
        recorder.onerror = () => reject(new Error("media_recorder_stop_error"));
        try {
          if (recorder.state !== "inactive") recorder.stop();
        } catch (e) {
          for (const track of stream.getTracks()) track.stop();
          reject(e);
        }
      });
    },
    abort() {
      stopped = true;
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        /* noop */
      }
      for (const track of stream.getTracks()) track.stop();
    }
  });
}

/** @param {Blob[]} chunks @param {string} mimeType */
function buildBlob(chunks, mimeType) {
  if (!chunks.length) return new Blob([], { type: mimeType });
  return new Blob(chunks, { type: mimeType });
}

/**
 * First N ms worth of chunks as a fast-path preview blob.
 * @param {Blob[]} chunks
 * @param {string} mimeType
 */
export function buildFastPathAudioBlobV3(chunks, mimeType) {
  if (!Array.isArray(chunks) || !chunks.length) return null;
  return new Blob(chunks.slice(0, 2), { type: mimeType });
}
