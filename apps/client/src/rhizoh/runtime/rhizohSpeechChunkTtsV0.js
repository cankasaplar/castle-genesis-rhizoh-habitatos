/**
 * Chunk-first TTS — applies hot speech skeleton + micro-rhythm to Web Speech API.
 */

import {
  readSpeechLocaleForVoiceV0,
  resolveSpeechLocaleForTextV0,
  resolveSpeechProsodyForLocaleV0
} from "./rhizohSpeechLocaleV0.js";
import {
  resolveSpeechBcp47ForUiLocaleV0,
  resolveSpeechVoiceForUiLocaleV0
} from "./rhizohSpeechLocaleV0.js";
import { recordRhizohReplySurfaceV0 } from "./rhizohReplyRhythmDiagnosticV0.js";
import { noteRecentRhizohTtsEchoV0 } from "./voiceTtsEchoGuardV0.js";
import { segmentSpeechTextV0 } from "./rhizohSpeechSentenceSegmenterV0.js";
import {
  buildConversationContinuityGlueV0,
  handoffHotSpeechToLlmReplyV0,
  resolveGlueProsodyForChunkV0
} from "./rhizohConversationContinuityGlueV0.js";
import { gateVoiceOutputForTurnV0 } from "./turnSovereigntyWireV0.js";
import {
  sanitizeSpeechTextForTtsV0,
  splitLongTtsChunkV0
} from "./rhizohSpeechTtsSanitizeV0.js";

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
  const prosody = resolveSpeechProsodyForLocaleV0(locale);
  if (pacing === "measured" || pacing === "hold") {
    utterance.rate = Math.max(0.98, prosody.rate - 0.02);
    utterance.pitch = Math.max(1.0, prosody.pitch - 0.02);
  } else if (pacing === "energetic") {
    utterance.rate = prosody.rate + 0.04;
    utterance.pitch = prosody.pitch + 0.02;
  } else {
    utterance.rate = prosody.rate;
    utterance.pitch = prosody.pitch;
  }

  const preempt = Number(feel?.preemptiveStart01);
  if (preempt > 0.12) utterance.rate = Math.min(1.12, utterance.rate + 0.04);

  const voice = resolveSpeechVoiceForUiLocaleV0(locale);
  if (voice) utterance.voice = voice;
  utterance.volume = prosody.volume;
  if (typeof hints.rateOverride === "number") utterance.rate = hints.rateOverride;
  if (typeof hints.pitchOverride === "number") utterance.pitch = hints.pitchOverride;
}

/**
 * Speak reply text with chunk plan gaps (skeleton chunk-first).
 * @param {string} text
 * @param {{ skeleton?: object, microRhythmFeel?: object, language?: string, smoothAfterAck?: boolean, glue?: ReturnType<import("./rhizohConversationContinuityGlueV0.js").buildConversationContinuityGlueV0> }} [opts]
 * @returns {Promise<{ ok: boolean, chunks: number, handoff?: object }>}
 */
export async function speakRhizohReplyChunkedV0(text, opts = {}) {
  const full = sanitizeSpeechTextForTtsV0(String(text || "").trim());
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
  const allSegments = seg.segments.flatMap((s) => splitLongTtsChunkV0(s.text, 280)).filter(Boolean);
  const MAX_TTS_SEGMENTS_V0 = 32;
  const plan = allSegments.slice(0, MAX_TTS_SEGMENTS_V0);
  const droppedSegments = Math.max(0, allSegments.length - plan.length);
  const chunks = plan.length ? plan : splitLongTtsChunkV0(full, 280);
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
      const u = new SpeechSynthesisUtterance(chunk);
      applyRhizohSpeechHintsToUtteranceV0(u, {
        skeleton: sk,
        microRhythmFeel: feel,
        language: resolveSpeechLocaleForTextV0(
          chunk,
          opts.language || expr?.projection?.language || glue?.language || readSpeechLocaleForVoiceV0()
        ),
        rateOverride: opts.voiceRateOverride,
        pitchOverride: opts.voicePitchOverride
      });
      if (prosody) {
        u.rate = prosody.rate;
        u.pitch = prosody.pitch;
        u.volume = prosody.volume;
      }
      u.onend = () => {
        noteRecentRhizohTtsEchoV0(chunk);
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

  noteRecentRhizohTtsEchoV0(ttsSpokenText);
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
