/**
 * Voice v3 — live mic energy probe (detect silence before Whisper hallucination).
 */

export const VOICE_AUDIO_LEVEL_V3_SCHEMA = "castle.rhizoh.voice_audio_level.v3";
/** Normalized RMS floor — below this Whisper often hallucinates on TR audio. */
export const VOICE_MIN_SPEECH_RMS_V3 = 0.012;

/**
 * @param {MediaStream} stream
 * @param {{ intervalMs?: number }} [opts]
 */
export function attachVoiceCaptureLevelProbeV3(stream, opts = {}) {
  if (typeof window === "undefined" || !stream) {
    return { stop: () => {}, getMaxRms: () => 0, getSampleCount: () => 0 };
  }

  let maxRms = 0;
  let sampleCount = 0;
  let timer = 0;
  /** @type {AudioContext | null} */
  let audioCtx = null;

  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return { stop: () => {}, getMaxRms: () => 0, getSampleCount: () => 0 };
    audioCtx = new Ctx();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    const tick = () => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i += 1) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      sampleCount += 1;
      if (rms > maxRms) maxRms = rms;
    };

    const intervalMs = Number(opts.intervalMs) > 0 ? Number(opts.intervalMs) : 120;
    tick();
    timer = window.setInterval(tick, intervalMs);

    return {
      getMaxRms: () => maxRms,
      getSampleCount: () => sampleCount,
      stop() {
        if (timer) window.clearInterval(timer);
        timer = 0;
        try {
          source.disconnect();
          analyser.disconnect();
        } catch {
          /* noop */
        }
        audioCtx?.close?.().catch?.(() => {});
        audioCtx = null;
      }
    };
  } catch {
    return { stop: () => {}, getMaxRms: () => 0, getSampleCount: () => 0 };
  }
}

/**
 * @param {number} maxRms
 */
export function hasVoiceCaptureSpeechEnergyV3(maxRms) {
  return Number(maxRms) >= VOICE_MIN_SPEECH_RMS_V3;
}
