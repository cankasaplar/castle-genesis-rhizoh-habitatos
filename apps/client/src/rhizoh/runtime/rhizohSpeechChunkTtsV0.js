/**
 * Chunk-first TTS — applies hot speech skeleton + micro-rhythm to Web Speech API.
 */

import { readSpeechLocaleForVoiceV0 } from "./rhizohSpeechLocaleV0.js";
import {
  resolveSpeechBcp47ForUiLocaleV0,
  resolveSpeechVoiceForUiLocaleV0
} from "./rhizohSpeechLocaleV0.js";
import { recordRhizohReplySurfaceV0 } from "./rhizohReplyRhythmDiagnosticV0.js";
import { segmentSpeechTextV0 } from "./rhizohSpeechSentenceSegmenterV0.js";
import {
  buildConversationContinuityGlueV0,
  handoffHotSpeechToLlmReplyV0,
  resolveGlueProsodyForChunkV0
} from "./rhizohConversationContinuityGlueV0.js";
import { gateVoiceOutputForTurnV0 } from "./turnSovereigntyWireV0.js";

export const RHIZOH_SPEECH_CHUNK_TTS_SCHEMA_V0 = "castle.rhizoh.speech_chunk_tts.v0";

/**
 * @param {SpeechSynthesisUtterance} utterance
 * @param {{ microRhythmFeel?: object, skeleton?: object, language?: string }} [hints]
 */
export function applyRhizohSpeechHintsToUtteranceV0(utterance, hints = {}) {
  const feel = hints.microRhythmFeel || hints.skeleton?.microRhythmFeel;
  const sk = hints.skeleton;
  const locale = String(hints.language || readSpeechLocaleForVoiceV0() || "en").toLowerCase();
  utterance.lang = resolveSpeechBcp47ForUiLocaleV0(locale);

  const pacing = String(sk?.pacing || feel?.breakStyle === "hot_skeleton" ? "calm" : "").toLowerCase();
  if (pacing === "measured" || pacing === "hold") {
    utterance.rate = 0.96;
    utterance.pitch = 0.98;
  } else if (pacing === "energetic") {
    utterance.rate = 1.06;
    utterance.pitch = 1.04;
  } else {
    utterance.rate = 1.02;
    utterance.pitch = 1.01;
  }

  const preempt = Number(feel?.preemptiveStart01);
  if (preempt > 0.12) utterance.rate = Math.min(1.12, utterance.rate + 0.04);

  const voice = resolveSpeechVoiceForUiLocaleV0(locale);
  if (voice) utterance.voice = voice;
  utterance.volume = 0.92;
}

/**
 * Speak reply text with chunk plan gaps (skeleton chunk-first).
 * @param {string} text
 * @param {{ skeleton?: object, microRhythmFeel?: object, language?: string, smoothAfterAck?: boolean, glue?: ReturnType<import("./rhizohConversationContinuityGlueV0.js").buildConversationContinuityGlueV0> }} [opts]
 * @returns {Promise<{ ok: boolean, chunks: number, handoff?: object }>}
 */
export async function speakRhizohReplyChunkedV0(text, opts = {}) {
  const full = String(text || "").trim();
  if (!full || typeof window === "undefined" || !window.speechSynthesis) {
    return { ok: false, chunks: 0 };
  }

  const traceId = String(opts.traceId || "");
  const voiceGate = gateVoiceOutputForTurnV0(traceId, opts.moduleId || "speakRhizohReplyChunkedV0");
  if (voiceGate.block) {
    return { ok: false, chunks: 0, sovereigntyBlocked: true, reason: voiceGate.reason };
  }

  const sk =
    opts.skeleton ||
    (typeof window !== "undefined" ? window.__CASTLE_RHIZOH_HOT_SPEECH__?.skeleton : null);
  const expr =
    typeof window !== "undefined" ? window.__CASTLE_RHIZOH_EXPRESSION__ : null;
  const feel = opts.microRhythmFeel || expr?.speechShape?.microRhythmFeel || expr?.conversationBehavior?.microRhythmFeel;

  const seg = segmentSpeechTextV0(full, { maxClauseChars: 120 });
  const allSegments = seg.segments.map((s) => s.text).filter(Boolean);
  const MAX_TTS_SEGMENTS_V0 = 32;
  const plan = allSegments.slice(0, MAX_TTS_SEGMENTS_V0);
  const droppedSegments = Math.max(0, allSegments.length - plan.length);
  const chunks = plan.length ? plan : [full];
  const ttsSpokenText = chunks.join(" ");

  const glue = opts.glue;
  const speakChunks = () => {
    let i = 0;
    const next = () => {
      if (i >= chunks.length) return;
      const chunk = chunks[i];
      const chunkIdx = i;
      i += 1;
      const prosody = glue ? resolveGlueProsodyForChunkV0(glue, chunkIdx) : null;
      const gapMs = prosody
        ? Math.max(40, prosody.gapMs)
        : Math.max(40, Number(feel?.hesitationMs) || 70);
      const u = new SpeechSynthesisUtterance(chunk.slice(0, 280));
      applyRhizohSpeechHintsToUtteranceV0(u, {
        skeleton: sk,
        microRhythmFeel: feel,
        language: opts.language || expr?.projection?.language || glue?.language || readSpeechLocaleForVoiceV0()
      });
      if (prosody) {
        u.rate = prosody.rate;
        u.pitch = prosody.pitch;
        u.volume = prosody.volume;
      }
      u.onend = () => {
        if (i < chunks.length) window.setTimeout(next, gapMs);
      };
      try {
        window.speechSynthesis.speak(u);
      } catch {
        /* noop */
      }
    };
    next();
  };

  let handoff = null;
  if (opts.smoothAfterAck !== false) {
    const activeGlue = glue || buildConversationContinuityGlueV0({});
    handoff = await handoffHotSpeechToLlmReplyV0(activeGlue, speakChunks);
  } else {
    speakChunks();
  }

  recordRhizohReplySurfaceV0({
    channel: "tts",
    text: ttsSpokenText,
    source: "chunked_tts",
    meta: Object.freeze({
      chunks: chunks.length,
      droppedSegments,
      fullChars: full.length,
      spokenChars: ttsSpokenText.length
    })
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.lastChunkedTts = Object.freeze({
      schema: RHIZOH_SPEECH_CHUNK_TTS_SCHEMA_V0,
      chunks: chunks.length,
      droppedSegments,
      atMs: Date.now()
    });
  }

  return Object.freeze({ ok: true, chunks: chunks.length, handoff, droppedSegments });
}
