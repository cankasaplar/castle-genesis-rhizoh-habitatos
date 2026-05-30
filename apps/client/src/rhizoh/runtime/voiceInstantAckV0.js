/**
 * Evre A — instant perceived voice ack while LLM runs (UX layer only; no gateway change).
 * Smooth handoff: if LLM returns while ack plays, wait for ack end — no abrupt cancel().
 */

import { logCastleLifecycleV0, logVoiceInfoV0, logVoiceWarnV0 } from "./rhizohProductionLogNamespacesV0.js";
import { resolveTurkishSpeechVoiceV0 } from "./prewarmSpeechSynthesisV0.js";
import { recordConversationMirrorFirstSpeechV0 } from "./rhizohConversationBehaviorMirrorV0.js";

export const VOICE_INSTANT_ACK_SCHEMA = "castle.voice_instant_ack.v0";
export const VOICE_ACK_SMOOTH_MAX_WAIT_MS = 2600;
export const VOICE_ACK_SMOOTH_GAP_MS = 110;

const ACK_PHRASES_TR = Object.freeze([
  "Anladım, bakıyorum.",
  "Tamam, dinliyorum.",
  "Evet, bir saniye."
]);

let lastDispatchAtMs = 0;
let ackSession = 0;
let ackPlaying = false;
/** @type {(() => void) | null} */
let ackReleaseResolve = null;

function armAckReleaseWaiter() {
  ackReleaseResolve = null;
}

function releaseAckWaiters(reason) {
  ackReleaseResolve?.();
  ackReleaseResolve = null;
  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.voiceInstantAckPlaying = false;
  }
}

export function markVoiceTurnDispatchV0(atMs = Date.now()) {
  lastDispatchAtMs = Number(atMs) || Date.now();
}

export function pickVoiceInstantAckPhraseV0() {
  return ACK_PHRASES_TR[Math.floor(Math.random() * ACK_PHRASES_TR.length)];
}

export function isVoiceInstantAckPlayingV0() {
  if (typeof window !== "undefined" && window.speechSynthesis?.speaking && ackPlaying) return true;
  return ackPlaying;
}

/**
 * @param {{ maxWaitMs?: number }} [opts]
 * @returns {Promise<{ waited: boolean, reason: string, waitMs: number }>}
 */
export function awaitVoiceInstantAckReleaseV0(opts = {}) {
  const maxWaitMs = Math.max(200, Number(opts.maxWaitMs) || VOICE_ACK_SMOOTH_MAX_WAIT_MS);
  if (!isVoiceInstantAckPlayingV0()) {
    return Promise.resolve({ waited: false, reason: "idle", waitMs: 0 });
  }
  const t0 = Date.now();
  return new Promise((resolve) => {
    let settled = false;
    const finish = (reason) => {
      if (settled) return;
      settled = true;
      ackReleaseResolve = null;
      resolve({ waited: true, reason, waitMs: Date.now() - t0 });
    };
    ackReleaseResolve = () => finish("ack_end");
    window.setTimeout(() => finish("max_wait"), maxWaitMs);
  });
}

/**
 * Wait for ack (if any), micro-gap, then invoke reply TTS without cutting ack mid-phrase.
 * @param {() => void} speakReplyFn
 * @param {{ maxWaitMs?: number, gapMs?: number }} [opts]
 */
export async function speakAfterVoiceInstantAckSmoothV0(speakReplyFn, opts = {}) {
  const gapMs = Number(opts.gapMs) || VOICE_ACK_SMOOTH_GAP_MS;
  const maxWaitMs = Number(opts.maxWaitMs) || VOICE_ACK_SMOOTH_MAX_WAIT_MS;
  let handoff = { mode: "direct", waited: false, reason: "idle", waitMs: 0 };

  if (isVoiceInstantAckPlayingV0()) {
    const release = await awaitVoiceInstantAckReleaseV0({ maxWaitMs });
    handoff = {
      mode: release.reason === "max_wait" ? "truncate" : "smooth",
      waited: release.waited,
      reason: release.reason,
      waitMs: release.waitMs
    };
    logVoiceInfoV0("ACK_SMOOTH_HANDOFF", handoff);
    logCastleLifecycleV0("ack_smooth_handoff", handoff);
    if (release.reason === "ack_end") {
      await new Promise((r) => window.setTimeout(r, gapMs));
    } else if (release.reason === "max_wait" && isVoiceInstantAckPlayingV0()) {
      logVoiceWarnV0("ACK_SMOOTH_TRUNCATE", { waitMs: release.waitMs });
      try {
        window.speechSynthesis?.cancel?.();
      } catch {
        /* noop */
      }
    }
  }

  cancelVoiceInstantAckV0();
  speakReplyFn();
  return handoff;
}

/**
 * @param {string} [phrase]
 * @returns {boolean}
 */
export function speakVoiceInstantAckV0(phrase = pickVoiceInstantAckPhraseV0()) {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const dispatchAtMs = lastDispatchAtMs || Date.now();
  const session = ++ackSession;
  armAckReleaseWaiter();
  const text = String(phrase || pickVoiceInstantAckPhraseV0()).trim();
  if (!text) return false;

  const utterance = new SpeechSynthesisUtterance(text.slice(0, 120));
  utterance.lang = "tr-TR";
  utterance.rate = 1.08;
  utterance.pitch = 1.02;
  utterance.volume = 0.9;
  const trVoice = resolveTurkishSpeechVoiceV0();
  if (trVoice) utterance.voice = trVoice;

  const finishAck = (reason) => {
    if (session !== ackSession) return;
    ackPlaying = false;
    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.voiceInstantAckPlaying = false;
    }
    releaseAckWaiters(reason);
  };

  utterance.onstart = () => {
    if (session !== ackSession) return;
    ackPlaying = true;
    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.voiceInstantAckPlaying = true;
    }
    const firstSpeechMs = Math.max(0, Date.now() - dispatchAtMs);
    const meta = { firstSpeechMs, kind: "instant_ack", phrase: text };
    recordConversationMirrorFirstSpeechV0({ firstSpeechMs, phraseKind: "instant_ack" });
    logVoiceInfoV0("FIRST_SPEECH", meta);
    logCastleLifecycleV0("first_speech", meta);
    if (typeof window !== "undefined") {
      window.__rhizoh = window.__rhizoh || {};
      window.__rhizoh.voiceInstantAck = Object.freeze({ ...meta, schema: VOICE_INSTANT_ACK_SCHEMA, atMs: Date.now() });
    }
  };

  utterance.onend = () => finishAck("end");
  utterance.onerror = () => finishAck("error");

  try {
    window.speechSynthesis.speak(utterance);
  } catch {
    finishAck("speak_error");
    return false;
  }
  return true;
}

export function cancelVoiceInstantAckV0() {
  ackSession += 1;
  ackPlaying = false;
  releaseAckWaiters("cancel");
}

export function resetVoiceInstantAckForTestV0() {
  ackSession = 0;
  ackPlaying = false;
  lastDispatchAtMs = Date.now();
  armAckReleaseWaiter();
}
