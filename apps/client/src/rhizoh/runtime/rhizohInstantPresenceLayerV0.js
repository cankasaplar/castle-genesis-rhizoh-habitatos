/**
 * Instant Presence Layer v0 — wake/presence reflex without LLM pipeline.
 * "Rhizoh" → "Buradayım" in <100ms perceived latency (TTS instant ack, no gateway).
 */

import { logVoiceInfoV0 } from "./rhizohProductionLogNamespacesV0.js";
import {
  classifyDirectedPatternsV0,
  DIRECTED_PATTERN_V0,
  SOVEREIGN_REALITY_V0
} from "./behavioralTurnSovereigntyV0.js";
import { ensureTurnSovereigntyLockedV0 } from "./turnSovereigntyWireV0.js";
import { markVoiceTurnDispatchV0 } from "./voiceInstantAckV0.js";
import { emitLivePresenceV0 } from "./rhizohLiveLayerV0.js";
import { PRESENCE_EVENT_KIND_V0 } from "./rhizohPresenceSignatureV0.js";
import { VOICE_DIRECTED_SPEECH_BAND } from "./voiceDirectedSpeechObservationV0.js";
import {
  notePresenceAckContinuityV0,
  noteThinkingContinuityV0,
  getContinuityKernelSnapshotV0
} from "./rhizohContinuityKernelV0.js";
import { recordVoiceTimelineEventV0 } from "./voiceShadowTimelineV0.js";
import { notePersonaSchedulerUserActivityV0 } from "./rhizohPersonaLoopSchedulerV0.js";
import { noteGroundSignalV1, GROUND_SIGNAL_KIND_V1 } from "./rhizohGroundingLayerV1.js";

export const RHIZOH_INSTANT_PRESENCE_SCHEMA_V0 = "rhizoh.instant_presence_layer.v0";

const WAKE_ONLY_MAX_CHARS_V0 = 24;
const PRESENCE_MAX_CHARS_V0 = 48;

/**
 * @param {string} text
 */
export function isPresenceFastPathEligibleV0(text) {
  const norm = String(text || "").trim();
  if (!norm) return false;
  const patterns = classifyDirectedPatternsV0(norm);
  const hasWake = patterns.includes(DIRECTED_PATTERN_V0.WAKE);
  const hasPresence = patterns.includes(DIRECTED_PATTERN_V0.PRESENCE_CHECK);
  const hasAddress = patterns.includes(DIRECTED_PATTERN_V0.ADDRESS);

  if (hasWake && norm.length <= WAKE_ONLY_MAX_CHARS_V0) return true;
  if (hasPresence && norm.length <= PRESENCE_MAX_CHARS_V0) return true;
  if (hasAddress && norm.length <= WAKE_ONLY_MAX_CHARS_V0) return true;
  return false;
}

/**
 * Attempt instant presence response — no LLM, no gateway, no speech pipeline.
 * @param {string} text — normalized STT text
 * @param {object} [opts]
 */
export async function tryInstantPresenceFastPathV0(text, opts = {}) {
  const msg = String(text || "").trim();
  if (!msg || !isPresenceFastPathEligibleV0(msg)) {
    return Object.freeze({ handled: false, reason: "not_eligible" });
  }

  const traceId = String(opts.traceId || "").trim();
  if (!traceId) {
    return Object.freeze({ handled: false, reason: "missing_trace_id" });
  }

  const directedPatterns = classifyDirectedPatternsV0(msg);
  const sovereigntyWire = ensureTurnSovereigntyLockedV0({
    turnId: traceId,
    text: msg,
    modality: "voice",
    source: opts.source,
    conversationPhase: opts.conversationPhase,
    userTurnCount: opts.userTurnCount,
    voice: {
      band: opts.band || VOICE_DIRECTED_SPEECH_BAND.DIRECTED_CANDIDATE,
      directedPatterns,
      authority: opts.authority || { maySpeak: true, path: "presence_fast" }
    },
    router: opts.router
  });

  const lock = sovereigntyWire.lock;
  const wire = sovereigntyWire.wire;
  if (!lock || lock.sovereignReality !== SOVEREIGN_REALITY_V0.PRESENCE_ACK) {
    return Object.freeze({
      handled: false,
      reason: "sovereignty_not_presence",
      sovereignReality: lock?.sovereignReality || null
    });
  }

  const phrase =
    String(lock.sovereignOutput?.text || lock.subReality?.phraseVariant || "").trim() ||
    (lock.subReality?.phraseHints?.[0] ?? "Buradayım.");

  markVoiceTurnDispatchV0();
  notePresenceAckContinuityV0({ phrase, emotionalTone: lock.subReality?.emotionalTone });
  notePersonaSchedulerUserActivityV0();
  noteGroundSignalV1(GROUND_SIGNAL_KIND_V1.USER_SPEECH, { intent: "presence", traceId });

  const live = emitLivePresenceV0({
    phrase,
    kind: PRESENCE_EVENT_KIND_V0.ACK,
    intent: "presence",
    emotionalTone: lock.subReality?.emotionalTone || "warm",
    traceId,
    speak: opts.speakReply !== false,
    source: "instant_presence",
    userInitiated: true,
    modality: "voice",
    incrementTurn: true,
    moduleId: "instant_presence_layer"
  });
  const spoke = live.spoke === true;
  recordVoiceTimelineEventV0({
    kind: "presence_ack_fast",
    preview: phrase,
    source: "instant_presence_layer",
    stage: "pre_pipeline",
    executionAccepted: true,
    route: "presence_fast_path",
    atMs: Date.now()
  });

  logVoiceInfoV0("INSTANT_PRESENCE_ACK", {
    traceId,
    phrase,
    spoke,
    patterns: directedPatterns,
    selectionReason: lock.selectionReason,
    llmBypass: true
  });

  const result = Object.freeze({
    ok: true,
    presenceAck: true,
    presenceFastPath: true,
    reply: phrase,
    spoke,
    traceId,
    turnSovereignty: lock,
    continuity: getContinuityKernelSnapshotV0(),
    llmBypass: true,
    latencyClass: "instant_presence"
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.instantPresence = Object.freeze({
      schema: RHIZOH_INSTANT_PRESENCE_SCHEMA_V0,
      atMs: Date.now(),
      ...result
    });
  }

  return Object.freeze({ handled: true, result });
}

/**
 * Sovereignty wire output applicable in all modes except OFF (log_only applies UX wire).
 */
export function shouldApplySovereigntyPresenceOutputV0() {
  return true;
}

/**
 * After presence fast path, if user had substantive follow-up in same utterance — rare.
 * @param {string} text
 */
export function hasSubstantiveTailAfterWakeV0(text) {
  const norm = String(text || "").trim();
  const stripped = norm.replace(/^(rhizoh|rizo|riza|rizoh|hey\s+rhizoh|dostum)\b[,!\s]*/i, "").trim();
  return stripped.length > 12;
}

export function noteLlmThinkingAfterPresenceV0(text, traceId) {
  if (hasSubstantiveTailAfterWakeV0(text)) {
    noteThinkingContinuityV0({ source: "mixed_wake_tail", preview: text, intent: "llm_followup" });
    return true;
  }
  return false;
}
