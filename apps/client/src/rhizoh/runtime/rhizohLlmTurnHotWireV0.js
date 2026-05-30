/**
 * LLM turn hot wire — speech-first prep before gateway round-trip.
 * Companion + skeleton + instant ack; CLAG stays on soft path only.
 */

import { runRhizohClagForLlmTurnV0 } from "./rhizohClagTurnBridgeV0.js";
import {
  markVoiceTurnDispatchV0,
  speakVoiceInstantAckV0
} from "./voiceInstantAckV0.js";
import { recordVoiceTimelineFromRouteV0 } from "./voiceShadowTimelineV0.js";
import { routeVoiceTranscriptConfidenceV0 } from "./voiceTranscriptConfidenceRouterV0.js";
import { FAST_ROUTE_V0 } from "./rhizohFastConversationRouterV0.js";

export const RHIZOH_LLM_TURN_HOT_WIRE_SCHEMA_V0 = "castle.rhizoh.llm_turn_hot_wire.v0";

/**
 * @param {Parameters<typeof runRhizohClagForLlmTurnV0>[0] & {
 *   speakInstantAck?: boolean,
 *   voiceTurn?: boolean
 * }} input
 */
export function prepareRhizohLlmTurnV0(input = {}) {
  const text = String(input.message || input.text || "").trim();
  markVoiceTurnDispatchV0();

  const turn = runRhizohClagForLlmTurnV0({
    ...input,
    message: text,
    voiceTurn: input.voiceTurn === true,
    sourcePath: input.sourcePath || "llm_turn_hot_wire"
  });

  if (input.voiceTurn === true && text) {
    const route = routeVoiceTranscriptConfidenceV0({
      text,
      confidence: input.confidence ?? 0.85,
      source: input.source || "llm_hot_wire",
      runTurnGate: false
    });
    recordVoiceTimelineFromRouteV0(route, {
      preview: text.slice(0, 96),
      source: input.source || "llm_hot_wire",
      stage: "hot_wire_prep"
    });
  }

  const ackPhrase =
    turn.fastAck ||
    turn.expression?.instantAckPhrase ||
    (typeof window !== "undefined" ? window.__CASTLE_RHIZOH_HOT_SPEECH__?.instantAckPhrase : null);

  if (input.speakInstantAck !== false && ackPhrase) {
    speakVoiceInstantAckV0(String(ackPhrase));
  }

  return Object.freeze({
    schema: RHIZOH_LLM_TURN_HOT_WIRE_SCHEMA_V0,
    turn,
    ackSpoken: input.speakInstantAck !== false && Boolean(ackPhrase),
    fastPath: turn.route?.fastPath === true,
    scheduling: turn.expression?.scheduling || "speech_first"
  });
}

/**
 * Gateway-safe context patch from hot expression (interpretation hints only).
 * @param {ReturnType<typeof prepareRhizohLlmTurnV0>} prep
 */
export function buildRhizohLlmContextPatchFromPrepV0(prep) {
  const expr = prep?.turn?.expression;
  const behavior = expr?.conversationBehavior;
  const hot =
    typeof window !== "undefined" && window.__CASTLE_RHIZOH_HOT_SPEECH__?.skeleton
      ? window.__CASTLE_RHIZOH_HOT_SPEECH__.skeleton
      : expr?.speechSkeleton;

  return Object.freeze({
    rhizohFastSpeechMode: true,
    scheduling: expr?.scheduling || "speech_first",
    routeId: expr?.route?.id || null,
    fastPath: expr?.route?.fastPath === true,
    clagAsyncOnly: expr?.route?.clagEnrichment === "async_scheduled",
    companionPresence: expr?.companion?.presenceMode || null,
    projectionLanguage: expr?.projection?.language || "tr",
    speechSkeleton: hot
      ? Object.freeze({
          targetFirstAudioMs: hot.targetFirstAudioMs,
          chunkCount: hot.chunkCount,
          pacing: hot.pacing,
          preCommit: hot.preCommit === true
        })
      : null,
    microRhythmFeel: behavior?.microRhythmFeel || null,
    depthMode: behavior?.depthMode || null,
    stabilityRegime: behavior?.stabilityRegime || null
  });
}

export { FAST_ROUTE_V0 };
