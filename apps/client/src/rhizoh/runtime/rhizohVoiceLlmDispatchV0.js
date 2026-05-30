/**
 * Voice → LLM dispatch with fast-speech hot path (execution path wiring).
 */

import { logVoiceInfoV0, logVoiceWarnV0 } from "./rhizohProductionLogNamespacesV0.js";
import { postRhizohLlmTurnV0 } from "./rhizohLlmTurnClientV0.js";
import {
  probeVoiceTranscriptDispatchV0,
  noteVoiceTranscriptDispatchedV0
} from "./voiceTranscriptDispatchDedupV0.js";
import { recordVoiceTimelineEventV0 } from "./voiceShadowTimelineV0.js";
import { speakRhizohReplyChunkedV0 } from "./rhizohSpeechChunkTtsV0.js";
import { buildConversationContinuityGlueV0 } from "./rhizohConversationContinuityGlueV0.js";
import { recordConversationMirrorLlmCompleteV0 } from "./rhizohConversationBehaviorMirrorV0.js";

export const RHIZOH_VOICE_LLM_DISPATCH_SCHEMA_V0 = "castle.rhizoh.voice_llm_dispatch.v0";

function makeTraceIdV0() {
  return `TRC-VLD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Canonical voice transcript → hot prep → instant ack → gateway LLM → chunked TTS.
 * @param {string} text
 * @param {{
 *   traceId?: string,
 *   sessionId?: string,
 *   connectionId?: string,
 *   manageVoiceTurn?: boolean,
 *   source?: string,
 *   confidence?: number,
 *   strategy?: string,
 *   witnessed?: object,
 *   speakReply?: boolean,
 *   idToken?: string
 * }} [opts]
 */
export async function handleRhizohVoiceTranscriptV0(text, opts = {}) {
  const msg = String(text || "").trim();
  if (!msg) {
    return Object.freeze({ ok: false, error: "empty_transcript" });
  }

  const dedup = probeVoiceTranscriptDispatchV0(msg);
  if (!dedup.ok) {
    logVoiceWarnV0("VOICE_LLM_DISPATCH_DEDUP", dedup);
    return Object.freeze({ ok: false, error: dedup.reason, dedup });
  }

  const traceId = String(opts.traceId || makeTraceIdV0());
  noteVoiceTranscriptDispatchedV0(msg);

  recordVoiceTimelineEventV0({
    kind: "execution_dispatch",
    preview: msg.slice(0, 96),
    source: opts.source || "voice_llm_dispatch",
    stage: "llm_post",
    executionAccepted: true,
    atMs: Date.now()
  });

  logVoiceInfoV0("VOICE_LLM_DISPATCH", {
    traceId,
    chars: msg.length,
    source: opts.source
  });

  const llmT0 = Date.now();
  const out = await postRhizohLlmTurnV0({
    message: msg,
    traceId,
    sessionId: opts.sessionId,
    connectionId: opts.connectionId,
    voiceTurn: true,
    speakInstantAck: true,
    userTurnCount: opts.userTurnCount,
    conversationPhase: opts.conversationPhase,
    idToken: opts.idToken,
    sourcePath: "voice_llm_dispatch"
  });
  const llmWaitMs = Date.now() - llmT0;
  const glue = buildConversationContinuityGlueV0({
    prep: out.prep,
    llmWaitMs
  });
  recordConversationMirrorLlmCompleteV0({ llmWaitMs, ok: out.ok });

  if (!out.ok) {
    logVoiceWarnV0("VOICE_LLM_DISPATCH_FAIL", { traceId, error: out.error });
    return Object.freeze({ ok: false, error: out.error, traceId, prep: out.prep, glue });
  }

  if (opts.speakReply !== false && out.reply) {
    await speakRhizohReplyChunkedV0(out.reply, { smoothAfterAck: true, glue });
  }

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.lastVoiceLlmDispatch = Object.freeze({
      schema: RHIZOH_VOICE_LLM_DISPATCH_SCHEMA_V0,
      traceId: out.traceId || traceId,
      replyChars: out.reply.length,
      atMs: Date.now()
    });
  }

  return Object.freeze({
    ok: true,
    traceId: out.traceId || traceId,
    reply: out.reply,
    prep: out.prep,
    glue
  });
}
