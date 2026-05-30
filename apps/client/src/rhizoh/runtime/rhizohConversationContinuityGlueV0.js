/**
 * Conversation continuity glue v0 — micro-transition between hot ack and LLM reply TTS.
 * Not a new pipeline layer: timing + prosody carry from hot speech → reply chunks.
 */

import { logCastleLifecycleV0, logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  speakAfterVoiceInstantAckSmoothV0,
  isVoiceInstantAckPlayingV0,
  VOICE_ACK_SMOOTH_GAP_MS
} from "./voiceInstantAckV0.js";

export const RHIZOH_CONVERSATION_CONTINUITY_GLUE_SCHEMA_V0 =
  "castle.rhizoh.conversation_continuity_glue.v0";

const BRIDGE_PHRASES_TR = Object.freeze({
  tr: Object.freeze(["…", "—"]),
  en: Object.freeze(["…", "—"]),
  es: Object.freeze(["…", "—"]),
  jp: Object.freeze(["…", "—"])
});

function clampMs(n, min, max) {
  const x = Math.round(Number(n) || 0);
  return Math.max(min, Math.min(max, x));
}

/**
 * @param {{
 *   expression?: object | null,
 *   prep?: object | null,
 *   llmWaitMs?: number,
 *   voiceInstantAck?: { rate?: number, pitch?: number, phrase?: string } | null
 * }} [input]
 */
export function buildConversationContinuityGlueV0(input = {}) {
  const expr =
    input.expression ||
    (typeof window !== "undefined" ? window.__CASTLE_RHIZOH_EXPRESSION__ : null);
  const hot =
    typeof window !== "undefined" ? window.__CASTLE_RHIZOH_HOT_SPEECH__ : null;
  const feel =
    expr?.conversationBehavior?.microRhythmFeel || expr?.speechShape?.microRhythmFeel;
  const lang = String(expr?.projection?.language || "tr").toLowerCase();
  const pacing = String(hot?.skeleton?.pacing || expr?.projection?.pacing || "calm");

  const ackMeta =
    input.voiceInstantAck ||
    (typeof window !== "undefined" ? window.__rhizoh?.voiceInstantAck : null);

  const llmWaitMs = Math.max(0, Number(input.llmWaitMs) || 0);
  const breathGapMs = Number(feel?.breathGapMs) || 120;
  const hesitationMs = Number(feel?.hesitationMs) || 60;
  const whenYouHearMs = Number(feel?.whenYouHearMs) || hot?.skeleton?.targetFirstAudioMs || 220;

  let bridgeGapMs = clampMs(
    breathGapMs * 0.42 + hesitationMs * 0.38 + (ackMeta?.firstSpeechMs ? 18 : 0),
    72,
    220
  );
  if (pacing === "measured" || pacing === "hold") bridgeGapMs = clampMs(bridgeGapMs + 28, 90, 240);
  if (pacing === "energetic") bridgeGapMs = clampMs(bridgeGapMs - 18, 55, 180);

  const longLlmWait = llmWaitMs > 900;
  const useMicroBridge = longLlmWait && !isVoiceInstantAckPlayingV0();
  const bridgeTable = BRIDGE_PHRASES_TR[lang] || BRIDGE_PHRASES_TR.tr;
  const microBridgePhrase = useMicroBridge ? bridgeTable[0] : null;

  const ackRate = 1.08;
  const glue = Object.freeze({
    schema: RHIZOH_CONVERSATION_CONTINUITY_GLUE_SCHEMA_V0,
    bridgeGapMs,
    microBridgePhrase,
    rateRamp: Object.freeze([ackRate * 0.96, 1.03, 1.01, 1.0]),
    pitchCarry: 1.02,
    volumeRamp: Object.freeze([0.86, 0.9, 0.92]),
    warmthCarry01: Number(feel?.warmthSmoothed01) || 0.5,
    language: lang,
    pacing,
    targetFirstAudioMs: whenYouHearMs,
    llmWaitMs,
    handoffMode: "prosody_carry"
  });

  if (typeof window !== "undefined") {
    window.__CASTLE_RHIZOH_SPEECH_GLUE__ = glue;
  }

  logCastleLifecycleV0("speech_continuity_glue", {
    bridgeGapMs: glue.bridgeGapMs,
    microBridge: Boolean(glue.microBridgePhrase),
    pacing: glue.pacing,
    llmWaitMs
  });

  return glue;
}

/**
 * Optional sub-200ms breath bridge utterance (same voice, lower volume).
 * @param {ReturnType<typeof buildConversationContinuityGlueV0>} glue
 */
function speakMicroBridgePhraseV0(glue) {
  const phrase = String(glue?.microBridgePhrase || "").trim();
  if (!phrase || typeof window === "undefined" || !window.speechSynthesis) return false;
  const u = new SpeechSynthesisUtterance(phrase);
  u.lang = glue.language === "en" ? "en-US" : "tr-TR";
  u.rate = 0.92;
  u.pitch = glue.pitchCarry;
  u.volume = 0.42;
  try {
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

/**
 * Wait for ack end + glue gap (+ optional micro bridge) before reply TTS.
 * @param {ReturnType<typeof buildConversationContinuityGlueV0>} glue
 * @param {() => void} speakReplyFn
 */
export async function handoffHotSpeechToLlmReplyV0(glue, speakReplyFn) {
  const gapMs = glue?.bridgeGapMs ?? VOICE_ACK_SMOOTH_GAP_MS;
  let handoff = { mode: "direct", waited: false, reason: "idle", waitMs: 0, bridgeGapMs: gapMs };

  if (isVoiceInstantAckPlayingV0()) {
    handoff = await speakAfterVoiceInstantAckSmoothV0(
      () => {
        if (glue?.microBridgePhrase) {
          speakMicroBridgePhraseV0(glue);
          window.setTimeout(() => speakReplyFn(), Math.min(140, gapMs));
        } else {
          speakReplyFn();
        }
      },
      { gapMs }
    );
  } else if (glue?.microBridgePhrase) {
    speakMicroBridgePhraseV0(glue);
    await new Promise((r) => window.setTimeout(r, gapMs));
    speakReplyFn();
    handoff = { mode: "bridge_only", waited: true, reason: "no_ack", waitMs: gapMs, bridgeGapMs: gapMs };
  } else {
    await new Promise((r) => window.setTimeout(r, gapMs));
    speakReplyFn();
    handoff = { mode: "gap_only", waited: true, reason: "no_ack", waitMs: gapMs, bridgeGapMs: gapMs };
  }

  logVoiceInfoV0("SPEECH_GLUE_HANDOFF", handoff);
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.lastSpeechGlueHandoff = Object.freeze({ ...handoff, atMs: Date.now() });
  }
  return handoff;
}

/**
 * Prosody hints for chunk index (0 = first LLM chunk after glue).
 * @param {ReturnType<typeof buildConversationContinuityGlueV0>} glue
 * @param {number} chunkIndex
 */
export function resolveGlueProsodyForChunkV0(glue, chunkIndex = 0) {
  const i = Math.max(0, Math.min(3, chunkIndex));
  const ramp = glue?.rateRamp || [1.04, 1.02, 1.0];
  const vol = glue?.volumeRamp || [0.88, 0.9, 0.92];
  return Object.freeze({
    rate: ramp[i] ?? ramp[ramp.length - 1] ?? 1.02,
    pitch: glue?.pitchCarry ?? 1.02,
    volume: vol[i] ?? vol[vol.length - 1] ?? 0.92,
    gapMs: i === 0 ? glue?.bridgeGapMs : Math.max(40, (glue?.bridgeGapMs || 110) * 0.55)
  });
}
