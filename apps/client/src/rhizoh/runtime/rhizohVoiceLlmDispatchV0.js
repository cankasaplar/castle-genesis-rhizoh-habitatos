/**
 * Voice → LLM dispatch — policy + command + commit kernel (instrumented).
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
import { normalizeSttTranscriptForOlpV0 } from "./normalizeSttTranscriptForOlpV0.js";
import { validateLocalCommandPostSttV0 } from "./castleCommandInvariantV0.js";
import {
  executeLocalVoiceCommandV0,
  routeVoiceInputV0,
  VOICE_ROUTE_EXECUTION_V0
} from "./rhizohVoiceCommandRouterV0.js";
import {
  commitFinalUserVisibleLanguageV0,
  LANGUAGE_COMMIT_LOCK_KEY_V0
} from "./rhizohFinalLanguageCommitV0.js";
import {
  buildHybridLlmConfirmDirectiveV0,
  executeHybridLocalFirstV0
} from "./rhizohHybridVoiceExecutionV0.js";
import { recordOlpBehavioralTurnV0 } from "./rhizohOlpInteractionToneV0.js";
import { recordExecutionGraphNodeV0 } from "./rhizohCommandExecutionGraphV0.js";
import { enforceLatencyBudgetV0 } from "./rhizohCastleLatencyBudgetV0.js";
import { buildExecutionReplayTapeFromTraceV0 } from "./rhizohExecutionGraphReplayEngineV0.js";
import {
  closeVoiceExecutionTraceV0,
  openVoiceExecutionTraceV0,
  traceLocalExecPhaseV0,
  traceRoutePhaseV0,
  traceSttNormalizePhaseV0
} from "./rhizohVoiceExecutionKernelV0.js";

export const RHIZOH_VOICE_LLM_DISPATCH_SCHEMA_V0 = "castle.rhizoh.voice_llm_dispatch.v0";

function makeTraceIdV0() {
  return `TRC-VLD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isHybridExecutionV0(execution) {
  return (
    execution === VOICE_ROUTE_EXECUTION_V0.HYBRID_LOCAL_FIRST ||
    execution === VOICE_ROUTE_EXECUTION_V0.HYBRID ||
    execution === "hybrid"
  );
}

export async function handleRhizohVoiceTranscriptV0(text, opts = {}) {
  const raw = String(text || "").trim();
  if (!raw) {
    return Object.freeze({ ok: false, error: "empty_transcript" });
  }

  const traceId = String(opts.traceId || makeTraceIdV0());
  const sttBudgetMs = Number(opts.sttBudgetMs) || 0;
  openVoiceExecutionTraceV0(traceId, { input: raw, source: opts.source || "voice_llm_dispatch" });

  const sttNorm = traceSttNormalizePhaseV0(traceId, () => normalizeSttTranscriptForOlpV0(raw));
  if (sttBudgetMs > 0) {
    enforceLatencyBudgetV0("stt", sttBudgetMs, traceId);
  }
  const msg = sttNorm.text;
  if (!msg) {
    closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "empty" });
    return Object.freeze({ ok: false, error: "empty_transcript" });
  }

  const route = traceRoutePhaseV0(traceId, () =>
    routeVoiceInputV0(msg, { sttInferred: sttNorm.inferredInputLocale })
  );

  if (route.execution === VOICE_ROUTE_EXECUTION_V0.LOCAL) {
    const invariant = validateLocalCommandPostSttV0(route);
    if (!invariant.ok) {
      closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "local_invariant_fail" });
      return Object.freeze({ ok: false, error: invariant.reason, route });
    }
    const localT0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const local = executeLocalVoiceCommandV0(route, { traceId });
    const localMs =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - localT0;
    traceLocalExecPhaseV0(traceId, String(route.canonical || route.grammarLocal?.kind || ""), localMs);

    if (opts.speakReply !== false && local.reply) {
      await speakRhizohReplyChunkedV0(local.reply, {
        smoothAfterAck: true,
        committedText: true,
        traceId
      });
    }
    recordOlpBehavioralTurnV0({ channel: "voice", depthMode: "local_command" });
    const graph = closeVoiceExecutionTraceV0(traceId, {
      ok: true,
      execution: "local",
      canonical: route.canonical || route.grammarLocal?.kind
    });
    const replayTape = buildExecutionReplayTapeFromTraceV0(traceId);
    return Object.freeze({
      ok: true,
      local: true,
      route,
      reply: local.reply || "",
      traceId,
      graph,
      replayTape
    });
  }

  if (isHybridExecutionV0(route.execution)) {
    const hybridT0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    const hybrid = executeHybridLocalFirstV0(route, msg, traceId);
    enforceLatencyBudgetV0(
      "hybrid_local",
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - hybridT0,
      traceId
    );

    recordExecutionGraphNodeV0(traceId, {
      id: "hybrid_local_first",
      phase: "hybrid_local_first",
      trigger: msg.slice(0, 96),
      localAction: true,
      llmFallback: false,
      sideEffects: Object.freeze(["hybrid:snapshot"]),
      edgeFrom: "route",
      edgeLabel: "hybrid_local"
    });

    if (opts.speakReply !== false && hybrid.localReply) {
      await speakRhizohReplyChunkedV0(hybrid.localReply, {
        smoothAfterAck: true,
        committedText: true,
        traceId
      });
    }

    const llmMessage = `${buildHybridLlmConfirmDirectiveV0(hybrid.snapshot, msg)}\n\n${msg}`;
    const out = await postRhizohLlmTurnV0({
      message: llmMessage,
      traceId,
      sessionId: opts.sessionId,
      connectionId: opts.connectionId,
      voiceTurn: true,
      speakInstantAck: false,
      userTurnCount: opts.userTurnCount,
      conversationPhase: opts.conversationPhase,
      idToken: opts.idToken,
      sourcePath: "voice_hybrid_llm_confirm"
    });

    if (!out.ok) {
      closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "hybrid_llm_fail" });
      return Object.freeze({ ok: false, error: out.error, traceId, hybrid, route });
    }

    recordExecutionGraphNodeV0(traceId, {
      id: "hybrid_llm_confirm",
      phase: "hybrid_llm_confirm",
      trigger: msg.slice(0, 96),
      localAction: false,
      llmFallback: true,
      sideEffects: Object.freeze(["llm:explain_only"]),
      edgeFrom: "hybrid_local_first",
      edgeLabel: "llm_confirm"
    });

    const committed = commitFinalUserVisibleLanguageV0(out.reply, {
      source: "llm",
      traceId,
      idempotencyKey: traceId,
      lockKey: LANGUAGE_COMMIT_LOCK_KEY_V0
    });

    if (opts.speakReply !== false && committed.text) {
      await speakRhizohReplyChunkedV0(committed.text, {
        smoothAfterAck: false,
        committedText: true,
        traceId
      });
    }

    recordOlpBehavioralTurnV0({ channel: "voice", depthMode: "hybrid" });
    const graph = closeVoiceExecutionTraceV0(traceId, { ok: true, execution: "hybrid" });
    const replayTape = buildExecutionReplayTapeFromTraceV0(traceId);
    return Object.freeze({
      ok: true,
      hybrid: true,
      phases: route.hybridPhases,
      snapshot: hybrid.snapshot,
      traceId: out.traceId || traceId,
      reply: committed.text,
      commitFromCache: committed.fromCache === true,
      graph,
      replayTape
    });
  }

  const dedup = probeVoiceTranscriptDispatchV0(msg);
  if (!dedup.ok) {
    logVoiceWarnV0("VOICE_LLM_DISPATCH_DEDUP", dedup);
    closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "dedup" });
    return Object.freeze({ ok: false, error: dedup.reason, dedup });
  }

  noteVoiceTranscriptDispatchedV0(msg);

  recordExecutionGraphNodeV0(traceId, {
    id: "llm_turn",
    phase: "llm",
    trigger: msg.slice(0, 96),
    localAction: false,
    llmFallback: true,
    sideEffects: Object.freeze(["llm:reasoning"]),
    edgeFrom: "route",
    edgeLabel: "llm"
  });

  recordVoiceTimelineEventV0({
    kind: "execution_dispatch",
    preview: msg.slice(0, 96),
    source: opts.source || "voice_llm_dispatch",
    stage: "llm_post",
    executionAccepted: true,
    route: route.execution,
    atMs: Date.now()
  });

  logVoiceInfoV0("VOICE_LLM_DISPATCH", { traceId, chars: msg.length, source: opts.source });

  const llmT0 = Date.now();
  const out = await postRhizohLlmTurnV0({
    message: msg,
    traceId,
    sessionId: opts.sessionId,
    connectionId: opts.connectionId,
    voiceTurn: true,
    speakInstantAck: false,
    userTurnCount: opts.userTurnCount,
    conversationPhase: opts.conversationPhase,
    idToken: opts.idToken,
    sourcePath: "voice_llm_dispatch"
  });
  const llmWaitMs = Date.now() - llmT0;
  const glue = buildConversationContinuityGlueV0({ prep: out.prep, llmWaitMs });
  recordConversationMirrorLlmCompleteV0({ llmWaitMs, ok: out.ok });

  if (!out.ok) {
    logVoiceWarnV0("VOICE_LLM_DISPATCH_FAIL", { traceId, error: out.error });
    closeVoiceExecutionTraceV0(traceId, { ok: false, execution: "llm_fail" });
    return Object.freeze({ ok: false, error: out.error, traceId, prep: out.prep, glue });
  }

  const commitT0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const committed = commitFinalUserVisibleLanguageV0(out.reply, {
    source: "llm",
    traceId,
    idempotencyKey: traceId,
    lockKey: LANGUAGE_COMMIT_LOCK_KEY_V0
  });
  enforceLatencyBudgetV0(
    "language_commit",
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - commitT0,
    traceId
  );

  recordExecutionGraphNodeV0(traceId, {
    id: "language_commit",
    phase: "language_commit",
    trigger: String(committed.text || "").slice(0, 80),
    localAction: false,
    llmFallback: false,
    sideEffects: Object.freeze([`commit:${committed.guardStep}`]),
    edgeFrom: "llm_turn",
    edgeLabel: "commit"
  });

  if (opts.speakReply !== false && committed.text) {
    await speakRhizohReplyChunkedV0(committed.text, {
      smoothAfterAck: true,
      glue,
      committedText: true,
      traceId
    });
  }

  recordOlpBehavioralTurnV0({
    channel: "voice",
    depthMode: out.prep?.turn?.expression?.conversationBehavior?.depthMode || "llm"
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.lastVoiceLlmDispatch = Object.freeze({
      schema: RHIZOH_VOICE_LLM_DISPATCH_SCHEMA_V0,
      traceId: out.traceId || traceId,
      replyChars: committed.text.length,
      commitFromCache: committed.fromCache === true,
      atMs: Date.now()
    });
  }

  const graph = closeVoiceExecutionTraceV0(traceId, { ok: true, execution: "llm" });
  const replayTape = buildExecutionReplayTapeFromTraceV0(traceId);
  return Object.freeze({
    ok: true,
    traceId: out.traceId || traceId,
    reply: committed.text,
    prep: out.prep,
    glue,
    commitFromCache: committed.fromCache === true,
    graph,
    replayTape
  });
}
