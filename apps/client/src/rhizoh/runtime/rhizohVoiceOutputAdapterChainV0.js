/**
 * Voice OUTPUT adapter chain — TTS never user-facing dead.
 * primary: browser speechSynthesis
 * fallback: text-only output buffer (always available)
 *
 * Note: Chrome console "No available adapters" = WebGPU probe, not this chain.
 */

import { logVoiceInfoV0, logVoiceWarnV0 } from "./rhizohProductionLogNamespacesV0.js";
import { isVoiceEngineV3EnabledV0 } from "./voiceEngineV3/isVoiceEngineV3EnabledV0.js";

export const RHIZOH_VOICE_OUTPUT_ADAPTER_SCHEMA_V0 = "rhizoh.voice_output_adapter_chain.v0";

export const VOICE_OUTPUT_CHANNEL_V0 = Object.freeze({
  SPEECH_SYNTHESIS: "browser_speech_synthesis",
  TEXT_BUFFER: "text_output_buffer"
});

const TEXT_BUFFER_MAX_V0 = 24;
/** @type {object[]} */
const textOutputBufferV0 = [];

/**
 * @returns {object[]}
 */
export function getVoiceOutputAdapterChainV0() {
  const chain = [];
  if (isVoiceEngineV3EnabledV0()) {
    chain.push(
      Object.freeze({
        id: "rhizoh-voice-engine-v3",
        role: "stt_primary",
        available: true
      })
    );
  }
  const ttsAvailable =
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined" &&
    typeof SpeechSynthesisUtterance !== "undefined";
  chain.push(
    Object.freeze({
      id: VOICE_OUTPUT_CHANNEL_V0.SPEECH_SYNTHESIS,
      role: "tts_primary",
      available: ttsAvailable
    })
  );
  chain.push(
    Object.freeze({
      id: VOICE_OUTPUT_CHANNEL_V0.TEXT_BUFFER,
      role: "tts_fallback",
      available: true
    })
  );
  return Object.freeze(chain);
}

/**
 * @param {string} text
 * @param {object} [meta]
 */
export function enqueueTextOutputV0(text, meta = {}) {
  const line = String(text || "").trim();
  if (!line) return null;
  const row = Object.freeze({
    atMs: Date.now(),
    text: line.slice(0, 480),
    source: meta.source || "voice_fallback",
    traceId: meta.traceId || null
  });
  textOutputBufferV0.push(row);
  if (textOutputBufferV0.length > TEXT_BUFFER_MAX_V0) textOutputBufferV0.shift();
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.textOutputQueue = getTextOutputBufferSnapshotV0();
    window.dispatchEvent(
      new CustomEvent("rhizoh:text-output-v0", { detail: row })
    );
  }
  logVoiceInfoV0("VOICE_TEXT_BUFFER_ENQUEUE", { preview: line.slice(0, 80), source: meta.source });
  return row;
}

export function getTextOutputBufferSnapshotV0() {
  return Object.freeze({
    schema: RHIZOH_VOICE_OUTPUT_ADAPTER_SCHEMA_V0,
    count: textOutputBufferV0.length,
    recent: Object.freeze(textOutputBufferV0.slice(-8))
  });
}

/**
 * Speak via TTS or enqueue text buffer — never silent to user.
 * @param {string} text
 * @param {() => boolean} speakTtsFn — returns true if TTS invoked
 * @param {object} [meta]
 */
export function emitVoiceOutputWithFallbackV0(text, speakTtsFn, meta = {}) {
  const line = String(text || "").trim();
  if (!line) return Object.freeze({ ok: false, channel: null });

  let ttsOk = false;
  try {
    ttsOk = typeof speakTtsFn === "function" ? speakTtsFn() === true : false;
  } catch {
    ttsOk = false;
  }

  if (ttsOk) {
    return Object.freeze({ ok: true, channel: VOICE_OUTPUT_CHANNEL_V0.SPEECH_SYNTHESIS, llmBypass: meta.llmBypass });
  }

  const row = enqueueTextOutputV0(line, meta);
  logVoiceWarnV0("VOICE_TTS_FALLBACK_TEXT", { preview: line.slice(0, 80) });
  return Object.freeze({
    ok: true,
    channel: VOICE_OUTPUT_CHANNEL_V0.TEXT_BUFFER,
    buffered: Boolean(row),
    llmBypass: meta.llmBypass
  });
}

export function getVoiceOutputAdapterSnapshotV0() {
  const chain = getVoiceOutputAdapterChainV0();
  const tts = chain.find((c) => c.id === VOICE_OUTPUT_CHANNEL_V0.SPEECH_SYNTHESIS);
  return Object.freeze({
    schema: RHIZOH_VOICE_OUTPUT_ADAPTER_SCHEMA_V0,
    chain,
    ttsAvailable: tts?.available === true,
    textBufferAvailable: true,
    userFacingDead: false,
    webGpuConsoleNoise:
      "Chrome 'No available adapters' is WebGPU — unrelated to voice TTS/STT chain.",
    textQueue: getTextOutputBufferSnapshotV0()
  });
}

/** @internal vitest */
export function __resetVoiceOutputAdapterChainForTestV0() {
  textOutputBufferV0.length = 0;
}
